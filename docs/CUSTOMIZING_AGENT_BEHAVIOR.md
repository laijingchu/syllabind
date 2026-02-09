# Customizing AI Agent Behavior

## Quick Reference

This guide shows how to customize the Syllabind generation agent's behavior without reading the full implementation plan.

## Common Customizations

### 1. Change Number of Steps Per Week

**File**: `server/utils/SyllabindGenerator.ts`
**Line**: ~30

```typescript
// Current: 4-6 steps per week
- Each week should have 4-6 steps (mix of readings and exercises)

// Make it 6-8 steps:
+ Each week should have 6-8 steps (aim for 7)

// Make it 3-5 steps (faster):
+ Each week should have 3-5 steps (focus on quality over quantity)
```

### 2. Prioritize Video Content

**File**: `server/utils/SyllabindGenerator.ts`
**Line**: ~28

```typescript
Requirements:
- Search for HIGH-QUALITY educational resources (articles, videos, books, courses)
+ - PRIORITIZE video content from YouTube, Coursera, and educational platforms
+ - Each week should include at least 2 video resources
```

### 3. Add Trusted Domains

**File**: `server/utils/webSearch.ts`
**Line**: ~62

```typescript
const trustworthy = [
  'edu', 'gov', 'arxiv.org', 'medium.com',
  'youtube.com', 'coursera.org', 'mit.edu',
  'stanford.edu', 'harvard.edu'
+ 'udemy.com', 'khanacademy.org', 'freecodecamp.org',
+ 'pluralsight.com', 'edx.org'
];
```

### 4. Boost Academic Sources

**File**: `server/utils/webSearch.ts`
**Line**: ~68

```typescript
if (trustworthy.some(domain => result.domain.includes(domain))) {
- score += 30;
+ score += 40; // Boost from 30 to 40
}

// Or add specific boosting for .edu domains:
+ if (result.domain.endsWith('.edu')) {
+   score += 50; // Extra boost for academic sources
+ }
```

### 5. Require Free Resources Only

**File**: `server/utils/SyllabindGenerator.ts`
**Line**: ~28

```typescript
Requirements:
- Search for HIGH-QUALITY educational resources
+ - All resources MUST be free and publicly accessible
+ - Avoid paywalled content, subscription services, and premium courses
```

### 6. Make Generation Faster (Lower Quality)

**File**: `server/utils/SyllabindGenerator.ts`
**Line**: ~36

```typescript
Process for each week:
- 1. Perform 2-3 targeted searches with different queries
+ 1. Perform ONE comprehensive search
2. Evaluate source quality
- 3. If needed, refine and search again
- 4. Once you have 4-6 high-quality steps, call finalize_week
+ 3. Select the best 4 results from that search
+ 4. Call finalize_week immediately
```

**And line**: ~56

```typescript
const response = await client.messages.create({
  model: 'claude-sonnet-4-20250514',
- max_tokens: 4000,
+ max_tokens: 2000, // Reduce from 4000 to 2000
```

### 7. Make Generation Higher Quality (Slower)

**File**: `server/utils/SyllabindGenerator.ts`
**Line**: ~56

```typescript
const response = await client.messages.create({
- model: 'claude-sonnet-4-20250514',
+ model: 'claude-opus-4-5-20251101', // Use Opus instead of Sonnet
- max_tokens: 4000,
+ max_tokens: 8000, // Increase from 4000 to 8000
```

**And line**: ~36

```typescript
Process for each week:
- 1. Perform 2-3 targeted searches with different queries
+ 1. Perform 3-5 targeted searches with different queries
2. Evaluate source quality
- 3. If needed, refine and search again
+ 3. Refine and search again until you have 6+ high-quality sources
```

### 8. Change Chat Personality

**File**: `server/websocket/chatSyllabind.ts`
**Line**: ~52

```typescript
const systemPrompt = `You are a helpful Syllabind assistant for Syllabind.
+ You are friendly, encouraging, and enthusiastic about education.
+ Use a conversational tone and explain your suggestions clearly.

Current syllabus:
...
```

### 9. Restrict Chat Capabilities

**File**: `server/websocket/chatSyllabind.ts`
**Line**: ~64

```typescript
You can:
- Add, remove, or modify steps (readings/exercises)
- Update week titles and descriptions
- Search for additional resources
- Update basic fields if explicitly requested (explain changes)
+ You CANNOT modify the syllabus title, description, duration, or audience level.
+ Only the creator can change these in the editor.
```

### 10. Add Subject-Specific Instructions

**File**: `server/utils/SyllabindGenerator.ts`
**Line**: ~28

```typescript
Description: ${basics.description}

