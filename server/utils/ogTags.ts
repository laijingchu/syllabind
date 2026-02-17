import type { Syllabus } from "@shared/schema";

const DEFAULT_TITLE = "Syllabind";
const DEFAULT_DESCRIPTION =
  "A calm web platform where thought leaders bind the best of the web into 4-week syllabi.";

/**
 * Replace static OG meta tags in the HTML template with dynamic values
 * from a specific syllabind. Used for link preview on social platforms.
 */
export function injectOgTags(html: string, syllabus: Syllabus): string {
  const title = `${syllabus.title} | Syllabind`;
  const description = syllabus.description || DEFAULT_DESCRIPTION;

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

/** Extract syllabind ID from a URL path like /syllabus/42 */
export function parseSyllabindIdFromUrl(url: string): number | null {
  const match = url.match(/^\/syllabus\/(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}
