import request from 'supertest';
import express from 'express';
import { createServer } from 'http';
import { registerRoutes } from '../routes';
import { storage } from '../storage';
import { resetAllMocks, mockUser, mockCurator, mockProUser, mockAdmin } from './setup/mocks';

const mockStorage = storage as unknown as Record<string, jest.Mock>;

describe('Visibility Enforcement', () => {
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

  // ========== PRIVATE BINDER ACCESS ==========

  describe('Private binder access', () => {
    const privateBinder = {
      id: 1,
      title: 'Private Course',
      visibility: 'private',
      status: 'published',
      curatorId: mockCurator.username,
      weeks: [],
    };

    it('returns 404 for unauthenticated user viewing private binder', async () => {
      mockStorage.getBinderWithContent.mockResolvedValue(privateBinder);
      const res = await request(app).get('/api/binders/1');
      expect(res.status).toBe(404);
    });

    it('returns 404 for non-curator viewing private binder', async () => {
      const authed = await createAuthedApp(mockUser);
      mockStorage.getBinderWithContent.mockResolvedValue(privateBinder);
      const res = await request(authed).get('/api/binders/1');
      expect(res.status).toBe(404);
    });

    it('allows curator to view their own private binder', async () => {
      const authed = await createAuthedApp(mockCurator);
      mockStorage.getBinderWithContent.mockResolvedValue(privateBinder);
      mockStorage.getTagsByBinderId.mockResolvedValue([]);
      mockStorage.listCategories.mockResolvedValue([]);

      const res = await request(authed).get('/api/binders/1');
      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Private Course');
    });
  });

  // ========== UNLISTED BINDER ACCESS ==========

  describe('Unlisted binder access', () => {
    const unlistedBinder = {
      id: 2,
      title: 'Unlisted Course',
      visibility: 'unlisted',
      status: 'published',
      curatorId: mockCurator.username,
      weeks: [],
    };

    it('allows unauthenticated user to view unlisted binder by link', async () => {
      mockStorage.getBinderWithContent.mockResolvedValue(unlistedBinder);
      mockStorage.getTagsByBinderId.mockResolvedValue([]);
      mockStorage.listCategories.mockResolvedValue([]);

      const res = await request(app).get('/api/binders/2');
      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Unlisted Course');
    });

    it('allows any authenticated user to view unlisted binder by link', async () => {
      const authed = await createAuthedApp(mockUser);
      mockStorage.getBinderWithContent.mockResolvedValue(unlistedBinder);
      mockStorage.getTagsByBinderId.mockResolvedValue([]);
      mockStorage.listCategories.mockResolvedValue([]);

      const res = await request(authed).get('/api/binders/2');
      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Unlisted Course');
    });
  });

  // ========== PUBLIC BINDER ACCESS ==========

  describe('Public binder access', () => {
    const publicBinder = {
      id: 3,
      title: 'Public Course',
      visibility: 'public',
      status: 'published',
      curatorId: mockCurator.username,
      weeks: [],
    };

    it('allows anyone to view public binder', async () => {
      mockStorage.getBinderWithContent.mockResolvedValue(publicBinder);
      mockStorage.getTagsByBinderId.mockResolvedValue([]);
      mockStorage.listCategories.mockResolvedValue([]);

      const res = await request(app).get('/api/binders/3');
      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Public Course');
    });
  });

  // ========== ENROLLMENT BLOCKED ON PRIVATE ==========

  describe('Enrollment on private binders', () => {
    it('blocks enrollment on private binder for non-curator', async () => {
      const authed = await createAuthedApp(mockProUser);
      mockStorage.getBinder.mockResolvedValue({
        id: 1, visibility: 'private', curatorId: 'other-curator',
      });

      const res = await request(authed).post('/api/enrollments').send({
        binderId: 1, status: 'in-progress',
      });
      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Binder not found');
    });

    it('allows curator to enroll in their own private binder', async () => {
      // Curator with Pro subscription
      const proCurator = { ...mockCurator, subscriptionStatus: 'pro', stripeCustomerId: 'cus_123' };
      const authed = await createAuthedApp(proCurator);
      mockStorage.getBinder.mockResolvedValue({
        id: 1, visibility: 'private', curatorId: mockCurator.username,
      });
      mockStorage.getEnrollment.mockResolvedValue(null);
      mockStorage.dropActiveEnrollments.mockResolvedValue(undefined);
      mockStorage.createEnrollment.mockResolvedValue({ id: 1, binderId: 1, status: 'in-progress' });

      const res = await request(authed).post('/api/enrollments').send({
        binderId: 1, status: 'in-progress', shareProfile: false,
      });
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(1);
    });

    it('allows enrollment on unlisted binder', async () => {
      const authed = await createAuthedApp(mockProUser);
      mockStorage.getBinder.mockResolvedValue({
        id: 2, visibility: 'unlisted', curatorId: 'other-curator',
      });
      mockStorage.getEnrollment.mockResolvedValue(null);
      mockStorage.dropActiveEnrollments.mockResolvedValue(undefined);
      mockStorage.createEnrollment.mockResolvedValue({ id: 2, binderId: 2, status: 'in-progress' });

      const res = await request(authed).post('/api/enrollments').send({
        binderId: 2, status: 'in-progress', shareProfile: false,
      });
      expect(res.status).toBe(200);
    });

    it('allows enrollment on public binder', async () => {
      const authed = await createAuthedApp(mockProUser);
      mockStorage.getBinder.mockResolvedValue({
        id: 3, visibility: 'public', curatorId: 'other-curator',
      });
      mockStorage.getEnrollment.mockResolvedValue(null);
      mockStorage.dropActiveEnrollments.mockResolvedValue(undefined);
      mockStorage.createEnrollment.mockResolvedValue({ id: 3, binderId: 3, status: 'in-progress' });

      const res = await request(authed).post('/api/enrollments').send({
        binderId: 3, status: 'in-progress', shareProfile: false,
      });
      expect(res.status).toBe(200);
    });
  });
});
