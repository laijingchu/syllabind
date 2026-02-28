import request from 'supertest';
import express from 'express';
import { createServer } from 'http';
import { registerRoutes } from '../routes';
import { storage } from '../storage';
import { resetAllMocks, mockUser, mockAdmin, mockCurator, mockProUser, mockProCurator } from './setup/mocks';

// Cast storage to jest mocks for type convenience
const mockStorage = storage as unknown as Record<string, jest.Mock>;

describe('Routes Integration (real registerRoutes)', () => {
  let app: express.Express;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    const httpServer = createServer(app);
    await registerRoutes(httpServer, app);
  });

  beforeEach(() => {
    resetAllMocks();
  });

  // Helper: create a new app instance with an authenticated user injected
  async function createAuthedApp(user: any) {
    const a = express();
    a.use(express.json());
    a.use((req, _res, next) => {
      (req as any).user = user;
      next();
    });
    const s = createServer(a);
    await registerRoutes(s, a);
    return a;
  }

  // ========== USER ROUTES ==========

  describe('GET /api/users/:username', () => {
    it('returns 404 when user not found', async () => {
      mockStorage.getUserByUsername.mockResolvedValue(null);
      const res = await request(app).get('/api/users/nobody');
      expect(res.status).toBe(404);
    });

    it('returns limited profile when shareProfile is false', async () => {
      mockStorage.getUserByUsername.mockResolvedValue({
        ...mockUser, password: 'hashed', shareProfile: false
      });
      const res = await request(app).get('/api/users/testuser');
      expect(res.status).toBe(200);
      expect(res.body.username).toBe('testuser');
      expect(res.body.email).toBeUndefined();
      expect(res.body.bio).toBeUndefined();
    });

    it('returns full profile when shareProfile is true', async () => {
      mockStorage.getUserByUsername.mockResolvedValue({
        ...mockCurator, password: 'hashed', shareProfile: true
      });
      const res = await request(app).get('/api/users/testcurator');
      expect(res.status).toBe(200);
      expect(res.body.bio).toBe('Test curator bio');
      expect(res.body.password).toBeUndefined();
      expect(res.body.email).toBeUndefined();
    });
  });

  describe('PUT /api/users/me', () => {
    it('returns 401 when not authenticated', async () => {
      const res = await request(app).put('/api/users/me').send({ name: 'X' });
      expect(res.status).toBe(401);
    });

    it('updates allowed fields', async () => {
      const authed = await createAuthedApp(mockUser);
      mockStorage.getUser.mockResolvedValue(mockUser);
      mockStorage.updateUser.mockResolvedValue({ ...mockUser, name: 'New', password: 'h' });

      const res = await request(authed).put('/api/users/me').send({ name: 'New' });
      expect(res.status).toBe(200);
      expect(res.body.name).toBe('New');
      expect(res.body.password).toBeUndefined();
    });

    it('rejects blob avatar URLs', async () => {
      const authed = await createAuthedApp(mockUser);
      const res = await request(authed).put('/api/users/me').send({ avatarUrl: 'blob:http://x' });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/users/me/toggle-curator', () => {
    it('returns 401 when not authenticated', async () => {
      const res = await request(app).post('/api/users/me/toggle-curator');
      expect(res.status).toBe(401);
    });

    it('toggles curator flag', async () => {
      const authed = await createAuthedApp(mockUser);
      mockStorage.getUser.mockResolvedValue({ ...mockUser, password: 'h', isCurator: false });
      mockStorage.updateUser.mockResolvedValue({ ...mockUser, isCurator: true, password: 'h' });

      const res = await request(authed).post('/api/users/me/toggle-curator');
      expect(res.status).toBe(200);
      expect(res.body.isCurator).toBe(true);
    });

    it('returns 404 if user not found', async () => {
      const authed = await createAuthedApp(mockUser);
      mockStorage.getUser.mockResolvedValue(null);
      const res = await request(authed).post('/api/users/me/toggle-curator');
      expect(res.status).toBe(404);
    });
  });

  // ========== BINDER ROUTES ==========

  describe('GET /api/binders', () => {
    it('returns all published binders', async () => {
      const binders = [{ id: 1, title: 'Test' }];
      mockStorage.listBinders.mockResolvedValue(binders);
      const res = await request(app).get('/api/binders');
      expect(res.status).toBe(200);
      expect(res.body).toEqual(binders);
    });
  });

  describe('GET /api/binders/:id', () => {
    it('returns binder with content', async () => {
      const data = { id: 1, title: 'Test', weeks: [] };
      mockStorage.getBinderWithContent.mockResolvedValue(data);
      const res = await request(app).get('/api/binders/1');
      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Test');
    });

    it('returns 404 when not found', async () => {
      mockStorage.getBinderWithContent.mockResolvedValue(null);
      const res = await request(app).get('/api/binders/999');
      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/binders/:id', () => {
    it('returns 401 when not authenticated', async () => {
      const res = await request(app).put('/api/binders/1').send({ title: 'X' });
      expect(res.status).toBe(401);
    });

    it('returns 403 when non-curator edits', async () => {
      const authed = await createAuthedApp(mockUser);
      mockStorage.getBinder.mockResolvedValue({ id: 1, curatorId: 'other' });
      const res = await request(authed).put('/api/binders/1').send({ title: 'X' });
      expect(res.status).toBe(403);
    });

    it('updates binder when authorized', async () => {
      const authed = await createAuthedApp(mockCurator);
      mockStorage.getBinder.mockResolvedValue({ id: 1, curatorId: mockCurator.username });
      mockStorage.updateBinder.mockResolvedValue({ id: 1, title: 'Updated' });
      const res = await request(authed).put('/api/binders/1').send({ title: 'Updated' });
      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Updated');
    });

    it('returns 404 when binder not found', async () => {
      const authed = await createAuthedApp(mockCurator);
      mockStorage.getBinder.mockResolvedValue(null);
      const res = await request(authed).put('/api/binders/1').send({ title: 'X' });
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/binders/:id', () => {
    it('returns 401 when not authenticated', async () => {
      const res = await request(app).delete('/api/binders/1');
      expect(res.status).toBe(401);
    });

    it('deletes when authorized', async () => {
      const authed = await createAuthedApp(mockCurator);
      mockStorage.getBinder.mockResolvedValue({ id: 1, curatorId: mockCurator.username });
      mockStorage.deleteBinder.mockResolvedValue(undefined);
      const res = await request(authed).delete('/api/binders/1');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('returns 403 when not owner', async () => {
      const authed = await createAuthedApp(mockUser);
      mockStorage.getBinder.mockResolvedValue({ id: 1, curatorId: 'other' });
      const res = await request(authed).delete('/api/binders/1');
      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/binders/batch-delete', () => {
    it('returns 400 for empty ids', async () => {
      const authed = await createAuthedApp(mockCurator);
      const res = await request(authed).post('/api/binders/batch-delete').send({ ids: [] });
      expect(res.status).toBe(400);
    });

    it('deletes owned binders', async () => {
      const authed = await createAuthedApp(mockCurator);
      mockStorage.getBinder.mockResolvedValue({ id: 1, curatorId: mockCurator.username });
      mockStorage.batchDeleteBinders.mockResolvedValue(undefined);
      const res = await request(authed).post('/api/binders/batch-delete').send({ ids: [1] });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('returns 403 if any binder not owned', async () => {
      const authed = await createAuthedApp(mockCurator);
      mockStorage.getBinder
        .mockResolvedValueOnce({ id: 1, curatorId: mockCurator.username })
        .mockResolvedValueOnce({ id: 2, curatorId: 'other' });
      const res = await request(authed).post('/api/binders/batch-delete').send({ ids: [1, 2] });
      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/binders', () => {
    it('returns 401 when not authenticated', async () => {
      const res = await request(app).post('/api/binders').send({});
      expect(res.status).toBe(401);
    });

    it('returns 403 when user is not curator', async () => {
      const authed = await createAuthedApp({ ...mockUser, isCurator: false });
      const res = await request(authed).post('/api/binders').send({
        title: 'X', description: 'Y', audienceLevel: 'Beginner', durationWeeks: 4
      });
      expect(res.status).toBe(403);
    });

    it('creates binder when authorized curator', async () => {
      const authed = await createAuthedApp(mockCurator);
      const binderData = { title: 'New', description: 'Desc', audienceLevel: 'Beginner', durationWeeks: 4, status: 'draft' };
      mockStorage.createBinder.mockResolvedValue({ id: 1, ...binderData });
      const res = await request(authed).post('/api/binders').send(binderData);
      expect(res.status).toBe(200);
      expect(res.body.title).toBe('New');
    });
  });

  describe('GET /api/curator/binders', () => {
    it('returns 401 when not authenticated', async () => {
      const res = await request(app).get('/api/curator/binders');
      expect(res.status).toBe(401);
    });

    it('returns 403 when not a curator', async () => {
      const authed = await createAuthedApp({ ...mockUser, isCurator: false });
      const res = await request(authed).get('/api/curator/binders');
      expect(res.status).toBe(403);
    });

    it('returns binders for curator', async () => {
      const authed = await createAuthedApp(mockCurator);
      const binders = [{ id: 1, title: 'Mine' }];
      mockStorage.getBindersByCurator.mockResolvedValue(binders);
      const res = await request(authed).get('/api/curator/binders');
      expect(res.status).toBe(200);
      expect(res.body).toEqual(binders);
    });
  });

  describe('GET /api/binders/:id/readers', () => {
    it('returns readers for owned binder', async () => {
      const authed = await createAuthedApp(mockCurator);
      mockStorage.getBinder.mockResolvedValue({ id: 1, curatorId: mockCurator.username });
      mockStorage.getReadersByBinderId.mockResolvedValue([{ user: mockUser }]);
      const res = await request(authed).get('/api/binders/1/readers');
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
    });

    it('returns 403 for non-owner', async () => {
      const authed = await createAuthedApp(mockUser);
      mockStorage.getBinder.mockResolvedValue({ id: 1, curatorId: 'other' });
      const res = await request(authed).get('/api/binders/1/readers');
      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/binders/:id/classmates', () => {
    it('returns classmates (public route)', async () => {
      mockStorage.getClassmatesByBinderId.mockResolvedValue({ classmates: [], totalEnrolled: 5 });
      const res = await request(app).get('/api/binders/1/classmates');
      expect(res.status).toBe(200);
      expect(res.body.totalEnrolled).toBe(5);
    });
  });

  describe('POST /api/binders/:id/publish', () => {
    it('toggles publish status', async () => {
      const authed = await createAuthedApp(mockCurator);
      mockStorage.getBinder.mockResolvedValue({ id: 1, curatorId: mockCurator.username, status: 'draft' });
      mockStorage.updateBinder.mockResolvedValue({ id: 1, status: 'published' });
      const res = await request(authed).post('/api/binders/1/publish');
      expect(res.status).toBe(200);
      expect(mockStorage.updateBinder).toHaveBeenCalledWith(1, { status: 'published', visibility: 'public' });
    });

    it('unpublishes when already published', async () => {
      const authed = await createAuthedApp(mockCurator);
      mockStorage.getBinder.mockResolvedValue({ id: 1, curatorId: mockCurator.username, status: 'published' });
      mockStorage.updateBinder.mockResolvedValue({ id: 1, status: 'draft' });
      const res = await request(authed).post('/api/binders/1/publish');
      expect(res.status).toBe(200);
      expect(mockStorage.updateBinder).toHaveBeenCalledWith(1, { status: 'draft', visibility: 'public' });
    });
  });

  // ========== ENROLLMENT ROUTES ==========

  describe('GET /api/enrollments', () => {
    it('returns 401 when not authenticated', async () => {
      const res = await request(app).get('/api/enrollments');
      expect(res.status).toBe(401);
    });

    it('returns user enrollments', async () => {
      const authed = await createAuthedApp(mockUser);
      const enrollments = [{ id: 1, binderId: 1, status: 'in-progress' }];
      mockStorage.getUserEnrollments.mockResolvedValue(enrollments);
      const res = await request(authed).get('/api/enrollments');
      expect(res.status).toBe(200);
      expect(res.body).toEqual(enrollments);
    });
  });

  describe('POST /api/enrollments', () => {
    it('creates a new enrollment (Pro user)', async () => {
      const authed = await createAuthedApp(mockProUser);
      mockStorage.getEnrollment.mockResolvedValue(null);
      mockStorage.dropActiveEnrollments.mockResolvedValue(undefined);
      mockStorage.createEnrollment.mockResolvedValue({ id: 1, binderId: 1, status: 'in-progress' });
      const res = await request(authed).post('/api/enrollments').send({
        binderId: 1, status: 'in-progress', shareProfile: false
      });
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(1);
    });

    it('returns 403 for free user (subscription required)', async () => {
      const authed = await createAuthedApp(mockUser);
      const res = await request(authed).post('/api/enrollments').send({
        binderId: 1, status: 'in-progress'
      });
      expect(res.status).toBe(403);
      expect(res.body.error).toBe('SUBSCRIPTION_REQUIRED');
    });

    it('returns 409 for already-enrolled pro user', async () => {
      const authed = await createAuthedApp(mockProUser);
      mockStorage.getEnrollment.mockResolvedValue({ id: 1, status: 'in-progress' });
      const res = await request(authed).post('/api/enrollments').send({
        binderId: 1, status: 'in-progress'
      });
      expect(res.status).toBe(409);
    });

    it('reactivates a dropped enrollment (Pro user)', async () => {
      const authed = await createAuthedApp(mockProUser);
      mockStorage.getEnrollment.mockResolvedValue({ id: 1, status: 'dropped' });
      mockStorage.dropActiveEnrollments.mockResolvedValue(undefined);
      mockStorage.updateEnrollment.mockResolvedValue({ id: 1, status: 'in-progress' });
      const res = await request(authed).post('/api/enrollments').send({
        binderId: 1, status: 'in-progress'
      });
      expect(res.status).toBe(200);
    });
  });

  describe('PUT /api/enrollments/:id', () => {
    it('updates enrollment when authorized', async () => {
      const authed = await createAuthedApp(mockUser);
      mockStorage.getEnrollmentById.mockResolvedValue({ id: 1, readerId: mockUser.username });
      mockStorage.updateEnrollment.mockResolvedValue({ id: 1, currentWeekIndex: 2 });
      const res = await request(authed).put('/api/enrollments/1').send({ currentWeekIndex: 2 });
      expect(res.status).toBe(200);
    });

    it('returns 403 when not the reader', async () => {
      const authed = await createAuthedApp(mockUser);
      mockStorage.getEnrollmentById.mockResolvedValue({ id: 1, readerId: 'other' });
      const res = await request(authed).put('/api/enrollments/1').send({ currentWeekIndex: 2 });
      expect(res.status).toBe(403);
    });

    it('returns 404 when enrollment not found', async () => {
      const authed = await createAuthedApp(mockUser);
      mockStorage.getEnrollmentById.mockResolvedValue(null);
      const res = await request(authed).put('/api/enrollments/999').send({});
      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /api/enrollments/:id/share-profile', () => {
    it('toggles shareProfile', async () => {
      const authed = await createAuthedApp(mockUser);
      mockStorage.getEnrollmentById.mockResolvedValue({ id: 1, readerId: mockUser.username });
      mockStorage.updateEnrollmentShareProfile.mockResolvedValue({ id: 1, shareProfile: true });
      const res = await request(authed)
        .patch('/api/enrollments/1/share-profile')
        .send({ shareProfile: true });
      expect(res.status).toBe(200);
    });

    it('returns 400 for non-boolean shareProfile', async () => {
      const authed = await createAuthedApp(mockUser);
      mockStorage.getEnrollmentById.mockResolvedValue({ id: 1, readerId: mockUser.username });
      const res = await request(authed)
        .patch('/api/enrollments/1/share-profile')
        .send({ shareProfile: 'yes' });
      expect(res.status).toBe(400);
    });
  });

  // ========== SUBMISSION ROUTES ==========

  describe('POST /api/submissions', () => {
    it('creates submission', async () => {
      const authed = await createAuthedApp(mockUser);
      const submissionData = { enrollmentId: 1, stepId: 1, answer: 'My answer', isShared: false };
      mockStorage.createSubmission.mockResolvedValue({ id: 1, ...submissionData });
      const res = await request(authed).post('/api/submissions').send(submissionData);
      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/enrollments/:id/submissions', () => {
    it('returns submissions for enrollment', async () => {
      const authed = await createAuthedApp(mockUser);
      mockStorage.getSubmissionsByEnrollmentId.mockResolvedValue([{ id: 1, answer: 'A' }]);
      const res = await request(authed).get('/api/enrollments/1/submissions');
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
    });
  });

  describe('PUT /api/submissions/:id/feedback', () => {
    it('adds feedback when curator owns binder', async () => {
      const authed = await createAuthedApp(mockCurator);
      mockStorage.getSubmission.mockResolvedValue({ id: 1, enrollmentId: 1 });
      mockStorage.getEnrollmentById.mockResolvedValue({ id: 1, binderId: 1 });
      mockStorage.getBinder.mockResolvedValue({ id: 1, curatorId: mockCurator.username });
      mockStorage.updateSubmissionFeedback.mockResolvedValue({ id: 1, feedback: 'Good' });
      const res = await request(authed)
        .put('/api/submissions/1/feedback')
        .send({ feedback: 'Good', grade: 'A' });
      expect(res.status).toBe(200);
    });

    it('returns 404 when submission not found', async () => {
      const authed = await createAuthedApp(mockCurator);
      mockStorage.getSubmission.mockResolvedValue(null);
      const res = await request(authed)
        .put('/api/submissions/999/feedback')
        .send({ feedback: 'X' });
      expect(res.status).toBe(404);
    });

    it('returns 403 when not binder owner', async () => {
      const authed = await createAuthedApp(mockCurator);
      mockStorage.getSubmission.mockResolvedValue({ id: 1, enrollmentId: 1 });
      mockStorage.getEnrollmentById.mockResolvedValue({ id: 1, binderId: 1 });
      mockStorage.getBinder.mockResolvedValue({ id: 1, curatorId: 'other' });
      const res = await request(authed)
        .put('/api/submissions/1/feedback')
        .send({ feedback: 'X' });
      expect(res.status).toBe(403);
    });
  });

  // ========== DELETE STEP ==========

  describe('DELETE /api/steps/:id', () => {
    it('deletes step when authorized', async () => {
      const authed = await createAuthedApp(mockCurator);
      mockStorage.getStep.mockResolvedValue({ id: 1, weekId: 10 });
      mockStorage.getWeek.mockResolvedValue({ id: 10, binderId: 1 });
      mockStorage.getBinder.mockResolvedValue({ id: 1, curatorId: mockCurator.username });
      mockStorage.deleteStep.mockResolvedValue(undefined);
      const res = await request(authed).delete('/api/steps/1');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('returns 404 when step not found', async () => {
      const authed = await createAuthedApp(mockCurator);
      mockStorage.getStep.mockResolvedValue(null);
      const res = await request(authed).delete('/api/steps/999');
      expect(res.status).toBe(404);
    });

    it('returns 403 when not owner', async () => {
      const authed = await createAuthedApp(mockCurator);
      mockStorage.getStep.mockResolvedValue({ id: 1, weekId: 10 });
      mockStorage.getWeek.mockResolvedValue({ id: 10, binderId: 1 });
      mockStorage.getBinder.mockResolvedValue({ id: 1, curatorId: 'other' });
      const res = await request(authed).delete('/api/steps/1');
      expect(res.status).toBe(403);
    });
  });

  // ========== COMPLETION TRACKING ==========

  describe('POST /api/enrollments/:enrollmentId/steps/:stepId/complete', () => {
    it('marks step complete', async () => {
      const authed = await createAuthedApp(mockUser);
      mockStorage.getEnrollmentById.mockResolvedValue({ id: 1, readerId: mockUser.username });
      mockStorage.markStepCompleted.mockResolvedValue({ enrollmentId: 1, stepId: 5 });
      const res = await request(authed).post('/api/enrollments/1/steps/5/complete');
      expect(res.status).toBe(200);
    });

    it('returns 403 when not authorized', async () => {
      const authed = await createAuthedApp(mockUser);
      mockStorage.getEnrollmentById.mockResolvedValue({ id: 1, readerId: 'other' });
      const res = await request(authed).post('/api/enrollments/1/steps/5/complete');
      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /api/enrollments/:enrollmentId/steps/:stepId/complete', () => {
    it('marks step incomplete', async () => {
      const authed = await createAuthedApp(mockUser);
      mockStorage.getEnrollmentById.mockResolvedValue({ id: 1, readerId: mockUser.username });
      mockStorage.markStepIncomplete.mockResolvedValue(undefined);
      const res = await request(authed).delete('/api/enrollments/1/steps/5/complete');
      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/enrollments/:enrollmentId/completed-steps', () => {
    it('returns completed step IDs', async () => {
      const authed = await createAuthedApp(mockUser);
      mockStorage.getEnrollmentById.mockResolvedValue({ id: 1, readerId: mockUser.username });
      mockStorage.getCompletedSteps.mockResolvedValue([1, 2, 3]);
      const res = await request(authed).get('/api/enrollments/1/completed-steps');
      expect(res.status).toBe(200);
      expect(res.body).toEqual([1, 2, 3]);
    });

    it('returns 403 when not authorized', async () => {
      const authed = await createAuthedApp(mockUser);
      mockStorage.getEnrollmentById.mockResolvedValue({ id: 1, readerId: 'other' });
      const res = await request(authed).get('/api/enrollments/1/completed-steps');
      expect(res.status).toBe(403);
    });
  });

  // ========== ANALYTICS ==========

  describe('GET /api/binders/:id/analytics', () => {
    it('returns analytics for curator', async () => {
      const authed = await createAuthedApp(mockCurator);
      mockStorage.getBinder.mockResolvedValue({ id: 1, curatorId: mockCurator.username });
      mockStorage.getBinderAnalytics.mockResolvedValue({ readersStarted: 5 });
      const res = await request(authed).get('/api/binders/1/analytics');
      expect(res.status).toBe(200);
      expect(res.body.readersStarted).toBe(5);
    });

    it('returns 403 for non-curator', async () => {
      const authed = await createAuthedApp(mockUser);
      mockStorage.getBinder.mockResolvedValue({ id: 1, curatorId: 'other' });
      const res = await request(authed).get('/api/binders/1/analytics');
      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/binders/:id/analytics/completion-rates', () => {
    it('returns completion rates for curator', async () => {
      const authed = await createAuthedApp(mockCurator);
      mockStorage.getBinder.mockResolvedValue({ id: 1, curatorId: mockCurator.username });
      mockStorage.getStepCompletionRates.mockResolvedValue([{ stepId: 1, completionRate: 50 }]);
      const res = await request(authed).get('/api/binders/1/analytics/completion-rates');
      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/binders/:id/analytics/completion-times', () => {
    it('returns completion times for curator', async () => {
      const authed = await createAuthedApp(mockCurator);
      mockStorage.getBinder.mockResolvedValue({ id: 1, curatorId: mockCurator.username });
      mockStorage.getAverageCompletionTimes.mockResolvedValue([{ stepId: 1, avgMinutes: 30 }]);
      const res = await request(authed).get('/api/binders/1/analytics/completion-times');
      expect(res.status).toBe(200);
    });
  });

  // ========== AI GENERATION ==========

  describe('POST /api/generate-binder', () => {
    it('returns 403 when not curator', async () => {
      const authed = await createAuthedApp({ ...mockUser, isCurator: false });
      const res = await request(authed).post('/api/generate-binder').send({ binderId: 1 });
      expect(res.status).toBe(403);
    });

    it('returns 400 when binderId missing', async () => {
      const authed = await createAuthedApp(mockCurator);
      const res = await request(authed).post('/api/generate-binder').send({});
      expect(res.status).toBe(400);
    });

    it('returns 400 when basics not complete', async () => {
      const authed = await createAuthedApp(mockCurator);
      mockStorage.getBinder.mockResolvedValue({
        id: 1, curatorId: mockCurator.username, title: 'T', description: null
      });
      const res = await request(authed).post('/api/generate-binder').send({ binderId: 1 });
      expect(res.status).toBe(400);
    });

    it('returns websocket URL when valid', async () => {
      const authed = await createAuthedApp(mockCurator);
      mockStorage.getBinder.mockResolvedValue({
        id: 1, curatorId: mockCurator.username,
        title: 'T', description: 'D', audienceLevel: 'Beginner', durationWeeks: 4
      });
      mockStorage.getGenerationInfo.mockResolvedValue({ generationCount: 0, lastGeneratedAt: null });
      mockStorage.updateBinder.mockResolvedValue(undefined);
      const res = await request(authed).post('/api/generate-binder').send({ binderId: 1 });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.websocketUrl).toContain('/ws/generate-binder');
    });

    it('returns 403 when non-Pro user generates binder with > 4 weeks', async () => {
      const authed = await createAuthedApp(mockCurator);
      mockStorage.getBinder.mockResolvedValue({
        id: 1, curatorId: mockCurator.username,
        title: 'T', description: 'D', audienceLevel: 'Beginner', durationWeeks: 6
      });
      const res = await request(authed).post('/api/generate-binder').send({ binderId: 1 });
      expect(res.status).toBe(403);
      expect(res.body.error).toBe('Pro subscription required for binders longer than 4 weeks');
    });

    it('returns 409 when generation already in progress', async () => {
      const authed = await createAuthedApp(mockCurator);
      mockStorage.getBinder.mockResolvedValue({
        id: 1, curatorId: mockCurator.username,
        title: 'T', description: 'D', audienceLevel: 'Beginner', durationWeeks: 4,
        status: 'generating'
      });
      mockStorage.getGenerationInfo.mockResolvedValue({ generationCount: 0, lastGeneratedAt: null });
      const res = await request(authed).post('/api/generate-binder').send({ binderId: 1 });
      expect(res.status).toBe(409);
      expect(res.body.error).toBe('Generation already in progress');
    });
  });

  describe('POST /api/regenerate-week', () => {
    it('returns 403 for non-Pro curator', async () => {
      const authed = await createAuthedApp(mockCurator);
      const res = await request(authed).post('/api/regenerate-week').send({ binderId: 1, weekIndex: 1 });
      expect(res.status).toBe(403);
      expect(res.body.error).toBe('Pro subscription required for week regeneration');
    });

    it('returns 400 for invalid weekIndex', async () => {
      const authed = await createAuthedApp(mockProCurator);
      const res = await request(authed).post('/api/regenerate-week').send({ binderId: 1, weekIndex: 0 });
      expect(res.status).toBe(400);
    });

    it('returns websocket URL for valid request', async () => {
      const authed = await createAuthedApp(mockProCurator);
      mockStorage.getBinder.mockResolvedValue({
        id: 1, curatorId: mockProCurator.username, durationWeeks: 4
      });
      const res = await request(authed).post('/api/regenerate-week').send({ binderId: 1, weekIndex: 2 });
      expect(res.status).toBe(200);
      expect(res.body.websocketUrl).toContain('/ws/regenerate-week');
    });

    it('returns 400 when weekIndex exceeds duration', async () => {
      const authed = await createAuthedApp(mockProCurator);
      mockStorage.getBinder.mockResolvedValue({
        id: 1, curatorId: mockProCurator.username, durationWeeks: 2
      });
      const res = await request(authed).post('/api/regenerate-week').send({ binderId: 1, weekIndex: 5 });
      expect(res.status).toBe(400);
    });
  });


  // ========== UPLOAD ==========

  describe('POST /api/upload', () => {
    it('returns 401 when not authenticated', async () => {
      const res = await request(app).post('/api/upload');
      expect(res.status).toBe(401);
    });
  });

  // ========== DEMO BINDERS ==========

  describe('GET /api/demo-binders', () => {
    it('returns demo binders (public route)', async () => {
      mockStorage.getDemoBinders.mockResolvedValue([
        {
          id: 1, title: 'Demo', description: 'A demo binder', audienceLevel: 'Beginner',
          durationWeeks: 2, status: 'published', visibility: 'public', curatorId: 'admin',
          isDemo: true, createdAt: new Date(), updatedAt: new Date(),
          weeks: [{ id: 1, binderId: 1, index: 1, title: 'W1', description: 'D1', steps: [] }]
        }
      ]);
      const res = await request(app).get('/api/demo-binders');
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].title).toBe('Demo');
    });

    it('returns empty array when no demo binders', async () => {
      mockStorage.getDemoBinders.mockResolvedValue([]);
      const res = await request(app).get('/api/demo-binders');
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });
  });

  // ========== GENERATION INFO ==========

  describe('GET /api/generation-info', () => {
    it('returns 401 when not authenticated', async () => {
      const res = await request(app).get('/api/generation-info');
      expect(res.status).toBe(401);
    });

    it('returns generation info for free user', async () => {
      const authed = await createAuthedApp(mockCurator);
      mockStorage.getGenerationInfo.mockResolvedValue({ generationCount: 1, lastGeneratedAt: null });
      const res = await request(authed).get('/api/generation-info');
      expect(res.status).toBe(200);
      expect(res.body.generationCount).toBe(1);
      expect(res.body.generationLimit).toBe(2);
      expect(res.body.remaining).toBe(1);
      expect(res.body.isPro).toBe(false);
    });

    it('returns unlimited for pro user', async () => {
      const authed = await createAuthedApp(mockProCurator);
      const res = await request(authed).get('/api/generation-info');
      expect(res.status).toBe(200);
      expect(res.body.isPro).toBe(true);
      expect(res.body.generationLimit).toBeNull();
    });
  });

  // ========== GENERATION GUARDS ==========

  describe('POST /api/generate-binder (generation limits)', () => {
    it('blocks free user who has used 2 generations', async () => {
      const authed = await createAuthedApp(mockCurator);
      mockStorage.getBinder.mockResolvedValue({
        id: 1, curatorId: mockCurator.username,
        title: 'T', description: 'D', audienceLevel: 'Beginner', durationWeeks: 4
      });
      mockStorage.getGenerationInfo.mockResolvedValue({ generationCount: 2, lastGeneratedAt: null });
      const res = await request(authed).post('/api/generate-binder').send({ binderId: 1 });
      expect(res.status).toBe(403);
      expect(res.body.error).toBe('GENERATION_LIMIT_REACHED');
    });

    it('blocks free user within cooldown period', async () => {
      const authed = await createAuthedApp(mockCurator);
      mockStorage.getBinder.mockResolvedValue({
        id: 1, curatorId: mockCurator.username,
        title: 'T', description: 'D', audienceLevel: 'Beginner', durationWeeks: 4
      });
      mockStorage.getGenerationInfo.mockResolvedValue({
        generationCount: 1,
        lastGeneratedAt: new Date() // Just now = within cooldown
      });
      const res = await request(authed).post('/api/generate-binder').send({ binderId: 1 });
      expect(res.status).toBe(429);
      expect(res.body.error).toBe('GENERATION_COOLDOWN');
    });

    it('rejects binder with > 6 weeks (hard cap)', async () => {
      const authed = await createAuthedApp(mockProCurator);
      mockStorage.getBinder.mockResolvedValue({
        id: 1, curatorId: mockProCurator.username,
        title: 'T', description: 'D', audienceLevel: 'Beginner', durationWeeks: 8
      });
      const res = await request(authed).post('/api/generate-binder').send({ binderId: 1 });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Maximum binder duration is 6 weeks');
    });
  });

  // ========== IS_DEMO TOGGLE ==========

  describe('PUT /api/binders/:id (isDemo)', () => {
    it('allows admin to set isDemo', async () => {
      const authed = await createAuthedApp({ ...mockAdmin, isCurator: true });
      mockStorage.getBinder.mockResolvedValue({ id: 1, curatorId: mockAdmin.username });
      mockStorage.updateBinder.mockResolvedValue({ id: 1, isDemo: true });
      const res = await request(authed).put('/api/binders/1').send({ isDemo: true });
      expect(res.status).toBe(200);
      // Admin's isDemo should pass through to updateBinder
      expect(mockStorage.updateBinder).toHaveBeenCalledWith(1, expect.objectContaining({ isDemo: true }));
    });

    it('strips isDemo from non-admin updates', async () => {
      const authed = await createAuthedApp(mockCurator);
      mockStorage.getBinder.mockResolvedValue({ id: 1, curatorId: mockCurator.username });
      mockStorage.updateBinder.mockResolvedValue({ id: 1, title: 'X' });
      const res = await request(authed).put('/api/binders/1').send({ title: 'X', isDemo: true });
      expect(res.status).toBe(200);
      // Non-admin's isDemo should be stripped
      expect(mockStorage.updateBinder).toHaveBeenCalledWith(1, expect.not.objectContaining({ isDemo: true }));
    });
  });
});
