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
  const description = binder.description || DEFAULT_DESCRIPTION;

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
