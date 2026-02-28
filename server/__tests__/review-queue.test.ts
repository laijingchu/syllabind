import request from 'supertest';
import express from 'express';
import { resetAllMocks, mockStorage, mockCurator, mockAdmin, mockUser } from './setup/mocks';

describe('Binder Approval Workflow', () => {
  let curatorApp: express.Express;
  let adminApp: express.Express;
  let readerApp: express.Express;

  const mockBinder = {
    id: 1,
    title: 'Test Binder',
    description: 'A test binder',
    status: 'draft',
    visibility: 'public',
    curatorId: 'testcurator',
    audienceLevel: 'Beginner',
    durationWeeks: 4,
    submittedAt: null,
    reviewNote: null,
  };

  function registerRoutes(a: express.Express) {
    const authMiddleware = (req: any, res: any, next: any) => {
      if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
      next();
    };

    // POST /api/binders/:id/publish (role-aware)
    a.post('/api/binders/:id/publish', authMiddleware, async (req, res) => {
      const id = parseInt(req.params.id);
      const username = (req.user as any).username;
      const binder = await mockStorage.getBinder(id);
      if (!binder) return res.status(404).json({ message: 'Binder not found' });
      const isAdmin = (req.user as any).isAdmin === true;
      if (binder.curatorId !== username && !isAdmin) {
        return res.status(403).json({ error: 'Not binder owner' });
      }

      const visibility = req.body?.visibility || binder.visibility || 'public';

      if (isAdmin) {
        const newStatus = binder.status === 'published' ? 'draft' : 'published';
        const updated = await mockStorage.updateBinder(id, { status: newStatus, visibility });
        return res.json(updated);
      }

      if (binder.status === 'draft') {
        if (visibility === 'public') {
          const updated = await mockStorage.updateBinder(id, {
            status: 'pending_review',
            visibility,
            submittedAt: new Date(),
            reviewNote: null,
          });
          return res.json(updated);
        } else {
          const updated = await mockStorage.updateBinder(id, { status: 'published', visibility });
          return res.json(updated);
        }
      } else if (binder.status === 'pending_review') {
        const updated = await mockStorage.updateBinder(id, {
          status: 'draft',
          submittedAt: null,
        });
        return res.json(updated);
      } else if (binder.status === 'published') {
        const updated = await mockStorage.updateBinder(id, { status: 'draft' });
        return res.json(updated);
      }

      res.json(binder);
    });

    // GET /api/admin/review-queue
    a.get('/api/admin/review-queue', authMiddleware, async (req, res) => {
      const user = req.user as any;
      if (!user.isAdmin) {
        return res.status(403).json({ error: 'Admin access required' });
      }
      const queue = await mockStorage.getBindersByStatus('pending_review');
      res.json(queue);
    });

    // POST /api/admin/binders/:id/approve
    a.post('/api/admin/binders/:id/approve', authMiddleware, async (req, res) => {
      const user = req.user as any;
      if (!user.isAdmin) {
        return res.status(403).json({ error: 'Admin access required' });
      }
      const id = parseInt(req.params.id);
      const binder = await mockStorage.getBinder(id);
      if (!binder) return res.status(404).json({ message: 'Binder not found' });
      if (binder.status !== 'pending_review') {
        return res.status(400).json({ error: 'Binder is not pending review' });
      }
      const updated = await mockStorage.updateBinder(id, {
        status: 'published',
        reviewNote: req.body?.note || null,
        reviewedAt: new Date(),
      });
      res.json(updated);
    });

    // POST /api/admin/binders/:id/reject
    a.post('/api/admin/binders/:id/reject', authMiddleware, async (req, res) => {
      const user = req.user as any;
      if (!user.isAdmin) {
        return res.status(403).json({ error: 'Admin access required' });
      }
      const id = parseInt(req.params.id);
      const binder = await mockStorage.getBinder(id);
      if (!binder) return res.status(404).json({ message: 'Binder not found' });
      if (binder.status !== 'pending_review') {
        return res.status(400).json({ error: 'Binder is not pending review' });
      }
      const { reason } = req.body;
      if (!reason || typeof reason !== 'string') {
        return res.status(400).json({ error: 'reason is required' });
      }
      const updated = await mockStorage.updateBinder(id, {
        status: 'draft',
        reviewNote: reason,
        submittedAt: null,
        reviewedAt: new Date(),
      });
      res.json(updated);
    });
  }

  beforeAll(() => {
    curatorApp = express();
    curatorApp.use(express.json());
    curatorApp.use((req, _res, next) => { req.user = mockCurator; next(); });
    registerRoutes(curatorApp);

    adminApp = express();
    adminApp.use(express.json());
    adminApp.use((req, _res, next) => { req.user = mockAdmin; next(); });
    registerRoutes(adminApp);

    readerApp = express();
    readerApp.use(express.json());
    readerApp.use((req, _res, next) => { req.user = mockUser; next(); });
    registerRoutes(readerApp);
  });

  beforeEach(() => {
    resetAllMocks();
  });

  // ========== Curator Publish (Submit for Review) ==========

  describe('POST /api/binders/:id/publish (curator - non-admin)', () => {
    it('submits a draft binder for review', async () => {
      const draftBinder = { ...mockBinder, status: 'draft' };
      mockStorage.getBinder.mockResolvedValue(draftBinder);
      mockStorage.updateBinder.mockResolvedValue({ ...draftBinder, status: 'pending_review' });

      const res = await request(curatorApp)
        .post('/api/binders/1/publish')
        .send({ visibility: 'public' });

      expect(res.status).toBe(200);
      expect(mockStorage.updateBinder).toHaveBeenCalledWith(1, expect.objectContaining({
        status: 'pending_review',
        visibility: 'public',
        reviewNote: null,
      }));
    });

    it('publishes a draft binder directly when visibility is unlisted', async () => {
      const draftBinder = { ...mockBinder, status: 'draft' };
      mockStorage.getBinder.mockResolvedValue(draftBinder);
      mockStorage.updateBinder.mockResolvedValue({ ...draftBinder, status: 'published', visibility: 'unlisted' });

      const res = await request(curatorApp)
        .post('/api/binders/1/publish')
        .send({ visibility: 'unlisted' });

      expect(res.status).toBe(200);
      expect(mockStorage.updateBinder).toHaveBeenCalledWith(1, {
        status: 'published',
        visibility: 'unlisted',
      });
    });

    it('publishes a draft binder directly when visibility is private', async () => {
      const draftBinder = { ...mockBinder, status: 'draft' };
      mockStorage.getBinder.mockResolvedValue(draftBinder);
      mockStorage.updateBinder.mockResolvedValue({ ...draftBinder, status: 'published', visibility: 'private' });

      const res = await request(curatorApp)
        .post('/api/binders/1/publish')
        .send({ visibility: 'private' });

      expect(res.status).toBe(200);
      expect(mockStorage.updateBinder).toHaveBeenCalledWith(1, {
        status: 'published',
        visibility: 'private',
      });
    });

    it('withdraws a pending_review binder back to draft', async () => {
      const pendingBinder = { ...mockBinder, status: 'pending_review' };
      mockStorage.getBinder.mockResolvedValue(pendingBinder);
      mockStorage.updateBinder.mockResolvedValue({ ...pendingBinder, status: 'draft' });

      const res = await request(curatorApp)
        .post('/api/binders/1/publish')
        .send({});

      expect(res.status).toBe(200);
      expect(mockStorage.updateBinder).toHaveBeenCalledWith(1, expect.objectContaining({
        status: 'draft',
        submittedAt: null,
      }));
    });

    it('unpublishes a published binder back to draft', async () => {
      const publishedBinder = { ...mockBinder, status: 'published' };
      mockStorage.getBinder.mockResolvedValue(publishedBinder);
      mockStorage.updateBinder.mockResolvedValue({ ...publishedBinder, status: 'draft' });

      const res = await request(curatorApp)
        .post('/api/binders/1/publish')
        .send({});

      expect(res.status).toBe(200);
      expect(mockStorage.updateBinder).toHaveBeenCalledWith(1, { status: 'draft' });
    });

    it('returns 403 for non-owner curator', async () => {
      const otherBinder = { ...mockBinder, curatorId: 'othercurator' };
      mockStorage.getBinder.mockResolvedValue(otherBinder);

      const res = await request(curatorApp)
        .post('/api/binders/1/publish')
        .send({});

      expect(res.status).toBe(403);
    });
  });

  // ========== Admin Publish (Direct) ==========

  describe('POST /api/binders/:id/publish (admin)', () => {
    it('publishes a draft binder directly', async () => {
      const draftBinder = { ...mockBinder, status: 'draft' };
      mockStorage.getBinder.mockResolvedValue(draftBinder);
      mockStorage.updateBinder.mockResolvedValue({ ...draftBinder, status: 'published' });

      const res = await request(adminApp)
        .post('/api/binders/1/publish')
        .send({ visibility: 'public' });

      expect(res.status).toBe(200);
      expect(mockStorage.updateBinder).toHaveBeenCalledWith(1, {
        status: 'published',
        visibility: 'public',
      });
    });

    it('publishes a pending_review binder directly', async () => {
      const pendingBinder = { ...mockBinder, status: 'pending_review' };
      mockStorage.getBinder.mockResolvedValue(pendingBinder);
      mockStorage.updateBinder.mockResolvedValue({ ...pendingBinder, status: 'published' });

      const res = await request(adminApp)
        .post('/api/binders/1/publish')
        .send({ visibility: 'public' });

      expect(res.status).toBe(200);
      expect(mockStorage.updateBinder).toHaveBeenCalledWith(1, {
        status: 'published',
        visibility: 'public',
      });
    });

    it('unpublishes a published binder', async () => {
      const publishedBinder = { ...mockBinder, status: 'published' };
      mockStorage.getBinder.mockResolvedValue(publishedBinder);
      mockStorage.updateBinder.mockResolvedValue({ ...publishedBinder, status: 'draft' });

      const res = await request(adminApp)
        .post('/api/binders/1/publish')
        .send({});

      expect(res.status).toBe(200);
      expect(mockStorage.updateBinder).toHaveBeenCalledWith(1, expect.objectContaining({
        status: 'draft',
      }));
    });
  });

  // ========== Admin Review Queue ==========

  describe('GET /api/admin/review-queue', () => {
    it('returns pending binders for admin', async () => {
      const pendingBinders = [
        { ...mockBinder, status: 'pending_review', submittedAt: new Date() },
      ];
      mockStorage.getBindersByStatus.mockResolvedValue(pendingBinders);

      const res = await request(adminApp).get('/api/admin/review-queue');

      expect(res.status).toBe(200);
      expect(mockStorage.getBindersByStatus).toHaveBeenCalledWith('pending_review');
      expect(res.body).toHaveLength(1);
    });

    it('returns 403 for non-admin', async () => {
      const res = await request(curatorApp).get('/api/admin/review-queue');
      expect(res.status).toBe(403);
    });

    it('returns 403 for regular user', async () => {
      const res = await request(readerApp).get('/api/admin/review-queue');
      expect(res.status).toBe(403);
    });
  });

  // ========== Admin Approve ==========

  describe('POST /api/admin/binders/:id/approve', () => {
    it('approves a pending binder', async () => {
      const pendingBinder = { ...mockBinder, status: 'pending_review' };
      mockStorage.getBinder.mockResolvedValue(pendingBinder);
      mockStorage.updateBinder.mockResolvedValue({ ...pendingBinder, status: 'published' });

      const res = await request(adminApp)
        .post('/api/admin/binders/1/approve')
        .send({});

      expect(res.status).toBe(200);
      expect(mockStorage.updateBinder).toHaveBeenCalledWith(1, {
        status: 'published',
        reviewNote: null,
        reviewedAt: expect.any(Date),
      });
    });

    it('rejects approval of non-pending binder', async () => {
      const draftBinder = { ...mockBinder, status: 'draft' };
      mockStorage.getBinder.mockResolvedValue(draftBinder);

      const res = await request(adminApp)
        .post('/api/admin/binders/1/approve')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Binder is not pending review');
    });

    it('returns 404 for non-existent binder', async () => {
      mockStorage.getBinder.mockResolvedValue(null);

      const res = await request(adminApp)
        .post('/api/admin/binders/999/approve')
        .send({});

      expect(res.status).toBe(404);
    });

    it('returns 403 for non-admin', async () => {
      const res = await request(curatorApp)
        .post('/api/admin/binders/1/approve')
        .send({});

      expect(res.status).toBe(403);
    });
  });

  // ========== Admin Reject ==========

  describe('POST /api/admin/binders/:id/reject', () => {
    it('rejects a pending binder with reason', async () => {
      const pendingBinder = { ...mockBinder, status: 'pending_review' };
      mockStorage.getBinder.mockResolvedValue(pendingBinder);
      mockStorage.updateBinder.mockResolvedValue({ ...pendingBinder, status: 'draft', reviewNote: 'Needs more content' });

      const res = await request(adminApp)
        .post('/api/admin/binders/1/reject')
        .send({ reason: 'Needs more content' });

      expect(res.status).toBe(200);
      expect(mockStorage.updateBinder).toHaveBeenCalledWith(1, {
        status: 'draft',
        reviewNote: 'Needs more content',
        submittedAt: null,
        reviewedAt: expect.any(Date),
      });
    });

    it('requires a reason for rejection', async () => {
      const pendingBinder = { ...mockBinder, status: 'pending_review' };
      mockStorage.getBinder.mockResolvedValue(pendingBinder);

      const res = await request(adminApp)
        .post('/api/admin/binders/1/reject')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('reason is required');
    });

    it('rejects rejection of non-pending binder', async () => {
      const draftBinder = { ...mockBinder, status: 'draft' };
      mockStorage.getBinder.mockResolvedValue(draftBinder);

      const res = await request(adminApp)
        .post('/api/admin/binders/1/reject')
        .send({ reason: 'test' });

      expect(res.status).toBe(400);
    });

    it('returns 403 for non-admin', async () => {
      const res = await request(curatorApp)
        .post('/api/admin/binders/1/reject')
        .send({ reason: 'test' });

      expect(res.status).toBe(403);
    });
  });
});
