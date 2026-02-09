/**
 * Converts markdown-style text to HTML for rich text editors.
 * Handles numbered lists, bullet lists, and paragraphs.
 */
export function markdownToHtml(text: string | null | undefined): string | null {
  if (!text) return null;

  // If already contains actual HTML structure tags, return as-is
  // Match common HTML tags like <p>, <ul>, <ol>, <li>, <div>, <span>, <br>, <strong>, <em>
  // but not placeholder text like <topic> or <your name here>
  if (/<(p|ul|ol|li|div|span|br|strong|em|b|i|a|h[1-6])[\s>]/i.test(text)) {
    return text;
  }

  const lines = text.split('\n');
  const result: string[] = [];
  let currentList: { type: 'ol' | 'ul'; items: string[] } | null = null;

  const flushList = () => {
    if (currentList) {
      const tag = currentList.type;
      // TipTap requires <p> tags inside <li> elements for proper rendering
      const items = currentList.items.map(item => `<li><p>${item}</p></li>`).join('');
      result.push(`<${tag}>${items}</${tag}>`);
      currentList = null;
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();

    // Empty line - flush any pending list and add break
    if (!trimmed) {
      flushList();
      continue;
    }

    // Numbered list: "1. item", "2) item", etc.
    const numberedMatch = trimmed.match(/^(\d+)[.)]\s+(.+)$/);
    if (numberedMatch) {
      if (currentList?.type !== 'ol') {
        flushList();
        currentList = { type: 'ol', items: [] };
      }
      currentList.items.push(numberedMatch[2]);
      continue;
    }

    // Bullet list: "- item", "* item", "• item"
    const bulletMatch = trimmed.match(/^[-*•]\s+(.+)$/);
    if (bulletMatch) {
      if (currentList?.type !== 'ul') {
        flushList();
        currentList = { type: 'ul', items: [] };
      }
      currentList.items.push(bulletMatch[1]);
      continue;
    }

    // Regular paragraph
    flushList();
    result.push(`<p>${trimmed}</p>`);
  }

  // Flush any remaining list
  flushList();

  return result.join('');
}
