import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  maxRetries: 0, // We handle retries ourselves with user-visible feedback
});

// Haiku only — optimized for Tier 1 rate limits (50 RPM)
export const CLAUDE_MODEL = 'claude-3-5-haiku-20241022';

export { client };

export const SYLLABIND_GENERATION_TOOLS: Anthropic.Tool[] = [
  {
    type: 'web_search_20250305',
    name: 'web_search',
    max_uses: 5 // Reduced for cost efficiency (~1 search per week)
  } as any,
  {
    name: 'finalize_week',
    description: 'Finalize a week\'s Syllabind. MUST have exactly 4 steps: 3 readings followed by 1 exercise.',
    input_schema: {
      type: 'object',
      properties: {
        weekIndex: { type: 'number', description: '1-based week number (1, 2, 3, etc.)' },
        title: { type: 'string', description: 'Week title (e.g., "Foundations", "Core Concepts")' },
        description: { type: 'string', description: 'Brief description of the week\'s focus' },
        steps: {
          type: 'array',
          description: 'Exactly 4 steps: 3 readings then 1 exercise',
          minItems: 4,
          maxItems: 4,
          items: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['reading', 'exercise'] },
              title: { type: 'string' },
              url: { type: 'string' },
              note: { type: 'string' },
              author: { type: 'string' },
              creationDate: {
                type: 'string',
                description: 'Publication or creation date of the resource in dd/mm/yyyy format (e.g., 15/03/2024). Extract from web search results when available.'
              },
              mediaType: { type: 'string', enum: ['Book', 'Book Chapter', 'Journal Article', 'Youtube video', 'Blog/Article', 'Podcast'] },
              promptText: { type: 'string', description: 'Exercise instructions. Use markdown: "- " for bullet points, "1. " for numbered lists' },
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

export const SYLLABIND_CHAT_TOOLS: Anthropic.Tool[] = [
  {
    name: 'read_current_syllabind',
    description: 'Read the current state of the Syllabind.',
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
            creationDate: {
              type: 'string',
              description: 'Publication or creation date in dd/mm/yyyy format (e.g., 15/03/2024)'
            },
            mediaType: { type: 'string' },
            promptText: { type: 'string', description: 'Exercise instructions. Use markdown: "- " for bullet points, "1. " for numbered lists' },
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
    type: 'web_search_20250305',
    name: 'web_search',
    max_uses: 2 // Conservative limit for chat
  } as any
];

export async function executeToolCall(
  toolName: string,
  toolInput: any,
  context: any
): Promise<any> {
  switch (toolName) {
    case 'web_search':
      // Claude handles web search natively - no execution needed here
      // The search is performed server-side by Anthropic's API
      // Results are automatically included in Claude's response
      return {
        message: 'Web search executed by Claude API',
        handled_by_api: true
      };

    case 'finalize_week':
      return {
        weekIndex: toolInput.weekIndex,
        title: toolInput.title,
        description: toolInput.description,
        steps: toolInput.steps
      };

    case 'read_current_syllabind':
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
