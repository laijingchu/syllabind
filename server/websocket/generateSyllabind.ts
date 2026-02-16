import { WebSocket } from 'ws';
import { storage } from '../storage';
import { generateSyllabind, regenerateWeek } from '../utils/syllabindGenerator';
import { checkRateLimitStatus, isRateLimitSufficient } from '../utils/rateLimitCheck';

// Mock data for testing streaming without API calls
const MOCK_STEPS = [
  { type: 'reading', title: 'Introduction to the Topic', author: 'Jane Smith', url: 'https://example.com/intro', mediaType: 'Blog/Article', estimatedMinutes: 15, note: 'A foundational overview of key concepts.' },
  { type: 'reading', title: 'Deep Dive: Core Principles', author: 'Academic Press', url: 'https://example.com/principles', mediaType: 'Journal Article', estimatedMinutes: 25, note: 'Scholarly analysis of the underlying theory.' },
  { type: 'reading', title: 'Practical Applications', author: 'John Doe', url: 'https://example.com/practical', mediaType: 'Youtube video', estimatedMinutes: 20, note: 'Real-world examples and case studies.' },
  { type: 'exercise', title: 'Reflection Exercise', promptText: '<p>Based on this week\'s readings:</p><ol><li><p>Identify 3 key concepts</p></li><li><p>Write a 200-word reflection</p></li><li><p>Share with a peer for feedback</p></li></ol>', estimatedMinutes: 30 }
];

