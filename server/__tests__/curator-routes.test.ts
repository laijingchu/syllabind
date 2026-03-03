import request from 'supertest';
import express from 'express';
import { resetAllMocks, mockStorage, mockCurator, mockUser } from './setup/mocks';

describe('Curator Routes', () => {
  let curatorApp: express.Express;
  let readerApp: express.Express;
  let unauthApp: express.Express;

  function registerRoutes(a: express.Express) {
    const authMiddleware = (req: any, res: any, next: any) => {
      if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
      next();
    };

    // GET /api/curator/binders
    a.get('/api/curator/binders', authMiddleware, async (req, res) => {
      const user = req.user as any;
      if (!user.isCurator) {
        return res.status(403).json({ error: 'Curator access required' });
      }
      const binders = await mockStorage.getBindersByCurator(user.username);
      res.json(binders);
    });

    // DELETE /api/binders/:id
    a.delete('/api/binders/:id', authMiddleware, async (req, res) => {
      const id = parseInt(req.params.id);
      const username = (req.user as any).username;
      const binder = await mockStorage.getBinder(id);
      if (!binder) return res.status(404).json({ message: 'Binder not found' });
      if (binder.curatorId !== username) {
        return res.status(403).json({ error: 'Forbidden: Only curator can delete this binder' });
      }
      await mockStorage.deleteBinder(id);
      res.json({ success: true });
    });

    // POST /api/binders/batch-delete
    a.post('/api/binders/batch-delete', authMiddleware, async (req, res) => {
      const username = (req.user as any).username;
      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: 'Invalid request: ids must be a non-empty array' });
      }
      const binders = await Promise.all(ids.map((id: any) => mockStorage.getBinder(parseInt(id))));
      for (const binder of binders) {
        if (!binder) return res.status(404).json({ message: 'One or more binders not found' });
        if (binder.curatorId !== username) {
          return res.status(403).json({ error: 'Forbidden: You can only delete your own binders' });
        }
      }
      await mockStorage.batchDeleteBinders(ids.map((id: any) => parseInt(id)));
      res.json({ success: true, count: ids.length });
    });

    // POST /api/binders/:id/publish
    a.post('/api/binders/:id/publish', authMiddleware, async (req, res) => {
      const id = parseInt(req.params.id);
      const username = (req.user as any).username;
      const binder = await mockStorage.getBinder(id);
      if (!binder) return res.status(404).json({ message: 'Binder not found' });
      if (binder.curatorId !== username) {
        return res.status(403).json({ error: 'Not binder owner' });
      }
      const newStatus = binder.status === 'published' ? 'draft' : 'published';
      const updated = await mockStorage.updateBinder(id, { status: newStatus });
      res.json(updated);
    });

    // GET /api/binders/:id/classmates (public)
    a.get('/api/binders/:id/classmates', async (req, res) => {
      const binderId = parseInt(req.params.id);
      const classmates = await mockStorage.getClassmatesByBinderId(binderId);
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
      const binder = await mockStorage.getBinder(week.binderId);
      if (!binder || binder.curatorId !== username) {
        return res.status(403).json({ error: 'Not binder owner' });
      }
      await mockStorage.deleteStep(stepId);
      res.json({ success: true });
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

    unauthApp = express();
    unauthApp.use(express.json());
    registerRoutes(unauthApp);
  });

  beforeEach(() => {
    resetAllMocks();
  });

  describe('GET /api/curator/binders', () => {
    it('should return curator binders', async () => {
      const binders = [{ id: 1, title: 'My Binder', curatorId: 'testcurator' }];
      mockStorage.getBindersByCurator.mockResolvedValue(binders);

      const res = await request(curatorApp).get('/api/curator/binders').expect(200);
      expect(res.body).toEqual(binders);
      expect(mockStorage.getBindersByCurator).toHaveBeenCalledWith('testcurator');
    });

    it('should return 403 if not a curator', async () => {
      await request(readerApp).get('/api/curator/binders').expect(403);
    });
  });

  describe('DELETE /api/binders/:id', () => {
    it('should delete binder when owner', async () => {
      mockStorage.getBinder.mockResolvedValue({ id: 1, curatorId: 'testcurator' });

      const res = await request(curatorApp).delete('/api/binders/1').expect(200);
      expect(res.body.success).toBe(true);
      expect(mockStorage.deleteBinder).toHaveBeenCalledWith(1);
    });

    it('should return 404 when binder not found', async () => {
      mockStorage.getBinder.mockResolvedValue(null);
      await request(curatorApp).delete('/api/binders/999').expect(404);
    });

    it('should return 403 when not owner', async () => {
      mockStorage.getBinder.mockResolvedValue({ id: 1, curatorId: 'othercreator' });
      await request(curatorApp).delete('/api/binders/1').expect(403);
    });
  });

  describe('POST /api/binders/batch-delete', () => {
    it('should batch delete owned binders', async () => {
      mockStorage.getBinder
        .mockResolvedValueOnce({ id: 1, curatorId: 'testcurator' })
        .mockResolvedValueOnce({ id: 2, curatorId: 'testcurator' });

      const res = await request(curatorApp)
        .post('/api/binders/batch-delete')
        .send({ ids: [1, 2] })
        .expect(200);

      expect(res.body).toEqual({ success: true, count: 2 });
      expect(mockStorage.batchDeleteBinders).toHaveBeenCalledWith([1, 2]);
    });

    it('should return 400 for invalid ids', async () => {
      await request(curatorApp)
        .post('/api/binders/batch-delete')
        .send({ ids: [] })
        .expect(400);

      await request(curatorApp)
        .post('/api/binders/batch-delete')
        .send({ ids: 'not-array' })
        .expect(400);
    });

    it('should return 404 if any binder not found', async () => {
      mockStorage.getBinder
        .mockResolvedValueOnce({ id: 1, curatorId: 'testcurator' })
        .mockResolvedValueOnce(null);

      await request(curatorApp)
        .post('/api/binders/batch-delete')
        .send({ ids: [1, 2] })
        .expect(404);
    });

    it('should return 403 if any binder not owned', async () => {
      mockStorage.getBinder
        .mockResolvedValueOnce({ id: 1, curatorId: 'testcurator' })
        .mockResolvedValueOnce({ id: 2, curatorId: 'othercreator' });

      await request(curatorApp)
        .post('/api/binders/batch-delete')
        .send({ ids: [1, 2] })
        .expect(403);
    });
  });

  describe('POST /api/binders/:id/publish', () => {
    it('should toggle draft to published', async () => {
      mockStorage.getBinder.mockResolvedValue({ id: 1, status: 'draft', curatorId: 'testcurator' });
      mockStorage.updateBinder.mockResolvedValue({ id: 1, status: 'published' });

      const res = await request(curatorApp).post('/api/binders/1/publish').expect(200);
      expect(mockStorage.updateBinder).toHaveBeenCalledWith(1, { status: 'published' });
      expect(res.body.status).toBe('published');
    });

    it('should toggle published to draft', async () => {
      mockStorage.getBinder.mockResolvedValue({ id: 1, status: 'published', curatorId: 'testcurator' });
      mockStorage.updateBinder.mockResolvedValue({ id: 1, status: 'draft' });

      const res = await request(curatorApp).post('/api/binders/1/publish').expect(200);
      expect(mockStorage.updateBinder).toHaveBeenCalledWith(1, { status: 'draft' });
    });

    it('should return 403 when not owner', async () => {
      mockStorage.getBinder.mockResolvedValue({ id: 1, curatorId: 'othercreator' });
      await request(curatorApp).post('/api/binders/1/publish').expect(403);
    });

    it('should return 404 when not found', async () => {
      mockStorage.getBinder.mockResolvedValue(null);
      await request(curatorApp).post('/api/binders/999/publish').expect(404);
    });

    it('should preserve showSchedulingLink when toggling publish status', async () => {
      mockStorage.getBinder.mockResolvedValue({ id: 1, status: 'draft', curatorId: 'testcurator', showSchedulingLink: false });
      mockStorage.updateBinder.mockResolvedValue({ id: 1, status: 'published', showSchedulingLink: false });

      const res = await request(curatorApp).post('/api/binders/1/publish').expect(200);
      // Only status should be updated, not showSchedulingLink
      expect(mockStorage.updateBinder).toHaveBeenCalledWith(1, { status: 'published' });
    });
  });

  describe('GET /api/binders/:id/classmates', () => {
    it('should return classmates data', async () => {
      const data = { classmates: [{ user: { username: 'learner1' } }], totalEnrolled: 3 };
      mockStorage.getClassmatesByBinderId.mockResolvedValue(data);

      const res = await request(unauthApp).get('/api/binders/1/classmates').expect(200);
      expect(res.body.totalEnrolled).toBe(3);
      expect(res.body.classmates).toHaveLength(1);
    });
  });

  describe('DELETE /api/steps/:id', () => {
    it('should delete step when curator owns binder', async () => {
      mockStorage.getStep.mockResolvedValue({ id: 10, weekId: 5 });
      mockStorage.getWeek.mockResolvedValue({ id: 5, binderId: 1 });
      mockStorage.getBinder.mockResolvedValue({ id: 1, curatorId: 'testcurator' });

      const res = await request(curatorApp).delete('/api/steps/10').expect(200);
      expect(res.body.success).toBe(true);
      expect(mockStorage.deleteStep).toHaveBeenCalledWith(10);
    });

    it('should return 404 when step not found', async () => {
      mockStorage.getStep.mockResolvedValue(null);
      await request(curatorApp).delete('/api/steps/999').expect(404);
    });

    it('should return 404 when week not found', async () => {
      mockStorage.getStep.mockResolvedValue({ id: 10, weekId: 999 });
      mockStorage.getWeek.mockResolvedValue(null);
      await request(curatorApp).delete('/api/steps/10').expect(404);
    });

    it('should return 403 when not binder owner', async () => {
      mockStorage.getStep.mockResolvedValue({ id: 10, weekId: 5 });
      mockStorage.getWeek.mockResolvedValue({ id: 5, binderId: 1 });
      mockStorage.getBinder.mockResolvedValue({ id: 1, curatorId: 'othercreator' });

      await request(curatorApp).delete('/api/steps/10').expect(403);
    });
  });
});
