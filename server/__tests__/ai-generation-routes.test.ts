import request from 'supertest';
import express from 'express';
import { resetAllMocks, mockStorage, mockCreator, mockUser } from './setup/mocks';

describe('AI Generation Routes', () => {
  let creatorApp: express.Express;
  let learnerApp: express.Express;

  function registerRoutes(a: express.Express) {
    const authMiddleware = (req: any, res: any, next: any) => {
      if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
      next();
    };

    // POST /api/generate-syllabind
    a.post('/api/generate-syllabind', authMiddleware, async (req, res) => {
      const username = (req.user as any).username;
      const user = req.user as any;

      if (!user.isCreator) {
        return res.status(403).json({ error: 'Creator access required' });
      }

      const { syllabusId } = req.body;

      if (!syllabusId || typeof syllabusId !== 'number') {
        return res.status(400).json({ error: 'Valid syllabusId required' });
      }

      const syllabus = await mockStorage.getSyllabus(syllabusId);
      if (!syllabus || syllabus.creatorId !== username) {
        return res.status(403).json({ error: 'Not your syllabus' });
      }

      if (!syllabus.title || !syllabus.description || !syllabus.audienceLevel || !syllabus.durationWeeks) {
        return res.status(400).json({ error: 'Complete basics fields before generating' });
      }

      await mockStorage.updateSyllabus(syllabusId, { status: 'generating' });

      res.json({
        success: true,
        syllabusId,
        websocketUrl: `/ws/generate-syllabind/${syllabusId}`
      });
    });

    // POST /api/regenerate-week
    a.post('/api/regenerate-week', authMiddleware, async (req, res) => {
      const username = (req.user as any).username;
      const user = req.user as any;

      if (!user.isCreator) {
        return res.status(403).json({ error: 'Creator access required' });
      }

      const { syllabusId, weekIndex } = req.body;

      if (!syllabusId || typeof syllabusId !== 'number') {
        return res.status(400).json({ error: 'Valid syllabusId required' });
      }

      if (!weekIndex || typeof weekIndex !== 'number' || weekIndex < 1) {
        return res.status(400).json({ error: 'Valid weekIndex required' });
      }

      const syllabus = await mockStorage.getSyllabus(syllabusId);
      if (!syllabus || syllabus.creatorId !== username) {
        return res.status(403).json({ error: 'Not your syllabus' });
      }

      if (weekIndex > (syllabus.durationWeeks || 0)) {
        return res.status(400).json({ error: 'weekIndex exceeds syllabus duration' });
      }

      res.json({
        success: true,
        syllabusId,
        weekIndex,
        websocketUrl: `/ws/regenerate-week/${syllabusId}/${weekIndex}`
      });
    });
  }

  beforeAll(() => {
    creatorApp = express();
    creatorApp.use(express.json());
    creatorApp.use((req, _res, next) => { req.user = mockCreator; next(); });
    registerRoutes(creatorApp);

    learnerApp = express();
    learnerApp.use(express.json());
    learnerApp.use((req, _res, next) => { req.user = mockUser; next(); });
    registerRoutes(learnerApp);
  });

  beforeEach(() => {
    resetAllMocks();
  });

  describe('POST /api/generate-syllabind', () => {
    const completeSyllabus = {
      id: 1,
      creatorId: 'testcreator',
      title: 'Test Syllabus',
      description: 'A test',
      audienceLevel: 'Beginner',
      durationWeeks: 4,
      status: 'draft'
    };

    it('should return websocket URL for valid request', async () => {
      mockStorage.getSyllabus.mockResolvedValue(completeSyllabus);

      const res = await request(creatorApp)
        .post('/api/generate-syllabind')
        .send({ syllabusId: 1 })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.websocketUrl).toBe('/ws/generate-syllabind/1');
      expect(mockStorage.updateSyllabus).toHaveBeenCalledWith(1, { status: 'generating' });
    });

    it('should return 403 for non-creator', async () => {
      await request(learnerApp)
        .post('/api/generate-syllabind')
        .send({ syllabusId: 1 })
        .expect(403);
    });

    it('should return 400 for missing syllabusId', async () => {
      await request(creatorApp)
        .post('/api/generate-syllabind')
        .send({})
        .expect(400);
    });

    it('should return 400 for non-numeric syllabusId', async () => {
      await request(creatorApp)
        .post('/api/generate-syllabind')
        .send({ syllabusId: 'abc' })
        .expect(400);
    });

    it('should return 403 when syllabus not owned by user', async () => {
      mockStorage.getSyllabus.mockResolvedValue({ ...completeSyllabus, creatorId: 'othercreator' });

      await request(creatorApp)
        .post('/api/generate-syllabind')
        .send({ syllabusId: 1 })
        .expect(403);
    });

    it('should return 400 when basics fields incomplete', async () => {
      mockStorage.getSyllabus.mockResolvedValue({
        ...completeSyllabus,
        description: null
      });

      await request(creatorApp)
        .post('/api/generate-syllabind')
        .send({ syllabusId: 1 })
        .expect(400);
    });
  });

  describe('POST /api/regenerate-week', () => {
    const syllabus = {
      id: 1,
      creatorId: 'testcreator',
      title: 'Test',
      description: 'Test',
      audienceLevel: 'Beginner',
      durationWeeks: 4
    };

    it('should return websocket URL for valid request', async () => {
      mockStorage.getSyllabus.mockResolvedValue(syllabus);

      const res = await request(creatorApp)
        .post('/api/regenerate-week')
        .send({ syllabusId: 1, weekIndex: 2 })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.weekIndex).toBe(2);
      expect(res.body.websocketUrl).toBe('/ws/regenerate-week/1/2');
    });

    it('should return 403 for non-creator', async () => {
      await request(learnerApp)
        .post('/api/regenerate-week')
        .send({ syllabusId: 1, weekIndex: 1 })
        .expect(403);
    });

    it('should return 400 for missing syllabusId', async () => {
      await request(creatorApp)
        .post('/api/regenerate-week')
        .send({ weekIndex: 1 })
        .expect(400);
    });

    it('should return 400 for missing weekIndex', async () => {
      await request(creatorApp)
        .post('/api/regenerate-week')
        .send({ syllabusId: 1 })
        .expect(400);
    });

    it('should return 400 for weekIndex < 1', async () => {
      await request(creatorApp)
        .post('/api/regenerate-week')
        .send({ syllabusId: 1, weekIndex: 0 })
        .expect(400);
    });

    it('should return 400 when weekIndex exceeds duration', async () => {
      mockStorage.getSyllabus.mockResolvedValue(syllabus);

      await request(creatorApp)
        .post('/api/regenerate-week')
        .send({ syllabusId: 1, weekIndex: 5 })
        .expect(400);
    });

    it('should return 403 when syllabus not owned', async () => {
      mockStorage.getSyllabus.mockResolvedValue({ ...syllabus, creatorId: 'othercreator' });

      await request(creatorApp)
        .post('/api/regenerate-week')
        .send({ syllabusId: 1, weekIndex: 1 })
        .expect(403);
    });
  });
});
