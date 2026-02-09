import { markdownToHtml } from '../utils/markdownToHtml';

describe('markdownToHtml', () => {
  it('returns null for null input', () => {
    expect(markdownToHtml(null)).toBeNull();
  });

  it('returns null for undefined input', () => {
    expect(markdownToHtml(undefined)).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(markdownToHtml('')).toBeNull();
  });

  it('passes through existing HTML unchanged', () => {
    const html = '<p>Already HTML</p><ul><li>Item</li></ul>';
    expect(markdownToHtml(html)).toBe(html);
  });

  it('does not treat placeholder brackets as HTML', () => {
    const input = 'Write about <topic> and share with <audience>';
    const expected = '<p>Write about <topic> and share with <audience></p>';
    expect(markdownToHtml(input)).toBe(expected);
  });

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

  it('handles multiple list types in sequence', () => {
    const input = '1. First\n2. Second\n\n- Bullet one\n- Bullet two';
    const expected = '<ol><li><p>First</p></li><li><p>Second</p></li></ol><ul><li><p>Bullet one</p></li><li><p>Bullet two</p></li></ul>';
    expect(markdownToHtml(input)).toBe(expected);
  });
});
