/**
 * Web Search Tests
 *
 * Tests the deprecated webSearch module which exports two functions
 * that throw errors indicating deprecation.
 */
import { searchWeb, evaluateSourceQuality } from '../utils/webSearch';

describe('webSearch (deprecated)', () => {
  it('searchWeb throws deprecation error', async () => {
    await expect(searchWeb()).rejects.toThrow('deprecated');
  });

  it('evaluateSourceQuality throws deprecation error', () => {
    expect(() => evaluateSourceQuality()).toThrow('deprecated');
  });
});
