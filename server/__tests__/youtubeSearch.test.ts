import { searchYouTube } from '../utils/youtubeSearch';
import { extractYouTubeVideoId } from '../utils/validateUrl';

const mockFetch = jest.fn();
global.fetch = mockFetch;

const ORIGINAL_ENV = process.env;

beforeEach(() => {
  mockFetch.mockReset();
  process.env = { ...ORIGINAL_ENV, YOUTUBE_API_KEY: 'test-api-key' };
});

afterAll(() => {
  process.env = ORIGINAL_ENV;
});

/**
 * Tests for the hasMedia logic used in ensureMediaUrl().
 * Claude often sets mediaType: 'Youtube video' on non-YouTube websites
 * that merely embed a video player. The fix uses extractYouTubeVideoId()
 * to verify the URL is actually a YouTube URL before considering media satisfied.
 */
describe('hasMedia YouTube URL verification', () => {
  // Simulates the hasMedia check from ensureMediaUrl()
  function hasMedia(readings: Array<{ url: string | null; mediaType: string | null }>): boolean {
    return readings.some(s => {
      if (!s.url) return false;
      if (s.mediaType === 'Youtube video') {
        return extractYouTubeVideoId(s.url) !== null;
      }
      if (s.mediaType === 'Podcast') return true;
      return false;
    });
  }

  it('returns true for a real YouTube URL with Youtube video mediaType', () => {
    expect(hasMedia([
      { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', mediaType: 'Youtube video' }
    ])).toBe(true);
  });

  it('returns false for a non-YouTube URL with Youtube video mediaType', () => {
    expect(hasMedia([
      { url: 'https://some-website.com/embeds/player', mediaType: 'Youtube video' }
    ])).toBe(false);
  });

  it('returns false for a non-YouTube URL even with other readings present', () => {
    expect(hasMedia([
      { url: 'https://some-blog.com/article', mediaType: 'Blog Post' },
      { url: 'https://website.com/video-embed', mediaType: 'Youtube video' },
      { url: null, mediaType: 'Journal Article' }
    ])).toBe(false);
  });

  it('returns true for Podcast mediaType with any URL', () => {
    expect(hasMedia([
      { url: 'https://podcasts.apple.com/us/podcast/episode/id123?i=456', mediaType: 'Podcast' }
    ])).toBe(true);
  });

  it('returns false when URL is null even with Youtube video mediaType', () => {
    expect(hasMedia([
      { url: null, mediaType: 'Youtube video' }
    ])).toBe(false);
  });

  it('returns true for youtu.be short URL', () => {
    expect(hasMedia([
      { url: 'https://youtu.be/dQw4w9WgXcQ', mediaType: 'Youtube video' }
    ])).toBe(true);
  });
});

describe('searchYouTube', () => {
  it('returns video data on successful API response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        items: [{
          id: { videoId: 'dQw4w9WgXcQ' },
          snippet: {
            title: 'Test Video Title',
            channelTitle: 'Test Channel',
            publishedAt: '2023-06-15T00:00:00Z'
          }
        }]
      })
    });

    const result = await searchYouTube('systems thinking');
    expect(result).toEqual({
      videoId: 'dQw4w9WgXcQ',
      title: 'Test Video Title',
      channelTitle: 'Test Channel',
      publishedAt: '2023-06-15T00:00:00Z'
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('googleapis.com/youtube/v3/search'),
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );
  });

  it('returns null when YOUTUBE_API_KEY is not set', async () => {
    delete process.env.YOUTUBE_API_KEY;

    const result = await searchYouTube('digital minimalism');
    expect(result).toBeNull();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('returns null on API error (non-200 status)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      statusText: 'Forbidden'
    });

    const result = await searchYouTube('bad query');
    expect(result).toBeNull();
  });

  it('returns null on empty results', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ items: [] })
    });

    const result = await searchYouTube('very obscure topic xyz');
    expect(result).toBeNull();
  });

  it('returns null when items array is missing', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({})
    });

    const result = await searchYouTube('missing items');
    expect(result).toBeNull();
  });

  it('returns null on network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const result = await searchYouTube('network failure test');
    expect(result).toBeNull();
  });

  it('returns null on timeout (AbortError)', async () => {
    const abortError = new Error('The operation was aborted');
    abortError.name = 'AbortError';
    mockFetch.mockRejectedValueOnce(abortError);

    const result = await searchYouTube('slow query');
    expect(result).toBeNull();
  });

  it('passes query and key in URL params', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        items: [{
          id: { videoId: 'abc12345678' },
          snippet: {
            title: 'Result',
            channelTitle: 'Channel',
            publishedAt: '2024-01-01T00:00:00Z'
          }
        }]
      })
    });

    await searchYouTube('deep work Cal Newport');

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain('q=deep+work+Cal+Newport');
    expect(calledUrl).toContain('key=test-api-key');
    expect(calledUrl).toContain('maxResults=1');
    expect(calledUrl).toContain('type=video');
  });
});
