import Anthropic from '@anthropic-ai/sdk';
import { searchWeb, evaluateSourceQuality } from './webSearch';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const CURRICULUM_GENERATION_TOOLS: Anthropic.Tool[] = [
  {
    name: 'search_web',
    description: 'Search the web for educational resources. Returns top 5 results with quality scores.',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The search query (be specific about topic and resource type)'
        },
        includeRecent: {
          type: 'boolean',
          description: 'Prioritize recent content (past year)',
          default: false
        }
      },
      required: ['query']
    }
  },
  {
    name: 'finalize_week',
    description: 'Finalize a week\'s curriculum after gathering sufficient resources.',
    input_schema: {
      type: 'object',
      properties: {
        weekIndex: { type: 'number' },
        title: { type: 'string' },
        description: { type: 'string' },
        steps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['reading', 'exercise'] },
              title: { type: 'string' },
              url: { type: 'string' },
              note: { type: 'string' },
              author: { type: 'string' },
              creationDate: { type: 'string' },
              mediaType: { type: 'string', enum: ['Book', 'Youtube video', 'Blog/Article', 'Podcast'] },
              promptText: { type: 'string' },
              estimatedMinutes: { type: 'number' }
            },
            required: ['type', 'title']
          }
        }
      },
      required: ['weekIndex', 'title', 'steps']
    }
  }
];

export const CURRICULUM_CHAT_TOOLS: Anthropic.Tool[] = [
  {
    name: 'read_current_curriculum',
    description: 'Read the current state of the syllabus curriculum.',
    input_schema: { type: 'object', properties: {}, required: [] }
  },
  {
    name: 'update_week',
    description: 'Update an existing week\'s title or description.',
    input_schema: {
      type: 'object',
      properties: {
        weekIndex: { type: 'number' },
        updates: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            description: { type: 'string' }
          }
        }
      },
      required: ['weekIndex', 'updates']
    }
  },
  {
    name: 'add_step',
    description: 'Add a new step to a week.',
    input_schema: {
      type: 'object',
      properties: {
        weekIndex: { type: 'number' },
        step: {
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['reading', 'exercise'] },
            title: { type: 'string' },
            url: { type: 'string' },
            note: { type: 'string' },
            author: { type: 'string' },
            mediaType: { type: 'string' },
            promptText: { type: 'string' },
            estimatedMinutes: { type: 'number' }
          },
          required: ['type', 'title']
        }
      },
      required: ['weekIndex', 'step']
    }
  },
  {
    name: 'remove_step',
    description: 'Remove a step by its position.',
    input_schema: {
      type: 'object',
      properties: {
        weekIndex: { type: 'number' },
        stepPosition: { type: 'number' }
      },
      required: ['weekIndex', 'stepPosition']
    }
  },
  {
    name: 'update_basics',
    description: 'Update basic syllabus info. EXPLAIN changes to user first.',
    input_schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        audienceLevel: { type: 'string', enum: ['Beginner', 'Intermediate', 'Advanced'] },
        durationWeeks: { type: 'number' }
      }
    }
  },
  {
    name: 'search_web',
    description: 'Search for additional resources.',
    input_schema: {
      type: 'object',
      properties: { query: { type: 'string' } },
      required: ['query']
    }
  }
];

export async function executeToolCall(
  toolName: string,
  toolInput: any,
  context: any
): Promise<any> {
  switch (toolName) {
    case 'search_web': {
      const results = await searchWeb(toolInput.query, {
        maxResults: 5,
        dateRestrict: toolInput.includeRecent ? 'y1' : undefined
      });
      return results.map(r => ({
        ...r,
        qualityScore: evaluateSourceQuality(r)
      }));
    }

    case 'finalize_week':
      return {
        weekIndex: toolInput.weekIndex,
        title: toolInput.title,
        description: toolInput.description,
        steps: toolInput.steps
      };

    case 'read_current_curriculum':
      return context.currentSyllabus;

    case 'update_week':
    case 'add_step':
    case 'remove_step':
    case 'update_basics':
      return toolInput;

    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}
