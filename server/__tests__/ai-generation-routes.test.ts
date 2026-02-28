import request from 'supertest';
import express from 'express';
import { resetAllMocks, mockStorage, mockCurator, mockUser } from './setup/mocks';

describe('AI Generation Routes', () => {
  let curatorApp: express.Express;
  let readerApp: express.Express;

  function registerRoutes(a: express.Express) {
    const authMiddleware = (req: any, res: any, next: any) => {
      if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
      next();
    };

    // POST /api/generate-binder
    a.post('/api/generate-binder', authMiddleware, async (req, res) => {
      const username = (req.user as any).username;
      const user = req.user as any;

      if (!user.isCurator) {
        return res.status(403).json({ error: 'Curator access required' });
      }

      const { binderId } = req.body;

      if (!binderId || typeof binderId !== 'number') {
        return res.status(400).json({ error: 'Valid binderId required' });
      }

      const binder = await mockStorage.getBinder(binderId);
      if (!binder || binder.curatorId !== username) {
        return res.status(403).json({ error: 'Not your binder' });
      }

      if (!binder.title || !binder.description || !binder.audienceLevel || !binder.durationWeeks) {
        return res.status(400).json({ error: 'Complete basics fields before generating' });
      }

      if (binder.status === 'generating') {
        return res.status(409).json({ error: 'Generation already in progress' });
      }

      await mockStorage.updateBinder(binderId, { status: 'generating' });

      res.json({
        success: true,
        binderId,
        websocketUrl: `/ws/generate-binder/${binderId}`
      });
    });

    // POST /api/regenerate-week
    a.post('/api/regenerate-week', authMiddleware, async (req, res) => {
      const username = (req.user as any).username;
      const user = req.user as any;

      if (!user.isCurator) {
        return res.status(403).json({ error: 'Curator access required' });
      }

      const { binderId, weekIndex } = req.body;

      if (!binderId || typeof binderId !== 'number') {
        return res.status(400).json({ error: 'Valid binderId required' });
      }

      if (!weekIndex || typeof weekIndex !== 'number' || weekIndex < 1) {
        return res.status(400).json({ error: 'Valid weekIndex required' });
      }

      const binder = await mockStorage.getBinder(binderId);
      if (!binder || binder.curatorId !== username) {
        return res.status(403).json({ error: 'Not your binder' });
      }

      if (weekIndex > (binder.durationWeeks || 0)) {
        return res.status(400).json({ error: 'weekIndex exceeds binder duration' });
      }

      res.json({
        success: true,
        binderId,
        weekIndex,
        websocketUrl: `/ws/regenerate-week/${binderId}/${weekIndex}`
      });
    });
  }

  beforeAll(() => {
    curatorApp = express();
    curatorApp.use(express.json());
    curatorApp.use((req, _res, next) => { req.user = mockCurator; next(); });
    registerRoutes(curatorApp);

    readerApp = express();
    readerApp.use(express.json());
    readerApp.use((req, _res, next) => { req.user = mockUser; next(); });
    registerRoutes(readerApp);
  });

  beforeEach(() => {
    resetAllMocks();
  });

  describe('POST /api/generate-binder', () => {
    const completeBinder = {
      id: 1,
      curatorId: 'testcurator',
      title: 'Test Binder',
      description: 'A test',
      audienceLevel: 'Beginner',
      durationWeeks: 4,
      status: 'draft'
    };

    it('should return websocket URL for valid request', async () => {
      mockStorage.getBinder.mockResolvedValue(completeBinder);

      const res = await request(curatorApp)
        .post('/api/generate-binder')
        .send({ binderId: 1 })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.websocketUrl).toBe('/ws/generate-binder/1');
      expect(mockStorage.updateBinder).toHaveBeenCalledWith(1, { status: 'generating' });
    });

    it('should return 403 for non-curator', async () => {
      await request(readerApp)
        .post('/api/generate-binder')
        .send({ binderId: 1 })
        .expect(403);
    });

    it('should return 400 for missing binderId', async () => {
      await request(curatorApp)
        .post('/api/generate-binder')
        .send({})
        .expect(400);
    });

    it('should return 400 for non-numeric binderId', async () => {
      await request(curatorApp)
        .post('/api/generate-binder')
        .send({ binderId: 'abc' })
        .expect(400);
    });

    it('should return 403 when binder not owned by user', async () => {
      mockStorage.getBinder.mockResolvedValue({ ...completeBinder, curatorId: 'othercreator' });

      await request(curatorApp)
        .post('/api/generate-binder')
        .send({ binderId: 1 })
        .expect(403);
    });

    it('should return 400 when basics fields incomplete', async () => {
      mockStorage.getBinder.mockResolvedValue({
        ...completeBinder,
        description: null
      });

      await request(curatorApp)
        .post('/api/generate-binder')
        .send({ binderId: 1 })
        .expect(400);
    });

    it('should return 409 when generation already in progress', async () => {
      mockStorage.getBinder.mockResolvedValue({
        ...completeBinder,
        status: 'generating'
      });

      const res = await request(curatorApp)
        .post('/api/generate-binder')
        .send({ binderId: 1 })
        .expect(409);

      expect(res.body.error).toBe('Generation already in progress');
    });
  });

  describe('POST /api/regenerate-week', () => {
    const binder = {
      id: 1,
      curatorId: 'testcurator',
      title: 'Test',
      description: 'Test',
      audienceLevel: 'Beginner',
      durationWeeks: 4
    };

    it('should return websocket URL for valid request', async () => {
      mockStorage.getBinder.mockResolvedValue(binder);

      const res = await request(curatorApp)
        .post('/api/regenerate-week')
        .send({ binderId: 1, weekIndex: 2 })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.weekIndex).toBe(2);
      expect(res.body.websocketUrl).toBe('/ws/regenerate-week/1/2');
    });

    it('should return 403 for non-curator', async () => {
      await request(readerApp)
        .post('/api/regenerate-week')
        .send({ binderId: 1, weekIndex: 1 })
        .expect(403);
    });

    it('should return 400 for missing binderId', async () => {
      await request(curatorApp)
        .post('/api/regenerate-week')
        .send({ weekIndex: 1 })
        .expect(400);
    });

    it('should return 400 for missing weekIndex', async () => {
      await request(curatorApp)
        .post('/api/regenerate-week')
        .send({ binderId: 1 })
        .expect(400);
    });

    it('should return 400 for weekIndex < 1', async () => {
      await request(curatorApp)
        .post('/api/regenerate-week')
        .send({ binderId: 1, weekIndex: 0 })
        .expect(400);
    });

    it('should return 400 when weekIndex exceeds duration', async () => {
      mockStorage.getBinder.mockResolvedValue(binder);

      await request(curatorApp)
        .post('/api/regenerate-week')
        .send({ binderId: 1, weekIndex: 5 })
        .expect(400);
    });

    it('should return 403 when binder not owned', async () => {
      mockStorage.getBinder.mockResolvedValue({ ...binder, curatorId: 'othercreator' });

      await request(curatorApp)
        .post('/api/regenerate-week')
        .send({ binderId: 1, weekIndex: 1 })
        .expect(403);
    });
  });
});
