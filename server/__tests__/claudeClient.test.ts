// Mock @anthropic-ai/sdk before importing
jest.mock('@anthropic-ai/sdk', () => {
  return jest.fn().mockImplementation(() => ({}));
});

describe('claudeClient', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    jest.resetModules();
  });

  describe('CLAUDE_MODEL', () => {
    it('should always use haiku (Tier 1 optimized)', () => {
      jest.resetModules();
      const { CLAUDE_MODEL } = require('../utils/claudeClient');
      expect(CLAUDE_MODEL).toBe('claude-3-5-haiku-20241022');
    });

    it('should use haiku regardless of NODE_ENV', () => {
      process.env.NODE_ENV = 'production';
      jest.resetModules();
      const { CLAUDE_MODEL } = require('../utils/claudeClient');
      expect(CLAUDE_MODEL).toBe('claude-3-5-haiku-20241022');
    });
  });

  describe('executeToolCall', () => {
    let executeToolCall: any;

    beforeEach(() => {
      process.env.NODE_ENV = 'test';
      jest.resetModules();
      executeToolCall = require('../utils/claudeClient').executeToolCall;
    });

    it('should handle web_search tool', async () => {
      const result = await executeToolCall('web_search', { query: 'test' }, {});
      expect(result.handled_by_api).toBe(true);
    });

    it('should handle finalize_week tool', async () => {
      const input = { weekIndex: 1, title: 'Week 1', steps: [] };
      const result = await executeToolCall('finalize_week', input, {});
      expect(result.weekIndex).toBe(1);
      expect(result.title).toBe('Week 1');
    });

    it('should handle read_current_syllabind tool', async () => {
      const context = { currentSyllabus: { id: 1, title: 'My Syllabus' } };
      const result = await executeToolCall('read_current_syllabind', {}, context);
      expect(result).toEqual(context.currentSyllabus);
    });

    it('should handle update_week tool', async () => {
      const input = { weekIndex: 2, updates: { title: 'New Title' } };
      const result = await executeToolCall('update_week', input, {});
      expect(result).toEqual(input);
    });

    it('should handle add_step tool', async () => {
      const input = { weekIndex: 1, step: { type: 'reading', title: 'Article' } };
      const result = await executeToolCall('add_step', input, {});
      expect(result).toEqual(input);
    });

    it('should handle remove_step tool', async () => {
      const input = { weekIndex: 1, stepPosition: 2 };
      const result = await executeToolCall('remove_step', input, {});
      expect(result).toEqual(input);
    });

    it('should handle update_basics tool', async () => {
      const input = { title: 'Updated Title', durationWeeks: 6 };
      const result = await executeToolCall('update_basics', input, {});
      expect(result).toEqual(input);
    });

    it('should throw for unknown tool', async () => {
      await expect(executeToolCall('unknown_tool', {}, {}))
        .rejects.toThrow('Unknown tool: unknown_tool');
    });
  });
});