+ Special instructions:
+ ${basics.title.toLowerCase().includes('programming') ?
+   '- Include coding exercises with interactive platforms (CodePen, Replit)\n- Prioritize hands-on tutorials' : ''}
+ ${basics.audienceLevel === 'Advanced' ?
+   '- Include research papers and advanced theoretical content\n- Assume prior knowledge' : ''}
```

### 11. Enable Recent Content Filter by Default

**File**: `server/utils/SyllabindGenerator.ts`
**Line**: ~28

```typescript
Requirements:
- Search for HIGH-QUALITY educational resources
+ - PRIORITIZE content from the past 2 years (use includeRecent: true)
+ - Avoid outdated tutorials and deprecated technologies
```

## File Quick Reference

| What to Change | File | Approx Line |
|---|---|---|
| Steps per week | `server/utils/SyllabindGenerator.ts` | 30 |
| Search iterations | `server/utils/SyllabindGenerator.ts` | 36 |
| Model & tokens | `server/utils/SyllabindGenerator.ts` | 56 |
| Trusted domains | `server/utils/webSearch.ts` | 62 |
| Quality scoring | `server/utils/webSearch.ts` | 68 |
| Chat personality | `server/websocket/chatSyllabind.ts` | 52 |
| Chat capabilities | `server/websocket/chatSyllabind.ts` | 64 |

## Testing Changes

After making changes:

1. **Restart the server**:
   ```bash
   # Kill existing server
   pkill -f "tsx server/index.ts"

   # Restart
   npm run dev
   ```

2. **Test with a sample syllabus**:
   - Title: "Test Subject"
   - Description: "Testing agent changes"
   - Duration: 2 weeks
   - Click "Autogenerate"

3. **Monitor the behavior**:
   - Check browser console for WebSocket messages
   - Check server logs for Claude API calls
   - Verify generated content meets expectations

4. **Iterate**:
   - If quality is poor, increase search iterations or boost scoring
   - If too slow, reduce searches or switch to Haiku
   - If too expensive, reduce max_tokens or use Haiku

## Cost Optimization

### Use Haiku for Chat (10x cheaper)

**File**: `server/websocket/chatSyllabind.ts`
**Line**: ~68

```typescript
const stream = await client.messages.stream({
- model: 'claude-sonnet-4-20250514',
+ model: 'claude-3-5-haiku-20241022', // Much cheaper
  max_tokens: 2000,
```

### Reduce Search Frequency

**File**: `server/utils/SyllabindGenerator.ts`
**Line**: ~36

```typescript
Process for each week:
- 1. Perform 2-3 targeted searches with different queries
+ 1. Perform 1-2 targeted searches
```

### Cache Search Results Longer

**File**: `server/utils/webSearch.ts`
**Line**: ~55

```typescript
export const searchWeb = memoizee(performGoogleSearch, {
- maxAge: 15 * 60 * 1000, // 15 minutes
+ maxAge: 60 * 60 * 1000, // 60 minutes
```

## Advanced Customizations

### Add a New Tool

See the full implementation plan for details on adding tools like `generate_quiz`, `search_academic_papers`, etc.

### Change Search Provider

Replace `server/utils/webSearch.ts` to use Bing, Brave Search, or DuckDuckGo instead of Google.

### Add Validation Rules

Modify `server/utils/claudeClient.ts` in the `finalize_week` case to validate steps before saving.

### Implement Undo/Redo

Add a `changes` array in `server/websocket/chatSyllabind.ts` to track modifications and allow rollback.

## Monitoring

### Enable Verbose Logging

**File**: `server/utils/SyllabindGenerator.ts`
**After line**: ~79

```typescript
for (const toolUse of toolUseBlocks) {
+ console.log('🤖 Claude called tool:', toolUse.name);
+ console.log('📝 Tool input:', JSON.stringify(toolUse.input, null, 2));

  const result = await executeToolCall(toolName, toolInput, {});

+ console.log('✅ Tool result:', JSON.stringify(result, null, 2));
}
```

### Track API Costs

**File**: `server/utils/SyllabindGenerator.ts`
**After line**: ~60

```typescript
const response = await client.messages.create({
  model: 'claude-sonnet-4-20250514',
  max_tokens: 4000,
  tools: SYLLABIND_GENERATION_TOOLS,
  messages
});

+ const inputTokens = response.usage.input_tokens;
+ const outputTokens = response.usage.output_tokens;
+ const cost = (inputTokens * 0.003 + outputTokens * 0.015) / 1000;
+ console.log(`💰 API call cost: $${cost.toFixed(4)}`);
```

## Tips

1. **Start conservative**: Begin with fewer searches and lower tokens, then increase if quality suffers
2. **Test incrementally**: Make one change at a time and test thoroughly
3. **Monitor costs**: Enable cost tracking to understand budget impact
4. **User feedback**: Collect feedback on generated quality before making major changes
5. **Subject-specific**: Consider different prompts for different subject areas

## Troubleshooting

### Agent generates low-quality content
- Increase search iterations (2-3 → 3-5)
- Boost .edu domain scores (+30 → +50)
- Add more specific instructions in system prompt

### Agent is too slow
- Reduce searches per week (2-3 → 1-2)
- Switch to Haiku model
- Reduce max_tokens (4000 → 2000)

### Agent doesn't follow instructions
- Make instructions more explicit in system prompt
- Add examples of desired output
- Use stronger language ("MUST", "NEVER", "ALWAYS")

### Chat makes unwanted changes
- Restrict available tools in `SYLLABIND_CHAT_TOOLS`
- Add confirmation prompts before destructive actions
- Make system prompt more conservative

---

For comprehensive details on architecture, flow, and advanced customization, see `AI_SYLLABIND_GENERATION.md`.
