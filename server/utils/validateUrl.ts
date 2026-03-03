/**
 * Lightweight URL validator using HEAD requests with GET fallback.
 * Used to strip hallucinated/dead URLs from AI-generated binders.
 *
 * Many academic sites (jstor, arxiv, .edu) block HEAD requests or return
 * 403/405, so we fall back to GET and accept "exists but restricted" responses.
 *
 * YouTube URLs are validated via the oEmbed API since YouTube returns 200/403
 * for any watch?v= URL, even completely fake video IDs.
 */

const PLACEHOLDER_PATTERNS = ['example', 'placeholder', 'test', 'sample', 'fake', 'lorem'];

// Word-boundary regex so "test" doesn't match inside "latest", "greatest", etc.
const PLACEHOLDER_REGEX = new RegExp(`\\b(${PLACEHOLDER_PATTERNS.join('|')})\\b`, 'i');

const YOUTUBE_HOSTS = ['www.youtube.com', 'youtube.com', 'm.youtube.com', 'youtu.be', 'music.youtube.com'];

/**
 * Media platform rules for detecting index/directory pages.
 * Uses allowlist approach: URL must match a known specific-resource pattern.
 * Everything else on that platform is rejected (profiles, playlists, search, etc.).
 *
 * - `allow`: path must match one of these patterns
 * - `require`: path+search must match this regex (for query-param-based specificity)
 */
const MEDIA_INDEX_RULES: { hosts: string[]; allow?: RegExp[]; require?: RegExp }[] = [
  // YouTube: /watch, /embed/, /v/ only
  {
    hosts: ['www.youtube.com', 'youtube.com', 'm.youtube.com'],
    allow: [/^\/watch/, /^\/embed\//, /^\/v\//],
  },
  // youtu.be: path IS the video ID
  {
    hosts: ['youtu.be'],
    allow: [/^\/[a-zA-Z0-9_-]+/],
  },
  // YouTube Music: /watch only (same as YouTube but different host)
  {
    hosts: ['music.youtube.com'],
    allow: [/^\/watch/],
  },
  // Spotify: /episode/ and /track/ only
  {
    hosts: ['open.spotify.com'],
    allow: [/^\/episode\//, /^\/track\//],
  },
  // Apple Podcasts: must have ?i= param for a specific episode
  {
    hosts: ['podcasts.apple.com'],
    require: /[?&]i=/,
  },
  // Apple Music: /album/ with ?i= (specific song) or /music-video/ or /song/
  {
    hosts: ['music.apple.com'],
    allow: [/^\/[a-z]{2}\/music-video\//, /^\/[a-z]{2}\/song\//],
    require: /[?&]i=/,
  },
  // SoundCloud: must have two path segments (/artist/track)
  {
    hosts: ['soundcloud.com', 'www.soundcloud.com'],
    allow: [/^\/[^/]+\/[^/]+/],
  },
  // Vimeo: numeric video ID only
  {
    hosts: ['vimeo.com', 'www.vimeo.com'],
    allow: [/^\/\d+/],
  },
];

const YOUTUBE_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;

/**
 * Extract a YouTube video ID from a URL, or null if not a YouTube video URL.
 */
export function extractYouTubeVideoId(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  if (!YOUTUBE_HOSTS.includes(parsed.hostname)) return null;

  // youtu.be/VIDEO_ID
  if (parsed.hostname === 'youtu.be') {
    const id = parsed.pathname.slice(1).split('/')[0];
    return id || null;
  }

  // youtube.com/watch?v=VIDEO_ID
  if (parsed.pathname === '/watch') {
    return parsed.searchParams.get('v') || null;
  }

  // youtube.com/embed/VIDEO_ID
  if (parsed.pathname.startsWith('/embed/')) {
    const id = parsed.pathname.split('/')[2];
    return id || null;
  }

  // youtube.com/v/VIDEO_ID
  if (parsed.pathname.startsWith('/v/')) {
    const id = parsed.pathname.split('/')[2];
    return id || null;
  }

  return null;
}

/**
 * Validate a YouTube video URL.
 *
 * Checks: valid video ID format → not a placeholder → oEmbed API confirmation.
 * oEmbed is fault-tolerant: only an explicit 404 rejects. Network errors, timeouts,
 * and rate limits fall back to accepting (format + isIndexUrl already filter hallucinations).
 */
export async function validateYouTubeUrl(url: string): Promise<boolean> {
  const videoId = extractYouTubeVideoId(url);
  if (!videoId) return false;

  // Reject obviously invalid IDs (YouTube IDs are exactly 11 chars, alphanumeric + _ -)
  if (!YOUTUBE_ID_REGEX.test(videoId)) return false;

  // Check if the video ID itself contains a placeholder pattern (substring match
  // is correct here — video IDs are opaque strings, not natural language words)
  const lowerVideoId = videoId.toLowerCase();
  if (PLACEHOLDER_PATTERNS.some(p => lowerVideoId.includes(p))) return false;

  // oEmbed confirmation — only reject on definitive "not found" responses.
  // Network errors/timeouts/rate limits → accept (format checks already passed).
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    const res = await fetch(oembedUrl, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SyllabindBot/1.0)' },
    });
    clearTimeout(timeout);

    if (res.ok) return true;                              // 200 — confirmed real
    if (res.status === 404 || res.status === 401) return false; // Definitely fake/private
    return true; // 429, 5xx, etc. — give benefit of the doubt
  } catch {
    return true; // Network error or timeout — format is valid, accept it
  }
}

