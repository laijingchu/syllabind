import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  maxRetries: 0, // We handle retries ourselves with user-visible feedback
});

// Haiku for planning + chat (simple tasks, cost-efficient)
export const CLAUDE_MODEL = 'claude-haiku-4-5-20251001';
// Sonnet for generation + repair (needs accurate metadata extraction from web search)
export const CLAUDE_MODEL_GENERATION = 'claude-sonnet-4-5-20250929';

export { client };

const PLAN_CURRICULUM_TOOL: Anthropic.Tool = {
  name: 'plan_curriculum',
  description: 'Plan the full curriculum outline with distinct week titles and descriptions. Call once with ALL weeks.',
  input_schema: {
    type: 'object',
    properties: {
      weeks: {
        type: 'array',
        description: 'One entry per week with a distinct topic title and description',
        items: {
          type: 'object',
          properties: {
            weekIndex: { type: 'number', description: '1-based week number' },
            title: { type: 'string', description: 'Distinct topic title for this week (e.g., "Foundations of Critical Thinking")' },
            description: { type: 'string', description: 'Brief description of the week\'s focus (1-2 sentences)' }
          },
          required: ['weekIndex', 'title', 'description']
        }
      }
    },
    required: ['weeks']
  }
};

const FINALIZE_WEEK_TOOL: Anthropic.Tool = {
  name: 'finalize_week',
  description: 'Finalize a week\'s Syllabind. MUST have exactly 4 steps: 3 readings followed by 1 exercise.',
  input_schema: {
    type: 'object',
    properties: {
      weekIndex: { type: 'number', description: '1-based week number (1, 2, 3, etc.)' },
      title: { type: 'string', description: 'Week title (e.g., "Foundations", "Core Concepts"). Optional if pre-set by curriculum plan.' },
      description: { type: 'string', description: 'Brief description of the week\'s focus. Optional if pre-set by curriculum plan.' },
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
            url: { type: 'string', description: 'REQUIRED for readings. Must be a real, working URL found via web search. Do NOT invent URLs.' },
            note: { type: 'string', description: 'Brief context or instructions for the reader (1-2 sentences). Required for readings.' },
            author: { type: 'string' },
            creationDate: {
              type: 'string',
              description: 'Publication or creation date in YYYY-MM-DD format (e.g., 2024-03-15). Extract from web search results when available.'
            },
            mediaType: { type: 'string', enum: ['Book', 'Book Chapter', 'Journal Article', 'Youtube video', 'Blog/Article', 'Podcast'] },
            promptText: { type: 'string', description: 'Exercise instructions. REQUIRED for exercises. Keep concise (~500 chars). Use markdown: "- " for bullet points, "1. " for numbered lists.' },
            estimatedMinutes: { type: 'number' }
          },
          required: ['type', 'title']
        }
      }
    },
    required: ['weekIndex', 'steps']
  }
};

/** Returns planning tools for curriculum outline generation (no web search needed). */
export function getPlanningTools(): Anthropic.Tool[] {
  return [PLAN_CURRICULUM_TOOL];
}

/** Returns generation tools with 8 web searches per batch (~4/week for 2-week batches). */
export function getGenerationTools(): Anthropic.Tool[] {
  return [
    { type: 'web_search_20250305', name: 'web_search', max_uses: 8 } as any,
    FINALIZE_WEEK_TOOL
  ];
}

const PROVIDE_URLS_TOOL: Anthropic.Tool = {
  name: 'provide_urls',
  description: 'Provide URLs found via web search for readings missing URLs. Call once with all results.',
  input_schema: {
    type: 'object',
    properties: {
      urls: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            stepId: { type: 'number', description: 'The step ID from the list' },
            url: { type: 'string', description: 'Real URL found via web search' }
          },
          required: ['stepId', 'url']
        }
      }
    },
    required: ['urls']
  }
};

/** Returns repair tools for finding URLs for readings that are missing them. */
export function getRepairTools(searchBudget: number): Anthropic.Tool[] {
  return [
    { type: 'web_search_20250305', name: 'web_search', max_uses: searchBudget } as any,
    PROVIDE_URLS_TOOL
  ];
}

export async function executeToolCall(
  toolName: string,
  toolInput: any,
  context: any
): Promise<any> {
  switch (toolName) {
    case 'web_search':
      return {
        message: 'Web search executed by Claude API',
        handled_by_api: true
      };

    case 'plan_curriculum':
      return {
        weeks: toolInput.weeks
      };

    case 'finalize_week':
      return {
        weekIndex: toolInput.weekIndex,
        title: toolInput.title,
        description: toolInput.description,
        steps: toolInput.steps
      };

    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}
