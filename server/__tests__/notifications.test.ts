import request from 'supertest';
import express from 'express';
import { resetAllMocks, mockStorage, mockCurator, mockAdmin, mockUser } from './setup/mocks';

describe('Notification Endpoints', () => {
  let curatorApp: express.Express;
  let adminApp: express.Express;
  let unauthApp: express.Express;

  function registerRoutes(a: express.Express) {
    const authMiddleware = (req: any, res: any, next: any) => {
      if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
      next();
    };

    // GET /api/notifications/status
    a.get('/api/notifications/status', authMiddleware, async (req, res) => {
      const user = req.user as any;
      const dbUser = await mockStorage.getUser(user.id);
      if (!dbUser) return res.status(404).json({ message: 'User not found' });

      const ackedAt = dbUser.notificationsAckedAt || null;

      if (user.isAdmin) {
        const pendingCount = await mockStorage.getAdminUnreadCount(ackedAt);
        return res.json({
          hasUnread: pendingCount > 0,
          pendingCount,
          items: [],
        });
      }

      const unread = await mockStorage.getCuratorUnreadNotifications(dbUser.username, ackedAt);
      const items = unread.map((n: any) => ({
        binderId: n.binderId,
        title: n.title,
        type: n.status === 'published' ? 'approved' : 'rejected',
      }));

      res.json({
        hasUnread: items.length > 0,
        pendingCount: 0,
        items,
      });
    });

    // POST /api/notifications/acknowledge
    a.post('/api/notifications/acknowledge', authMiddleware, async (req, res) => {
      const userId = (req.user as any).id;
      await mockStorage.acknowledgeNotifications(userId);
      res.json({ success: true });
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

    unauthApp = express();
    unauthApp.use(express.json());
    registerRoutes(unauthApp);
  });

  beforeEach(() => {
    resetAllMocks();
  });

  // ========== GET /api/notifications/status ==========

  describe('GET /api/notifications/status (curator)', () => {
    it('returns no unread when no reviewed binders', async () => {
      mockStorage.getUser.mockResolvedValue({ ...mockCurator, notificationsAckedAt: null });
      mockStorage.getCuratorUnreadNotifications.mockResolvedValue([]);

      const res = await request(curatorApp).get('/api/notifications/status');

      expect(res.status).toBe(200);
      expect(res.body.hasUnread).toBe(false);
      expect(res.body.items).toHaveLength(0);
    });

    it('returns unread items when binders have been reviewed', async () => {
      mockStorage.getUser.mockResolvedValue({ ...mockCurator, notificationsAckedAt: null });
      mockStorage.getCuratorUnreadNotifications.mockResolvedValue([
        { binderId: 1, title: 'Test Binder', status: 'published', reviewNote: null },
        { binderId: 2, title: 'Rejected Binder', status: 'draft', reviewNote: 'Needs work' },
      ]);

      const res = await request(curatorApp).get('/api/notifications/status');

      expect(res.status).toBe(200);
      expect(res.body.hasUnread).toBe(true);
      expect(res.body.items).toHaveLength(2);
      expect(res.body.items[0]).toEqual({
        binderId: 1,
        title: 'Test Binder',
        type: 'approved',
      });
      expect(res.body.items[1]).toEqual({
        binderId: 2,
        title: 'Rejected Binder',
        type: 'rejected',
      });
    });

    it('passes ackedAt to storage method', async () => {
      const ackedDate = new Date('2026-02-01');
      mockStorage.getUser.mockResolvedValue({ ...mockCurator, notificationsAckedAt: ackedDate });
      mockStorage.getCuratorUnreadNotifications.mockResolvedValue([]);

      await request(curatorApp).get('/api/notifications/status');

      expect(mockStorage.getCuratorUnreadNotifications).toHaveBeenCalledWith(
        mockCurator.username,
        ackedDate,
      );
    });
  });

  describe('GET /api/notifications/status (admin)', () => {
    it('returns pending count for admin', async () => {
      mockStorage.getUser.mockResolvedValue({ ...mockAdmin, notificationsAckedAt: null });
      mockStorage.getAdminUnreadCount.mockResolvedValue(3);

      const res = await request(adminApp).get('/api/notifications/status');

      expect(res.status).toBe(200);
      expect(res.body.hasUnread).toBe(true);
      expect(res.body.pendingCount).toBe(3);
      expect(res.body.items).toHaveLength(0);
    });

    it('returns no unread when no pending binders', async () => {
      mockStorage.getUser.mockResolvedValue({ ...mockAdmin, notificationsAckedAt: null });
      mockStorage.getAdminUnreadCount.mockResolvedValue(0);

      const res = await request(adminApp).get('/api/notifications/status');

      expect(res.status).toBe(200);
      expect(res.body.hasUnread).toBe(false);
      expect(res.body.pendingCount).toBe(0);
    });
  });

  describe('GET /api/notifications/status (unauthenticated)', () => {
    it('returns 401', async () => {
      const res = await request(unauthApp).get('/api/notifications/status');
      expect(res.status).toBe(401);
    });
  });

  // ========== POST /api/notifications/acknowledge ==========

  describe('POST /api/notifications/acknowledge', () => {
    it('calls acknowledgeNotifications with user id', async () => {
      const res = await request(curatorApp)
        .post('/api/notifications/acknowledge')
        .send({});

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockStorage.acknowledgeNotifications).toHaveBeenCalledWith(mockCurator.id);
    });

    it('works for admin users', async () => {
      const res = await request(adminApp)
        .post('/api/notifications/acknowledge')
        .send({});

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockStorage.acknowledgeNotifications).toHaveBeenCalledWith(mockAdmin.id);
    });

    it('returns 401 for unauthenticated', async () => {
      const res = await request(unauthApp)
        .post('/api/notifications/acknowledge')
        .send({});

      expect(res.status).toBe(401);
    });
  });
});
