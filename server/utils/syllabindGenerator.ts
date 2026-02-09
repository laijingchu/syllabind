import Anthropic from '@anthropic-ai/sdk';
import { storage } from '../storage';
import { CURRICULUM_GENERATION_TOOLS, executeToolCall } from './claudeClient';
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
}

export async function generateCurriculum(context: GenerationContext): Promise<void> {
  const { syllabusId, basics, ws } = context;

  const systemPrompt = `You are an expert curriculum designer for Syllabind.

Generate a ${basics.durationWeeks}-week curriculum for "${basics.title}" (${basics.audienceLevel} level).

Requirements:
- Search for HIGH-QUALITY educational resources (articles, videos, books, courses)
- Each week should have 4-6 steps (mix of readings and exercises)
- Readings: Include title, URL, author, media type, estimated time, and relevance note
- Exercises: Include title, prompt text, and estimated time
- Prioritize credible sources (.edu, established platforms, recognized experts)
- Ensure logical week-to-week progression

Description: ${basics.description}

Process for each week:
1. Perform 2-3 targeted searches with different queries
2. Evaluate source quality
3. If needed, refine and search again
4. Once you have 4-6 high-quality steps, call finalize_week
5. Move to next week

Start with Week 1.`;

  const messages: Anthropic.MessageParam[] = [
    { role: 'user', content: systemPrompt }
  ];

  let weekIndex = 1;

  while (weekIndex <= basics.durationWeeks) {
    ws.send(JSON.stringify({
      type: 'week_started',
      data: { weekIndex }
    }));

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      tools: CURRICULUM_GENERATION_TOOLS,
      messages
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

        if (toolName === 'search_web') {
          ws.send(JSON.stringify({
            type: 'searching',
            data: { query: toolInput.query, weekIndex }
          }));
        }

        const result = await executeToolCall(toolName, toolInput, {});

        if (toolName === 'search_web') {
          ws.send(JSON.stringify({
            type: 'search_results',
            data: { count: result.length, weekIndex }
          }));
        }

        if (toolName === 'finalize_week') {
          // Save week to database
          const week = await storage.createWeek({
            syllabusId,
            index: result.weekIndex,
            title: result.title,
            description: result.description
          });

          // Save steps
          for (let i = 0; i < result.steps.length; i++) {
            await storage.createStep({
              weekId: week.id,
              position: i + 1,
              ...result.steps[i]
            });
          }

          ws.send(JSON.stringify({
            type: 'week_completed',
            data: { weekIndex, week: result }
          }));

          weekIndex++;
        }

        (toolResults.content as any[]).push({
          type: 'tool_result',
          tool_use_id: toolUse.id,
          content: JSON.stringify(result)
        });
      }

      messages.push({ role: 'assistant', content: response.content });
      messages.push(toolResults);
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
