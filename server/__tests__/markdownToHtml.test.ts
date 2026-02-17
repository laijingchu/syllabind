import { markdownToHtml } from '../utils/markdownToHtml';

describe('markdownToHtml', () => {
  // --- Null / empty handling ---

  it('returns null for null input', () => {
    expect(markdownToHtml(null)).toBeNull();
  });

  it('returns null for undefined input', () => {
    expect(markdownToHtml(undefined)).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(markdownToHtml('')).toBeNull();
  });

  // --- HTML pass-through ---

  it('passes through existing HTML unchanged', () => {
    const html = '<p>Already HTML</p><ul><li>Item</li></ul>';
    expect(markdownToHtml(html)).toBe(html);
  });

  it('does not treat placeholder brackets as HTML', () => {
    const input = 'Write about <topic> and share with <audience>';
    const expected = '<p>Write about <topic> and share with <audience></p>';
    expect(markdownToHtml(input)).toBe(expected);
  });

  // --- Inline formatting ---

  it('converts **bold** to <strong>', () => {
    expect(markdownToHtml('**Life Assessment**: Rate yourself')).toBe(
      '<p><strong>Life Assessment</strong>: Rate yourself</p>'
    );
  });

  it('converts *italic* to <em>', () => {
    expect(markdownToHtml('This is *important* text')).toBe(
      '<p>This is <em>important</em> text</p>'
    );
  });

  it('converts __bold__ to <strong>', () => {
    expect(markdownToHtml('__bold text__ here')).toBe(
      '<p><strong>bold text</strong> here</p>'
    );
  });

  it('handles bold and italic together', () => {
    expect(markdownToHtml('**bold** and *italic* text')).toBe(
      '<p><strong>bold</strong> and <em>italic</em> text</p>'
    );
  });

  it('converts inline formatting inside list items', () => {
    const input = '- **Step 1**: Do something\n- **Step 2**: Do more';
    const expected =
      '<ul>' +
        '<li><p><strong>Step 1</strong>: Do something</p></li>' +
        '<li><p><strong>Step 2</strong>: Do more</p></li>' +
      '</ul>';
    expect(markdownToHtml(input)).toBe(expected);
  });

  it('converts inline formatting inside numbered list items', () => {
    const input = '1. **Phase 1**: Planning\n2. **Phase 2**: Execution';
    const expected =
      '<ol>' +
        '<li><p><strong>Phase 1</strong>: Planning</p></li>' +
        '<li><p><strong>Phase 2</strong>: Execution</p></li>' +
      '</ol>';
    expect(markdownToHtml(input)).toBe(expected);
  });

  // --- Basic conversions ---

  it('converts plain text to paragraph', () => {
    expect(markdownToHtml('Hello world')).toBe('<p>Hello world</p>');
  });

  it('converts numbered list to ordered list', () => {
    const input = '1. First item\n2. Second item\n3. Third item';
    const expected = '<ol><li><p>First item</p></li><li><p>Second item</p></li><li><p>Third item</p></li></ol>';
    expect(markdownToHtml(input)).toBe(expected);
  });

  it('converts numbered list with parenthesis', () => {
    const input = '1) First item\n2) Second item';
    const expected = '<ol><li><p>First item</p></li><li><p>Second item</p></li></ol>';
    expect(markdownToHtml(input)).toBe(expected);
  });

  it('converts bullet list with dashes', () => {
    const input = '- First item\n- Second item\n- Third item';
    const expected = '<ul><li><p>First item</p></li><li><p>Second item</p></li><li><p>Third item</p></li></ul>';
    expect(markdownToHtml(input)).toBe(expected);
  });

  it('converts bullet list with asterisks', () => {
    const input = '* First item\n* Second item';
    const expected = '<ul><li><p>First item</p></li><li><p>Second item</p></li></ul>';
    expect(markdownToHtml(input)).toBe(expected);
  });

  it('handles mixed content with paragraphs and lists', () => {
    const input = 'Introduction\n\n1. Step one\n2. Step two\n\nConclusion';
    const expected = '<p>Introduction</p><ol><li><p>Step one</p></li><li><p>Step two</p></li></ol><p>Conclusion</p>';
    expect(markdownToHtml(input)).toBe(expected);
  });

  it('nests trailing bullets under last numbered item', () => {
    const input = '1. First\n2. Second\n\n- Bullet one\n- Bullet two';
    const expected =
      '<ol>' +
        '<li><p>First</p></li>' +
        '<li><p>Second</p>' +
          '<ul><li><p>Bullet one</p></li><li><p>Bullet two</p></li></ul>' +
        '</li>' +
      '</ol>';
    expect(markdownToHtml(input)).toBe(expected);
  });

  // --- Numbered list continuation across blank lines ---

  it('keeps numbered items in one <ol> when separated by blank lines', () => {
    const input = '1. First\n\n2. Second\n\n3. Third';
    const expected = '<ol><li><p>First</p></li><li><p>Second</p></li><li><p>Third</p></li></ol>';
    expect(markdownToHtml(input)).toBe(expected);
  });

  it('handles lazy numbering (all 1.) in a single <ol>', () => {
    const input = '1. First\n1. Second\n1. Third';
    const expected = '<ol><li><p>First</p></li><li><p>Second</p></li><li><p>Third</p></li></ol>';
    expect(markdownToHtml(input)).toBe(expected);
  });

  // --- Nesting: bullets between numbered items ---

  it('nests bullet sub-items under numbered items', () => {
    const input = [
      '1. Red Teaming Phase:',
      '- Create test prompts',
      '- Document vulnerabilities',
      '2. Benchmark Development:',
      '- Create evaluation rubric',
      '3. Mitigation Strategy:',
      '- Propose improvements',
    ].join('\n');
    const expected =
      '<ol>' +
        '<li><p>Red Teaming Phase:</p>' +
          '<ul><li><p>Create test prompts</p></li><li><p>Document vulnerabilities</p></li></ul>' +
        '</li>' +
        '<li><p>Benchmark Development:</p>' +
          '<ul><li><p>Create evaluation rubric</p></li></ul>' +
        '</li>' +
        '<li><p>Mitigation Strategy:</p>' +
          '<ul><li><p>Propose improvements</p></li></ul>' +
        '</li>' +
      '</ol>';
    expect(markdownToHtml(input)).toBe(expected);
  });

  it('nests bullets between numbered items separated by blank lines', () => {
    const input = [
      '1. Phase One:',
      '',
      '- Sub task A',
      '- Sub task B',
      '',
      '1. Phase Two:',
      '',
      '- Sub task C',
    ].join('\n');
    const expected =
      '<ol>' +
        '<li><p>Phase One:</p>' +
          '<ul><li><p>Sub task A</p></li><li><p>Sub task B</p></li></ul>' +
        '</li>' +
        '<li><p>Phase Two:</p>' +
          '<ul><li><p>Sub task C</p></li></ul>' +
        '</li>' +
      '</ol>';
    expect(markdownToHtml(input)).toBe(expected);
  });

  it('handles the full exercise prompt example with trailing text', () => {
    const input = [
      'Design and execute a safety evaluation. Your project should include:',
      '',
      '1. Red Teaming Phase:',
      '- Create 10 adversarial test prompts',
      '- Document potential vulnerabilities',
      '',
      '1. Benchmark Development:',
      '- Create a custom 5-point evaluation rubric',
      '',
      '1. Mitigation Strategy:',
      '- Propose concrete improvements',
      '- Explain how changes address vulnerabilities',
      '',
      'Deliverable: A 2-3 page report.',
    ].join('\n');
    const result = markdownToHtml(input)!;

    // Should have a single <ol> with 3 items
    expect(result.match(/<ol>/g)?.length).toBe(1);
    expect(result.match(/<\/ol>/g)?.length).toBe(1);
    expect(result.match(/<li>/g)?.length).toBeGreaterThanOrEqual(3);

    // Trailing text should be a separate <p>
    expect(result).toContain('<p>Deliverable: A 2-3 page report.</p>');

    // Intro text should be a <p>
    expect(result).toContain('<p>Design and execute a safety evaluation. Your project should include:</p>');
  });

  // --- Indentation-based nesting ---

  it('nests indented bullet items under parent bullets', () => {
    const input = [
      '- Top level',
      '  - Nested level 1',
      '  - Nested level 1b',
    ].join('\n');
    const expected =
      '<ul>' +
        '<li><p>Top level</p>' +
          '<ul><li><p>Nested level 1</p></li><li><p>Nested level 1b</p></li></ul>' +
        '</li>' +
      '</ul>';
    expect(markdownToHtml(input)).toBe(expected);
  });

  it('supports 3 levels of indented nesting', () => {
    const input = [
      '1. Level 1',
      '  - Level 2a',
      '    1. Level 3a',
      '    2. Level 3b',
      '  - Level 2b',
      '2. Level 1b',
    ].join('\n');
    const expected =
      '<ol>' +
        '<li><p>Level 1</p>' +
          '<ul>' +
            '<li><p>Level 2a</p>' +
              '<ol><li><p>Level 3a</p></li><li><p>Level 3b</p></li></ol>' +
            '</li>' +
            '<li><p>Level 2b</p></li>' +
          '</ul>' +
        '</li>' +
        '<li><p>Level 1b</p></li>' +
      '</ol>';
    expect(markdownToHtml(input)).toBe(expected);
  });

  it('nests indented text as sub-content of list items', () => {
    const input = [
      '1. Main point',
      '  Additional context for this point',
      '2. Second point',
    ].join('\n');
    const expected =
      '<ol>' +
        '<li><p>Main point</p><p>Additional context for this point</p></li>' +
        '<li><p>Second point</p></li>' +
      '</ol>';
    expect(markdownToHtml(input)).toBe(expected);
  });

  // --- Edge cases ---

  it('handles multiple blank lines between items', () => {
    const input = '1. First\n\n\n\n2. Second';
    const expected = '<ol><li><p>First</p></li><li><p>Second</p></li></ol>';
    expect(markdownToHtml(input)).toBe(expected);
  });

  it('handles bullet list followed by numbered list as separate lists', () => {
    const input = '- Bullet one\n- Bullet two\n\n1. Number one\n2. Number two';
    const expected =
      '<ul><li><p>Bullet one</p></li><li><p>Bullet two</p></li></ul>' +
      '<ol><li><p>Number one</p></li><li><p>Number two</p></li></ol>';
    expect(markdownToHtml(input)).toBe(expected);
  });

  it('handles bullet unicode dot character', () => {
    const input = '• Item one\n• Item two';
    const expected = '<ul><li><p>Item one</p></li><li><p>Item two</p></li></ul>';
    expect(markdownToHtml(input)).toBe(expected);
  });
});
