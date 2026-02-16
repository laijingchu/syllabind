import { WebSocket } from 'ws';
import { storage } from '../storage';
import { generateSyllabind, regenerateWeek } from '../utils/syllabindGenerator';

// Mock data for testing streaming without API calls
const MOCK_STEPS = [
  { type: 'reading', title: 'Introduction to the Topic', author: 'Jane Smith', url: 'https://example.com/intro', mediaType: 'Blog/Article', estimatedMinutes: 15, note: 'A foundational overview of key concepts.' },
  { type: 'reading', title: 'Deep Dive: Core Principles', author: 'Academic Press', url: 'https://example.com/principles', mediaType: 'Journal Article', estimatedMinutes: 25, note: 'Scholarly analysis of the underlying theory.' },
  { type: 'reading', title: 'Practical Applications', author: 'John Doe', url: 'https://example.com/practical', mediaType: 'Youtube video', estimatedMinutes: 20, note: 'Real-world examples and case studies.' },
  { type: 'exercise', title: 'Reflection Exercise', promptText: '<p>Based on this week\'s readings:</p><ol><li><p>Identify 3 key concepts</p></li><li><p>Write a 200-word reflection</p></li><li><p>Share with a peer for feedback</p></li></ol>', estimatedMinutes: 30 }
];

// Mock week titles for distinct curriculum topics
const MOCK_WEEK_TITLES = [
  { title: 'Foundations & First Principles', description: 'Establish core vocabulary and mental models for the topic.' },
  { title: 'Historical Context & Evolution', description: 'Trace how the field developed and why current approaches exist.' },
  { title: 'Core Frameworks & Models', description: 'Learn the primary analytical frameworks used by practitioners.' },
  { title: 'Research Methods & Evidence', description: 'Understand how knowledge is produced and validated in this field.' },
  { title: 'Applied Techniques', description: 'Put theory into practice with real-world techniques and tools.' },
  { title: 'Case Studies & Analysis', description: 'Analyze detailed real-world examples and their outcomes.' },
  { title: 'Contemporary Debates', description: 'Engage with current controversies and open questions in the field.' },
  { title: 'Synthesis & Future Directions', description: 'Integrate everything learned and explore emerging frontiers.' },
];

async function mockGenerateSyllabind(ws: WebSocket, syllabusId: number, durationWeeks: number): Promise<void> {
  console.log('[MockGenerate] Starting mock generation for testing...');

  // Phase 1: Plan curriculum
  ws.send(JSON.stringify({
    type: 'planning_started',
    data: { durationWeeks }
  }));

  await new Promise(resolve => setTimeout(resolve, 1000));

  // Send all week titles immediately
  const curriculum = Array.from({ length: durationWeeks }, (_, i) => ({
    weekIndex: i + 1,
    title: MOCK_WEEK_TITLES[i % MOCK_WEEK_TITLES.length].title,
    description: MOCK_WEEK_TITLES[i % MOCK_WEEK_TITLES.length].description
  }));

  // Create all weeks in DB
  const savedWeeks: Map<number, number> = new Map(); // weekIndex -> weekId
  for (const cw of curriculum) {
    const week = await storage.createWeek({
      syllabusId,
      index: cw.weekIndex,
      title: cw.title,
      description: cw.description
    });
    savedWeeks.set(cw.weekIndex, week.id);
  }

  await new Promise(resolve => setTimeout(resolve, 300));

  ws.send(JSON.stringify({
    type: 'curriculum_planned',
    data: { weeks: curriculum }
  }));

  await new Promise(resolve => setTimeout(resolve, 500));

  // Phase 2: Generate content per week
  for (let weekIndex = 1; weekIndex <= durationWeeks; weekIndex++) {
    const weekId = savedWeeks.get(weekIndex)!;
    const weekTitle = curriculum[weekIndex - 1].title;
    const weekDescription = curriculum[weekIndex - 1].description;

    // Send week_started (title/description already set by curriculum_planned)
    ws.send(JSON.stringify({
      type: 'week_started',
      data: { weekIndex }
    }));

    // Simulate search delay
    await new Promise(resolve => setTimeout(resolve, 500));
    ws.send(JSON.stringify({
      type: 'searching',
      data: { query: `best resources for ${weekTitle}` }
    }));
    await new Promise(resolve => setTimeout(resolve, 800));

    // Send week_info to confirm title/description
    ws.send(JSON.stringify({
      type: 'week_info',
      data: { weekIndex, title: weekTitle, description: weekDescription }
    }));

    // Stream steps one by one with delays
    for (let i = 0; i < MOCK_STEPS.length; i++) {
      const stepData = MOCK_STEPS[i];

      const createdStep = await storage.createStep({
        weekId,
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

      await new Promise(resolve => setTimeout(resolve, 400));
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

    // Send week_completed with preserved title
    ws.send(JSON.stringify({
      type: 'week_completed',
      data: {
        weekIndex,
        week: { weekIndex, title: weekTitle, description: weekDescription }
      }
    }));

    await new Promise(resolve => setTimeout(resolve, 300));
  }

  await storage.updateSyllabus(syllabusId, { status: 'draft' });

  ws.send(JSON.stringify({
    type: 'generation_complete',
    data: { syllabusId }
  }));

  console.log('[MockGenerate] Mock generation complete!');
}

export function handleGenerateSyllabindWS(ws: WebSocket, syllabusId: number, useMock?: boolean) {
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

// Mock regeneration for a single week — preserves existing title/description
async function mockRegenerateWeek(
  ws: WebSocket,
  syllabusId: number,
  weekIndex: number,
  existingWeekId?: number,
  existingTitle?: string,
  existingDescription?: string
): Promise<void> {
  console.log(`[MockRegenerateWeek] Starting mock regeneration for week ${weekIndex}...`);

  ws.send(JSON.stringify({
    type: 'week_started',
    data: { weekIndex }
  }));

  await new Promise(resolve => setTimeout(resolve, 500));

  // Preserve existing title/description
  const weekTitle = existingTitle || `Week ${weekIndex}: Regenerated Content`;
  const weekDescription = existingDescription || `Fresh content generated for week ${weekIndex} with updated readings and exercises.`;

  let weekId = existingWeekId;
  if (!weekId) {
    const week = await storage.createWeek({
      syllabusId,
      index: weekIndex,
      title: weekTitle,
      description: weekDescription
    });
    weekId = week.id;
  }
  // Don't update week title/description — preserve what's already there

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

      // Get existing week record
      const existingWeeks = await storage.getWeeksBySyllabusId(syllabusId);
      const existingWeek = existingWeeks.find(w => w.index === weekIndex);

      if (existingWeek) {
        // Delete only the steps for this week (preserve week record)
        console.log(`[RegenerateWeek] Deleting steps for week ${weekIndex}...`);
        await storage.deleteStepsByWeekId(existingWeek.id);
      }

      // Build full outline from all weeks for context
      const allWeeksOutline = existingWeeks.map(w => ({
        weekIndex: w.index,
        title: w.title || '',
        description: w.description || ''
      }));

      if (useMock) {
        await mockRegenerateWeek(ws, syllabusId, weekIndex, existingWeek?.id, existingWeek?.title ?? undefined, existingWeek?.description ?? undefined);
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
          weekTitle: existingWeek?.title ?? undefined,
          weekDescription: existingWeek?.description ?? undefined,
          allWeeksOutline,
          ws,
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
