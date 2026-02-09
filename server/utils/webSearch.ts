// DEPRECATED: This file is no longer used.
// The Syllabind generator now uses Claude's native web search (web_search_20250305).
// Keeping for reference only.
//
// Background:
// Google Custom Search JSON API is closed to new customers as of 2026
// and will be shut down on January 1, 2027. We've migrated to Claude's
// built-in web search functionality which provides better integration,
// no additional API setup, and improved search quality through Claude's reasoning.
//
// See: /home/runner/.claude/plans/glowing-spinning-fog.md for implementation details.

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  domain: string;
  qualityScore?: number;
}

// This function is no longer called
export async function searchWeb(): Promise<SearchResult[]> {
  throw new Error('searchWeb is deprecated - use Claude native web search instead');
}

// This function is no longer called
export function evaluateSourceQuality(): number {
  throw new Error('evaluateSourceQuality is deprecated - Claude handles quality evaluation');
}
