/**
 * Lightweight URL validator using HEAD requests with GET fallback.
 * Used to strip hallucinated/dead URLs from AI-generated syllabinds.
 *
 * Many academic sites (jstor, arxiv, .edu) block HEAD requests or return
 * 403/405, so we fall back to GET and accept "exists but restricted" responses.
 */
export async function validateUrl(url: string): Promise<boolean> {
  try {
    new URL(url); // Quick syntax check
  } catch {
    return false;
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