/**
 * Check if a URL contains obvious placeholder/hallucination patterns.
 * Uses word-boundary matching so "test" doesn't match inside "latest", "greatest", etc.
 */
export function hasPlaceholderPattern(url: string): boolean {
  return PLACEHOLDER_REGEX.test(url);
}

/**
 * Check if a URL points to an index/directory page (channel, profile, show)
 * rather than a specific media resource (video, episode, track, article).
 *
 * Also rejects bare-domain URLs with no meaningful path (e.g. "https://medium.com/").
 */
export function isIndexUrl(url: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }

  // Reject bare-domain URLs with no meaningful path
  const path = parsed.pathname;
  if (path === '/' || path === '') return true;

  // Check platform-specific index patterns
  const hostname = parsed.hostname;
  for (const rule of MEDIA_INDEX_RULES) {
    if (!rule.hosts.includes(hostname)) continue;

    const fullUrl = parsed.pathname + parsed.search;
    const matchesAllow = rule.allow ? rule.allow.some(p => p.test(path)) : false;
    const matchesRequire = rule.require ? rule.require.test(fullUrl) : false;

    // If rule has both allow and require, pass if EITHER matches (e.g. Apple Music:
    // /song/ path passes via allow, /album/?i=123 passes via require)
    // If rule has only allow or only require, that one must match
    if (rule.allow && rule.require) {
      if (!matchesAllow && !matchesRequire) return true;
    } else if (rule.allow) {
      if (!matchesAllow) return true;
    } else if (rule.require) {
      if (!matchesRequire) return true;
    }
  }

  return false;
}

export async function validateUrl(url: string): Promise<boolean> {
  try {
    new URL(url); // Quick syntax check
  } catch {
    return false;
  }

  // Reject URLs with obvious placeholder/hallucination patterns
  if (hasPlaceholderPattern(url)) return false;

  // Reject index/directory pages (channels, profiles, show pages, bare domains)
  if (isIndexUrl(url)) return false;

  // YouTube URLs need special validation — HEAD/GET always returns 200/403
  const youtubeId = extractYouTubeVideoId(url);
  if (youtubeId) {
    return validateYouTubeUrl(url);
  }

  // Phase 1: HEAD request (fast, low bandwidth)
  const headResult = await quickFetch(url, 'HEAD');
  if (headResult === 'ok') return true;

  // Phase 2: GET fallback for sites that reject HEAD (403, 405, or network error)
  if (headResult === 'rejected') {
    const getResult = await quickFetch(url, 'GET');
    return getResult === 'ok' || getResult === 'exists';
  }

  // HEAD returned 'exists' (403 — page exists but restricted, common for academic sites)
  if (headResult === 'exists') return true;

  return false; // 'not_found' — 404, 410, etc.
}

type FetchResult = 'ok' | 'exists' | 'rejected' | 'not_found';

async function quickFetch(url: string, method: 'HEAD' | 'GET'): Promise<FetchResult> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, {
      method,
      signal: controller.signal,
      redirect: 'follow',
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SyllabindBot/1.0)' }
    });
    clearTimeout(timeout);

    if (res.ok) return 'ok';                    // 200-299
    if (res.status === 403) return 'exists';     // Exists but restricted (academic paywalls)
    if (res.status === 405) return 'rejected';   // Method not allowed — try GET
    if (res.status === 406) return 'rejected';   // Not acceptable — try GET
    if (res.status >= 400 && res.status < 500) return 'not_found'; // 404, 410, etc.
    if (res.status >= 500) return 'rejected';    // Server error — might work with GET

    return 'not_found';
  } catch {
    return 'rejected'; // Network error, timeout, etc.
  }
}
