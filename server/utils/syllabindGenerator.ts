import Anthropic from '@anthropic-ai/sdk';
import { storage } from '../storage';
import { SYLLABIND_GENERATION_TOOLS, CLAUDE_MODEL, client } from './claudeClient';
import { markdownToHtml } from './markdownToHtml';
import { apiQueue } from './requestQueue';
import WebSocket from 'ws';

const MAX_RETRIES = 5;

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
        const backoff = retryAfter ?? Math.min(2 ** attempt * 1000, 16_000);
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

  const systemPrompt = `You are a Syllabind designer. Generate ${basics.durationWeeks} weeks for "${basics.title}" (${basics.audienceLevel}).

Description: ${basics.description}

Rules:
- Each week: 3 readings + 1 exercise (exercise last). Max 5 hours/week.
- Real links only. No Wikipedia.
- Include 1+ academic source per week (jstor, arxiv, scholar.google, .edu, worldcat, academia.edu)
- Use mediaType "Book" for book chapters, "Journal Article" for papers
- Extract creationDate (dd/mm/yyyy) from search results when available
- Exercises: creative, open-ended, producing real outputs. Use markdown formatting.
- Tailor difficulty to ${basics.audienceLevel} (Beginner=middle school, Intermediate=college, Advanced=post-grad)
- ~5 web searches total. Use them wisely.

Process: Generate ALL ${basics.durationWeeks} weeks. Search for resources (~5 searches total), then call finalize_week for each week sequentially (Week 1 first, then Week 2, etc.).
weekIndex values: Week 1 = 1, Week 2 = 2, etc.`;

  const messages: Anthropic.MessageParam[] = [
    { role: 'user', content: `Generate all ${basics.durationWeeks} weeks.` }
  ];

  let weekIndex = 1;
  let retryCount = 0;
  const MAX_RETRIES_PER_WEEK = 3;
  let weekStartedSent = new Set<number>();

  while (weekIndex <= basics.durationWeeks) {
    // Check for cancellation before each API call
    if (signal?.aborted) {
      console.log(`[Generate] Cancelled before week ${weekIndex}`);
      await storage.updateSyllabus(syllabusId, { status: 'draft' });
      return;
    }

    let response;
    try {
      response = await createMessageWithRetry({
        model: CLAUDE_MODEL,
        max_tokens: 8192,
        system: [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }],
        tools: SYLLABIND_GENERATION_TOOLS,
        messages,
        signal: signal as AbortSignal | undefined
      }, ws, `generate weeks ${weekIndex}-${basics.durationWeeks}`);
    } catch (error: any) {
      // Abort errors are not generation failures
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
      // Filter for custom tool_use blocks only (not server_tool_use like web_search)
      const toolUseBlocks = response.content.filter(
        (block): block is Anthropic.ContentBlock & { type: 'tool_use' } =>
          block.type === 'tool_use'
      );

      const toolResults: Anthropic.MessageParam = {
        role: 'user',
        content: []
      };

      // Process custom tools only (web_search is handled server-side)
      for (const toolUse of toolUseBlocks) {
        const toolName = toolUse.name;
        const toolInput = toolUse.input as any;

        // Skip web_search - it's executed server-side and doesn't need tool_result
        if (toolName === 'web_search') {
          continue;
        }

        if (toolName === 'finalize_week') {
          // Always use sequential counter — Claude may send duplicate or out-of-order weekIndex values
          const actualWeekIndex = weekIndex;

          // Send week_started once per week (handles multiple weeks in one response)
          if (!weekStartedSent.has(actualWeekIndex)) {
            ws.send(JSON.stringify({
              type: 'week_started',
              data: { weekIndex: actualWeekIndex }
            }));
            weekStartedSent.add(actualWeekIndex);
          }

          // Save week to database
          const week = await storage.createWeek({
            syllabusId,
            index: actualWeekIndex,
            title: toolInput.title,
            description: toolInput.description
          });

          // Send week title/description FIRST (before steps) so they render immediately
          ws.send(JSON.stringify({
            type: 'week_info',
            data: {
              weekIndex: actualWeekIndex,
              title: toolInput.title,
              description: toolInput.description
            }
          }));

          // Ensure steps is an array
          if (!Array.isArray(toolInput.steps)) {
            console.error(`[Week ${actualWeekIndex}] steps is not an array:`, typeof toolInput.steps, toolInput.steps);
            toolInput.steps = [];
          }

          console.log(`[Week ${actualWeekIndex}] Claude sent ${toolInput.steps.length} steps (expected 4)`);
          if (toolInput.steps.length !== 4) {
            console.warn(`[Week ${actualWeekIndex}] Step count mismatch! Steps:`, toolInput.steps.map((s: any) => `${s.type}: ${s.title}`));
          }

          // Save steps with error handling and validation
          for (let i = 0; i < toolInput.steps.length; i++) {
            const stepData = toolInput.steps[i];

            // Add delay before sending step_completed (except for first step)
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

              console.log(`[Week ${actualWeekIndex}] Saving step ${i + 1}: ${stepData.type} - ${stepData.title}`);

              const createdStep = await storage.createStep({
                weekId: week.id,
                position: i + 1,
                type: stepData.type,
                title: stepData.title,
                url: stepData.url || null,
                note: markdownToHtml(stepData.note) || null,
                author: stepData.author || null,
                creationDate: stepData.creationDate || null,
                mediaType: stepData.mediaType || null,
                promptText: markdownToHtml(stepData.promptText) || null,
                estimatedMinutes: stepData.estimatedMinutes || null
              });

              console.log(`[Week ${actualWeekIndex}] Step ${i + 1} saved successfully`);

              ws.send(JSON.stringify({
                type: 'step_completed',
                data: {
                  weekIndex: actualWeekIndex,
                  stepIndex: i + 1,
                  step: {
                    id: createdStep.id,
                    weekId: week.id,
                    position: i + 1,
                    type: stepData.type,
                    title: stepData.title,
                    url: stepData.url || null,
                    note: markdownToHtml(stepData.note) || null,
                    author: stepData.author || null,
                    creationDate: stepData.creationDate || null,
                    mediaType: stepData.mediaType || null,
                    promptText: markdownToHtml(stepData.promptText) || null,
                    estimatedMinutes: stepData.estimatedMinutes || null
                  }
                }
              }));

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
                title: toolInput.title,
                description: toolInput.description
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

      // Always push assistant message to maintain proper message alternation
      messages.push({ role: 'assistant', content: filteredContent });

      // Only push tool results if there are any (there won't be for web_search-only responses)
      if ((toolResults.content as any[]).length > 0) {
        messages.push(toolResults);
      }

      // Prompt Claude to generate remaining weeks (hybrid fallback)
      if (weekIndex <= basics.durationWeeks) {
        messages.push({
          role: 'user',
          content: `Generated through Week ${weekIndex - 1}. Now generate the remaining weeks (${weekIndex} through ${basics.durationWeeks}). Call finalize_week for each.`
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

    if (weekIndex <= basics.durationWeeks) {
      messages.push({
        role: 'user',
        content: `Please call the finalize_week tool to complete Week ${weekIndex}. You must use the finalize_week tool with weekIndex: ${weekIndex}, a title, and exactly 4 steps.`
      });
    } else {
      break;
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
  ws: WebSocket;
  signal?: AbortSignal;
}

export async function regenerateWeek(context: WeekRegenerationContext): Promise<void> {
  const { syllabusId, weekIndex, existingWeekId, basics, ws, signal } = context;
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

  const systemPrompt = `You are a Syllabind designer regenerating Week ${weekIndex} for "${basics.title}" (${basics.audienceLevel}).

Description: ${basics.description}
Week ${weekIndex} of ${basics.durationWeeks} total.

Rules:
- Generate Week ${weekIndex} ONLY. 3 readings + 1 exercise (exercise last).
- Real links only. No Wikipedia.
- 1+ academic source (jstor, arxiv, scholar.google, .edu)
- Exercises: creative, open-ended, producing real outputs. Use markdown.
- Extract creationDate (dd/mm/yyyy) when available.

Search for resources, then call finalize_week.`;

  const messages: Anthropic.MessageParam[] = [
    { role: 'user', content: `Generate Week ${weekIndex}.` }
  ];

  let response;
  try {
    response = await createMessageWithRetry({
      model: CLAUDE_MODEL,
      max_tokens: 4096,
      system: [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }],
      tools: SYLLABIND_GENERATION_TOOLS,
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
    messages.push({ role: 'user', content: `Please call the finalize_week tool to complete Week ${weekIndex}. You must use the finalize_week tool with weekIndex: ${weekIndex}, a title, and exactly 4 steps.` });

    response = await createMessageWithRetry({
      model: CLAUDE_MODEL,
      max_tokens: 4096,
      system: [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }],
      tools: SYLLABIND_GENERATION_TOOLS,
      messages,
      signal: signal as AbortSignal | undefined
    }, ws, `regen week ${weekIndex} retry ${regenRetries}`);
  }

  if (response.stop_reason === 'tool_use') {
    const toolUseBlocks = response.content.filter(
      (block): block is Anthropic.ContentBlock & { type: 'tool_use' } =>
        block.type === 'tool_use'
    );

    for (const toolUse of toolUseBlocks) {
      if (toolUse.name === 'finalize_week') {
        const toolInput = toolUse.input as any;

        let weekId = existingWeekId;
        if (!weekId) {
          const week = await storage.createWeek({
            syllabusId,
            index: weekIndex,
            title: toolInput.title,
            description: toolInput.description
          });
          weekId = week.id;
        } else {
          await storage.updateWeek(weekId, {
            title: toolInput.title,
            description: toolInput.description
          });
        }

        ws.send(JSON.stringify({
          type: 'week_info',
          data: {
            weekIndex,
            title: toolInput.title,
            description: toolInput.description
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
            estimatedMinutes: stepData.estimatedMinutes || null
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
                estimatedMinutes: stepData.estimatedMinutes || null
              }
            }
          }));
        }

        ws.send(JSON.stringify({
          type: 'week_completed',
          data: {
            weekIndex,
            week: {
              weekIndex,
              title: toolInput.title,
              description: toolInput.description
            }
          }
        }));
      }
    }
  }

  const totalTime = ((Date.now() - sessionStartTime) / 1000).toFixed(1);
  console.log(`[RegenerateWeek] Complete for syllabind ${syllabusId}, week ${weekIndex}: ${sessionApiCalls} API calls, ${totalTime}s total`);

  ws.send(JSON.stringify({
    type: 'week_regeneration_complete',
    data: { syllabusId, weekIndex }
  }));
}
