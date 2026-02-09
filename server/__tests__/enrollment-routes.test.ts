import request from 'supertest';
import express from 'express';
import { resetAllMocks, mockStorage, mockUser } from './setup/mocks';

describe('Enrollment Routes', () => {
  let authedApp: express.Express;
  let unauthApp: express.Express;

  function registerRoutes(a: express.Express) {
    const authMiddleware = (req: any, res: any, next: any) => {
      if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
      next();
    };

    // GET /api/enrollments
    a.get('/api/enrollments', authMiddleware, async (req, res) => {
      const username = (req.user as any).username;
      const enrollments = await mockStorage.getUserEnrollments(username);
      res.json(enrollments);
    });

    // POST /api/enrollments
    a.post('/api/enrollments', authMiddleware, async (req, res) => {
      const username = (req.user as any).username;
      const { shareProfile, ...enrollmentBody } = req.body;

      if (!enrollmentBody.syllabusId) {
        return res.status(400).json({ message: 'syllabusId is required' });
      }

      const existing = await mockStorage.getEnrollment(username, enrollmentBody.syllabusId);
      if (existing) {
        if (existing.status === 'dropped') {
          await mockStorage.dropActiveEnrollments(username, enrollmentBody.syllabusId);
          const reactivated = await mockStorage.updateEnrollment(existing.id, { status: 'in-progress' });
          return res.json(reactivated);
        }
        return res.status(409).json({ message: 'Already enrolled in this syllabus' });
      }

      await mockStorage.dropActiveEnrollments(username);
      const enrollment = await mockStorage.createEnrollment({
        ...enrollmentBody,
        studentId: username,
        shareProfile: shareProfile === true
      });
      res.json(enrollment);
    });

    // PUT /api/enrollments/:id
    a.put('/api/enrollments/:id', authMiddleware, async (req, res) => {
      const id = parseInt(req.params.id);
      const username = (req.user as any).username;
      const enrollment = await mockStorage.getEnrollmentById(id);
      if (!enrollment) return res.status(404).json({ message: 'Enrollment not found' });
      if (enrollment.studentId !== username) {
        return res.status(403).json({ error: 'Not your enrollment' });
      }
      const updated = await mockStorage.updateEnrollment(id, req.body);
      res.json(updated);
    });

    // PATCH /api/enrollments/:id/share-profile
    a.patch('/api/enrollments/:id/share-profile', authMiddleware, async (req, res) => {
      const id = parseInt(req.params.id);
      const username = (req.user as any).username;
      const enrollment = await mockStorage.getEnrollmentById(id);
      if (!enrollment) return res.status(404).json({ message: 'Enrollment not found' });
      if (enrollment.studentId !== username) {
        return res.status(403).json({ error: 'Not your enrollment' });
      }
      const { shareProfile } = req.body;
      if (typeof shareProfile !== 'boolean') {
        return res.status(400).json({ error: 'shareProfile must be a boolean' });
      }
      const updated = await mockStorage.updateEnrollmentShareProfile(id, shareProfile);
      res.json(updated);
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

  describe('GET /api/enrollments', () => {
    it('should return user enrollments', async () => {
      const enrollments = [{ id: 1, studentId: 'testuser', syllabusId: 1 }];
      mockStorage.getUserEnrollments.mockResolvedValue(enrollments);

      const res = await request(authedApp).get('/api/enrollments').expect(200);
      expect(res.body).toEqual(enrollments);
      expect(mockStorage.getUserEnrollments).toHaveBeenCalledWith('testuser');
    });

    it('should return 401 when not authenticated', async () => {
      await request(unauthApp).get('/api/enrollments').expect(401);
    });
  });

  describe('POST /api/enrollments', () => {
    it('should create new enrollment', async () => {
      mockStorage.getEnrollment.mockResolvedValue(null);
      mockStorage.createEnrollment.mockResolvedValue({ id: 1, studentId: 'testuser', syllabusId: 1 });

      const res = await request(authedApp)
        .post('/api/enrollments')
        .send({ syllabusId: 1 })
        .expect(200);

      expect(mockStorage.dropActiveEnrollments).toHaveBeenCalledWith('testuser');
      expect(mockStorage.createEnrollment).toHaveBeenCalled();
      expect(res.body.id).toBe(1);
    });

    it('should reactivate dropped enrollment', async () => {
      mockStorage.getEnrollment.mockResolvedValue({ id: 5, status: 'dropped', studentId: 'testuser' });
      mockStorage.updateEnrollment.mockResolvedValue({ id: 5, status: 'in-progress' });

      const res = await request(authedApp)
        .post('/api/enrollments')
        .send({ syllabusId: 1 })
        .expect(200);

      expect(mockStorage.dropActiveEnrollments).toHaveBeenCalledWith('testuser', 1);
      expect(mockStorage.updateEnrollment).toHaveBeenCalledWith(5, { status: 'in-progress' });
      expect(res.body.status).toBe('in-progress');
    });

    it('should return 409 for active duplicate enrollment', async () => {
      mockStorage.getEnrollment.mockResolvedValue({ id: 5, status: 'in-progress', studentId: 'testuser' });

      await request(authedApp)
        .post('/api/enrollments')
        .send({ syllabusId: 1 })
        .expect(409);
    });
  });

  describe('PUT /api/enrollments/:id', () => {
    it('should update enrollment when owner', async () => {
      mockStorage.getEnrollmentById.mockResolvedValue({ id: 1, studentId: 'testuser' });
      mockStorage.updateEnrollment.mockResolvedValue({ id: 1, currentWeekIndex: 2 });

      const res = await request(authedApp)
        .put('/api/enrollments/1')
        .send({ currentWeekIndex: 2 })
        .expect(200);

      expect(mockStorage.updateEnrollment).toHaveBeenCalledWith(1, { currentWeekIndex: 2 });
    });

    it('should return 404 when enrollment not found', async () => {
      mockStorage.getEnrollmentById.mockResolvedValue(null);
      await request(authedApp).put('/api/enrollments/999').send({}).expect(404);
    });

    it('should return 403 when not owner', async () => {
      mockStorage.getEnrollmentById.mockResolvedValue({ id: 1, studentId: 'otheruser' });
      await request(authedApp).put('/api/enrollments/1').send({}).expect(403);
    });
  });

  describe('PATCH /api/enrollments/:id/share-profile', () => {
    it('should toggle share profile', async () => {
      mockStorage.getEnrollmentById.mockResolvedValue({ id: 1, studentId: 'testuser' });
      mockStorage.updateEnrollmentShareProfile.mockResolvedValue({ id: 1, shareProfile: true });

      const res = await request(authedApp)
        .patch('/api/enrollments/1/share-profile')
        .send({ shareProfile: true })
        .expect(200);

      expect(mockStorage.updateEnrollmentShareProfile).toHaveBeenCalledWith(1, true);
    });

    it('should return 400 for non-boolean shareProfile', async () => {
      mockStorage.getEnrollmentById.mockResolvedValue({ id: 1, studentId: 'testuser' });

      await request(authedApp)
        .patch('/api/enrollments/1/share-profile')
        .send({ shareProfile: 'yes' })
        .expect(400);
    });

    it('should return 404 when enrollment not found', async () => {
      mockStorage.getEnrollmentById.mockResolvedValue(null);
      await request(authedApp)
        .patch('/api/enrollments/999/share-profile')
        .send({ shareProfile: true })
        .expect(404);
    });

    it('should return 403 when not owner', async () => {
      mockStorage.getEnrollmentById.mockResolvedValue({ id: 1, studentId: 'otheruser' });
      await request(authedApp)
        .patch('/api/enrollments/1/share-profile')
        .send({ shareProfile: true })
        .expect(403);
    });
  });
});
