import request from 'supertest';
import express from 'express';
import { resetAllMocks, mockStorage, mockUser, mockCreator } from './setup/mocks';

describe('Submission Routes', () => {
  let learnerApp: express.Express;
  let creatorApp: express.Express;

  function registerRoutes(a: express.Express) {
    const authMiddleware = (req: any, res: any, next: any) => {
      if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
      next();
    };

    // POST /api/submissions
    a.post('/api/submissions', authMiddleware, async (req, res) => {
      const { enrollmentId, stepId, answer, isShared } = req.body;
      if (!enrollmentId || !stepId || !answer) {
        return res.status(400).json({ message: 'enrollmentId, stepId, and answer are required' });
      }
      const submission = await mockStorage.createSubmission(req.body);
      res.json(submission);
    });

    // GET /api/enrollments/:id/submissions
    a.get('/api/enrollments/:id/submissions', authMiddleware, async (req, res) => {
      const enrollmentId = parseInt(req.params.id);
      const submissions = await mockStorage.getSubmissionsByEnrollmentId(enrollmentId);
      res.json(submissions);
    });

    // PUT /api/submissions/:id/feedback
    a.put('/api/submissions/:id/feedback', authMiddleware, async (req, res) => {
      const id = parseInt(req.params.id);
      const { feedback, grade, rubricUrl } = req.body;
      const username = (req.user as any).username;

      const submission = await mockStorage.getSubmission(id);
      if (!submission) return res.status(404).json({ message: 'Submission not found' });

      const enrollment = await mockStorage.getEnrollmentById(submission.enrollmentId);
      if (!enrollment) return res.status(404).json({ message: 'Enrollment not found' });

      const syllabus = await mockStorage.getSyllabus(enrollment.syllabusId);
      if (!syllabus) return res.status(404).json({ message: 'Syllabus not found' });
      if (syllabus.creatorId !== username) {
        return res.status(403).json({ error: 'Not syllabus owner' });
      }

      const updated = await mockStorage.updateSubmissionFeedback(id, feedback, grade, rubricUrl);
      res.json(updated);
    });
  }

  beforeAll(() => {
    learnerApp = express();
    learnerApp.use(express.json());
    learnerApp.use((req, _res, next) => { req.user = mockUser; next(); });
    registerRoutes(learnerApp);

    creatorApp = express();
    creatorApp.use(express.json());
    creatorApp.use((req, _res, next) => { req.user = mockCreator; next(); });
    registerRoutes(creatorApp);
  });

  beforeEach(() => {
    resetAllMocks();
  });

  describe('POST /api/submissions', () => {
    it('should create a submission', async () => {
      const submissionData = { enrollmentId: 1, stepId: 5, answer: 'My answer', isShared: false };
      mockStorage.createSubmission.mockResolvedValue({ id: 1, ...submissionData });

      const res = await request(learnerApp)
        .post('/api/submissions')
        .send(submissionData)
        .expect(200);

      expect(mockStorage.createSubmission).toHaveBeenCalledWith(submissionData);
      expect(res.body.id).toBe(1);
    });

    it('should return 400 for missing required fields', async () => {
      await request(learnerApp)
        .post('/api/submissions')
        .send({ enrollmentId: 1 })
        .expect(400);
    });
  });

  describe('GET /api/enrollments/:id/submissions', () => {
    it('should return submissions for enrollment', async () => {
      const submissions = [
        { id: 1, enrollmentId: 1, stepId: 5, answer: 'Answer 1' },
        { id: 2, enrollmentId: 1, stepId: 6, answer: 'Answer 2' }
      ];
      mockStorage.getSubmissionsByEnrollmentId.mockResolvedValue(submissions);

      const res = await request(learnerApp)
        .get('/api/enrollments/1/submissions')
        .expect(200);

      expect(res.body).toHaveLength(2);
      expect(mockStorage.getSubmissionsByEnrollmentId).toHaveBeenCalledWith(1);
    });
  });

  describe('PUT /api/submissions/:id/feedback', () => {
    it('should add feedback when creator owns syllabus', async () => {
      mockStorage.getSubmission.mockResolvedValue({ id: 1, enrollmentId: 10 });
      mockStorage.getEnrollmentById.mockResolvedValue({ id: 10, syllabusId: 20 });
      mockStorage.getSyllabus.mockResolvedValue({ id: 20, creatorId: 'testcreator' });
      mockStorage.updateSubmissionFeedback.mockResolvedValue({
        id: 1, feedback: 'Great work!', grade: 'A'
      });

      const res = await request(creatorApp)
        .put('/api/submissions/1/feedback')
        .send({ feedback: 'Great work!', grade: 'A' })
        .expect(200);

      expect(mockStorage.updateSubmissionFeedback).toHaveBeenCalledWith(1, 'Great work!', 'A', undefined);
      expect(res.body.feedback).toBe('Great work!');
    });

    it('should return 404 when submission not found', async () => {
      mockStorage.getSubmission.mockResolvedValue(null);

      await request(creatorApp)
        .put('/api/submissions/999/feedback')
        .send({ feedback: 'test' })
        .expect(404);
    });

    it('should return 404 when enrollment not found', async () => {
      mockStorage.getSubmission.mockResolvedValue({ id: 1, enrollmentId: 10 });
      mockStorage.getEnrollmentById.mockResolvedValue(null);

      await request(creatorApp)
        .put('/api/submissions/1/feedback')
        .send({ feedback: 'test' })
        .expect(404);
    });

    it('should return 404 when syllabus not found', async () => {
      mockStorage.getSubmission.mockResolvedValue({ id: 1, enrollmentId: 10 });
      mockStorage.getEnrollmentById.mockResolvedValue({ id: 10, syllabusId: 20 });
      mockStorage.getSyllabus.mockResolvedValue(null);

      await request(creatorApp)
        .put('/api/submissions/1/feedback')
        .send({ feedback: 'test' })
        .expect(404);
    });

    it('should return 403 when not syllabus owner', async () => {
      mockStorage.getSubmission.mockResolvedValue({ id: 1, enrollmentId: 10 });
      mockStorage.getEnrollmentById.mockResolvedValue({ id: 10, syllabusId: 20 });
      mockStorage.getSyllabus.mockResolvedValue({ id: 20, creatorId: 'othercreator' });

      await request(creatorApp)
        .put('/api/submissions/1/feedback')
        .send({ feedback: 'test' })
        .expect(403);
    });
  });
});
