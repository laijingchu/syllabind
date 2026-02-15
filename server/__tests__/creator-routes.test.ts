import request from 'supertest';
import express from 'express';
import { resetAllMocks, mockStorage, mockCreator, mockUser } from './setup/mocks';

describe('Creator Routes', () => {
  let creatorApp: express.Express;
  let learnerApp: express.Express;
  let unauthApp: express.Express;

  function registerRoutes(a: express.Express) {
    const authMiddleware = (req: any, res: any, next: any) => {
      if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
      next();
    };

    // GET /api/creator/syllabinds
    a.get('/api/creator/syllabinds', authMiddleware, async (req, res) => {
      const user = req.user as any;
      if (!user.isCreator) {
        return res.status(403).json({ error: 'Creator access required' });
      }
      const syllabinds = await mockStorage.getSyllabindsByCreator(user.username);
      res.json(syllabinds);
    });

    // DELETE /api/syllabinds/:id
    a.delete('/api/syllabinds/:id', authMiddleware, async (req, res) => {
      const id = parseInt(req.params.id);
      const username = (req.user as any).username;
      const syllabus = await mockStorage.getSyllabus(id);
      if (!syllabus) return res.status(404).json({ message: 'Syllabus not found' });
      if (syllabus.creatorId !== username) {
        return res.status(403).json({ error: 'Forbidden: Only creator can delete this syllabus' });
      }
      await mockStorage.deleteSyllabus(id);
      res.json({ success: true });
    });

    // POST /api/syllabinds/batch-delete
    a.post('/api/syllabinds/batch-delete', authMiddleware, async (req, res) => {
      const username = (req.user as any).username;
      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: 'Invalid request: ids must be a non-empty array' });
      }
      const syllabinds = await Promise.all(ids.map((id: any) => mockStorage.getSyllabus(parseInt(id))));
      for (const syllabus of syllabinds) {
        if (!syllabus) return res.status(404).json({ message: 'One or more syllabinds not found' });
        if (syllabus.creatorId !== username) {
          return res.status(403).json({ error: 'Forbidden: You can only delete your own syllabinds' });
        }
      }
      await mockStorage.batchDeleteSyllabinds(ids.map((id: any) => parseInt(id)));
      res.json({ success: true, count: ids.length });
    });

    // POST /api/syllabinds/:id/publish
    a.post('/api/syllabinds/:id/publish', authMiddleware, async (req, res) => {
      const id = parseInt(req.params.id);
      const username = (req.user as any).username;
      const syllabus = await mockStorage.getSyllabus(id);
      if (!syllabus) return res.status(404).json({ message: 'Syllabus not found' });
      if (syllabus.creatorId !== username) {
        return res.status(403).json({ error: 'Not syllabus owner' });
      }
      const newStatus = syllabus.status === 'published' ? 'draft' : 'published';
      const updated = await mockStorage.updateSyllabus(id, { status: newStatus });
      res.json(updated);
    });

    // GET /api/syllabinds/:id/classmates (public)
    a.get('/api/syllabinds/:id/classmates', async (req, res) => {
      const syllabusId = parseInt(req.params.id);
      const classmates = await mockStorage.getClassmatesBySyllabusId(syllabusId);
      res.json(classmates);
    });

    // DELETE /api/steps/:id
    a.delete('/api/steps/:id', authMiddleware, async (req, res) => {
      const stepId = parseInt(req.params.id);
      const username = (req.user as any).username;
      const step = await mockStorage.getStep(stepId);
      if (!step) return res.status(404).json({ message: 'Step not found' });
      const week = await mockStorage.getWeek(step.weekId);
      if (!week) return res.status(404).json({ message: 'Week not found' });
      const syllabus = await mockStorage.getSyllabus(week.syllabusId);
      if (!syllabus || syllabus.creatorId !== username) {
        return res.status(403).json({ error: 'Not syllabus owner' });
      }
      await mockStorage.deleteStep(stepId);
      res.json({ success: true });
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

    unauthApp = express();
    unauthApp.use(express.json());
    registerRoutes(unauthApp);
  });

  beforeEach(() => {
    resetAllMocks();
  });

  describe('GET /api/creator/syllabinds', () => {
    it('should return creator syllabinds', async () => {
      const syllabinds = [{ id: 1, title: 'My Syllabus', creatorId: 'testcreator' }];
      mockStorage.getSyllabindsByCreator.mockResolvedValue(syllabinds);

      const res = await request(creatorApp).get('/api/creator/syllabinds').expect(200);
      expect(res.body).toEqual(syllabinds);
      expect(mockStorage.getSyllabindsByCreator).toHaveBeenCalledWith('testcreator');
    });

    it('should return 403 if not a creator', async () => {
      await request(learnerApp).get('/api/creator/syllabinds').expect(403);
    });
  });

  describe('DELETE /api/syllabinds/:id', () => {
    it('should delete syllabus when owner', async () => {
      mockStorage.getSyllabus.mockResolvedValue({ id: 1, creatorId: 'testcreator' });

      const res = await request(creatorApp).delete('/api/syllabinds/1').expect(200);
      expect(res.body.success).toBe(true);
      expect(mockStorage.deleteSyllabus).toHaveBeenCalledWith(1);
    });

    it('should return 404 when syllabus not found', async () => {
      mockStorage.getSyllabus.mockResolvedValue(null);
      await request(creatorApp).delete('/api/syllabinds/999').expect(404);
    });

    it('should return 403 when not owner', async () => {
      mockStorage.getSyllabus.mockResolvedValue({ id: 1, creatorId: 'othercreator' });
      await request(creatorApp).delete('/api/syllabinds/1').expect(403);
    });
  });

  describe('POST /api/syllabinds/batch-delete', () => {
    it('should batch delete owned syllabinds', async () => {
      mockStorage.getSyllabus
        .mockResolvedValueOnce({ id: 1, creatorId: 'testcreator' })
        .mockResolvedValueOnce({ id: 2, creatorId: 'testcreator' });

      const res = await request(creatorApp)
        .post('/api/syllabinds/batch-delete')
        .send({ ids: [1, 2] })
        .expect(200);

      expect(res.body).toEqual({ success: true, count: 2 });
      expect(mockStorage.batchDeleteSyllabinds).toHaveBeenCalledWith([1, 2]);
    });

    it('should return 400 for invalid ids', async () => {
      await request(creatorApp)
        .post('/api/syllabinds/batch-delete')
        .send({ ids: [] })
        .expect(400);

      await request(creatorApp)
        .post('/api/syllabinds/batch-delete')
        .send({ ids: 'not-array' })
        .expect(400);
    });

    it('should return 404 if any syllabind not found', async () => {
      mockStorage.getSyllabus
        .mockResolvedValueOnce({ id: 1, creatorId: 'testcreator' })
        .mockResolvedValueOnce(null);

      await request(creatorApp)
        .post('/api/syllabinds/batch-delete')
        .send({ ids: [1, 2] })
        .expect(404);
    });

    it('should return 403 if any syllabind not owned', async () => {
      mockStorage.getSyllabus
        .mockResolvedValueOnce({ id: 1, creatorId: 'testcreator' })
        .mockResolvedValueOnce({ id: 2, creatorId: 'othercreator' });

      await request(creatorApp)
        .post('/api/syllabinds/batch-delete')
        .send({ ids: [1, 2] })
        .expect(403);
    });
  });

  describe('POST /api/syllabinds/:id/publish', () => {
    it('should toggle draft to published', async () => {
      mockStorage.getSyllabus.mockResolvedValue({ id: 1, status: 'draft', creatorId: 'testcreator' });
      mockStorage.updateSyllabus.mockResolvedValue({ id: 1, status: 'published' });

      const res = await request(creatorApp).post('/api/syllabinds/1/publish').expect(200);
      expect(mockStorage.updateSyllabus).toHaveBeenCalledWith(1, { status: 'published' });
      expect(res.body.status).toBe('published');
    });

    it('should toggle published to draft', async () => {
      mockStorage.getSyllabus.mockResolvedValue({ id: 1, status: 'published', creatorId: 'testcreator' });
      mockStorage.updateSyllabus.mockResolvedValue({ id: 1, status: 'draft' });

      const res = await request(creatorApp).post('/api/syllabinds/1/publish').expect(200);
      expect(mockStorage.updateSyllabus).toHaveBeenCalledWith(1, { status: 'draft' });
    });

    it('should return 403 when not owner', async () => {
      mockStorage.getSyllabus.mockResolvedValue({ id: 1, creatorId: 'othercreator' });
      await request(creatorApp).post('/api/syllabinds/1/publish').expect(403);
    });

    it('should return 404 when not found', async () => {
      mockStorage.getSyllabus.mockResolvedValue(null);
      await request(creatorApp).post('/api/syllabinds/999/publish').expect(404);
    });
  });

  describe('GET /api/syllabinds/:id/classmates', () => {
    it('should return classmates data', async () => {
      const data = { classmates: [{ user: { username: 'learner1' } }], totalEnrolled: 3 };
      mockStorage.getClassmatesBySyllabusId.mockResolvedValue(data);

      const res = await request(unauthApp).get('/api/syllabinds/1/classmates').expect(200);
      expect(res.body.totalEnrolled).toBe(3);
      expect(res.body.classmates).toHaveLength(1);
    });
  });

  describe('DELETE /api/steps/:id', () => {
    it('should delete step when creator owns syllabus', async () => {
      mockStorage.getStep.mockResolvedValue({ id: 10, weekId: 5 });
      mockStorage.getWeek.mockResolvedValue({ id: 5, syllabusId: 1 });
      mockStorage.getSyllabus.mockResolvedValue({ id: 1, creatorId: 'testcreator' });

      const res = await request(creatorApp).delete('/api/steps/10').expect(200);
      expect(res.body.success).toBe(true);
      expect(mockStorage.deleteStep).toHaveBeenCalledWith(10);
    });

    it('should return 404 when step not found', async () => {
      mockStorage.getStep.mockResolvedValue(null);
      await request(creatorApp).delete('/api/steps/999').expect(404);
    });

    it('should return 404 when week not found', async () => {
      mockStorage.getStep.mockResolvedValue({ id: 10, weekId: 999 });
      mockStorage.getWeek.mockResolvedValue(null);
      await request(creatorApp).delete('/api/steps/10').expect(404);
    });

    it('should return 403 when not syllabus owner', async () => {
      mockStorage.getStep.mockResolvedValue({ id: 10, weekId: 5 });
      mockStorage.getWeek.mockResolvedValue({ id: 5, syllabusId: 1 });
      mockStorage.getSyllabus.mockResolvedValue({ id: 1, creatorId: 'othercreator' });

      await request(creatorApp).delete('/api/steps/10').expect(403);
    });
  });
});
