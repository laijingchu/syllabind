import memoizee from 'memoizee';

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  domain: string;
  qualityScore?: number;
}

interface SearchOptions {
  maxResults?: number;
  dateRestrict?: string;
}

async function performGoogleSearch(
  query: string,
  options: SearchOptions = {}
): Promise<SearchResult[]> {
  const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
  const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;

  if (!apiKey || !searchEngineId) {
    throw new Error('Google Search API not configured');
  }

  const params = new URLSearchParams({
    key: apiKey,
    cx: searchEngineId,
    q: query,
    num: (options.maxResults || 5).toString(),
  });

  if (options.dateRestrict) {
    params.append('dateRestrict', options.dateRestrict);
  }

  const response = await fetch(
    `https://www.googleapis.com/customsearch/v1?${params}`,
    { signal: AbortSignal.timeout(10000) }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Search API error: ${response.status} - ${error}`);
  }

  const data = await response.json();

  return (data.items || []).map((item: any) => ({
    title: item.title,
    url: item.link,
    snippet: item.snippet,
    domain: new URL(item.link).hostname,
  }));
}

// Memoize with 15-minute cache
export const searchWeb = memoizee(performGoogleSearch, {
  maxAge: 15 * 60 * 1000,
  promise: true,
  normalizer: ([query, options]) => JSON.stringify({ query, options }),
});

export function evaluateSourceQuality(result: SearchResult): number {
  const trustworthy = [
    'edu', 'gov', 'arxiv.org', 'medium.com',
    'youtube.com', 'coursera.org', 'mit.edu',
    'stanford.edu', 'harvard.edu'
  ];

  let score = 50;

  if (trustworthy.some(domain => result.domain.includes(domain))) {
    score += 30;
  }

  if (result.snippet.length > 100) {
    score += 10;
  }

  return Math.min(score, 100);
}
