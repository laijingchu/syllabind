/**
 * YouTube Data API v3 search utility.
 * Bypasses LLM URL generation — searches for real videos by topic.
 */

export interface YouTubeSearchResult {
  videoId: string;
  title: string;
  channelTitle: string;
  publishedAt: string;
}

/**
 * Search YouTube for a video matching the given query.
 * Returns the top result or null if unavailable.
 *
 * No-op (returns null) when YOUTUBE_API_KEY is not set.
 */
export async function searchYouTube(query: string): Promise<YouTubeSearchResult | null> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    console.log('[YouTubeSearch] YOUTUBE_API_KEY not set, skipping');
    return null;
  }

  const params = new URLSearchParams({
    part: 'snippet',
    type: 'video',
    maxResults: '1',
    q: query,
    key: apiKey
  });

  const url = `https://www.googleapis.com/youtube/v3/search?${params}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) {
      console.warn(`[YouTubeSearch] API returned ${response.status}: ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    const items = data.items;
    if (!Array.isArray(items) || items.length === 0) {
      console.log(`[YouTubeSearch] No results for query: "${query}"`);
      return null;
    }

    const item = items[0];
    return {
      videoId: item.id.videoId,
      title: item.snippet.title,
      channelTitle: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt
    };
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.warn(`[YouTubeSearch] Request timed out for query: "${query}"`);
    } else {
      console.warn(`[YouTubeSearch] Error searching for "${query}":`, error.message);
    }
    return null;
  }
}
