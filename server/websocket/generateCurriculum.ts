import { WebSocket } from 'ws';
import { storage } from '../storage';
import { generateCurriculum } from '../utils/curriculumGenerator';

export function handleGenerateCurriculumWS(ws: WebSocket, syllabusId: number) {
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

      await generateCurriculum({
        syllabusId,
        basics: {
          title: syllabus.title,
          description: syllabus.description,
          audienceLevel: syllabus.audienceLevel,
          durationWeeks: syllabus.durationWeeks
        },
        ws
      });

    } catch (error) {
      console.error('Generation error:', error);
      ws.send(JSON.stringify({
        type: 'error',
        data: { message: error instanceof Error ? error.message : 'Unknown error' }
      }));

      await storage.updateSyllabus(syllabusId, { status: 'draft' });
    } finally {
      ws.close();
    }
  })();
}