async function mockGenerateSyllabind(ws: WebSocket, syllabusId: number, durationWeeks: number): Promise<void> {
  console.log('[MockGenerate] Starting mock generation for testing...');

  for (let weekIndex = 1; weekIndex <= durationWeeks; weekIndex++) {
    // Send week_started
    ws.send(JSON.stringify({
      type: 'week_started',
      data: { weekIndex }
    }));

    // Simulate search delay
    await new Promise(resolve => setTimeout(resolve, 500));
    ws.send(JSON.stringify({
      type: 'searching',
      data: { query: `best resources for week ${weekIndex} topic` }
    }));
    await new Promise(resolve => setTimeout(resolve, 800));

    // Create week in database
    const weekTitle = `Week ${weekIndex}: Core Concepts`;
    const weekDescription = `This week covers fundamental aspects of the topic with curated readings and a practical exercise.`;

    const week = await storage.createWeek({
      syllabusId,
      index: weekIndex,
      title: weekTitle,
      description: weekDescription
    });

    // Send week title/description FIRST (before steps) so they render immediately
    ws.send(JSON.stringify({
      type: 'week_info',
      data: {
        weekIndex,
        title: weekTitle,
        description: weekDescription
      }
    }));

    // Stream steps one by one with delays
    for (let i = 0; i < MOCK_STEPS.length; i++) {
      const stepData = MOCK_STEPS[i];

      // Create step in database
      const createdStep = await storage.createStep({
        weekId: week.id,
        position: i + 1,
        type: stepData.type as 'reading' | 'exercise',
        title: `${stepData.title} (Week ${weekIndex})`,
        url: stepData.url || null,
        note: stepData.note || null,
        author: stepData.author || null,
        mediaType: stepData.mediaType || null,
        promptText: stepData.promptText || null,
        estimatedMinutes: stepData.estimatedMinutes || null
      });

      // Send step_completed with delay for visible streaming
      await new Promise(resolve => setTimeout(resolve, 400));
      ws.send(JSON.stringify({
        type: 'step_completed',
        data: {
          weekIndex,
          stepIndex: i + 1,
          step: {
            id: createdStep.id,
            weekId: week.id,
            position: i + 1,
            type: stepData.type,
            title: `${stepData.title} (Week ${weekIndex})`,
            url: stepData.url || null,
            note: stepData.note || null,
            author: stepData.author || null,
            mediaType: stepData.mediaType || null,
            promptText: stepData.promptText || null,
            estimatedMinutes: stepData.estimatedMinutes || null
          }
        }
      }));
    }

    // Send week_completed
    ws.send(JSON.stringify({
      type: 'week_completed',
      data: {
        weekIndex,
        week: {
          weekIndex,
          title: `Week ${weekIndex}: Core Concepts`,
          description: `This week covers fundamental aspects of the topic.`
        }
      }
    }));

    // Brief pause before next week
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  // Update syllabus status
  await storage.updateSyllabus(syllabusId, { status: 'draft' });

  ws.send(JSON.stringify({
    type: 'generation_complete',
    data: { syllabusId }
  }));

  console.log('[MockGenerate] Mock generation complete!');
}

export function handleGenerateSyllabindWS(ws: WebSocket, syllabusId: number, model?: string, useMock?: boolean) {
  const abortController = new AbortController();

  // When client disconnects (cancel or navigation), abort the generation
  ws.on('close', () => {
    if (!abortController.signal.aborted) {
      console.log(`[Generate] Client disconnected, aborting generation for syllabind ${syllabusId}`);
      abortController.abort();
    }
  });

  (async () => {
    try {
      const syllabus = await storage.getSyllabus(syllabusId);
      if (!syllabus) {
        ws.send(JSON.stringify({
          type: 'error',
          data: { message: 'Syllabus not found' }
        }));
        ws.close();
        return;
      }

      // CHECK RATE LIMITS BEFORE STARTING
      console.log('[Generate] Checking rate limit status...');
      const rateLimitStatus = await checkRateLimitStatus();

      console.log('[Generate] Rate limit status:', rateLimitStatus);

      // Send status to client
      ws.send(JSON.stringify({
        type: 'rate_limit_status',
        data: rateLimitStatus
      }));

      // If insufficient limits, abort generation
      if (!isRateLimitSufficient(rateLimitStatus)) {
        ws.send(JSON.stringify({
          type: 'generation_error',
          data: {
            message: rateLimitStatus.message,
            isRateLimit: true,
            resetIn: rateLimitStatus.resetIn,
            remaining: rateLimitStatus.remaining,
            limit: rateLimitStatus.limit
          }
        }));

        await storage.updateSyllabus(syllabusId, { status: 'draft' });
        return; // Don't start generation
      }

      if (syllabus.status !== 'generating') {
        await storage.updateSyllabus(syllabusId, { status: 'generating' });
      }

      // Delete existing weeks/steps before regenerating to prevent orphaned data
      console.log('[Generate] Deleting existing Syllabind data...');
      await storage.deleteWeeksBySyllabusId(syllabusId);

      // Use mock mode for testing streaming without API calls
      if (useMock) {
        await mockGenerateSyllabind(ws, syllabusId, syllabus.durationWeeks);
      } else {
        await generateSyllabind({
          syllabusId,
          basics: {
            title: syllabus.title,
            description: syllabus.description,
            audienceLevel: syllabus.audienceLevel,
            durationWeeks: syllabus.durationWeeks
          },
          ws,
          model,
          signal: abortController.signal
        });
      }

    } catch (error) {
      // Don't log abort errors as generation errors
      if (abortController.signal.aborted) {
        console.log(`[Generate] Generation cancelled for syllabind ${syllabusId}`);
        await storage.updateSyllabus(syllabusId, { status: 'draft' });
        return;
      }

      console.error('Generation error:', error);
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'error',
          data: { message: error instanceof Error ? error.message : 'Unknown error' }
        }));
      }

      await storage.updateSyllabus(syllabusId, { status: 'draft' });
    } finally {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    }
  })();
}

