import Anthropic from '@anthropic-ai/sdk';
import { storage } from '../storage';
import { SYLLABIND_GENERATION_TOOLS, executeToolCall, CLAUDE_MODEL } from './claudeClient';
import { markdownToHtml } from './markdownToHtml';
import WebSocket from 'ws';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface GenerationContext {
  syllabusId: number;
  basics: {
    title: string;
    description: string;
    audienceLevel: string;
    durationWeeks: number;
  };
  ws: WebSocket;
  model?: string;
}

export async function generateSyllabind(context: GenerationContext): Promise<void> {
  const { syllabusId, basics, ws, model } = context;
  const selectedModel = model || CLAUDE_MODEL;

  const systemPrompt = `You are an expert Syllabind designer.

Generate EXACTLY ${basics.durationWeeks} weeks for "${basics.title}" (${basics.audienceLevel} level).

Description: ${basics.description}

STRICT REQUIREMENTS:
- You MUST generate exactly ${basics.durationWeeks} weeks, no more, no less
- Each week MUST have exactly 4 steps: 3 readings + 1 exercise
- The exercise MUST always be the last step (position 4)
- Readings: Include title, URL, author, media type, estimated time, and relevance note
- Exercise: Include title, prompt text, and estimated time
- NEVER use Wikipedia pages - avoid all wikipedia.org links
- Ensure logical week-to-week progression

ACADEMIC SOURCE REQUIREMENTS:
- Each week MUST include at least 1 academic source: book chapter, journal article, or scholarly paper
- Prioritize: academia.edu, jstor.org, worldcat.org, arxiv.org, scholar.google.com, .edu domains
- Use mediaType "Book" for book chapters and "Journal Article" for academic papers
- ALWAYS extract and include creationDate (publication/creation date) in dd/mm/yyyy format from web search results

EXERCISE REQUIREMENTS:
- Exercises must be CREATIVE and OPEN-ENDED, not simple quizzes or summaries
- Design exercises that produce REAL outputs for actual consumption or use
- FORMAT promptText using markdown syntax:
  - Use "- " (dash + space) at the start of each list item for bullet points
  - Use numbered lists ("1. ", "2. ", etc.) for ordered steps
  - Separate paragraphs with blank lines
- Bias towards:
  * Content creation (write a blog post, create a video essay, design an infographic, record a podcast episode)
  * Community building (start a discussion group, organize a meetup, create a Discord/forum, interview practitioners)
  * Product/project building (build a prototype, create a tool, design a system, launch something small)
  * Experience design (plan a workshop, create a curriculum for others, design an event)
- Exercises can involve MULTIPLE STEPS and MEDIA formats
- Encourage learners to share their work publicly or with a specific audience
- Each exercise should feel like meaningful work, not busywork
- Later weeks should build on earlier exercises when possible (cumulative projects)

Process:
1. Generate ONE week at a time
2. For each week, search for educational resources (use specific, targeted queries)
3. Prioritize academic sources: academia.edu, jstor, worldcat, arxiv, google scholar, .edu - but NOT Wikipedia
4. Create exactly 4 steps: 3 readings followed by 1 exercise
5. Call finalize_week with the complete week data
6. Continue until all ${basics.durationWeeks} weeks are generated

CRITICAL weekIndex values:
- Week 1: weekIndex = 1
- Week 2: weekIndex = 2
- ...and so on until Week ${basics.durationWeeks}

Note: You have a total limit of 5 web searches. Use them wisely - about 1 search per 2 weeks.

Start with Week 1 (weekIndex: 1).`;

  const messages: Anthropic.MessageParam[] = [
    {
      role: 'user',
      content: [
        {
          type: 'text',
          text: systemPrompt,
          cache_control: { type: 'ephemeral' }
        }
      ]
    }
  ];

  let weekIndex = 1;

  while (weekIndex <= basics.durationWeeks) {
    ws.send(JSON.stringify({
      type: 'week_started',
      data: { weekIndex }
    }));

    let response;
    try {
      response = await client.messages.create({
        model: selectedModel,
        max_tokens: 4000,
        tools: SYLLABIND_GENERATION_TOOLS,
        messages
      });
    } catch (error: any) {
      console.error('Syllabind generation error:', error);

      let errorData: any = {
        message: error.message || 'Failed to generate Syllabind',
        weekIndex
      };

      // Check for specific error types
      if (error.status === 400) {
        errorData.details = 'Web search may not be enabled in your organization. Check Console settings.';
      } else if (error.status === 429 && error.headers) {
        // Extract rate limit info from headers
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

      // Send error to client
      ws.send(JSON.stringify({
        type: 'generation_error',
        data: errorData
      }));

      throw error;
    }

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
          // Use the weekIndex provided by Claude, fallback to our counter
          const actualWeekIndex = toolInput.weekIndex || weekIndex;

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

          // Log step count for debugging
          console.log(`[Week ${actualWeekIndex}] Claude sent ${toolInput.steps.length} steps (expected 4)`);
          if (toolInput.steps.length !== 4) {
            console.warn(`[Week ${actualWeekIndex}] Step count mismatch! Steps:`, toolInput.steps.map((s: any) => `${s.type}: ${s.title}`));
          }

          // Save steps with error handling and validation
          // Use delays between step_completed messages to create visible streaming effect
          for (let i = 0; i < toolInput.steps.length; i++) {
            const stepData = toolInput.steps[i];

            // Add delay before sending step_completed (except for first step)
            if (i > 0) {
              await new Promise(resolve => setTimeout(resolve, 350));
            }

            try {
              // Validate required fields
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

              // Validate type enum
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

              // Insert step
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

              // Send step_completed message immediately after saving
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

          // Send week_completed with just title/description (steps already streamed via step_completed)
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

          // Provide tool result for finalize_week
          (toolResults.content as any[]).push({
            type: 'tool_result',
            tool_use_id: toolUse.id,
            content: JSON.stringify({ success: true, weekIndex: actualWeekIndex })
          });
        }
      }

      // Filter out web_search_tool_result blocks to reduce context size
      const filteredContent = response.content.filter((block: any) => {
        // Keep text blocks and tool_use blocks (like finalize_week)
        if (block.type === 'text' || block.type === 'tool_use') {
          return true;
        }

        // Discard web_search_tool_result blocks (they contain heavy encrypted content)
        if (block.type === 'web_search_tool_result') {
          return false;
        }

        // Discard server_tool_use blocks for web_search
        if (block.type === 'server_tool_use' && block.name === 'web_search') {
          return false;
        }

        return true;
      });

      messages.push({ role: 'assistant', content: filteredContent });

      // Only push tool results if there are any (there won't be for web_search-only responses)
      if ((toolResults.content as any[]).length > 0) {
        messages.push(toolResults);
      }

      // CRITICAL FIX: Prompt Claude to generate the next week
      if (weekIndex <= basics.durationWeeks) {
        messages.push({
          role: 'user',
          content: `Excellent! Week ${weekIndex - 1} is complete. Now generate Week ${weekIndex}.`
        });
      }

      continue;
    }

    if (weekIndex <= basics.durationWeeks) {
      messages.push({
        role: 'user',
        content: `Great! Now generate Week ${weekIndex}.`
      });
    } else {
      break;
    }
  }

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
  model?: string;
}

