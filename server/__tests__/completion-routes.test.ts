import request from 'supertest';
import express from 'express';
import { resetAllMocks, mockStorage, mockUser } from './setup/mocks';

describe('Completion Routes', () => {
  let authedApp: express.Express;
  let unauthApp: express.Express;

  function registerRoutes(a: express.Express) {
    const authMiddleware = (req: any, res: any, next: any) => {
      if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
      next();
    };

    // POST /api/enrollments/:enrollmentId/steps/:stepId/complete
    a.post('/api/enrollments/:enrollmentId/steps/:stepId/complete', authMiddleware, async (req, res) => {
      const enrollmentId = parseInt(req.params.enrollmentId);
      const stepId = parseInt(req.params.stepId);
      const enrollment = await mockStorage.getEnrollmentById(enrollmentId);
      if (!enrollment || enrollment.studentId !== (req.user as any).username) {
        return res.status(403).json({ error: 'Not authorized' });
      }
      const completion = await mockStorage.markStepCompleted(enrollmentId, stepId);
      res.json(completion);
    });

    // DELETE /api/enrollments/:enrollmentId/steps/:stepId/complete
    a.delete('/api/enrollments/:enrollmentId/steps/:stepId/complete', authMiddleware, async (req, res) => {
      const enrollmentId = parseInt(req.params.enrollmentId);
      const stepId = parseInt(req.params.stepId);
      const enrollment = await mockStorage.getEnrollmentById(enrollmentId);
      if (!enrollment || enrollment.studentId !== (req.user as any).username) {
        return res.status(403).json({ error: 'Not authorized' });
      }
      await mockStorage.markStepIncomplete(enrollmentId, stepId);
      res.json({ success: true });
    });

    // GET /api/enrollments/:enrollmentId/completed-steps
    a.get('/api/enrollments/:enrollmentId/completed-steps', authMiddleware, async (req, res) => {
      const enrollmentId = parseInt(req.params.enrollmentId);
      const username = (req.user as any).username;
      const enrollment = await mockStorage.getEnrollmentById(enrollmentId);
      if (!enrollment || enrollment.studentId !== username) {
        return res.status(403).json({ error: 'Not authorized' });
      }
      const completedStepIds = await mockStorage.getCompletedSteps(enrollmentId);
      res.json(completedStepIds);
    });
  }

  beforeAll(() => {
    authedApp = express();
    authedApp.use(express.json());
    authedApp.use((req, _res, next) => { req.user = mockUser; next(); });
    registerRoutes(authedApp);

    unauthApp = express();
    unauthApp.use(express.json());
    registerRoutes(unauthApp);
  });

  beforeEach(() => {
    resetAllMocks();
  });

  describe('POST /api/enrollments/:enrollmentId/steps/:stepId/complete', () => {
    it('should mark step as complete', async () => {
      mockStorage.getEnrollmentById.mockResolvedValue({ id: 1, studentId: 'testuser' });
      const completion = { enrollmentId: 1, stepId: 5, completedAt: new Date().toISOString() };
      mockStorage.markStepCompleted.mockResolvedValue(completion);

      const res = await request(authedApp)
        .post('/api/enrollments/1/steps/5/complete')
        .expect(200);

      expect(mockStorage.markStepCompleted).toHaveBeenCalledWith(1, 5);
      expect(res.body.enrollmentId).toBe(1);
    });

    it('should return 403 when not enrollment owner', async () => {
      mockStorage.getEnrollmentById.mockResolvedValue({ id: 1, studentId: 'otheruser' });

      await request(authedApp)
        .post('/api/enrollments/1/steps/5/complete')
        .expect(403);
    });

    it('should return 403 when enrollment not found', async () => {
      mockStorage.getEnrollmentById.mockResolvedValue(null);

      await request(authedApp)
        .post('/api/enrollments/999/steps/5/complete')
        .expect(403);
    });
  });

  describe('DELETE /api/enrollments/:enrollmentId/steps/:stepId/complete', () => {
    it('should mark step as incomplete', async () => {
      mockStorage.getEnrollmentById.mockResolvedValue({ id: 1, studentId: 'testuser' });

      const res = await request(authedApp)
        .delete('/api/enrollments/1/steps/5/complete')
        .expect(200);

      expect(mockStorage.markStepIncomplete).toHaveBeenCalledWith(1, 5);
      expect(res.body.success).toBe(true);
    });

    it('should return 403 when not enrollment owner', async () => {
      mockStorage.getEnrollmentById.mockResolvedValue({ id: 1, studentId: 'otheruser' });

      await request(authedApp)
        .delete('/api/enrollments/1/steps/5/complete')
        .expect(403);
    });
  });

  describe('GET /api/enrollments/:enrollmentId/completed-steps', () => {
    it('should return completed step IDs', async () => {
      mockStorage.getEnrollmentById.mockResolvedValue({ id: 1, studentId: 'testuser' });
      mockStorage.getCompletedSteps.mockResolvedValue([1, 3, 5]);

      const res = await request(authedApp)
        .get('/api/enrollments/1/completed-steps')
        .expect(200);

      expect(res.body).toEqual([1, 3, 5]);
    });

    it('should return 403 when not enrollment owner', async () => {
      mockStorage.getEnrollmentById.mockResolvedValue({ id: 1, studentId: 'otheruser' });

      await request(authedApp)
        .get('/api/enrollments/1/completed-steps')
        .expect(403);
    });
  });
});
