import { WebSocket } from 'ws';
import Anthropic from '@anthropic-ai/sdk';
import { storage } from '../storage';
import { SYLLABIND_CHAT_TOOLS, executeToolCall, CLAUDE_MODEL, client } from '../utils/claudeClient';
import { markdownToHtml } from '../utils/markdownToHtml';
import { apiQueue } from '../utils/requestQueue';

const MAX_HISTORY_MESSAGES = 10;
const MAX_TOOL_ITERATIONS = 5; // Prevent infinite loops

export function handleChatSyllabindWS(ws: WebSocket, syllabusId: number) {
  let conversationHistory: Anthropic.MessageParam[] = [];
  let pendingToolConfirmation: { toolCall: any; resolve: (approved: boolean) => void } | null = null;

  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data.toString());

      if (message.type === 'init') {
        const previousMessages = await storage.getChatMessages(syllabusId);
        const truncatedMessages = previousMessages.slice(-MAX_HISTORY_MESSAGES);
        conversationHistory = truncatedMessages.map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        }));

        ws.send(JSON.stringify({
          type: 'history',
          data: conversationHistory
        }));
        return;
      }

      // Handle tool confirmation response
      if (message.type === 'tool_confirmed') {
        if (pendingToolConfirmation) {
          pendingToolConfirmation.resolve(message.approved);
          pendingToolConfirmation = null;
        }
        return;
      }

      // Handle clear chat request
      if (message.type === 'clear_chat') {
        await storage.clearChatMessages(syllabusId);
        conversationHistory = [];
        ws.send(JSON.stringify({
          type: 'chat_cleared',
          data: { success: true }
        }));
        return;
      }

      if (message.type === 'user_message') {
        const userMessage = message.content;

        await storage.createChatMessage({
          syllabusId,
          role: 'user',
          content: userMessage
        });

        conversationHistory.push({
          role: 'user',
          content: userMessage
        });

        let syllabus = await storage.getSyllabusWithContent(syllabusId);
        if (!syllabus) {
          ws.send(JSON.stringify({
            type: 'error',
            data: { message: 'Syllabus not found' }
          }));
          return;
        }

        const systemPrompt = `You are a helpful Syllabind assistant.

Current Syllabind: "${syllabus.title}" (${syllabus.audienceLevel}, ${syllabus.durationWeeks} weeks)

You can:
- Use read_current_syllabind to see the full Syllabind structure (call this first if needed)
- Search the web for additional high-quality educational resources (requires user approval)
- Add, remove, or modify steps (readings/exercises)
- Update week titles and descriptions

When searching, prioritize: .edu domains, Coursera, YouTube, Khan Academy.
Be conversational and helpful. Always cite your sources.`;

        // Agentic loop - continue until no more tool calls
        let continueLoop = true;
        let iterations = 0;
        let fullAssistantResponse = '';
        let chatApiCalls = 0;
        const chatStartTime = Date.now();

        while (continueLoop && iterations < MAX_TOOL_ITERATIONS) {
          iterations++;
          chatApiCalls++;

          await apiQueue.acquire();
          console.log(`[Chat] API call #${chatApiCalls} for syllabind ${syllabusId} (iteration ${iterations})`);
          const stream = await client.messages.stream({
            model: CLAUDE_MODEL,
            max_tokens: 2000,
            system: [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }],
            tools: SYLLABIND_CHAT_TOOLS,
            messages: conversationHistory
          });

          let iterationText = '';
          const toolUseBlocks: Anthropic.ContentBlock[] = [];
          let currentToolInput = '';
          let currentToolIndex = -1;

          for await (const event of stream) {
            // Stream text chunks to client
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
              const textChunk = event.delta.text;
              iterationText += textChunk;
              fullAssistantResponse += textChunk;

              ws.send(JSON.stringify({
                type: 'assistant_chunk',
                data: { text: textChunk }
              }));
            }

            // Capture tool_use blocks
            if (event.type === 'content_block_start' && event.content_block.type === 'tool_use') {
              currentToolIndex = toolUseBlocks.length;
              toolUseBlocks.push({
                type: 'tool_use',
                id: event.content_block.id,
                name: event.content_block.name,
                input: {}
              } as Anthropic.ToolUseBlock);
              currentToolInput = '';
            }

            // Accumulate tool input JSON
            if (event.type === 'content_block_delta' && event.delta.type === 'input_json_delta') {
              currentToolInput += event.delta.partial_json;
            }

            // Finalize tool input when block stops
            if (event.type === 'content_block_stop' && currentToolIndex >= 0 && currentToolInput) {
              try {
                (toolUseBlocks[currentToolIndex] as Anthropic.ToolUseBlock).input = JSON.parse(currentToolInput);
              } catch {
                // Keep empty object if JSON parsing fails
              }
              currentToolInput = '';
              currentToolIndex = -1;
            }
          }

          if (toolUseBlocks.length > 0) {
            // Build assistant message content (text + tool_use blocks)
            const assistantContent: Anthropic.ContentBlock[] = [];
            if (iterationText) {
              assistantContent.push({ type: 'text', text: iterationText } as Anthropic.TextBlock);
            }
            assistantContent.push(...toolUseBlocks);

            conversationHistory.push({
              role: 'assistant',
              content: assistantContent
            });

            // Execute tools and collect results
            const toolResults: Anthropic.ToolResultBlockParam[] = [];

            for (const block of toolUseBlocks) {
              const toolBlock = block as Anthropic.ToolUseBlock;

              // Check if this tool requires user confirmation
              if (toolBlock.name === 'web_search') {
                ws.send(JSON.stringify({
                  type: 'confirm_tool',
                  data: {
                    toolId: toolBlock.id,
                    tool: toolBlock.name,
                    message: 'Search the web for resources? (This uses API credits)'
                  }
                }));

                // Wait for user confirmation
                const approved = await new Promise<boolean>((resolve) => {
                  pendingToolConfirmation = { toolCall: toolBlock, resolve };
                  // Timeout after 60 seconds - default to decline
                  setTimeout(() => {
                    if (pendingToolConfirmation) {
                      pendingToolConfirmation.resolve(false);
                      pendingToolConfirmation = null;
                    }
                  }, 60000);
                });

                if (!approved) {
                  toolResults.push({
                    type: 'tool_result',
                    tool_use_id: toolBlock.id,
                    content: 'User declined the web search. Please continue without searching.'
                  });
                  continue;
                }
              }

              // Send thinking indicator
              ws.send(JSON.stringify({
                type: 'tool_thinking',
                data: { tool: toolBlock.name }
              }));

              // Execute the tool
              const result = await executeToolCall(
                toolBlock.name,
                toolBlock.input,
                { currentSyllabus: syllabus }
              );

              // Handle database mutations
              switch (toolBlock.name) {
                case 'update_week': {
                  const { weekIndex, updates } = result;
                  const week = syllabus.weeks.find(w => w.index === weekIndex);
                  if (week) {
                    await storage.updateWeek(week.id, updates);
                  }
                  break;
                }

                case 'add_step': {
                  const { weekIndex, step } = result;
                  const week = syllabus.weeks.find(w => w.index === weekIndex);
                  if (week) {
                    await storage.createStep({
                      weekId: week.id,
                      position: week.steps.length + 1,
                      ...step,
                      note: markdownToHtml(step.note) || step.note,
                      promptText: markdownToHtml(step.promptText) || step.promptText
                    });
                  }
                  break;
                }

                case 'remove_step': {
                  const { weekIndex, stepPosition } = result;
                  const week = syllabus.weeks.find(w => w.index === weekIndex);
                  if (week && week.steps[stepPosition - 1]) {
                    await storage.deleteStep(week.steps[stepPosition - 1].id);
                  }
                  break;
                }

                case 'update_basics': {
                  const { title, description, audienceLevel, durationWeeks } = result;
                  await storage.updateSyllabus(syllabusId, { title, description, audienceLevel, durationWeeks });
                  break;
                }
              }

              // Notify client of tool execution
              if (toolBlock.name !== 'read_current_syllabind') {
                ws.send(JSON.stringify({
                  type: 'tool_executed',
                  data: { tool: toolBlock.name }
                }));
              }

              // Refresh syllabus after mutations
              if (['update_week', 'add_step', 'remove_step', 'update_basics'].includes(toolBlock.name)) {
                syllabus = await storage.getSyllabusWithContent(syllabusId) || syllabus;
              }

              // Add tool result for Claude
              toolResults.push({
                type: 'tool_result',
                tool_use_id: toolBlock.id,
                content: JSON.stringify(result)
              });
            }

            // Add tool results to conversation
            conversationHistory.push({
              role: 'user',
              content: toolResults
            });

            // Continue loop to get Claude's response to tool results
          } else {
            // No tool calls - we're done
            continueLoop = false;

            // Add final text response to history
            if (iterationText) {
              conversationHistory.push({
                role: 'assistant',
                content: iterationText
              });
            }
          }
        }

        // Save the complete assistant response to database
        if (fullAssistantResponse) {
          await storage.createChatMessage({
            syllabusId,
            role: 'assistant',
            content: fullAssistantResponse
          });
        }

        const chatElapsed = ((Date.now() - chatStartTime) / 1000).toFixed(1);
        console.log(`[Chat] Complete for syllabind ${syllabusId}: ${chatApiCalls} API calls, ${chatElapsed}s total`);

        ws.send(JSON.stringify({
          type: 'assistant_complete',
          data: { message: fullAssistantResponse }
        }));
      }
    } catch (error) {
      console.error('Chat error:', error);
      ws.send(JSON.stringify({
        type: 'error',
        data: { message: error instanceof Error ? error.message : 'Unknown error' }
      }));
    }
  });
}