export async function regenerateWeek(context: WeekRegenerationContext): Promise<void> {
  const { syllabusId, weekIndex, existingWeekId, basics, ws, model } = context;
  const selectedModel = model || CLAUDE_MODEL;

  ws.send(JSON.stringify({
    type: 'week_started',
    data: { weekIndex }
  }));

  const systemPrompt = `You are an expert Syllabind designer regenerating Week ${weekIndex} for "${basics.title}" (${basics.audienceLevel} level).

Description: ${basics.description}

This is week ${weekIndex} of ${basics.durationWeeks} total weeks.

STRICT REQUIREMENTS:
- Generate content for Week ${weekIndex} ONLY
- Create exactly 4 steps: 3 readings + 1 exercise
- The exercise MUST be the last step (position 4)
- Readings: Include title, URL, author, media type, estimated time, and relevance note
- Exercise: Include title, prompt text, and estimated time
- NEVER use Wikipedia pages - avoid all wikipedia.org links

ACADEMIC SOURCE REQUIREMENTS:
- Include at least 1 academic source: book chapter, journal article, or scholarly paper
- Prioritize: academia.edu, jstor.org, worldcat.org, arxiv.org, scholar.google.com, .edu domains

EXERCISE REQUIREMENTS:
- Exercises must be CREATIVE and OPEN-ENDED
- Design exercises that produce REAL outputs for actual consumption or use
- FORMAT promptText using markdown syntax

Generate the week content now. Search for resources, then call finalize_week when complete.`;

  const messages: Anthropic.MessageParam[] = [
    {
      role: 'user',
      content: [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }]
    }
  ];

  let response;
  try {
    response = await client.messages.create({
      model: selectedModel,
      max_tokens: 4000,
      tools: SYLLABIND_GENERATION_TOOLS,
      messages
    });
  } catch (error: any) {
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

  if (response.stop_reason === 'tool_use') {
    const toolUseBlocks = response.content.filter(
      (block): block is Anthropic.ContentBlock & { type: 'tool_use' } =>
        block.type === 'tool_use'
    );

    for (const toolUse of toolUseBlocks) {
      if (toolUse.name === 'finalize_week') {
        const toolInput = toolUse.input as any;

        // Create or update week
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

        // Send week_info
        ws.send(JSON.stringify({
          type: 'week_info',
          data: {
            weekIndex,
            title: toolInput.title,
            description: toolInput.description
          }
        }));

        // Save and stream steps
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

        // Send week_completed
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

  // Signal completion
  ws.send(JSON.stringify({
    type: 'week_regeneration_complete',
    data: { syllabusId, weekIndex }
  }));
}
