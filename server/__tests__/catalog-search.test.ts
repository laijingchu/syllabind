import request from 'supertest';
import express from 'express';
import { createServer } from 'http';
import { registerRoutes } from '../routes';
import { storage } from '../storage';
import { resetAllMocks, mockUser, mockCreator, mockAdmin } from './setup/mocks';

const mockStorage = storage as unknown as Record<string, jest.Mock>;

describe('Catalog Search & Categories/Tags', () => {
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

  // ========== CATEGORIES ==========

  describe('GET /api/categories', () => {
    it('returns all categories', async () => {
      const categories = [
        { id: 1, name: 'Technology', slug: 'technology', displayOrder: 0 },
        { id: 2, name: 'Design', slug: 'design', displayOrder: 1 },
      ];
      mockStorage.listCategories.mockResolvedValue(categories);
      const res = await request(app).get('/api/categories');
      expect(res.status).toBe(200);
      expect(res.body).toEqual(categories);
      expect(mockStorage.listCategories).toHaveBeenCalled();
    });

    it('returns empty array when no categories exist', async () => {
      mockStorage.listCategories.mockResolvedValue([]);
      const res = await request(app).get('/api/categories');
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });
  });

  // ========== TAGS ==========

  describe('GET /api/tags', () => {
    it('returns all tags without query', async () => {
      const tags = [
        { id: 1, name: 'javascript', slug: 'javascript' },
        { id: 2, name: 'design', slug: 'design' },
      ];
      mockStorage.listTags.mockResolvedValue(tags);
      const res = await request(app).get('/api/tags');
      expect(res.status).toBe(200);
      expect(res.body).toEqual(tags);
      expect(mockStorage.listTags).toHaveBeenCalledWith(undefined);
    });

    it('passes query parameter for tag search', async () => {
      mockStorage.listTags.mockResolvedValue([{ id: 1, name: 'javascript', slug: 'javascript' }]);
      const res = await request(app).get('/api/tags?q=java');
      expect(res.status).toBe(200);
      expect(mockStorage.listTags).toHaveBeenCalledWith('java');
    });
  });

  describe('PUT /api/syllabinds/:id/tags', () => {
    it('returns 401 when not authenticated', async () => {
      const res = await request(app).put('/api/syllabinds/1/tags').send({ tags: ['test'] });
      expect(res.status).toBe(401);
    });

    it('sets tags for owned syllabind', async () => {
      const authed = await createAuthedApp(mockCreator);
      mockStorage.getSyllabus.mockResolvedValue({ id: 1, creatorId: mockCreator.username });
      const resultTags = [
        { id: 1, name: 'react', slug: 'react' },
        { id: 2, name: 'typescript', slug: 'typescript' },
      ];
      mockStorage.setSyllabindTags.mockResolvedValue(resultTags);

      const res = await request(authed).put('/api/syllabinds/1/tags').send({ tags: ['react', 'typescript'] });
      expect(res.status).toBe(200);
      expect(res.body).toEqual(resultTags);
      expect(mockStorage.setSyllabindTags).toHaveBeenCalledWith(1, ['react', 'typescript']);
    });

    it('returns 403 when not syllabind owner', async () => {
      const authed = await createAuthedApp(mockUser);
      mockStorage.getSyllabus.mockResolvedValue({ id: 1, creatorId: 'other-creator' });
      const res = await request(authed).put('/api/syllabinds/1/tags').send({ tags: ['test'] });
      expect(res.status).toBe(403);
    });

    it('allows admin to set tags on any syllabind', async () => {
      const authed = await createAuthedApp(mockAdmin);
      mockStorage.getSyllabus.mockResolvedValue({ id: 1, creatorId: 'other-creator' });
      mockStorage.setSyllabindTags.mockResolvedValue([]);
      const res = await request(authed).put('/api/syllabinds/1/tags').send({ tags: [] });
      expect(res.status).toBe(200);
    });

    it('returns 400 when tags is not an array', async () => {
      const authed = await createAuthedApp(mockCreator);
      mockStorage.getSyllabus.mockResolvedValue({ id: 1, creatorId: mockCreator.username });
      const res = await request(authed).put('/api/syllabinds/1/tags').send({ tags: 'not-array' });
      expect(res.status).toBe(400);
    });

    it('returns 400 when more than 5 tags', async () => {
      const authed = await createAuthedApp(mockCreator);
      mockStorage.getSyllabus.mockResolvedValue({ id: 1, creatorId: mockCreator.username });
      const res = await request(authed).put('/api/syllabinds/1/tags').send({
        tags: ['a', 'b', 'c', 'd', 'e', 'f'],
      });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Maximum 5 tags');
    });

    it('returns 404 when syllabind not found', async () => {
      const authed = await createAuthedApp(mockCreator);
      mockStorage.getSyllabus.mockResolvedValue(null);
      const res = await request(authed).put('/api/syllabinds/1/tags').send({ tags: ['test'] });
      expect(res.status).toBe(404);
    });
  });

  // ========== CATALOG SEARCH ==========

  describe('GET /api/syllabinds?catalog=true', () => {
    it('routes to searchCatalog when catalog=true', async () => {
      const catalogResult = {
        syllabinds: [{ id: 1, title: 'Test', visibility: 'public', status: 'published' }],
        total: 1,
      };
      mockStorage.searchCatalog.mockResolvedValue(catalogResult);

      const res = await request(app).get('/api/syllabinds?catalog=true');
      expect(res.status).toBe(200);
      expect(res.body).toEqual(catalogResult);
      expect(mockStorage.searchCatalog).toHaveBeenCalledWith({
        query: undefined,
        category: undefined,
        level: undefined,
        visibility: 'public',
        sort: 'newest',
        limit: 20,
        offset: 0,
      });
    });

    it('passes visibility filter to searchCatalog', async () => {
      mockStorage.searchCatalog.mockResolvedValue({ syllabinds: [], total: 0 });
      await request(app).get('/api/syllabinds?catalog=true&visibility=unlisted');
      expect(mockStorage.searchCatalog).toHaveBeenCalledWith(
        expect.objectContaining({ visibility: 'unlisted' }),
      );
    });

    it('defaults to public for invalid visibility values', async () => {
      mockStorage.searchCatalog.mockResolvedValue({ syllabinds: [], total: 0 });
      await request(app).get('/api/syllabinds?catalog=true&visibility=invalid');
      expect(mockStorage.searchCatalog).toHaveBeenCalledWith(
        expect.objectContaining({ visibility: 'public' }),
      );
    });

    it('passes search query to searchCatalog', async () => {
      mockStorage.searchCatalog.mockResolvedValue({ syllabinds: [], total: 0 });
      await request(app).get('/api/syllabinds?catalog=true&q=javascript');
      expect(mockStorage.searchCatalog).toHaveBeenCalledWith(
        expect.objectContaining({ query: 'javascript' }),
      );
    });

    it('passes category filter to searchCatalog', async () => {
      mockStorage.searchCatalog.mockResolvedValue({ syllabinds: [], total: 0 });
      await request(app).get('/api/syllabinds?catalog=true&category=technology');
      expect(mockStorage.searchCatalog).toHaveBeenCalledWith(
        expect.objectContaining({ category: 'technology' }),
      );
    });

    it('passes level filter to searchCatalog', async () => {
      mockStorage.searchCatalog.mockResolvedValue({ syllabinds: [], total: 0 });
      await request(app).get('/api/syllabinds?catalog=true&level=Beginner');
      expect(mockStorage.searchCatalog).toHaveBeenCalledWith(
        expect.objectContaining({ level: 'Beginner' }),
      );
    });

    it('passes sort option to searchCatalog', async () => {
      mockStorage.searchCatalog.mockResolvedValue({ syllabinds: [], total: 0 });
      await request(app).get('/api/syllabinds?catalog=true&sort=popular');
      expect(mockStorage.searchCatalog).toHaveBeenCalledWith(
        expect.objectContaining({ sort: 'popular' }),
      );
    });

    it('clamps limit to 50', async () => {
      mockStorage.searchCatalog.mockResolvedValue({ syllabinds: [], total: 0 });
      await request(app).get('/api/syllabinds?catalog=true&limit=100');
      expect(mockStorage.searchCatalog).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 50 }),
      );
    });

    it('passes offset for pagination', async () => {
      mockStorage.searchCatalog.mockResolvedValue({ syllabinds: [], total: 0 });
      await request(app).get('/api/syllabinds?catalog=true&offset=20');
      expect(mockStorage.searchCatalog).toHaveBeenCalledWith(
        expect.objectContaining({ offset: 20 }),
      );
    });

    it('combines multiple filters', async () => {
      mockStorage.searchCatalog.mockResolvedValue({ syllabinds: [], total: 0 });
      await request(app).get('/api/syllabinds?catalog=true&q=design&category=arts&level=Advanced&visibility=private&sort=relevance&limit=10&offset=5');
      expect(mockStorage.searchCatalog).toHaveBeenCalledWith({
        query: 'design',
        category: 'arts',
        level: 'Advanced',
        visibility: 'private',
        sort: 'relevance',
        limit: 10,
        offset: 5,
      });
    });
  });

  describe('GET /api/syllabinds (without catalog flag)', () => {
    it('returns all syllabinds via listSyllabinds', async () => {
      const syllabinds = [{ id: 1, title: 'Test' }];
      mockStorage.listSyllabinds.mockResolvedValue(syllabinds);
      const res = await request(app).get('/api/syllabinds');
      expect(res.status).toBe(200);
      expect(res.body).toEqual(syllabinds);
      expect(mockStorage.searchCatalog).not.toHaveBeenCalled();
    });
  });

  // ========== SYLLABIND DETAIL WITH TAGS/CATEGORY ==========

  describe('GET /api/syllabinds/:id (tags and category attachment)', () => {
    it('attaches tags and category to response', async () => {
      const syllabus = { id: 1, title: 'Test', categoryId: 2, visibility: 'public', weeks: [] };
      const tags = [{ id: 1, name: 'react', slug: 'react' }];
      const categories = [
        { id: 1, name: 'Tech', slug: 'tech' },
        { id: 2, name: 'Design', slug: 'design' },
      ];
      mockStorage.getSyllabusWithContent.mockResolvedValue(syllabus);
      mockStorage.getTagsBySyllabindId.mockResolvedValue(tags);
      mockStorage.listCategories.mockResolvedValue(categories);

      const res = await request(app).get('/api/syllabinds/1');
      expect(res.status).toBe(200);
      expect(res.body.tags).toEqual(tags);
      expect(res.body.category).toEqual({ id: 2, name: 'Design', slug: 'design' });
    });

    it('returns null category when categoryId is not set', async () => {
      const syllabus = { id: 1, title: 'Test', categoryId: null, visibility: 'public', weeks: [] };
      mockStorage.getSyllabusWithContent.mockResolvedValue(syllabus);
      mockStorage.getTagsBySyllabindId.mockResolvedValue([]);
      mockStorage.listCategories.mockResolvedValue([]);

      const res = await request(app).get('/api/syllabinds/1');
      expect(res.status).toBe(200);
      expect(res.body.category).toBeNull();
      expect(res.body.tags).toEqual([]);
    });
  });

  // ========== PUBLISH WITH VISIBILITY ==========

  describe('POST /api/syllabinds/:id/publish (visibility)', () => {
    it('publishes with default public visibility', async () => {
      const authed = await createAuthedApp(mockCreator);
      mockStorage.getSyllabus.mockResolvedValue({
        id: 1, creatorId: mockCreator.username, status: 'draft', visibility: 'public',
      });
      mockStorage.updateSyllabus.mockResolvedValue({ id: 1, status: 'published', visibility: 'public' });

      const res = await request(authed).post('/api/syllabinds/1/publish');
      expect(res.status).toBe(200);
      expect(mockStorage.updateSyllabus).toHaveBeenCalledWith(1, { status: 'published', visibility: 'public' });
    });

    it('publishes with custom visibility', async () => {
      const authed = await createAuthedApp(mockCreator);
      mockStorage.getSyllabus.mockResolvedValue({
        id: 1, creatorId: mockCreator.username, status: 'draft', visibility: 'public',
      });
      mockStorage.updateSyllabus.mockResolvedValue({ id: 1, status: 'published', visibility: 'unlisted' });

      const res = await request(authed).post('/api/syllabinds/1/publish').send({ visibility: 'unlisted' });
      expect(res.status).toBe(200);
      expect(mockStorage.updateSyllabus).toHaveBeenCalledWith(1, { status: 'published', visibility: 'unlisted' });
    });

    it('preserves existing visibility on unpublish', async () => {
      const authed = await createAuthedApp(mockCreator);
      mockStorage.getSyllabus.mockResolvedValue({
        id: 1, creatorId: mockCreator.username, status: 'published', visibility: 'unlisted',
      });
      mockStorage.updateSyllabus.mockResolvedValue({ id: 1, status: 'draft', visibility: 'unlisted' });

      const res = await request(authed).post('/api/syllabinds/1/publish');
      expect(res.status).toBe(200);
      expect(mockStorage.updateSyllabus).toHaveBeenCalledWith(1, { status: 'draft', visibility: 'unlisted' });
    });
  });
});
