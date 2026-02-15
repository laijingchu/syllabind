import request from 'supertest';
import express from 'express';
import { resetAllMocks, mockStorage, mockCreator } from './setup/mocks';

describe('Analytics Routes', () => {
  let creatorApp: express.Express;

  function registerRoutes(a: express.Express) {
    const authMiddleware = (req: any, res: any, next: any) => {
      if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
      next();
    };

    // GET /api/syllabinds/:id/analytics
    a.get('/api/syllabinds/:id/analytics', authMiddleware, async (req, res) => {
      const syllabusId = parseInt(req.params.id);
      const username = (req.user as any).username;
      const syllabus = await mockStorage.getSyllabus(syllabusId);
      if (!syllabus || syllabus.creatorId !== username) {
        return res.status(403).json({ error: 'Only creator can view analytics' });
      }
      const analytics = await mockStorage.getSyllabusAnalytics(syllabusId);
      res.json(analytics);
    });

    // GET /api/syllabinds/:id/analytics/completion-rates
    a.get('/api/syllabinds/:id/analytics/completion-rates', authMiddleware, async (req, res) => {
      const syllabusId = parseInt(req.params.id);
      const username = (req.user as any).username;
      const syllabus = await mockStorage.getSyllabus(syllabusId);
      if (!syllabus || syllabus.creatorId !== username) {
        return res.status(403).json({ error: 'Only creator can view analytics' });
      }
      const rates = await mockStorage.getStepCompletionRates(syllabusId);
      res.json(rates);
    });

    // GET /api/syllabinds/:id/analytics/completion-times
    a.get('/api/syllabinds/:id/analytics/completion-times', authMiddleware, async (req, res) => {
      const syllabusId = parseInt(req.params.id);
      const username = (req.user as any).username;
      const syllabus = await mockStorage.getSyllabus(syllabusId);
      if (!syllabus || syllabus.creatorId !== username) {
        return res.status(403).json({ error: 'Only creator can view analytics' });
      }
      const times = await mockStorage.getAverageCompletionTimes(syllabusId);
      res.json(times);
    });
  }

  beforeAll(() => {
    creatorApp = express();
    creatorApp.use(express.json());
    creatorApp.use((req, _res, next) => { req.user = mockCreator; next(); });
    registerRoutes(creatorApp);
  });

  beforeEach(() => {
    resetAllMocks();
  });

  describe('GET /api/syllabinds/:id/analytics', () => {
    it('should return analytics data for creator', async () => {
      mockStorage.getSyllabus.mockResolvedValue({ id: 1, creatorId: 'testcreator' });
      const analyticsData = {
        learnersStarted: 10,
        learnersCompleted: 3,
        completionRate: 30,
        averageProgress: 55,
        weekReach: [],
        stepDropoff: [],
        topDropoutStep: null
      };
      mockStorage.getSyllabusAnalytics.mockResolvedValue(analyticsData);

      const res = await request(creatorApp).get('/api/syllabinds/1/analytics').expect(200);
      expect(res.body.learnersStarted).toBe(10);
      expect(res.body.completionRate).toBe(30);
    });

    it('should return 403 when not creator', async () => {
      mockStorage.getSyllabus.mockResolvedValue({ id: 1, creatorId: 'othercreator' });
      await request(creatorApp).get('/api/syllabinds/1/analytics').expect(403);
    });

    it('should return 403 when syllabus not found', async () => {
      mockStorage.getSyllabus.mockResolvedValue(null);
      await request(creatorApp).get('/api/syllabinds/999/analytics').expect(403);
    });
  });

  describe('GET /api/syllabinds/:id/analytics/completion-rates', () => {
    it('should return step completion rates', async () => {
      mockStorage.getSyllabus.mockResolvedValue({ id: 1, creatorId: 'testcreator' });
      const rates = [
        { stepId: 1, completionCount: 8, completionRate: 80 },
        { stepId: 2, completionCount: 5, completionRate: 50 }
      ];
      mockStorage.getStepCompletionRates.mockResolvedValue(rates);

      const res = await request(creatorApp)
        .get('/api/syllabinds/1/analytics/completion-rates')
        .expect(200);

      expect(res.body).toHaveLength(2);
      expect(res.body[0].completionRate).toBe(80);
    });

    it('should return 403 when not creator', async () => {
      mockStorage.getSyllabus.mockResolvedValue({ id: 1, creatorId: 'othercreator' });
      await request(creatorApp)
        .get('/api/syllabinds/1/analytics/completion-rates')
        .expect(403);
    });
  });

  describe('GET /api/syllabinds/:id/analytics/completion-times', () => {
    it('should return average completion times', async () => {
      mockStorage.getSyllabus.mockResolvedValue({ id: 1, creatorId: 'testcreator' });
      const times = [
        { stepId: 1, avgMinutes: 15.5 },
        { stepId: 2, avgMinutes: 30.2 }
      ];
      mockStorage.getAverageCompletionTimes.mockResolvedValue(times);

      const res = await request(creatorApp)
        .get('/api/syllabinds/1/analytics/completion-times')
        .expect(200);

      expect(res.body).toHaveLength(2);
      expect(res.body[0].avgMinutes).toBe(15.5);
    });

    it('should return 403 when not creator', async () => {
      mockStorage.getSyllabus.mockResolvedValue({ id: 1, creatorId: 'othercreator' });
      await request(creatorApp)
        .get('/api/syllabinds/1/analytics/completion-times')
        .expect(403);
    });
  });
});