// Mock regeneration for a single week
async function mockRegenerateWeek(
  ws: WebSocket,
  syllabusId: number,
  weekIndex: number,
  existingWeekId?: number
): Promise<void> {
  console.log(`[MockRegenerateWeek] Starting mock regeneration for week ${weekIndex}...`);

  ws.send(JSON.stringify({
    type: 'week_started',
    data: { weekIndex }
  }));

  await new Promise(resolve => setTimeout(resolve, 500));

  const weekTitle = `Week ${weekIndex}: Regenerated Content`;
  const weekDescription = `Fresh content generated for week ${weekIndex} with updated readings and exercises.`;

  let weekId = existingWeekId;
  if (!weekId) {
    const week = await storage.createWeek({
      syllabusId,
      index: weekIndex,
      title: weekTitle,
      description: weekDescription
    });
    weekId = week.id;
  } else {
    await storage.updateWeek(weekId, {
      title: weekTitle,
      description: weekDescription
    });
  }

  ws.send(JSON.stringify({
    type: 'week_info',
    data: { weekIndex, title: weekTitle, description: weekDescription }
  }));

  for (let i = 0; i < MOCK_STEPS.length; i++) {
    const stepData = MOCK_STEPS[i];
    await new Promise(resolve => setTimeout(resolve, 400));

    const createdStep = await storage.createStep({
      weekId,
      position: i + 1,
      type: stepData.type as 'reading' | 'exercise',
      title: `${stepData.title} (Regenerated)`,
      url: stepData.url || null,
      note: stepData.note || null,
      author: stepData.author || null,
      mediaType: stepData.mediaType || null,
      promptText: stepData.promptText || null,
      estimatedMinutes: stepData.estimatedMinutes || null
    });

    ws.send(JSON.stringify({
      type: 'step_completed',
      data: {
        weekIndex,
        stepIndex: i + 1,
        step: {
          id: createdStep.id,
          weekId,
          position: i + 1,
          type: stepData.type,
          title: `${stepData.title} (Regenerated)`,
          url: stepData.url || null,
          note: stepData.note || null,
          author: stepData.author || null,
          mediaType: stepData.mediaType || null,
          promptText: stepData.promptText || null,
          estimatedMinutes: stepData.estimatedMinutes || null
        }
      }
    }));
  }

  ws.send(JSON.stringify({
    type: 'week_completed',
    data: {
      weekIndex,
      week: { weekIndex, title: weekTitle, description: weekDescription }
    }
  }));

  ws.send(JSON.stringify({
    type: 'week_regeneration_complete',
    data: { syllabusId, weekIndex }
  }));

  console.log(`[MockRegenerateWeek] Week ${weekIndex} regeneration complete!`);
}

export function handleRegenerateWeekWS(
  ws: WebSocket,
  syllabusId: number,
  weekIndex: number,
  model?: string,
  useMock?: boolean
) {
  const abortController = new AbortController();

  // When client disconnects (cancel or navigation), abort the regeneration
  ws.on('close', () => {
    if (!abortController.signal.aborted) {
      console.log(`[RegenerateWeek] Client disconnected, aborting regeneration for syllabind ${syllabusId} week ${weekIndex}`);
      abortController.abort();
    }
  });

  (async () => {
    try {
      const syllabus = await storage.getSyllabus(syllabusId);
      if (!syllabus) {
        ws.send(JSON.stringify({
          type: 'error',
          data: { message: 'Syllabus not found' }
        }));
        ws.close();
        return;
      }

      // Check rate limits
      console.log('[RegenerateWeek] Checking rate limit status...');
      const rateLimitStatus = await checkRateLimitStatus();

      ws.send(JSON.stringify({
        type: 'rate_limit_status',
        data: rateLimitStatus
      }));

      if (!isRateLimitSufficient(rateLimitStatus)) {
        ws.send(JSON.stringify({
          type: 'generation_error',
          data: {
            message: rateLimitStatus.message,
            isRateLimit: true,
            resetIn: rateLimitStatus.resetIn,
            remaining: rateLimitStatus.remaining,
            limit: rateLimitStatus.limit
          }
        }));
        return;
      }

      // Get existing week record
      const existingWeeks = await storage.getWeeksBySyllabusId(syllabusId);
      const existingWeek = existingWeeks.find(w => w.index === weekIndex);

      if (existingWeek) {
        // Delete only the steps for this week (preserve week record)
        console.log(`[RegenerateWeek] Deleting steps for week ${weekIndex}...`);
        await storage.deleteStepsByWeekId(existingWeek.id);
      }

      if (useMock) {
        await mockRegenerateWeek(ws, syllabusId, weekIndex, existingWeek?.id);
      } else {
        await regenerateWeek({
          syllabusId,
          weekIndex,
          existingWeekId: existingWeek?.id,
          basics: {
            title: syllabus.title,
            description: syllabus.description,
            audienceLevel: syllabus.audienceLevel,
            durationWeeks: syllabus.durationWeeks
          },
          ws,
          model,
          signal: abortController.signal
        });
      }

    } catch (error) {
      // Don't log abort errors as generation errors
      if (abortController.signal.aborted) {
        console.log(`[RegenerateWeek] Regeneration cancelled for syllabind ${syllabusId} week ${weekIndex}`);
        return;
      }

      console.error('Week regeneration error:', error);
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'error',
          data: { message: error instanceof Error ? error.message : 'Unknown error' }
        }));
      }
    } finally {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    }
  })();
}
