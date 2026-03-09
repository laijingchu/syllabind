import type { Binder } from "@shared/schema";

const DEFAULT_TITLE = "Syllabind";
const DEFAULT_DESCRIPTION =
  "A calm web platform where thought leaders bind the best of the web into multi-week binders.";

/**
 * Replace static OG meta tags in the HTML template with dynamic values
 * from a specific binder. Used for link preview on social platforms.
 */
export function injectOgTags(html: string, binder: Binder): string {
  const title = `${binder.title} | Syllabind`;
  const rawDescription = binder.description
    ? stripHtml(binder.description)
    : DEFAULT_DESCRIPTION;
  const description = rawDescription || DEFAULT_DESCRIPTION;

  // Escape HTML entities to prevent injection
  const safeTitle = escapeHtml(title);
  const safeDescription = escapeHtml(description);

  html = html.replace(
    /<meta property="og:title" content="[^"]*" \/>/,
    `<meta property="og:title" content="${safeTitle}" />`,
  );
  html = html.replace(
    /<meta property="og:description" content="[^"]*" \/>/,
    `<meta property="og:description" content="${safeDescription}" />`,
  );
  html = html.replace(
    /<meta name="twitter:title" content="[^"]*" \/>/,
    `<meta name="twitter:title" content="${safeTitle}" />`,
  );
  html = html.replace(
    /<meta name="twitter:description" content="[^"]*" \/>/,
    `<meta name="twitter:description" content="${safeDescription}" />`,
  );

  return html;
}

/** Strip HTML tags and decode common entities to plain text */
function stripHtml(str: string): string {
  return str
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Extract binder ID from a URL path like /binder/42 */
export function parseBinderIdFromUrl(url: string): number | null {
  const match = url.match(/^\/binder\/(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}
