import request from 'supertest';
import express from 'express';
import { resetAllMocks, mockStorage, mockCurator } from './setup/mocks';

describe('Analytics Routes', () => {
  let curatorApp: express.Express;

  function registerRoutes(a: express.Express) {
    const authMiddleware = (req: any, res: any, next: any) => {
      if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
      next();
    };

    // GET /api/binders/:id/analytics
    a.get('/api/binders/:id/analytics', authMiddleware, async (req, res) => {
      const binderId = parseInt(req.params.id);
      const username = (req.user as any).username;
      const binder = await mockStorage.getBinder(binderId);
      if (!binder || binder.curatorId !== username) {
        return res.status(403).json({ error: 'Only curator can view analytics' });
      }
      const analytics = await mockStorage.getBinderAnalytics(binderId);
      res.json(analytics);
    });

    // GET /api/binders/:id/analytics/completion-rates
    a.get('/api/binders/:id/analytics/completion-rates', authMiddleware, async (req, res) => {
      const binderId = parseInt(req.params.id);
      const username = (req.user as any).username;
      const binder = await mockStorage.getBinder(binderId);
      if (!binder || binder.curatorId !== username) {
        return res.status(403).json({ error: 'Only curator can view analytics' });
      }
      const rates = await mockStorage.getStepCompletionRates(binderId);
      res.json(rates);
    });

    // GET /api/binders/:id/analytics/completion-times
    a.get('/api/binders/:id/analytics/completion-times', authMiddleware, async (req, res) => {
      const binderId = parseInt(req.params.id);
      const username = (req.user as any).username;
      const binder = await mockStorage.getBinder(binderId);
      if (!binder || binder.curatorId !== username) {
        return res.status(403).json({ error: 'Only curator can view analytics' });
      }
      const times = await mockStorage.getAverageCompletionTimes(binderId);
      res.json(times);
    });
  }

  beforeAll(() => {
    curatorApp = express();
    curatorApp.use(express.json());
    curatorApp.use((req, _res, next) => { req.user = mockCurator; next(); });
    registerRoutes(curatorApp);
  });

  beforeEach(() => {
    resetAllMocks();
  });

  describe('GET /api/binders/:id/analytics', () => {
    it('should return analytics data for curator', async () => {
      mockStorage.getBinder.mockResolvedValue({ id: 1, curatorId: 'testcurator' });
      const analyticsData = {
        readersStarted: 10,
        readersCompleted: 3,
        completionRate: 30,
        averageProgress: 55,
        weekReach: [],
        stepDropoff: [],
        topDropoutStep: null
      };
      mockStorage.getBinderAnalytics.mockResolvedValue(analyticsData);

      const res = await request(curatorApp).get('/api/binders/1/analytics').expect(200);
      expect(res.body.readersStarted).toBe(10);
      expect(res.body.completionRate).toBe(30);
    });

    it('should return 403 when not curator', async () => {
      mockStorage.getBinder.mockResolvedValue({ id: 1, curatorId: 'othercreator' });
      await request(curatorApp).get('/api/binders/1/analytics').expect(403);
    });

    it('should return 403 when binder not found', async () => {
      mockStorage.getBinder.mockResolvedValue(null);
      await request(curatorApp).get('/api/binders/999/analytics').expect(403);
    });
  });

  describe('GET /api/binders/:id/analytics/completion-rates', () => {
    it('should return step completion rates', async () => {
      mockStorage.getBinder.mockResolvedValue({ id: 1, curatorId: 'testcurator' });
      const rates = [
        { stepId: 1, completionCount: 8, completionRate: 80 },
        { stepId: 2, completionCount: 5, completionRate: 50 }
      ];
      mockStorage.getStepCompletionRates.mockResolvedValue(rates);

      const res = await request(curatorApp)
        .get('/api/binders/1/analytics/completion-rates')
        .expect(200);

      expect(res.body).toHaveLength(2);
      expect(res.body[0].completionRate).toBe(80);
    });

    it('should return 403 when not curator', async () => {
      mockStorage.getBinder.mockResolvedValue({ id: 1, curatorId: 'othercreator' });
      await request(curatorApp)
        .get('/api/binders/1/analytics/completion-rates')
        .expect(403);
    });
  });

  describe('GET /api/binders/:id/analytics/completion-times', () => {
    it('should return average completion times', async () => {
      mockStorage.getBinder.mockResolvedValue({ id: 1, curatorId: 'testcurator' });
      const times = [
        { stepId: 1, avgMinutes: 15.5 },
        { stepId: 2, avgMinutes: 30.2 }
      ];
      mockStorage.getAverageCompletionTimes.mockResolvedValue(times);

      const res = await request(curatorApp)
        .get('/api/binders/1/analytics/completion-times')
        .expect(200);

      expect(res.body).toHaveLength(2);
      expect(res.body[0].avgMinutes).toBe(15.5);
    });

    it('should return 403 when not curator', async () => {
      mockStorage.getBinder.mockResolvedValue({ id: 1, curatorId: 'othercreator' });
      await request(curatorApp)
        .get('/api/binders/1/analytics/completion-times')
        .expect(403);
    });
  });
});
