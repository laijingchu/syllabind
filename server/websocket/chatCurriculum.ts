import { WebSocket } from 'ws';
import Anthropic from '@anthropic-ai/sdk';
import { storage } from '../storage';
import { CURRICULUM_CHAT_TOOLS, executeToolCall } from '../utils/claudeClient';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export function handleChatCurriculumWS(ws: WebSocket, syllabusId: number) {
  let conversationHistory: Anthropic.MessageParam[] = [];

  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data.toString());

      if (message.type === 'init') {
        const previousMessages = await storage.getChatMessages(syllabusId);
        conversationHistory = previousMessages.map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        }));

        ws.send(JSON.stringify({
          type: 'history',
          data: conversationHistory
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

        const syllabus = await storage.getSyllabusWithContent(syllabusId);
        if (!syllabus) {
          ws.send(JSON.stringify({
            type: 'error',
            data: { message: 'Syllabus not found' }
          }));
          return;
        }

        const systemPrompt = `You are a helpful curriculum assistant for Syllabind.

Current syllabus:
Title: ${syllabus.title}
Description: ${syllabus.description}
Audience: ${syllabus.audienceLevel}
Duration: ${syllabus.durationWeeks} weeks

Current curriculum:
${JSON.stringify(syllabus.weeks, null, 2)}

You can:
- Add, remove, or modify steps (readings/exercises)
- Update week titles and descriptions
- Search for additional resources
- Update basic fields if explicitly requested (explain changes)

Be conversational and helpful.`;

        const stream = await client.messages.stream({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2000,
          tools: CURRICULUM_CHAT_TOOLS,
          messages: [
            { role: 'user', content: systemPrompt },
            ...conversationHistory
          ]
        });

        let fullResponse = '';
        const toolCalls: any[] = [];

        for await (const event of stream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            const textChunk = event.delta.text;
            fullResponse += textChunk;

            ws.send(JSON.stringify({
              type: 'assistant_chunk',
              data: { text: textChunk }
            }));
          }

          if (event.type === 'content_block_start' && event.content_block.type === 'tool_use') {
            toolCalls.push({
              id: event.content_block.id,
              name: event.content_block.name,
              input: event.content_block.input
            });
          }
        }

        // Execute tool calls
        for (const toolCall of toolCalls) {
          const result = await executeToolCall(
            toolCall.name,
            toolCall.input,
            { currentSyllabus: syllabus }
          );

          switch (toolCall.name) {
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
                  ...step
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
              await storage.updateSyllabus(syllabusId, result);
              break;
            }
          }

          ws.send(JSON.stringify({
            type: 'tool_executed',
            data: { tool: toolCall.name }
          }));
        }

        await storage.createChatMessage({
          syllabusId,
          role: 'assistant',
          content: fullResponse
        });

        conversationHistory.push({
          role: 'assistant',
          content: fullResponse
        });

        ws.send(JSON.stringify({
          type: 'assistant_complete',
          data: { message: fullResponse }
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
