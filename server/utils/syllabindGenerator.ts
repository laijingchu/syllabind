import Anthropic from '@anthropic-ai/sdk';
import { storage } from '../storage';
import { getGenerationTools, getPlanningTools, getRepairTools, CLAUDE_MODEL, CLAUDE_MODEL_GENERATION, client } from './claudeClient';
import { markdownToHtml } from './markdownToHtml';
import { validateUrl } from './validateUrl';
import { apiQueue } from './requestQueue';
import WebSocket from 'ws';

const MAX_RETRIES = 10;

/** Default estimatedMinutes when Claude omits the field */
function defaultEstimatedMinutes(type: string, provided: number | null | undefined): number {
  if (provided && provided > 0) return provided;
  return 60;
}

/** Tracks API call count per generation session for logging */
let sessionApiCalls = 0;
let sessionStartTime = 0;

function resetApiCallCounter() {
  sessionApiCalls = 0;
  sessionStartTime = Date.now();
}

function logApiCall(context: string) {
  sessionApiCalls++;
  const elapsed = ((Date.now() - sessionStartTime) / 1000).toFixed(1);
  console.log(`[API Call #${sessionApiCalls}] ${context} (${elapsed}s elapsed)`);
}

/**
 * Parse retry-after from error headers (rate limit reset time).
 * Returns milliseconds to wait, or null if not available.
 */
function parseRetryAfter(headers: Record<string, string> | undefined): number | null {
  if (!headers) return null;
  const resetTime = headers['anthropic-ratelimit-requests-reset'];
  if (resetTime) {
    const resetDate = new Date(resetTime);
    const ms = resetDate.getTime() - Date.now();
    // Cap at 120s
    return Math.max(1000, Math.min(ms, 120_000));
  }
  return null;
}

/**
 * Wraps client.messages.create() with queue + exponential backoff.
 * On 429: calculates backoff with jitter, notifies client via WebSocket, sleeps, retries.
 * Non-429 errors pass through immediately.
 */
async function createMessageWithRetry(
  params: Anthropic.MessageCreateParamsNonStreaming & { signal?: AbortSignal },
  ws: WebSocket,
  label?: string
): Promise<Anthropic.Message> {
  const { signal, ...apiParams } = params;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    await apiQueue.acquire();
    logApiCall(label || 'unknown');

    try {
      return await client.messages.create(apiParams, { signal });
    } catch (error: any) {
      if (error.status === 429 && attempt < MAX_RETRIES - 1) {
        const retryAfter = parseRetryAfter(error.headers);
        const backoff = retryAfter ?? Math.min(2 ** attempt * 1000, 60_000);
        const jitter = Math.random() * 1000;
        const waitMs = Math.round(backoff + jitter);
        const waitSec = Math.ceil(waitMs / 1000);

        console.log(`[RateLimit] 429 received, waiting ${waitSec}s (attempt ${attempt + 1}/${MAX_RETRIES})`);

        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'rate_limit_wait',
            data: { resetIn: waitSec, retry: attempt + 1, maxRetries: MAX_RETRIES }
          }));
        }

        await new Promise(resolve => setTimeout(resolve, waitMs));
        continue;
      }

      throw error;
    }
  }

  // Should never reach here, but TypeScript needs it
  throw new Error('Max retries exceeded');
}

export interface CurriculumWeek {
  weekIndex: number;
  title: string;
  description: string;
}

/**
 * Phase 1: Plan the full curriculum outline in a single API call.
 * Returns distinct week titles and descriptions for all weeks.
 */
async function planCurriculum(
  basics: { title: string; description: string; audienceLevel: string; durationWeeks: number },
  ws: WebSocket,
  signal?: AbortSignal
): Promise<CurriculumWeek[]> {
  const systemPrompt = `You are a curriculum designer. Plan a ${basics.durationWeeks}-week Syllabind outline for "${basics.title}" (${basics.audienceLevel}).

Description: ${basics.description}

Rules:
- Generate exactly ${basics.durationWeeks} weeks.
- Each week MUST have a DISTINCT topic. No two weeks should cover the same theme.
- Titles should form a logical learning arc (foundations → intermediate → advanced/synthesis).
- Descriptions should be 1-2 sentences explaining the week's focus.
- Call the plan_curriculum tool with all ${basics.durationWeeks} weeks at once.`;

  const messages: Anthropic.MessageParam[] = [
    { role: 'user', content: `Plan the ${basics.durationWeeks}-week curriculum outline. Call the plan_curriculum tool.` }
  ];

  const MAX_PLANNING_RETRIES = 2;

  for (let attempt = 0; attempt <= MAX_PLANNING_RETRIES; attempt++) {
    if (signal?.aborted) throw new Error('Cancelled');

    const response = await createMessageWithRetry({
      model: CLAUDE_MODEL,
      max_tokens: 4096,
      system: [{ type: 'text', text: systemPrompt }],
      tools: getPlanningTools(),
      messages,
      signal: signal as AbortSignal | undefined
    }, ws, `plan curriculum (attempt ${attempt + 1})`);

    const toolUse = response.content.find(
      (block): block is Anthropic.ContentBlock & { type: 'tool_use' } =>
        block.type === 'tool_use' && block.name === 'plan_curriculum'
    );

    if (toolUse) {
      const input = toolUse.input as { weeks: CurriculumWeek[] };
      if (Array.isArray(input.weeks) && input.weeks.length > 0) {
        console.log(`[PlanCurriculum] Got ${input.weeks.length} week outlines`);
        return input.weeks;
      }
    }

    // Retry: Claude didn't call the tool
    console.log(`[PlanCurriculum] Attempt ${attempt + 1}: Claude didn't call plan_curriculum, retrying`);
    const filtered = response.content.filter((block: any) =>
      block.type === 'text' || block.type === 'tool_use'
    );
    messages.push({ role: 'assistant', content: filtered.length > 0 ? filtered : [{ type: 'text', text: '(thinking)' }] });
    messages.push({ role: 'user', content: 'You MUST call the plan_curriculum tool with all week titles and descriptions.' });
  }

  throw new Error('Failed to plan curriculum after retries');
}

