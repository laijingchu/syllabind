import Anthropic from '@anthropic-ai/sdk';
import { CLAUDE_MODEL } from './claudeClient';

export interface RateLimitStatus {
  status: 'ok' | 'low' | 'exceeded';
  remaining?: number;
  limit?: number;
  resetTime?: string;
  resetIn?: number; // seconds
  message: string;
}

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function checkRateLimitStatus(): Promise<RateLimitStatus> {
  try {
    // Make a minimal API call to probe rate limits
    // Using count_tokens is lightweight and doesn't consume generation quota
    await client.messages.countTokens({
      model: CLAUDE_MODEL,
      messages: [{ role: 'user', content: 'test' }],
    });

    // If successful, we have capacity (but don't know exact numbers)
    return {
      status: 'ok',
      message: 'Rate limits OK. Ready to generate Syllabind.',
    };

  } catch (error: any) {
    // Check if it's a rate limit error
    if (error.status === 429 && error.headers) {
      const headers = error.headers as Record<string, string>;

      const remaining = parseInt(headers['anthropic-ratelimit-requests-remaining'] || '0');
      const limit = parseInt(headers['anthropic-ratelimit-requests-limit'] || '0');
      const resetTime = headers['anthropic-ratelimit-requests-reset'];

      // Calculate seconds until reset
      let resetIn = 0;
      if (resetTime) {
        const resetDate = new Date(resetTime);
        resetIn = Math.max(0, Math.ceil((resetDate.getTime() - Date.now()) / 1000));
      }

      return {
        status: 'exceeded',
        remaining,
        limit,
        resetTime,
        resetIn,
        message: `Rate limit exceeded. ${remaining}/${limit} requests remaining. Resets in ${resetIn}s.`,
      };
    }

    // Check for other Anthropic errors that might indicate rate issues
    if (error.status === 529) {
      return {
        status: 'exceeded',
        message: 'API is currently overloaded. Please try again in a few minutes.',
      };
    }

    // Unknown error - let it propagate
    throw error;
  }
}

export function isRateLimitSufficient(status: RateLimitStatus): boolean {
  // Need at least 10 requests for a 4-week Syllabind (12-15 typical)
  if (status.status === 'exceeded') return false;
  if (status.remaining !== undefined && status.remaining < 10) return false;
  return true;
}
