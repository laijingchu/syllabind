import request from 'supertest';
import express from 'express';
import { createServer } from 'http';
import { registerRoutes } from '../routes';
import { storage } from '../storage';
import { resetAllMocks, mockUser, mockCreator, mockProUser, mockAdmin } from './setup/mocks';

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

  // ========== PRIVATE SYLLABIND ACCESS ==========

  describe('Private syllabind access', () => {
    const privateSyllabus = {
      id: 1,
      title: 'Private Course',
      visibility: 'private',
      status: 'published',
      creatorId: mockCreator.username,
      weeks: [],
    };

    it('returns 404 for unauthenticated user viewing private syllabind', async () => {
      mockStorage.getSyllabusWithContent.mockResolvedValue(privateSyllabus);
      const res = await request(app).get('/api/syllabinds/1');
      expect(res.status).toBe(404);
    });

    it('returns 404 for non-creator viewing private syllabind', async () => {
      const authed = await createAuthedApp(mockUser);
      mockStorage.getSyllabusWithContent.mockResolvedValue(privateSyllabus);
      const res = await request(authed).get('/api/syllabinds/1');
      expect(res.status).toBe(404);
    });

    it('allows creator to view their own private syllabind', async () => {
      const authed = await createAuthedApp(mockCreator);
      mockStorage.getSyllabusWithContent.mockResolvedValue(privateSyllabus);
      mockStorage.getTagsBySyllabindId.mockResolvedValue([]);
      mockStorage.listCategories.mockResolvedValue([]);

      const res = await request(authed).get('/api/syllabinds/1');
      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Private Course');
    });
  });

  // ========== UNLISTED SYLLABIND ACCESS ==========

  describe('Unlisted syllabind access', () => {
    const unlistedSyllabus = {
      id: 2,
      title: 'Unlisted Course',
      visibility: 'unlisted',
      status: 'published',
      creatorId: mockCreator.username,
      weeks: [],
    };

    it('allows unauthenticated user to view unlisted syllabind by link', async () => {
      mockStorage.getSyllabusWithContent.mockResolvedValue(unlistedSyllabus);
      mockStorage.getTagsBySyllabindId.mockResolvedValue([]);
      mockStorage.listCategories.mockResolvedValue([]);

      const res = await request(app).get('/api/syllabinds/2');
      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Unlisted Course');
    });

    it('allows any authenticated user to view unlisted syllabind by link', async () => {
      const authed = await createAuthedApp(mockUser);
      mockStorage.getSyllabusWithContent.mockResolvedValue(unlistedSyllabus);
      mockStorage.getTagsBySyllabindId.mockResolvedValue([]);
      mockStorage.listCategories.mockResolvedValue([]);

      const res = await request(authed).get('/api/syllabinds/2');
      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Unlisted Course');
    });
  });

  // ========== PUBLIC SYLLABIND ACCESS ==========

  describe('Public syllabind access', () => {
    const publicSyllabus = {
      id: 3,
      title: 'Public Course',
      visibility: 'public',
      status: 'published',
      creatorId: mockCreator.username,
      weeks: [],
    };

    it('allows anyone to view public syllabind', async () => {
      mockStorage.getSyllabusWithContent.mockResolvedValue(publicSyllabus);
      mockStorage.getTagsBySyllabindId.mockResolvedValue([]);
      mockStorage.listCategories.mockResolvedValue([]);

      const res = await request(app).get('/api/syllabinds/3');
      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Public Course');
    });
  });

  // ========== ENROLLMENT BLOCKED ON PRIVATE ==========

  describe('Enrollment on private syllabinds', () => {
    it('blocks enrollment on private syllabind for non-creator', async () => {
      const authed = await createAuthedApp(mockProUser);
      mockStorage.getSyllabus.mockResolvedValue({
        id: 1, visibility: 'private', creatorId: 'other-creator',
      });

      const res = await request(authed).post('/api/enrollments').send({
        syllabusId: 1, status: 'in-progress',
      });
      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Syllabind not found');
    });

    it('allows creator to enroll in their own private syllabind', async () => {
      // Creator with Pro subscription
      const proCreator = { ...mockCreator, subscriptionStatus: 'pro', stripeCustomerId: 'cus_123' };
      const authed = await createAuthedApp(proCreator);
      mockStorage.getSyllabus.mockResolvedValue({
        id: 1, visibility: 'private', creatorId: mockCreator.username,
      });
      mockStorage.getEnrollment.mockResolvedValue(null);
      mockStorage.dropActiveEnrollments.mockResolvedValue(undefined);
      mockStorage.createEnrollment.mockResolvedValue({ id: 1, syllabusId: 1, status: 'in-progress' });

      const res = await request(authed).post('/api/enrollments').send({
        syllabusId: 1, status: 'in-progress', shareProfile: false,
      });
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(1);
    });

    it('allows enrollment on unlisted syllabind', async () => {
      const authed = await createAuthedApp(mockProUser);
      mockStorage.getSyllabus.mockResolvedValue({
        id: 2, visibility: 'unlisted', creatorId: 'other-creator',
      });
      mockStorage.getEnrollment.mockResolvedValue(null);
      mockStorage.dropActiveEnrollments.mockResolvedValue(undefined);
      mockStorage.createEnrollment.mockResolvedValue({ id: 2, syllabusId: 2, status: 'in-progress' });

      const res = await request(authed).post('/api/enrollments').send({
        syllabusId: 2, status: 'in-progress', shareProfile: false,
      });
      expect(res.status).toBe(200);
    });

    it('allows enrollment on public syllabind', async () => {
      const authed = await createAuthedApp(mockProUser);
      mockStorage.getSyllabus.mockResolvedValue({
        id: 3, visibility: 'public', creatorId: 'other-creator',
      });
      mockStorage.getEnrollment.mockResolvedValue(null);
      mockStorage.dropActiveEnrollments.mockResolvedValue(undefined);
      mockStorage.createEnrollment.mockResolvedValue({ id: 3, syllabusId: 3, status: 'in-progress' });

      const res = await request(authed).post('/api/enrollments').send({
        syllabusId: 3, status: 'in-progress', shareProfile: false,
      });
      expect(res.status).toBe(200);
    });
  });
});