/**
 * Build a human-readable outline string from curriculum weeks for batch prompts.
 */
function buildOutlineString(curriculum: CurriculumWeek[]): string {
  return curriculum.map(w => `Week ${w.weekIndex}: "${w.title}" — ${w.description}`).join('\n');
}

interface MissingUrlStep {
  stepId: number;
  weekIndex: number;
  title: string;
  author: string | null;
  mediaType: string | null;
}

/**
 * After each batch, check for readings missing URLs and make a focused API call
 * to find them. This separates "find URLs" (simple) from "generate curriculum" (complex).
 */
async function repairMissingUrls(
  missingSteps: MissingUrlStep[],
  syllabindTitle: string,
  ws: WebSocket,
  signal?: AbortSignal
): Promise<void> {
  if (missingSteps.length === 0) return;

  console.log(`[URLRepair] ${missingSteps.length} readings missing URLs, starting repair pass`);

  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'url_repair_started',
      data: { count: missingSteps.length }
    }));
  }

  const searchBudget = Math.min(missingSteps.length * 3, 20);

  const stepList = missingSteps.map(s =>
    `- stepId: ${s.stepId} | "${s.title}"${s.author ? ` by ${s.author}` : ''}${s.mediaType ? ` (${s.mediaType})` : ''}`
  ).join('\n');

  const systemPrompt = `You are a URL finder. Your ONLY job: search for URLs, then call the provide_urls tool.

Readings needing URLs:
${stepList}

Instructions:
1. Search for each reading by title and author
2. After searching, you MUST call the provide_urls tool with ALL URLs found
3. Do NOT output text explanations — ONLY use tools (web_search and provide_urls)
4. No Wikipedia links
5. If you cannot find a URL for a reading, omit it from the provide_urls call`;

  try {
    const messages: Anthropic.MessageParam[] = [
      { role: 'user', content: `Find URLs for the ${missingSteps.length} readings listed in your instructions. Search, then call provide_urls.` }
    ];

    let repairedCount = 0;
    const MAX_REPAIR_TURNS = 3;

    for (let turn = 0; turn < MAX_REPAIR_TURNS; turn++) {
      if (signal?.aborted) return;

      const response = await createMessageWithRetry({
        model: CLAUDE_MODEL_GENERATION,
        max_tokens: 4096,
        system: [{ type: 'text', text: systemPrompt }],
        tools: getRepairTools(searchBudget),
        messages,
        signal: signal as AbortSignal | undefined
      }, ws, `url repair pass (turn ${turn + 1})`);

      // Check for provide_urls tool call
      const toolUseBlocks = response.content.filter(
        (block): block is Anthropic.ContentBlock & { type: 'tool_use' } =>
          block.type === 'tool_use' && block.name === 'provide_urls'
      );

      if (toolUseBlocks.length > 0) {
        // Process URLs from the tool call
        for (const toolUse of toolUseBlocks) {
          const input = toolUse.input as { urls: Array<{ stepId: number; url: string }> };
          if (!Array.isArray(input.urls)) continue;

          for (const item of input.urls) {
            if (signal?.aborted) return;

            const isValid = await validateUrl(item.url);
            if (!isValid) {
              console.warn(`[URLRepair] URL failed validation for step ${item.stepId}: ${item.url}`);
              continue;
            }

            try {
              await storage.updateStepUrl(item.stepId, item.url);
              repairedCount++;
              console.log(`[URLRepair] Repaired step ${item.stepId} with URL: ${item.url}`);

              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                  type: 'step_url_repaired',
                  data: { stepId: item.stepId, url: item.url }
                }));
              }
            } catch (err) {
              console.error(`[URLRepair] Failed to update step ${item.stepId}:`, err);
            }
          }
        }
        // Tool was called — we're done
        break;
      }

      // Claude didn't call provide_urls — prompt it again
      console.log(`[URLRepair] Turn ${turn + 1}: Claude didn't call provide_urls (stop_reason=${response.stop_reason}), retrying`);

      // Filter out web search result blocks (heavy) from conversation history
      const filteredContent = response.content.filter((block: any) => {
        if (block.type === 'text' || block.type === 'tool_use') return true;
        if (block.type === 'web_search_tool_result') return false;
        if (block.type === 'server_tool_use' && block.name === 'web_search') return false;
        return true;
      });

      messages.push({
        role: 'assistant',
        content: filteredContent.length > 0 ? filteredContent : [{ type: 'text', text: '(searching)' }]
      });
      messages.push({
        role: 'user',
        content: 'Now call the provide_urls tool with the URLs you found. You MUST call the provide_urls tool.'
      });
    }

    console.log(`[URLRepair] Complete: ${repairedCount}/${missingSteps.length} URLs repaired`);

    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'url_repair_complete',
        data: { repaired: repairedCount, total: missingSteps.length }
      }));
    }
  } catch (error: any) {
    // Non-fatal — log and continue generation
    console.error('[URLRepair] Repair pass failed (non-fatal):', error.message);

    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'url_repair_complete',
        data: { repaired: 0, total: missingSteps.length, error: true }
      }));
    }
  }
}

