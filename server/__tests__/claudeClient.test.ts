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

  describe('CLAUDE_MODEL_GENERATION', () => {
    it('should export Sonnet for generation tasks', () => {
      jest.resetModules();
      const { CLAUDE_MODEL_GENERATION } = require('../utils/claudeClient');
      expect(CLAUDE_MODEL_GENERATION).toBe('claude-sonnet-4-5-20250929');
    });
  });

  describe('getPlanningTools', () => {
    it('should return only the plan_curriculum tool (no web search)', () => {
      jest.resetModules();
      const { getPlanningTools } = require('../utils/claudeClient');
      const tools = getPlanningTools();
      expect(tools).toHaveLength(1);
      expect(tools[0].name).toBe('plan_curriculum');
    });
  });

  describe('getGenerationTools', () => {
    it('should include web_search and finalize_week', () => {
      jest.resetModules();
      const { getGenerationTools } = require('../utils/claudeClient');
      const tools = getGenerationTools();
      expect(tools).toHaveLength(2);
      expect(tools[0].name).toBe('web_search');
      expect(tools[1].name).toBe('finalize_week');
    });

    it('finalize_week should not require title (optional for pre-set curriculum)', () => {
      jest.resetModules();
      const { getGenerationTools } = require('../utils/claudeClient');
      const tools = getGenerationTools();
      const finalizeTool = tools.find((t: any) => t.name === 'finalize_week');
      expect(finalizeTool.input_schema.required).toContain('weekIndex');
      expect(finalizeTool.input_schema.required).toContain('steps');
      expect(finalizeTool.input_schema.required).not.toContain('title');
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

    it('should handle plan_curriculum tool', async () => {
      const input = {
        weeks: [
          { weekIndex: 1, title: 'Foundations', description: 'Core concepts' },
          { weekIndex: 2, title: 'Advanced', description: 'Deep dive' }
        ]
      };
      const result = await executeToolCall('plan_curriculum', input, {});
      expect(result.weeks).toHaveLength(2);
      expect(result.weeks[0].title).toBe('Foundations');
      expect(result.weeks[1].weekIndex).toBe(2);
    });

    it('should handle finalize_week tool', async () => {
      const input = { weekIndex: 1, title: 'Week 1', steps: [] };
      const result = await executeToolCall('finalize_week', input, {});
      expect(result.weekIndex).toBe(1);
      expect(result.title).toBe('Week 1');
    });

    it('should handle finalize_week without title (pre-set by curriculum plan)', async () => {
      const input = { weekIndex: 3, steps: [{ type: 'reading', title: 'Article' }] };
      const result = await executeToolCall('finalize_week', input, {});
      expect(result.weekIndex).toBe(3);
      expect(result.title).toBeUndefined();
      expect(result.steps).toHaveLength(1);
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
