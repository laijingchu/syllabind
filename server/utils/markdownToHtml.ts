/**
 * Converts markdown-style text to HTML for rich text editors.
 * Handles numbered lists, bullet lists, paragraphs, and nested lists up to 3 levels.
 *
 * Key behaviors:
 * - Numbered items separated by blank lines stay in one <ol>
 * - Bullet sub-items between numbered items are nested under the preceding item
 * - Indented items create nested lists (2 spaces per level, up to 3 levels)
 * - Lazy numbering (all "1.") is handled automatically by HTML <ol>
 */

type LineToken = {
  type: 'ol' | 'ul' | 'text' | 'blank';
  content: string;
  indent: number;
};

function getIndentLevel(line: string): number {
  let spaces = 0;
  for (const ch of line) {
    if (ch === ' ') spaces++;
    else if (ch === '\t') spaces += 2;
    else break;
  }
  return Math.min(Math.floor(spaces / 2), 3);
}

function tokenize(lines: string[]): LineToken[] {
  return lines.map(line => {
    const trimmed = line.trim();
    if (!trimmed) return { type: 'blank' as const, content: '', indent: 0 };

    const indent = getIndentLevel(line);

    const numMatch = trimmed.match(/^(\d+)[.)]\s+(.+)$/);
    if (numMatch) return { type: 'ol' as const, content: numMatch[2], indent };

    const bulletMatch = trimmed.match(/^[-*•]\s+(.+)$/);
    if (bulletMatch) return { type: 'ul' as const, content: bulletMatch[1], indent };

    return { type: 'text' as const, content: trimmed, indent };
  });
}

/** Render a flat sequence of tokens into HTML. */
function render(tokens: LineToken[]): string {
  const result: string[] = [];
  let i = 0;

  while (i < tokens.length) {
    if (tokens[i].type === 'blank') { i++; continue; }

    const tokenType = tokens[i].type;
    if (tokenType === 'ol' || tokenType === 'ul') {
      const [html, next] = renderList(tokens, i, tokenType, tokens[i].indent);
      result.push(html);
      i = next;
    } else {
      result.push(`<p>${tokens[i].content}</p>`);
      i++;
    }
  }

  return result.join('');
}

/** Render an ordered or unordered list, collecting items at the same indent and type. */
function renderList(
  tokens: LineToken[],
  start: number,
  listType: 'ol' | 'ul',
  baseIndent: number,
): [string, number] {
  const items: string[] = [];
  let i = start;

  while (i < tokens.length) {
    if (tokens[i].type === 'blank') { i++; continue; }

    if (tokens[i].type === listType && tokens[i].indent === baseIndent) {
      const [itemHtml, next] = renderListItem(tokens, i, listType, baseIndent);
      items.push(itemHtml);
      i = next;
    } else {
      break;
    }
  }

  return [`<${listType}>${items.join('')}</${listType}>`, i];
}

/**
 * Render a single <li> and any nested sub-content (sub-lists, indented text).
 *
 * Nesting rule for same-indent different-type items:
 * - Numbered (ol) items nest bullet (ul) sub-items at the same indent level.
 *   This handles the common pattern of numbered sections with bullet details.
 * - Bullet (ul) items do NOT nest numbered (ol) items at the same indent,
 *   preventing recursive nesting issues and keeping separate list sections distinct.
 * - Both types always nest deeper-indented items via indentation.
 */
function renderListItem(
  tokens: LineToken[],
  start: number,
  listType: 'ol' | 'ul',
  baseIndent: number,
): [string, number] {
  // TipTap requires <p> tags inside <li> elements for proper rendering
  let html = `<li><p>${tokens[start].content}</p>`;
  let i = start + 1;

  while (i < tokens.length) {
    if (tokens[i].type === 'blank') { i++; continue; }

    // Same type at same indent → next sibling item in the parent list
    if (tokens[i].type === listType && tokens[i].indent === baseIndent) break;

    // Deeper indent → nested content (always allowed regardless of type)
    if (tokens[i].indent > baseIndent) {
      const subType = tokens[i].type;
      if (subType === 'ol' || subType === 'ul') {
        const [subList, next] = renderList(tokens, i, subType, tokens[i].indent);
        html += subList;
        i = next;
      } else {
        html += `<p>${tokens[i].content}</p>`;
        i++;
      }
      continue;
    }

    // Same indent, different list type
    if (
      tokens[i].indent === baseIndent &&
      (tokens[i].type === 'ol' || tokens[i].type === 'ul') &&
      tokens[i].type !== listType
    ) {
      // Only ol items nest ul sub-items at the same indent.
      // ul items break when encountering ol at the same indent,
      // which prevents recursive nesting and keeps separate lists distinct.
      if (listType === 'ol') {
        const diffType = tokens[i].type as 'ol' | 'ul';
        const [subList, next] = renderList(tokens, i, diffType, tokens[i].indent);
        html += subList;
        i = next;
        continue;
      }
      break;
    }

    // Text or shallower indent → done with this item
    break;
  }

  html += '</li>';
  return [html, i];
}

export function markdownToHtml(text: string | null | undefined): string | null {
  if (!text) return null;

  // If already contains actual HTML structure tags, return as-is
  // Match common HTML tags but not placeholder text like <topic>
  if (/<(p|ul|ol|li|div|span|br|strong|em|b|i|a|h[1-6])[\s>]/i.test(text)) {
    return text;
  }

  const tokens = tokenize(text.split('\n'));
  return render(tokens);
}
