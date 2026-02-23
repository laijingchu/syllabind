import {
  validateUrl,
  validateYouTubeUrl,
  extractYouTubeVideoId,
  hasPlaceholderPattern,
  isIndexUrl,
} from '../utils/validateUrl';

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockReset();
});

// --- extractYouTubeVideoId ---

describe('extractYouTubeVideoId', () => {
  it('extracts ID from youtube.com/watch?v= URL', () => {
    expect(extractYouTubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('extracts ID from youtu.be/ short URL', () => {
    expect(extractYouTubeVideoId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('extracts ID from youtube.com/embed/ URL', () => {
    expect(extractYouTubeVideoId('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('extracts ID from youtube.com/v/ URL', () => {
    expect(extractYouTubeVideoId('https://www.youtube.com/v/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('extracts ID from m.youtube.com URL', () => {
    expect(extractYouTubeVideoId('https://m.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('handles extra query params', () => {
    expect(extractYouTubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=30s')).toBe('dQw4w9WgXcQ');
  });

  it('returns null for non-YouTube URL', () => {
    expect(extractYouTubeVideoId('https://vimeo.com/123456')).toBeNull();
  });

  it('returns null for YouTube channel URL', () => {
    expect(extractYouTubeVideoId('https://www.youtube.com/@channel')).toBeNull();
  });

  it('returns null for invalid URL', () => {
    expect(extractYouTubeVideoId('not-a-url')).toBeNull();
  });

  it('returns null for youtube.com with no path or params', () => {
    expect(extractYouTubeVideoId('https://www.youtube.com/')).toBeNull();
  });
});

// --- hasPlaceholderPattern ---

describe('hasPlaceholderPattern', () => {
  it('detects "example" in URL', () => {
    expect(hasPlaceholderPattern('https://www.youtube.com/watch?v=example')).toBe(true);
  });

  it('detects "placeholder" in URL', () => {
    expect(hasPlaceholderPattern('https://example.com/placeholder-video')).toBe(true);
  });

  it('detects "test" in URL', () => {
    expect(hasPlaceholderPattern('https://test.com/video')).toBe(true);
  });

  it('detects "sample" in URL', () => {
    expect(hasPlaceholderPattern('https://example.com/sample')).toBe(true);
  });

  it('detects "fake" in URL', () => {
    expect(hasPlaceholderPattern('https://fake-site.com/resource')).toBe(true);
  });

  it('detects "lorem" in URL', () => {
    expect(hasPlaceholderPattern('https://lorem-ipsum.com/text')).toBe(true);
  });

  it('returns false for normal URL', () => {
    expect(hasPlaceholderPattern('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(false);
  });

  it('is case-insensitive', () => {
    expect(hasPlaceholderPattern('https://EXAMPLE.COM/page')).toBe(true);
  });

  // Word-boundary matching — no false positives on substrings
  it('does not match "test" inside "latest"', () => {
    expect(hasPlaceholderPattern('https://blog.com/latest-podcast-episodes')).toBe(false);
  });

  it('does not match "test" inside "greatest"', () => {
    expect(hasPlaceholderPattern('https://blog.com/the-greatest-hits')).toBe(false);
  });

  it('does not match "test" inside "contest"', () => {
    expect(hasPlaceholderPattern('https://news.com/contest-winner-announced')).toBe(false);
  });

  it('does not match "sample" inside "oversampled"', () => {
    expect(hasPlaceholderPattern('https://audio.com/oversampled-drums')).toBe(false);
  });
});

// --- isIndexUrl ---

describe('isIndexUrl', () => {
  // Bare domains
  it('rejects bare domain with trailing slash', () => {
    expect(isIndexUrl('https://medium.com/')).toBe(true);
  });

  it('rejects bare domain without trailing slash', () => {
    expect(isIndexUrl('https://medium.com')).toBe(true);
  });

  // YouTube: allowlist approach — only known video paths are allowed
  it('rejects YouTube channel page (@handle)', () => {
    expect(isIndexUrl('https://www.youtube.com/@CoachMichelleHong')).toBe(true);
  });

  it('rejects YouTube channel page (/channel/)', () => {
    expect(isIndexUrl('https://www.youtube.com/channel/UCHnyfMqiRRG1u-2MsSQLbXA')).toBe(true);
  });

  it('rejects YouTube user page', () => {
    expect(isIndexUrl('https://www.youtube.com/user/minutephysics')).toBe(true);
  });

  it('rejects YouTube custom channel (/c/)', () => {
    expect(isIndexUrl('https://www.youtube.com/c/Vsauce')).toBe(true);
  });

  it('rejects YouTube playlist page', () => {
    expect(isIndexUrl('https://www.youtube.com/playlist?list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf')).toBe(true);
  });

  it('rejects YouTube search results', () => {
    expect(isIndexUrl('https://www.youtube.com/results?search_query=test')).toBe(true);
  });

  it('rejects YouTube shorts', () => {
    expect(isIndexUrl('https://www.youtube.com/shorts/abc123')).toBe(true);
  });

  it('rejects YouTube live page', () => {
    expect(isIndexUrl('https://www.youtube.com/live/abc123')).toBe(true);
  });

  it('rejects YouTube premium/gaming/music pages', () => {
    expect(isIndexUrl('https://www.youtube.com/premium')).toBe(true);
    expect(isIndexUrl('https://www.youtube.com/gaming')).toBe(true);
    expect(isIndexUrl('https://www.youtube.com/music')).toBe(true);
  });

  it('allows YouTube watch URL (specific video)', () => {
    expect(isIndexUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(false);
  });

  it('allows YouTube embed URL (specific video)', () => {
    expect(isIndexUrl('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe(false);
  });

  it('allows YouTube /v/ URL (specific video)', () => {
    expect(isIndexUrl('https://www.youtube.com/v/dQw4w9WgXcQ')).toBe(false);
  });

  it('allows youtu.be short URL (specific video)', () => {
    expect(isIndexUrl('https://youtu.be/dQw4w9WgXcQ')).toBe(false);
  });

  // YouTube Music
  it('rejects YouTube Music artist page', () => {
    expect(isIndexUrl('https://music.youtube.com/channel/UCxyz')).toBe(true);
  });

  it('rejects YouTube Music playlist page', () => {
    expect(isIndexUrl('https://music.youtube.com/playlist?list=OLAK5uy')).toBe(true);
  });

  it('allows YouTube Music watch URL (specific track)', () => {
    expect(isIndexUrl('https://music.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(false);
  });

  // Spotify: allowlist — only /episode/ and /track/
  it('rejects Spotify show page', () => {
    expect(isIndexUrl('https://open.spotify.com/show/4rOoJ6Egrf8K2IrywzwOMk')).toBe(true);
  });

  it('rejects Spotify artist page', () => {
    expect(isIndexUrl('https://open.spotify.com/artist/123abc')).toBe(true);
  });

  it('rejects Spotify playlist page', () => {
    expect(isIndexUrl('https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M')).toBe(true);
  });

  it('rejects Spotify album page', () => {
    expect(isIndexUrl('https://open.spotify.com/album/4aawyAB9vmqN3uQ7FjRGTy')).toBe(true);
  });

  it('rejects Spotify user profile', () => {
    expect(isIndexUrl('https://open.spotify.com/user/spotify')).toBe(true);
  });

  it('allows Spotify episode URL', () => {
    expect(isIndexUrl('https://open.spotify.com/episode/4rOoJ6Egrf8K2IrywzwOMk')).toBe(false);
  });

  it('allows Spotify track URL', () => {
    expect(isIndexUrl('https://open.spotify.com/track/4rOoJ6Egrf8K2IrywzwOMk')).toBe(false);
  });

  // Apple Podcasts: require ?i= for specific episode
  it('rejects Apple Podcasts show page (no ?i= param)', () => {
    expect(isIndexUrl('https://podcasts.apple.com/us/podcast/some-podcast/id123456')).toBe(true);
  });

  it('allows Apple Podcasts episode URL (has ?i= param)', () => {
    expect(isIndexUrl('https://podcasts.apple.com/us/podcast/some-podcast/id123456?i=1000600000')).toBe(false);
  });

  // Apple Music: allow /song/, /music-video/, or ?i= for specific track in album
  it('rejects Apple Music artist page', () => {
    expect(isIndexUrl('https://music.apple.com/us/artist/taylor-swift/159260351')).toBe(true);
  });

  it('rejects Apple Music album page (no ?i= param)', () => {
    expect(isIndexUrl('https://music.apple.com/us/album/some-album/123456')).toBe(true);
  });

  it('allows Apple Music album track (has ?i= param)', () => {
    expect(isIndexUrl('https://music.apple.com/us/album/some-album/123456?i=789')).toBe(false);
  });

  it('allows Apple Music song URL', () => {
    expect(isIndexUrl('https://music.apple.com/us/song/some-song/123456')).toBe(false);
  });

  // SoundCloud: allowlist — must have /artist/track (two segments)
  it('rejects SoundCloud user profile page', () => {
    expect(isIndexUrl('https://soundcloud.com/artist-name')).toBe(true);
  });

  it('allows SoundCloud track URL', () => {
    expect(isIndexUrl('https://soundcloud.com/artist-name/track-name')).toBe(false);
  });

  // Vimeo: allowlist — only numeric video IDs
  it('rejects Vimeo channel page', () => {
    expect(isIndexUrl('https://vimeo.com/channels/staffpicks')).toBe(true);
  });

  it('rejects Vimeo user page', () => {
    expect(isIndexUrl('https://vimeo.com/user12345')).toBe(true);
  });

  it('rejects Vimeo groups page', () => {
    expect(isIndexUrl('https://vimeo.com/groups/animation')).toBe(true);
  });

  it('allows Vimeo video URL', () => {
    expect(isIndexUrl('https://vimeo.com/123456789')).toBe(false);
  });

  // Non-media sites pass through (not an index page by our rules)
  it('allows a normal article URL', () => {
    expect(isIndexUrl('https://arxiv.org/abs/2301.00001')).toBe(false);
  });

  it('allows a deep path URL', () => {
    expect(isIndexUrl('https://www.nature.com/articles/s41586-023-05696-3')).toBe(false);
  });
});

// --- validateYouTubeUrl ---

describe('validateYouTubeUrl', () => {
  it('returns true for a real YouTube video (oEmbed 200)', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, status: 200 });
    const result = await validateYouTubeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    expect(result).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('youtube.com/oembed'),
      expect.any(Object),
    );
  });

  it('returns false for a fake YouTube video (oEmbed 404)', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 404 });
    const result = await validateYouTubeUrl('https://www.youtube.com/watch?v=aaaaaaaaaaa');
    expect(result).toBe(false);
  });

  it('returns false when video ID is too short', async () => {
    const result = await validateYouTubeUrl('https://www.youtube.com/watch?v=abc123');
    expect(result).toBe(false);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('returns false when video ID is too long', async () => {
    const result = await validateYouTubeUrl('https://www.youtube.com/watch?v=abcdefghijkl');
    expect(result).toBe(false);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('returns false when video ID contains placeholder pattern', async () => {
    // "exampleABCDE" is 12 chars but let's use an 11-char one with "example"
    // "example1234" is 11 chars
    const result = await validateYouTubeUrl('https://www.youtube.com/watch?v=example1234');
    expect(result).toBe(false);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('returns false for non-YouTube URL', async () => {
    const result = await validateYouTubeUrl('https://vimeo.com/123456');
    expect(result).toBe(false);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('accepts on network error (fault-tolerant — format already validated)', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));
    const result = await validateYouTubeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    expect(result).toBe(true);
  });

  it('accepts on rate limit 429 (fault-tolerant)', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 429 });
    const result = await validateYouTubeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    expect(result).toBe(true);
  });

  it('accepts on server error 500 (fault-tolerant)', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });
    const result = await validateYouTubeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    expect(result).toBe(true);
  });

  it('rejects on 401 unauthorized (private/deleted video)', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 401 });
    const result = await validateYouTubeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    expect(result).toBe(false);
  });

  it('validates youtu.be short URLs', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, status: 200 });
    const result = await validateYouTubeUrl('https://youtu.be/dQw4w9WgXcQ');
    expect(result).toBe(true);
  });
});

// --- validateUrl ---

describe('validateUrl', () => {
  it('returns false for invalid URL syntax', async () => {
    const result = await validateUrl('not-a-url');
    expect(result).toBe(false);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('rejects URLs with placeholder patterns', async () => {
    const result = await validateUrl('https://example.com/article');
    expect(result).toBe(false);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('routes YouTube URLs through oEmbed validation', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, status: 200 });
    const result = await validateUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    expect(result).toBe(true);
    // Should call oEmbed, not HEAD
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('oembed'),
      expect.any(Object),
    );
  });

  it('rejects fake YouTube URLs via oEmbed', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 404 });
    const result = await validateUrl('https://www.youtube.com/watch?v=aaaaaaaaaaa');
    expect(result).toBe(false);
  });

  it('validates non-YouTube URLs with HEAD request (200)', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, status: 200 });
    const result = await validateUrl('https://arxiv.org/abs/2301.00001');
    expect(result).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://arxiv.org/abs/2301.00001',
      expect.objectContaining({ method: 'HEAD' }),
    );
  });

  it('accepts non-YouTube 403 as "exists" (academic paywall)', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 403 });
    const result = await validateUrl('https://jstor.org/stable/12345');
    expect(result).toBe(true);
  });

  it('falls back to GET when HEAD returns 405', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: false, status: 405 }) // HEAD rejected
      .mockResolvedValueOnce({ ok: true, status: 200 });  // GET succeeds
    const result = await validateUrl('https://some-api.com/resource');
    expect(result).toBe(true);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('returns false for 404 on non-YouTube URL', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 404 });
    const result = await validateUrl('https://arxiv.org/abs/0000.00000');
    expect(result).toBe(false);
  });

  // Index/directory URL rejection
  it('rejects YouTube channel URL', async () => {
    const result = await validateUrl('https://www.youtube.com/@veritasium');
    expect(result).toBe(false);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('rejects Spotify show page', async () => {
    const result = await validateUrl('https://open.spotify.com/show/4rOoJ6Egrf8K2IrywzwOMk');
    expect(result).toBe(false);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('rejects bare domain URL', async () => {
    const result = await validateUrl('https://medium.com/');
    expect(result).toBe(false);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('validates Spotify episode URL normally', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, status: 200 });
    const result = await validateUrl('https://open.spotify.com/episode/4rOoJ6Egrf8K2IrywzwOMk');
    expect(result).toBe(true);
  });
});
