import request from 'supertest';
import express from 'express';
import { createServer } from 'http';
import { registerRoutes } from '../routes';
import { storage } from '../storage';
import { resetAllMocks, mockUser, mockCreator, mockProUser } from './setup/mocks';

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
        ...mockCreator, password: 'hashed', shareProfile: true
      });
      const res = await request(app).get('/api/users/testcreator');
      expect(res.status).toBe(200);
      expect(res.body.bio).toBe('Test creator bio');
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

  describe('POST /api/users/me/toggle-creator', () => {
    it('returns 401 when not authenticated', async () => {
      const res = await request(app).post('/api/users/me/toggle-creator');
      expect(res.status).toBe(401);
    });

    it('toggles creator flag', async () => {
      const authed = await createAuthedApp(mockUser);
      mockStorage.getUser.mockResolvedValue({ ...mockUser, password: 'h', isCreator: false });
      mockStorage.updateUser.mockResolvedValue({ ...mockUser, isCreator: true, password: 'h' });

      const res = await request(authed).post('/api/users/me/toggle-creator');
      expect(res.status).toBe(200);
      expect(res.body.isCreator).toBe(true);
    });

    it('returns 404 if user not found', async () => {
      const authed = await createAuthedApp(mockUser);
      mockStorage.getUser.mockResolvedValue(null);
      const res = await request(authed).post('/api/users/me/toggle-creator');
      expect(res.status).toBe(404);
    });
  });

  // ========== SYLLABUS ROUTES ==========

  describe('GET /api/syllabinds', () => {
    it('returns all published syllabinds', async () => {
      const syllabinds = [{ id: 1, title: 'Test' }];
      mockStorage.listSyllabinds.mockResolvedValue(syllabinds);
      const res = await request(app).get('/api/syllabinds');
      expect(res.status).toBe(200);
      expect(res.body).toEqual(syllabinds);
    });
  });

  describe('GET /api/syllabinds/:id', () => {
    it('returns syllabus with content', async () => {
      const data = { id: 1, title: 'Test', weeks: [] };
      mockStorage.getSyllabusWithContent.mockResolvedValue(data);
      const res = await request(app).get('/api/syllabinds/1');
      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Test');
    });

    it('returns 404 when not found', async () => {
      mockStorage.getSyllabusWithContent.mockResolvedValue(null);
      const res = await request(app).get('/api/syllabinds/999');
      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/syllabinds/:id', () => {
    it('returns 401 when not authenticated', async () => {
      const res = await request(app).put('/api/syllabinds/1').send({ title: 'X' });
      expect(res.status).toBe(401);
    });

    it('returns 403 when non-creator edits', async () => {
      const authed = await createAuthedApp(mockUser);
      mockStorage.getSyllabus.mockResolvedValue({ id: 1, creatorId: 'other' });
      const res = await request(authed).put('/api/syllabinds/1').send({ title: 'X' });
      expect(res.status).toBe(403);
    });

    it('updates syllabus when authorized', async () => {
      const authed = await createAuthedApp(mockCreator);
      mockStorage.getSyllabus.mockResolvedValue({ id: 1, creatorId: mockCreator.username });
      mockStorage.updateSyllabus.mockResolvedValue({ id: 1, title: 'Updated' });
      const res = await request(authed).put('/api/syllabinds/1').send({ title: 'Updated' });
      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Updated');
    });

    it('returns 404 when syllabus not found', async () => {
      const authed = await createAuthedApp(mockCreator);
      mockStorage.getSyllabus.mockResolvedValue(null);
      const res = await request(authed).put('/api/syllabinds/1').send({ title: 'X' });
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/syllabinds/:id', () => {
    it('returns 401 when not authenticated', async () => {
      const res = await request(app).delete('/api/syllabinds/1');
      expect(res.status).toBe(401);
    });

    it('deletes when authorized', async () => {
      const authed = await createAuthedApp(mockCreator);
      mockStorage.getSyllabus.mockResolvedValue({ id: 1, creatorId: mockCreator.username });
      mockStorage.deleteSyllabus.mockResolvedValue(undefined);
      const res = await request(authed).delete('/api/syllabinds/1');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('returns 403 when not owner', async () => {
      const authed = await createAuthedApp(mockUser);
      mockStorage.getSyllabus.mockResolvedValue({ id: 1, creatorId: 'other' });
      const res = await request(authed).delete('/api/syllabinds/1');
      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/syllabinds/batch-delete', () => {
    it('returns 400 for empty ids', async () => {
      const authed = await createAuthedApp(mockCreator);
      const res = await request(authed).post('/api/syllabinds/batch-delete').send({ ids: [] });
      expect(res.status).toBe(400);
    });

    it('deletes owned syllabinds', async () => {
      const authed = await createAuthedApp(mockCreator);
      mockStorage.getSyllabus.mockResolvedValue({ id: 1, creatorId: mockCreator.username });
      mockStorage.batchDeleteSyllabinds.mockResolvedValue(undefined);
      const res = await request(authed).post('/api/syllabinds/batch-delete').send({ ids: [1] });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('returns 403 if any syllabus not owned', async () => {
      const authed = await createAuthedApp(mockCreator);
      mockStorage.getSyllabus
        .mockResolvedValueOnce({ id: 1, creatorId: mockCreator.username })
        .mockResolvedValueOnce({ id: 2, creatorId: 'other' });
      const res = await request(authed).post('/api/syllabinds/batch-delete').send({ ids: [1, 2] });
      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/syllabinds', () => {
    it('returns 401 when not authenticated', async () => {
      const res = await request(app).post('/api/syllabinds').send({});
      expect(res.status).toBe(401);
    });

    it('returns 403 when user is not creator', async () => {
      const authed = await createAuthedApp({ ...mockUser, isCreator: false });
      const res = await request(authed).post('/api/syllabinds').send({
        title: 'X', description: 'Y', audienceLevel: 'Beginner', durationWeeks: 4
      });
      expect(res.status).toBe(403);
    });

    it('creates syllabus when authorized creator', async () => {
      const authed = await createAuthedApp(mockCreator);
      const syllabusData = { title: 'New', description: 'Desc', audienceLevel: 'Beginner', durationWeeks: 4, status: 'draft' };
      mockStorage.createSyllabus.mockResolvedValue({ id: 1, ...syllabusData });
      const res = await request(authed).post('/api/syllabinds').send(syllabusData);
      expect(res.status).toBe(200);
      expect(res.body.title).toBe('New');
    });
  });

  describe('GET /api/creator/syllabinds', () => {
    it('returns 401 when not authenticated', async () => {
      const res = await request(app).get('/api/creator/syllabinds');
      expect(res.status).toBe(401);
    });

    it('returns 403 when not a creator', async () => {
      const authed = await createAuthedApp({ ...mockUser, isCreator: false });
      const res = await request(authed).get('/api/creator/syllabinds');
      expect(res.status).toBe(403);
    });

    it('returns syllabinds for creator', async () => {
      const authed = await createAuthedApp(mockCreator);
      const syllabinds = [{ id: 1, title: 'Mine' }];
      mockStorage.getSyllabindsByCreator.mockResolvedValue(syllabinds);
      const res = await request(authed).get('/api/creator/syllabinds');
      expect(res.status).toBe(200);
      expect(res.body).toEqual(syllabinds);
    });
  });

  describe('GET /api/syllabinds/:id/learners', () => {
    it('returns learners for owned syllabus', async () => {
      const authed = await createAuthedApp(mockCreator);
      mockStorage.getSyllabus.mockResolvedValue({ id: 1, creatorId: mockCreator.username });
      mockStorage.getLearnersBySyllabusId.mockResolvedValue([{ user: mockUser }]);
      const res = await request(authed).get('/api/syllabinds/1/learners');
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
    });

    it('returns 403 for non-owner', async () => {
      const authed = await createAuthedApp(mockUser);
      mockStorage.getSyllabus.mockResolvedValue({ id: 1, creatorId: 'other' });
      const res = await request(authed).get('/api/syllabinds/1/learners');
      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/syllabinds/:id/classmates', () => {
    it('returns classmates (public route)', async () => {
      mockStorage.getClassmatesBySyllabusId.mockResolvedValue({ classmates: [], totalEnrolled: 5 });
      const res = await request(app).get('/api/syllabinds/1/classmates');
      expect(res.status).toBe(200);
      expect(res.body.totalEnrolled).toBe(5);
    });
  });

  describe('POST /api/syllabinds/:id/publish', () => {
    it('toggles publish status', async () => {
      const authed = await createAuthedApp(mockCreator);
      mockStorage.getSyllabus.mockResolvedValue({ id: 1, creatorId: mockCreator.username, status: 'draft' });
      mockStorage.updateSyllabus.mockResolvedValue({ id: 1, status: 'published' });
      const res = await request(authed).post('/api/syllabinds/1/publish');
      expect(res.status).toBe(200);
      expect(mockStorage.updateSyllabus).toHaveBeenCalledWith(1, { status: 'published' });
    });

    it('unpublishes when already published', async () => {
      const authed = await createAuthedApp(mockCreator);
      mockStorage.getSyllabus.mockResolvedValue({ id: 1, creatorId: mockCreator.username, status: 'published' });
      mockStorage.updateSyllabus.mockResolvedValue({ id: 1, status: 'draft' });
      const res = await request(authed).post('/api/syllabinds/1/publish');
      expect(res.status).toBe(200);
      expect(mockStorage.updateSyllabus).toHaveBeenCalledWith(1, { status: 'draft' });
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
      const enrollments = [{ id: 1, syllabusId: 1, status: 'in-progress' }];
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
      mockStorage.createEnrollment.mockResolvedValue({ id: 1, syllabusId: 1, status: 'in-progress' });
      const res = await request(authed).post('/api/enrollments').send({
        syllabusId: 1, status: 'in-progress', shareProfile: false
      });
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(1);
    });

    it('returns 403 for free user (subscription required)', async () => {
      const authed = await createAuthedApp(mockUser);
      const res = await request(authed).post('/api/enrollments').send({
        syllabusId: 1, status: 'in-progress'
      });
      expect(res.status).toBe(403);
      expect(res.body.error).toBe('SUBSCRIPTION_REQUIRED');
    });

    it('returns 409 for already-enrolled pro user', async () => {
      const authed = await createAuthedApp(mockProUser);
      mockStorage.getEnrollment.mockResolvedValue({ id: 1, status: 'in-progress' });
      const res = await request(authed).post('/api/enrollments').send({
        syllabusId: 1, status: 'in-progress'
      });
      expect(res.status).toBe(409);
    });

    it('reactivates a dropped enrollment (Pro user)', async () => {
      const authed = await createAuthedApp(mockProUser);
      mockStorage.getEnrollment.mockResolvedValue({ id: 1, status: 'dropped' });
      mockStorage.dropActiveEnrollments.mockResolvedValue(undefined);
      mockStorage.updateEnrollment.mockResolvedValue({ id: 1, status: 'in-progress' });
      const res = await request(authed).post('/api/enrollments').send({
        syllabusId: 1, status: 'in-progress'
      });
      expect(res.status).toBe(200);
    });
  });

  describe('PUT /api/enrollments/:id', () => {
    it('updates enrollment when authorized', async () => {
      const authed = await createAuthedApp(mockUser);
      mockStorage.getEnrollmentById.mockResolvedValue({ id: 1, studentId: mockUser.username });
      mockStorage.updateEnrollment.mockResolvedValue({ id: 1, currentWeekIndex: 2 });
      const res = await request(authed).put('/api/enrollments/1').send({ currentWeekIndex: 2 });
      expect(res.status).toBe(200);
    });

    it('returns 403 when not the student', async () => {
      const authed = await createAuthedApp(mockUser);
      mockStorage.getEnrollmentById.mockResolvedValue({ id: 1, studentId: 'other' });
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
      mockStorage.getEnrollmentById.mockResolvedValue({ id: 1, studentId: mockUser.username });
      mockStorage.updateEnrollmentShareProfile.mockResolvedValue({ id: 1, shareProfile: true });
      const res = await request(authed)
        .patch('/api/enrollments/1/share-profile')
        .send({ shareProfile: true });
      expect(res.status).toBe(200);
    });

    it('returns 400 for non-boolean shareProfile', async () => {
      const authed = await createAuthedApp(mockUser);
      mockStorage.getEnrollmentById.mockResolvedValue({ id: 1, studentId: mockUser.username });
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
    it('adds feedback when creator owns syllabus', async () => {
      const authed = await createAuthedApp(mockCreator);
      mockStorage.getSubmission.mockResolvedValue({ id: 1, enrollmentId: 1 });
      mockStorage.getEnrollmentById.mockResolvedValue({ id: 1, syllabusId: 1 });
      mockStorage.getSyllabus.mockResolvedValue({ id: 1, creatorId: mockCreator.username });
      mockStorage.updateSubmissionFeedback.mockResolvedValue({ id: 1, feedback: 'Good' });
      const res = await request(authed)
        .put('/api/submissions/1/feedback')
        .send({ feedback: 'Good', grade: 'A' });
      expect(res.status).toBe(200);
    });

    it('returns 404 when submission not found', async () => {
      const authed = await createAuthedApp(mockCreator);
      mockStorage.getSubmission.mockResolvedValue(null);
      const res = await request(authed)
        .put('/api/submissions/999/feedback')
        .send({ feedback: 'X' });
      expect(res.status).toBe(404);
    });

    it('returns 403 when not syllabus owner', async () => {
      const authed = await createAuthedApp(mockCreator);
      mockStorage.getSubmission.mockResolvedValue({ id: 1, enrollmentId: 1 });
      mockStorage.getEnrollmentById.mockResolvedValue({ id: 1, syllabusId: 1 });
      mockStorage.getSyllabus.mockResolvedValue({ id: 1, creatorId: 'other' });
      const res = await request(authed)
        .put('/api/submissions/1/feedback')
        .send({ feedback: 'X' });
      expect(res.status).toBe(403);
    });
  });

  // ========== DELETE STEP ==========

  describe('DELETE /api/steps/:id', () => {
    it('deletes step when authorized', async () => {
      const authed = await createAuthedApp(mockCreator);
      mockStorage.getStep.mockResolvedValue({ id: 1, weekId: 10 });
      mockStorage.getWeek.mockResolvedValue({ id: 10, syllabusId: 1 });
      mockStorage.getSyllabus.mockResolvedValue({ id: 1, creatorId: mockCreator.username });
      mockStorage.deleteStep.mockResolvedValue(undefined);
      const res = await request(authed).delete('/api/steps/1');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('returns 404 when step not found', async () => {
      const authed = await createAuthedApp(mockCreator);
      mockStorage.getStep.mockResolvedValue(null);
      const res = await request(authed).delete('/api/steps/999');
      expect(res.status).toBe(404);
    });

    it('returns 403 when not owner', async () => {
      const authed = await createAuthedApp(mockCreator);
      mockStorage.getStep.mockResolvedValue({ id: 1, weekId: 10 });
      mockStorage.getWeek.mockResolvedValue({ id: 10, syllabusId: 1 });
      mockStorage.getSyllabus.mockResolvedValue({ id: 1, creatorId: 'other' });
      const res = await request(authed).delete('/api/steps/1');
      expect(res.status).toBe(403);
    });
  });

  // ========== COMPLETION TRACKING ==========

  describe('POST /api/enrollments/:enrollmentId/steps/:stepId/complete', () => {
    it('marks step complete', async () => {
      const authed = await createAuthedApp(mockUser);
      mockStorage.getEnrollmentById.mockResolvedValue({ id: 1, studentId: mockUser.username });
      mockStorage.markStepCompleted.mockResolvedValue({ enrollmentId: 1, stepId: 5 });
      const res = await request(authed).post('/api/enrollments/1/steps/5/complete');
      expect(res.status).toBe(200);
    });

    it('returns 403 when not authorized', async () => {
      const authed = await createAuthedApp(mockUser);
      mockStorage.getEnrollmentById.mockResolvedValue({ id: 1, studentId: 'other' });
      const res = await request(authed).post('/api/enrollments/1/steps/5/complete');
      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /api/enrollments/:enrollmentId/steps/:stepId/complete', () => {
    it('marks step incomplete', async () => {
      const authed = await createAuthedApp(mockUser);
      mockStorage.getEnrollmentById.mockResolvedValue({ id: 1, studentId: mockUser.username });
      mockStorage.markStepIncomplete.mockResolvedValue(undefined);
      const res = await request(authed).delete('/api/enrollments/1/steps/5/complete');
      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/enrollments/:enrollmentId/completed-steps', () => {
    it('returns completed step IDs', async () => {
      const authed = await createAuthedApp(mockUser);
      mockStorage.getEnrollmentById.mockResolvedValue({ id: 1, studentId: mockUser.username });
      mockStorage.getCompletedSteps.mockResolvedValue([1, 2, 3]);
      const res = await request(authed).get('/api/enrollments/1/completed-steps');
      expect(res.status).toBe(200);
      expect(res.body).toEqual([1, 2, 3]);
    });

    it('returns 403 when not authorized', async () => {
      const authed = await createAuthedApp(mockUser);
      mockStorage.getEnrollmentById.mockResolvedValue({ id: 1, studentId: 'other' });
      const res = await request(authed).get('/api/enrollments/1/completed-steps');
      expect(res.status).toBe(403);
    });
  });

  // ========== ANALYTICS ==========

  describe('GET /api/syllabinds/:id/analytics', () => {
    it('returns analytics for creator', async () => {
      const authed = await createAuthedApp(mockCreator);
      mockStorage.getSyllabus.mockResolvedValue({ id: 1, creatorId: mockCreator.username });
      mockStorage.getSyllabusAnalytics.mockResolvedValue({ learnersStarted: 5 });
      const res = await request(authed).get('/api/syllabinds/1/analytics');
      expect(res.status).toBe(200);
      expect(res.body.learnersStarted).toBe(5);
    });

    it('returns 403 for non-creator', async () => {
      const authed = await createAuthedApp(mockUser);
      mockStorage.getSyllabus.mockResolvedValue({ id: 1, creatorId: 'other' });
      const res = await request(authed).get('/api/syllabinds/1/analytics');
      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/syllabinds/:id/analytics/completion-rates', () => {
    it('returns completion rates for creator', async () => {
      const authed = await createAuthedApp(mockCreator);
      mockStorage.getSyllabus.mockResolvedValue({ id: 1, creatorId: mockCreator.username });
      mockStorage.getStepCompletionRates.mockResolvedValue([{ stepId: 1, completionRate: 50 }]);
      const res = await request(authed).get('/api/syllabinds/1/analytics/completion-rates');
      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/syllabinds/:id/analytics/completion-times', () => {
    it('returns completion times for creator', async () => {
      const authed = await createAuthedApp(mockCreator);
      mockStorage.getSyllabus.mockResolvedValue({ id: 1, creatorId: mockCreator.username });
      mockStorage.getAverageCompletionTimes.mockResolvedValue([{ stepId: 1, avgMinutes: 30 }]);
      const res = await request(authed).get('/api/syllabinds/1/analytics/completion-times');
      expect(res.status).toBe(200);
    });
  });

  // ========== AI GENERATION ==========

  describe('POST /api/generate-syllabind', () => {
    it('returns 403 when not creator', async () => {
      const authed = await createAuthedApp({ ...mockUser, isCreator: false });
      const res = await request(authed).post('/api/generate-syllabind').send({ syllabusId: 1 });
      expect(res.status).toBe(403);
    });

    it('returns 400 when syllabusId missing', async () => {
      const authed = await createAuthedApp(mockCreator);
      const res = await request(authed).post('/api/generate-syllabind').send({});
      expect(res.status).toBe(400);
    });

    it('returns 400 when basics not complete', async () => {
      const authed = await createAuthedApp(mockCreator);
      mockStorage.getSyllabus.mockResolvedValue({
        id: 1, creatorId: mockCreator.username, title: 'T', description: null
      });
      const res = await request(authed).post('/api/generate-syllabind').send({ syllabusId: 1 });
      expect(res.status).toBe(400);
    });

    it('returns websocket URL when valid', async () => {
      const authed = await createAuthedApp(mockCreator);
      mockStorage.getSyllabus.mockResolvedValue({
        id: 1, creatorId: mockCreator.username,
        title: 'T', description: 'D', audienceLevel: 'Beginner', durationWeeks: 4
      });
      mockStorage.updateSyllabus.mockResolvedValue(undefined);
      const res = await request(authed).post('/api/generate-syllabind').send({ syllabusId: 1 });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.websocketUrl).toContain('/ws/generate-syllabind');
    });

    it('returns 409 when generation already in progress', async () => {
      const authed = await createAuthedApp(mockCreator);
      mockStorage.getSyllabus.mockResolvedValue({
        id: 1, creatorId: mockCreator.username,
        title: 'T', description: 'D', audienceLevel: 'Beginner', durationWeeks: 4,
        status: 'generating'
      });
      const res = await request(authed).post('/api/generate-syllabind').send({ syllabusId: 1 });
      expect(res.status).toBe(409);
      expect(res.body.error).toBe('Generation already in progress');
    });
  });

  describe('POST /api/regenerate-week', () => {
    it('returns 400 for invalid weekIndex', async () => {
      const authed = await createAuthedApp(mockCreator);
      const res = await request(authed).post('/api/regenerate-week').send({ syllabusId: 1, weekIndex: 0 });
      expect(res.status).toBe(400);
    });

    it('returns websocket URL for valid request', async () => {
      const authed = await createAuthedApp(mockCreator);
      mockStorage.getSyllabus.mockResolvedValue({
        id: 1, creatorId: mockCreator.username, durationWeeks: 4
      });
      const res = await request(authed).post('/api/regenerate-week').send({ syllabusId: 1, weekIndex: 2 });
      expect(res.status).toBe(200);
      expect(res.body.websocketUrl).toContain('/ws/regenerate-week');
    });

    it('returns 400 when weekIndex exceeds duration', async () => {
      const authed = await createAuthedApp(mockCreator);
      mockStorage.getSyllabus.mockResolvedValue({
        id: 1, creatorId: mockCreator.username, durationWeeks: 2
      });
      const res = await request(authed).post('/api/regenerate-week').send({ syllabusId: 1, weekIndex: 5 });
      expect(res.status).toBe(400);
    });
  });

  // ========== CHAT MESSAGES ==========

  describe('GET /api/syllabinds/:id/chat-messages', () => {
    it('returns chat messages for creator', async () => {
      const authed = await createAuthedApp(mockCreator);
      mockStorage.getSyllabus.mockResolvedValue({ id: 1, creatorId: mockCreator.username });
      mockStorage.getChatMessages.mockResolvedValue([{ id: 1, role: 'user', content: 'Hello' }]);
      const res = await request(authed).get('/api/syllabinds/1/chat-messages');
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
    });

    it('returns 403 for non-creator', async () => {
      const authed = await createAuthedApp(mockUser);
      mockStorage.getSyllabus.mockResolvedValue({ id: 1, creatorId: 'other' });
      const res = await request(authed).get('/api/syllabinds/1/chat-messages');
      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/syllabinds/:id/chat-messages', () => {
    it('creates chat message for creator', async () => {
      const authed = await createAuthedApp(mockCreator);
      mockStorage.getSyllabus.mockResolvedValue({ id: 1, creatorId: mockCreator.username });
      mockStorage.createChatMessage.mockResolvedValue({ id: 1, syllabusId: 1, role: 'user', content: 'Hello' });
      const res = await request(authed)
        .post('/api/syllabinds/1/chat-messages')
        .send({ role: 'user', content: 'Hello' });
      expect(res.status).toBe(200);
      expect(res.body.content).toBe('Hello');
    });
  });

  // ========== UPLOAD / DEBUG ==========

  describe('GET /api/debug/uploads-path', () => {
    it('returns paths info', async () => {
      const res = await request(app).get('/api/debug/uploads-path');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('currentDirPath');
    });
  });

  describe('POST /api/upload', () => {
    it('returns 401 when not authenticated', async () => {
      const res = await request(app).post('/api/upload');
      expect(res.status).toBe(401);
    });
  });
});