interface GenerationContext {
  syllabusId: number;
  basics: {
    title: string;
    description: string;
    audienceLevel: string;
    durationWeeks: number;
  };
  ws: WebSocket;
  signal?: AbortSignal;
}

export async function generateSyllabind(context: GenerationContext): Promise<void> {
  const { syllabusId, basics, ws, signal } = context;
  resetApiCallCounter();
  console.log(`[Generate] Starting generation for syllabind ${syllabusId} (${basics.durationWeeks} weeks, ${basics.audienceLevel})`);

  // === Phase 1: Plan curriculum outline ===
  console.log(`[Generate] Phase 1: Planning curriculum outline...`);
  ws.send(JSON.stringify({
    type: 'planning_started',
    data: { durationWeeks: basics.durationWeeks }
  }));

  let curriculum: CurriculumWeek[];
  try {
    curriculum = await planCurriculum(basics, ws, signal);
  } catch (error: any) {
    if (signal?.aborted || error.name === 'AbortError') {
      console.log(`[Generate] Cancelled during curriculum planning`);
      await storage.updateSyllabus(syllabusId, { status: 'draft' });
      return;
    }
    throw error;
  }

  // Save all weeks to DB and stream curriculum_planned to client
  const savedWeeks: Map<number, { id: number; title: string; description: string }> = new Map();
  for (const cw of curriculum) {
    const week = await storage.createWeek({
      syllabusId,
      index: cw.weekIndex,
      title: cw.title,
      description: cw.description
    });
    savedWeeks.set(cw.weekIndex, { id: week.id, title: cw.title, description: cw.description });
  }

  ws.send(JSON.stringify({
    type: 'curriculum_planned',
    data: { weeks: curriculum }
  }));

  const outlineString = buildOutlineString(curriculum);
  console.log(`[Generate] Curriculum planned:\n${outlineString}`);

  // === Phase 2: Generate content in batches ===
  const BATCH_SIZE = 2;
  let weekIndex = 1;

  while (weekIndex <= basics.durationWeeks) {
    if (signal?.aborted) {
      console.log(`[Generate] Cancelled before week ${weekIndex}`);
      await storage.updateSyllabus(syllabusId, { status: 'draft' });
      return;
    }

    const batchStart = weekIndex;
    const batchEnd = Math.min(weekIndex + BATCH_SIZE - 1, basics.durationWeeks);
    const batchWeekCount = batchEnd - batchStart + 1;
    const weekLabel = batchWeekCount === 1
      ? `Week ${batchStart}`
      : `Weeks ${batchStart}-${batchEnd}`;

    console.log(`[Generate] Starting batch: ${weekLabel}`);

    // Build batch-specific topic guidance from the curriculum
    const batchTopics = [];
    for (let i = batchStart; i <= batchEnd; i++) {
      const cw = savedWeeks.get(i);
      if (cw) batchTopics.push(`Week ${i}: "${cw.title}" — ${cw.description}`);
    }

    const systemPrompt = `You are a Syllabind designer. Generate readings and exercises for ${weekLabel} of "${basics.title}" (${basics.audienceLevel}).

Description: ${basics.description}

FULL CURRICULUM OUTLINE (for context — do NOT duplicate content across weeks):
${outlineString}

You are generating ${weekLabel} ONLY. The week titles and descriptions are already set. Generate ONLY the readings and exercises.
${batchTopics.map(t => `Topic for ${t}`).join('\n')}

Rules:
- Each week: 3 readings + 1 exercise (exercise last). Max 5 hours/week.
- EVERY reading MUST have a url found via web search. Do NOT invent or guess URLs.
- EVERY reading MUST have a note (1-2 sentence context for the learner).
- EVERY step MUST have estimatedMinutes (typical: 15-30 for readings, 30-60 for exercises).
- EVERY exercise MUST have a promptText (~500 chars). Be concise — focus on the core task, not lengthy preambles.
- Include 1+ academic source per week (jstor, arxiv, scholar.google, .edu, worldcat, academia.edu)
- No Wikipedia links.
- Use mediaType "Book" for book chapters, "Journal Article" for papers
- EVERY reading MUST have creationDate in YYYY-MM-DD format. Extract from search results; if unknown, use best estimate.
- Exercises: creative, open-ended, producing real outputs.
- Tailor difficulty to ${basics.audienceLevel} (Beginner=middle school, Intermediate=college, Advanced=post-grad)
- Do NOT include title or description in finalize_week — they are pre-set.

Process: Search for resources first (~2-3 searches per week), then call finalize_week for each week sequentially.
weekIndex values: Week ${batchStart} = ${batchStart}${batchWeekCount > 1 ? `, Week ${batchEnd} = ${batchEnd}` : ''}.`;

    const messages: Anthropic.MessageParam[] = [
      { role: 'user', content: `Generate readings and exercises for ${weekLabel}.` }
    ];

    let retryCount = 0;
    const MAX_RETRIES_PER_WEEK = 3;
    let weekStartedSent = new Set<number>();
    const batchSavedSteps: MissingUrlStep[] = [];

    // Inner loop: process this batch until both weeks are finalized
    while (weekIndex <= batchEnd) {
      if (signal?.aborted) {
        console.log(`[Generate] Cancelled before week ${weekIndex}`);
        await storage.updateSyllabus(syllabusId, { status: 'draft' });
        return;
      }

      let response;
      try {
        response = await createMessageWithRetry({
          model: CLAUDE_MODEL_GENERATION,
          max_tokens: 8192,
          system: [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }],
          tools: getGenerationTools(),
          messages,
          signal: signal as AbortSignal | undefined
        }, ws, `generate ${weekLabel} (at week ${weekIndex})`);
      } catch (error: any) {
        if (signal?.aborted || error.name === 'AbortError') {
          console.log(`[Generate] Cancelled during week ${weekIndex} API call (${sessionApiCalls} API calls made)`);
          await storage.updateSyllabus(syllabusId, { status: 'draft' });
          return;
        }

        console.error('Syllabind generation error:', error);

        let errorData: any = {
          message: error.message || 'Failed to generate Syllabind',
          weekIndex
        };

        if (error.status === 400) {
          errorData.details = 'Web search may not be enabled in your organization. Check Console settings.';
        } else if (error.status === 429 && error.headers) {
          const headers = error.headers as Record<string, string>;
          const remaining = headers['anthropic-ratelimit-requests-remaining'];
          const resetTime = headers['anthropic-ratelimit-requests-reset'];

          let resetIn = 0;
          if (resetTime) {
            const resetDate = new Date(resetTime);
            resetIn = Math.ceil((resetDate.getTime() - Date.now()) / 1000);
          }

          errorData = {
            ...errorData,
            isRateLimit: true,
            message: 'Rate limit exceeded during generation',
            remaining: remaining ? parseInt(remaining) : undefined,
            resetIn,
            details: `Please wait ${resetIn} seconds before trying again.`
          };
        }

        ws.send(JSON.stringify({
          type: 'generation_error',
          data: errorData
        }));

        throw error;
      }

      // Filter out heavy web search blocks from response content for message history
      const filteredContent = response.content.filter((block: any) => {
        if (block.type === 'text' || block.type === 'tool_use') return true;
        if (block.type === 'web_search_tool_result') return false;
        if (block.type === 'server_tool_use' && block.name === 'web_search') return false;
        return true;
      });

      if (response.stop_reason === 'tool_use') {
        const toolUseBlocks = response.content.filter(
          (block): block is Anthropic.ContentBlock & { type: 'tool_use' } =>
            block.type === 'tool_use'
        );

        const toolResults: Anthropic.MessageParam = {
          role: 'user',
          content: []
        };

        for (const toolUse of toolUseBlocks) {
          const toolName = toolUse.name;
          const toolInput = toolUse.input as any;

          if (toolName === 'web_search') {
            continue;
          }

          if (toolName === 'finalize_week') {
            const actualWeekIndex = weekIndex;

            if (!weekStartedSent.has(actualWeekIndex)) {
              ws.send(JSON.stringify({
                type: 'week_started',
                data: { weekIndex: actualWeekIndex }
              }));
              weekStartedSent.add(actualWeekIndex);
            }

            // Use the pre-created week from Phase 1 instead of creating a new one
            const savedWeek = savedWeeks.get(actualWeekIndex);
            if (!savedWeek) {
              console.error(`[Week ${actualWeekIndex}] No pre-created week found in savedWeeks map`);
              throw new Error(`No pre-created week for index ${actualWeekIndex}`);
            }

            const weekTitle = savedWeek.title;
            const weekDescription = savedWeek.description;

            ws.send(JSON.stringify({
              type: 'week_info',
              data: {
                weekIndex: actualWeekIndex,
                title: weekTitle,
                description: weekDescription
              }
            }));

            if (!Array.isArray(toolInput.steps)) {
              console.error(`[Week ${actualWeekIndex}] steps is not an array:`, typeof toolInput.steps, toolInput.steps);
              toolInput.steps = [];
            }

            console.log(`[Week ${actualWeekIndex}] Claude sent ${toolInput.steps.length} steps (expected 4)`);
            if (toolInput.steps.length !== 4) {
              console.warn(`[Week ${actualWeekIndex}] Step count mismatch! Steps:`, toolInput.steps.map((s: any) => `${s.type}: ${s.title}`));
            }

            for (let i = 0; i < toolInput.steps.length; i++) {
              const stepData = toolInput.steps[i];

              if (i > 0) {
                await new Promise(resolve => setTimeout(resolve, 350));
              }

              try {
                if (!stepData.type || !stepData.title) {
                  console.error(`[Week ${actualWeekIndex}] Step ${i + 1} missing required fields:`, {
                    hasType: !!stepData.type,
                    hasTitle: !!stepData.title,
                    stepData
                  });

                  ws.send(JSON.stringify({
                    type: 'step_error',
                    data: {
                      weekIndex: actualWeekIndex,
                      stepIndex: i + 1,
                      error: 'Missing required fields (type or title)',
                      stepData
                    }
                  }));

                  continue;
                }

                if (stepData.type !== 'reading' && stepData.type !== 'exercise') {
                  console.error(`[Week ${actualWeekIndex}] Step ${i + 1} has invalid type: "${stepData.type}"`);
                  ws.send(JSON.stringify({
                    type: 'step_error',
                    data: {
                      weekIndex: actualWeekIndex,
                      stepIndex: i + 1,
                      error: `Invalid step type: "${stepData.type}". Must be "reading" or "exercise"`,
                      stepData
                    }
                  }));
                  continue;
                }

                // Validate URL for reading steps
                if (stepData.type === 'reading' && stepData.url) {
                  const isValid = await validateUrl(stepData.url);
                  if (!isValid) {
                    console.warn(`[Week ${actualWeekIndex}] Step ${i + 1} URL failed validation: ${stepData.url}`);
                    stepData.url = null;
                  }
                }

                console.log(`[Week ${actualWeekIndex}] Saving step ${i + 1}: ${stepData.type} - ${stepData.title}`);

                const createdStep = await storage.createStep({
                  weekId: savedWeek.id,
                  position: i + 1,
                  type: stepData.type,
                  title: stepData.title,
                  url: stepData.url || null,
                  note: markdownToHtml(stepData.note) || null,
                  author: stepData.author || null,
                  creationDate: stepData.creationDate || null,
                  mediaType: stepData.mediaType || null,
                  promptText: markdownToHtml(stepData.promptText) || null,
                  estimatedMinutes: defaultEstimatedMinutes(stepData.type, stepData.estimatedMinutes)
                });

                console.log(`[Week ${actualWeekIndex}] Step ${i + 1} saved successfully`);

                ws.send(JSON.stringify({
                  type: 'step_completed',
                  data: {
                    weekIndex: actualWeekIndex,
                    stepIndex: i + 1,
                    step: {
                      id: createdStep.id,
                      weekId: savedWeek.id,
                      position: i + 1,
                      type: stepData.type,
                      title: stepData.title,
                      url: stepData.url || null,
                      note: markdownToHtml(stepData.note) || null,
                      author: stepData.author || null,
                      creationDate: stepData.creationDate || null,
                      mediaType: stepData.mediaType || null,
                      promptText: markdownToHtml(stepData.promptText) || null,
                      estimatedMinutes: defaultEstimatedMinutes(stepData.type, stepData.estimatedMinutes)
                    }
                  }
                }));

                // Track readings missing URLs for repair pass
                if (stepData.type === 'reading' && !stepData.url) {
                  batchSavedSteps.push({
                    stepId: createdStep.id,
                    weekIndex: actualWeekIndex,
                    title: stepData.title,
                    author: stepData.author || null,
                    mediaType: stepData.mediaType || null
                  });
                }

              } catch (error: any) {
                console.error(`[Week ${actualWeekIndex}] Failed to save step ${i + 1}:`, error);
                console.error(`Step data:`, stepData);

                ws.send(JSON.stringify({
                  type: 'step_error',
                  data: {
                    weekIndex: actualWeekIndex,
                    stepIndex: i + 1,
                    error: error.message || 'Database insertion failed',
                    stepData
                  }
                }));
              }
            }

            console.log(`[Week ${actualWeekIndex}] Week saved with ${toolInput.steps.length} step(s)`)

            ws.send(JSON.stringify({
              type: 'week_completed',
              data: {
                weekIndex: actualWeekIndex,
                week: {
                  weekIndex: actualWeekIndex,
                  title: weekTitle,
                  description: weekDescription
                }
              }
            }));

            weekIndex++;
            retryCount = 0;

            (toolResults.content as any[]).push({
              type: 'tool_result',
              tool_use_id: toolUse.id,
              content: JSON.stringify({ success: true, weekIndex: actualWeekIndex })
            });
          }
        }

        messages.push({ role: 'assistant', content: filteredContent });

        if ((toolResults.content as any[]).length > 0) {
          messages.push(toolResults);
        }

        // Prompt for second week in batch if still needed
        if (weekIndex <= batchEnd) {
          messages.push({
            role: 'user',
            content: `Week ${weekIndex - 1} saved. Now generate readings and exercises for Week ${weekIndex}. Search for resources, then call finalize_week.`
          });
        }

        continue;
      }

      // Handle end_turn / max_tokens: Claude didn't call finalize_week
      if (filteredContent.length > 0) {
        messages.push({ role: 'assistant', content: filteredContent });
      } else {
        messages.push({ role: 'assistant', content: [{ type: 'text', text: '(continuing)' }] });
      }

      retryCount++;
      console.log(`[Week ${weekIndex}] Claude responded with stop_reason="${response.stop_reason}" without finalize_week (retry ${retryCount}/${MAX_RETRIES_PER_WEEK})`);

      if (retryCount > MAX_RETRIES_PER_WEEK) {
        console.error(`[Week ${weekIndex}] Max retries exceeded, aborting generation`);
        ws.send(JSON.stringify({
          type: 'generation_error',
          data: {
            message: `Failed to generate Week ${weekIndex} after ${MAX_RETRIES_PER_WEEK} attempts. Try again.`,
            weekIndex
          }
        }));
        throw new Error(`Max retries exceeded for week ${weekIndex}`);
      }

      messages.push({
        role: 'user',
        content: `Please call the finalize_week tool to complete Week ${weekIndex}. You must use the finalize_week tool with weekIndex: ${weekIndex} and exactly 4 steps (title/description are pre-set).`
      });
    }

    // URL repair pass: find URLs for readings that are missing them
    if (batchSavedSteps.length > 0 && !signal?.aborted) {
      await repairMissingUrls(batchSavedSteps, basics.title, ws, signal);
    }
  }

  // === Final sweep: collect ALL readings missing URLs across all weeks ===
  if (!signal?.aborted) {
    const allWeeks = await storage.getWeeksBySyllabusId(syllabusId);
    const allMissingUrls: MissingUrlStep[] = [];
    for (const week of allWeeks) {
      const weekSteps = await storage.getStepsByWeekId(week.id);
      for (const step of weekSteps) {
        if (step.type === 'reading' && !step.url) {
          allMissingUrls.push({
            stepId: step.id,
            weekIndex: week.index,
            title: step.title,
            author: step.author || null,
            mediaType: step.mediaType || null
          });
        }
      }
    }

    if (allMissingUrls.length > 0) {
      console.log(`[Generate] Final sweep: ${allMissingUrls.length} readings still missing URLs across all weeks`);
      await repairMissingUrls(allMissingUrls, basics.title, ws, signal);
    }
  }

  const totalTime = ((Date.now() - sessionStartTime) / 1000).toFixed(1);
  console.log(`[Generate] Complete for syllabind ${syllabusId}: ${sessionApiCalls} API calls, ${totalTime}s total`);

  await storage.updateSyllabus(syllabusId, { status: 'draft' });

  ws.send(JSON.stringify({
    type: 'generation_complete',
    data: { syllabusId }
  }));
}

interface WeekRegenerationContext {
  syllabusId: number;
  weekIndex: number;
  existingWeekId?: number;
  basics: {
    title: string;
    description: string;
    audienceLevel: string;
    durationWeeks: number;
  };
  weekTitle?: string;
  weekDescription?: string;
  allWeeksOutline?: CurriculumWeek[];
  ws: WebSocket;
  signal?: AbortSignal;
}

export async function regenerateWeek(context: WeekRegenerationContext): Promise<void> {
  const { syllabusId, weekIndex, existingWeekId, basics, weekTitle, weekDescription, allWeeksOutline, ws, signal } = context;
  resetApiCallCounter();
  console.log(`[RegenerateWeek] Starting regeneration for syllabind ${syllabusId}, week ${weekIndex}`);

  if (signal?.aborted) {
    console.log(`[RegenerateWeek] Cancelled before starting week ${weekIndex}`);
    return;
  }

  ws.send(JSON.stringify({
    type: 'week_started',
    data: { weekIndex }
  }));

  // Build outline context if available
  const outlineSection = allWeeksOutline && allWeeksOutline.length > 0
    ? `\nFULL CURRICULUM OUTLINE (for context — do NOT duplicate content from other weeks):\n${buildOutlineString(allWeeksOutline)}\n`
    : '';

  // Build topic guidance from existing title/description
  const topicSection = weekTitle
    ? `\nThis week's topic: "${weekTitle}"${weekDescription ? ` — ${weekDescription}` : ''}\nThe week title and description are already set. Generate ONLY the readings and exercises. Do NOT include title or description in finalize_week.`
    : '';

  const systemPrompt = `You are a Syllabind designer regenerating Week ${weekIndex} for "${basics.title}" (${basics.audienceLevel}).

Description: ${basics.description}
Week ${weekIndex} of ${basics.durationWeeks} total.
${outlineSection}${topicSection}

Rules:
- Generate Week ${weekIndex} ONLY. 3 readings + 1 exercise (exercise last). Max 5 hours/week.
- EVERY reading MUST have a url found via web search. Do NOT invent or guess URLs.
- EVERY reading MUST have a note (1-2 sentence context for the learner).
- EVERY step MUST have estimatedMinutes (typical: 15-30 for readings, 30-60 for exercises).
- EVERY exercise MUST have a promptText (max 500 chars). Be concise — focus on the core task, not lengthy preambles.
- Include 1+ academic source (jstor, arxiv, scholar.google, .edu, worldcat, academia.edu)
- No Wikipedia links.
- Use mediaType "Book" for book chapters, "Journal Article" for papers
- EVERY reading MUST have creationDate in YYYY-MM-DD format. Extract from search results; if unknown, use best estimate.
- Exercises: creative, open-ended, producing real outputs.
- Tailor difficulty to ${basics.audienceLevel} (Beginner=middle school, Intermediate=college, Advanced=post-grad)

Process: Search for resources first (~2-3 searches), then call finalize_week.`;

  const messages: Anthropic.MessageParam[] = [
    { role: 'user', content: `Generate readings and exercises for Week ${weekIndex}.` }
  ];

  let response;
  try {
    response = await createMessageWithRetry({
      model: CLAUDE_MODEL_GENERATION,
      max_tokens: 4096,
      system: [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }],
      tools: getGenerationTools(),
      messages,
      signal: signal as AbortSignal | undefined
    }, ws, `regen week ${weekIndex}`);
  } catch (error: any) {
    if (signal?.aborted || error.name === 'AbortError') {
      console.log(`[RegenerateWeek] Cancelled during week ${weekIndex} API call (${sessionApiCalls} API calls made)`);
      return;
    }

    console.error('Week regeneration error:', error);

    let errorData: any = {
      message: error.message || 'Failed to regenerate week',
      weekIndex
    };

    if (error.status === 429 && error.headers) {
      const headers = error.headers as Record<string, string>;
      const remaining = headers['anthropic-ratelimit-requests-remaining'];
      const resetTime = headers['anthropic-ratelimit-requests-reset'];

      let resetIn = 0;
      if (resetTime) {
        const resetDate = new Date(resetTime);
        resetIn = Math.ceil((resetDate.getTime() - Date.now()) / 1000);
      }

      errorData = {
        ...errorData,
        isRateLimit: true,
        message: 'Rate limit exceeded during generation',
        remaining: remaining ? parseInt(remaining) : undefined,
        resetIn,
        details: `Please wait ${resetIn} seconds before trying again.`
      };
    }

    ws.send(JSON.stringify({
      type: 'generation_error',
      data: errorData
    }));

    throw error;
  }

  // Retry loop: if Claude doesn't call finalize_week, prompt it again (up to 3 times)
  let regenRetries = 0;
  const MAX_REGEN_RETRIES = 3;
  while (response.stop_reason !== 'tool_use' || !response.content.some((b: any) => b.type === 'tool_use' && b.name === 'finalize_week')) {
    if (signal?.aborted) {
      console.log(`[RegenerateWeek] Cancelled during retry for week ${weekIndex}`);
      return;
    }

    regenRetries++;
    if (regenRetries > MAX_REGEN_RETRIES) {
      ws.send(JSON.stringify({
        type: 'generation_error',
        data: { message: `Failed to regenerate Week ${weekIndex} after ${MAX_REGEN_RETRIES} attempts. Try again.`, weekIndex }
      }));
      throw new Error(`Max retries exceeded for week ${weekIndex} regeneration`);
    }

    console.log(`[RegenerateWeek ${weekIndex}] Claude responded with stop_reason="${response.stop_reason}" without finalize_week (retry ${regenRetries}/${MAX_REGEN_RETRIES})`);

    const filtered = response.content.filter((block: any) => {
      if (block.type === 'text' || block.type === 'tool_use') return true;
      if (block.type === 'web_search_tool_result') return false;
      if (block.type === 'server_tool_use' && block.name === 'web_search') return false;
      return true;
    });
    messages.push({ role: 'assistant', content: filtered.length > 0 ? filtered : [{ type: 'text', text: '(continuing)' }] });
    const retryHint = weekTitle
      ? `Please call the finalize_week tool to complete Week ${weekIndex}. You must use the finalize_week tool with weekIndex: ${weekIndex} and exactly 4 steps (title/description are pre-set).`
      : `Please call the finalize_week tool to complete Week ${weekIndex}. You must use the finalize_week tool with weekIndex: ${weekIndex}, a title, and exactly 4 steps.`;
    messages.push({ role: 'user', content: retryHint });

    response = await createMessageWithRetry({
      model: CLAUDE_MODEL_GENERATION,
      max_tokens: 4096,
      system: [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }],
      tools: getGenerationTools(),
      messages,
      signal: signal as AbortSignal | undefined
    }, ws, `regen week ${weekIndex} retry ${regenRetries}`);
  }

  const regenSavedSteps: MissingUrlStep[] = []; // Track readings for URL repair

  if (response.stop_reason === 'tool_use') {
    const toolUseBlocks = response.content.filter(
      (block): block is Anthropic.ContentBlock & { type: 'tool_use' } =>
        block.type === 'tool_use'
    );

    for (const toolUse of toolUseBlocks) {
      if (toolUse.name === 'finalize_week') {
        const toolInput = toolUse.input as any;

        // Use preserved title/description if available, otherwise use Claude's output
        const finalTitle = weekTitle || toolInput.title;
        const finalDescription = weekDescription || toolInput.description;

        let weekId = existingWeekId;
        if (!weekId) {
          const week = await storage.createWeek({
            syllabusId,
            index: weekIndex,
            title: finalTitle,
            description: finalDescription
          });
          weekId = week.id;
        } else if (!weekTitle) {
          // Only update title/description if not preserving existing ones
          await storage.updateWeek(weekId, {
            title: finalTitle,
            description: finalDescription
          });
        }

        ws.send(JSON.stringify({
          type: 'week_info',
          data: {
            weekIndex,
            title: finalTitle,
            description: finalDescription
          }
        }));

        if (!Array.isArray(toolInput.steps)) {
          console.error(`[Week ${weekIndex}] steps is not an array:`, typeof toolInput.steps, toolInput.steps);
          toolInput.steps = [];
        }

        for (let i = 0; i < toolInput.steps.length; i++) {
          const stepData = toolInput.steps[i];
          if (i > 0) await new Promise(resolve => setTimeout(resolve, 350));

          if (!stepData.type || !stepData.title) {
            console.error(`[Week ${weekIndex}] Step ${i + 1} missing required fields`);
            continue;
          }

          if (stepData.type !== 'reading' && stepData.type !== 'exercise') {
            console.error(`[Week ${weekIndex}] Step ${i + 1} has invalid type: "${stepData.type}"`);
            continue;
          }

          // Validate URL for reading steps
          if (stepData.type === 'reading' && stepData.url) {
            const isValid = await validateUrl(stepData.url);
            if (!isValid) {
              console.warn(`[Week ${weekIndex}] Step ${i + 1} URL failed validation: ${stepData.url}`);
              stepData.url = null;
            }
          }

          const createdStep = await storage.createStep({
            weekId,
            position: i + 1,
            type: stepData.type,
            title: stepData.title,
            url: stepData.url || null,
            note: markdownToHtml(stepData.note) || null,
            author: stepData.author || null,
            creationDate: stepData.creationDate || null,
            mediaType: stepData.mediaType || null,
            promptText: markdownToHtml(stepData.promptText) || null,
            estimatedMinutes: defaultEstimatedMinutes(stepData.type, stepData.estimatedMinutes)
          });

          ws.send(JSON.stringify({
            type: 'step_completed',
            data: {
              weekIndex,
              stepIndex: i + 1,
              step: {
                id: createdStep.id,
                weekId,
                position: i + 1,
                type: stepData.type,
                title: stepData.title,
                url: stepData.url || null,
                note: markdownToHtml(stepData.note) || null,
                author: stepData.author || null,
                creationDate: stepData.creationDate || null,
                mediaType: stepData.mediaType || null,
                promptText: markdownToHtml(stepData.promptText) || null,
                estimatedMinutes: defaultEstimatedMinutes(stepData.type, stepData.estimatedMinutes)
              }
            }
          }));

          // Track readings missing URLs for repair pass
          if (stepData.type === 'reading' && !stepData.url) {
            regenSavedSteps.push({
              stepId: createdStep.id,
              weekIndex,
              title: stepData.title,
              author: stepData.author || null,
              mediaType: stepData.mediaType || null
            });
          }
        }

        ws.send(JSON.stringify({
          type: 'week_completed',
          data: {
            weekIndex,
            week: {
              weekIndex,
              title: finalTitle,
              description: finalDescription
            }
          }
        }));
      }
    }
  }

  // URL repair pass: find URLs for readings that are missing them
  if (regenSavedSteps.length > 0 && !signal?.aborted) {
    await repairMissingUrls(regenSavedSteps, basics.title, ws, signal);
  }

  const totalTime = ((Date.now() - sessionStartTime) / 1000).toFixed(1);
  console.log(`[RegenerateWeek] Complete for syllabind ${syllabusId}, week ${weekIndex}: ${sessionApiCalls} API calls, ${totalTime}s total`);

  ws.send(JSON.stringify({
    type: 'week_regeneration_complete',
    data: { syllabusId, weekIndex }
  }));
}
