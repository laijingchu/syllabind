import request from 'supertest';
import express from 'express';
import { resetAllMocks, mockStorage, mockUser, mockCreator } from './setup/mocks';

describe('User Routes', () => {
  let app: express.Express;
  let authedApp: express.Express;

  // Helper to create an app with auth middleware injecting a given user
  function createAuthedApp(user: any) {
    const a = express();
    a.use(express.json());
    a.use((req, _res, next) => {
      req.user = user;
      (req as any).session = { userId: user.id };
      next();
    });
    registerRoutes(a);
    return a;
  }

  function registerRoutes(a: express.Express) {
    // GET /api/users/:username — public profile
    a.get('/api/users/:username', async (req, res) => {
      const user = await mockStorage.getUserByUsername(req.params.username);
      if (!user) return res.status(404).json({ message: 'User not found' });

      if (!user.shareProfile) {
        return res.json({
          username: user.username,
          name: user.name,
          avatarUrl: user.avatarUrl
        });
      }

      const { password, email, ...publicProfile } = user;
      res.json(publicProfile);
    });

    // PUT /api/users/me — update profile (auth required)
    a.put('/api/users/me', (req, res, next) => {
      if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
      next();
    }, async (req, res) => {
      const userId = (req.user as any).id;

      if (req.body.avatarUrl && typeof req.body.avatarUrl === 'string' && req.body.avatarUrl.startsWith('blob:')) {
        return res.status(400).json({ message: 'Invalid avatar URL: blob URLs are not allowed' });
      }

      const allowedFields = ['name', 'bio', 'expertise', 'linkedin', 'website', 'twitter', 'threads', 'shareProfile', 'avatarUrl'] as const;
      const profileUpdate: Record<string, any> = {};
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          profileUpdate[field] = req.body[field];
        }
      }

      const updated = await mockStorage.updateUser(userId, profileUpdate);
      const { password, ...userWithoutPassword } = updated;
      res.json(userWithoutPassword);
    });

    // POST /api/users/me/toggle-creator — toggle creator mode (auth required)
    a.post('/api/users/me/toggle-creator', (req, res, next) => {
      if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
      next();
    }, async (req, res) => {
      const userId = (req.user as any).id;
      const user = await mockStorage.getUser(userId);
      if (!user) return res.status(404).json({ message: 'User not found' });

      const updated = await mockStorage.updateUser(userId, { isCreator: !user.isCreator });
      const { password, ...userWithoutPassword } = updated;
      res.json(userWithoutPassword);
    });
  }

  beforeAll(() => {
    app = express();
    app.use(express.json());
    registerRoutes(app);

    authedApp = createAuthedApp(mockUser);
  });

  beforeEach(() => {
    resetAllMocks();
  });

  describe('GET /api/users/:username', () => {
    it('should return limited profile when shareProfile is false', async () => {
      const privateUser = { ...mockUser, password: 'hashed', shareProfile: false };
      mockStorage.getUserByUsername.mockResolvedValue(privateUser);

      const res = await request(app).get('/api/users/testuser').expect(200);

      expect(res.body).toEqual({
        username: 'testuser',
        name: 'Test User',
        avatarUrl: null
      });
      expect(res.body.email).toBeUndefined();
      expect(res.body.bio).toBeUndefined();
    });

    it('should return full public profile when shareProfile is true', async () => {
      const publicUser = { ...mockCreator, password: 'hashed', email: 'creator@example.com', shareProfile: true };
      mockStorage.getUserByUsername.mockResolvedValue(publicUser);

      const res = await request(app).get('/api/users/testcreator').expect(200);

      expect(res.body.username).toBe('testcreator');
      expect(res.body.bio).toBe('Test creator bio');
      expect(res.body.password).toBeUndefined();
      expect(res.body.email).toBeUndefined();
    });

    it('should return 404 when user not found', async () => {
      mockStorage.getUserByUsername.mockResolvedValue(null);

      const res = await request(app).get('/api/users/nobody').expect(404);
      expect(res.body.message).toBe('User not found');
    });
  });

  describe('PUT /api/users/me', () => {
    it('should update allowed fields only', async () => {
      const updatedUser = { ...mockUser, name: 'New Name', password: 'hashed' };
      mockStorage.updateUser.mockResolvedValue(updatedUser);

      const res = await request(authedApp)
        .put('/api/users/me')
        .send({ name: 'New Name', id: 'hack-attempt' })
        .expect(200);

      expect(mockStorage.updateUser).toHaveBeenCalledWith(
        mockUser.id,
        { name: 'New Name' }
      );
      expect(res.body.password).toBeUndefined();
    });

    it('should reject blob URLs for avatarUrl', async () => {
      const res = await request(authedApp)
        .put('/api/users/me')
        .send({ avatarUrl: 'blob:http://localhost/abc' })
        .expect(400);

      expect(res.body.message).toContain('blob URLs');
    });

    it('should return 401 when not authenticated', async () => {
      await request(app)
        .put('/api/users/me')
        .send({ name: 'New Name' })
        .expect(401);
    });
  });

  describe('POST /api/users/me/toggle-creator', () => {
    it('should toggle isCreator flag', async () => {
      const userWithPassword = { ...mockUser, password: 'hashed', isCreator: false };
      mockStorage.getUser.mockResolvedValue(userWithPassword);
      mockStorage.updateUser.mockResolvedValue({ ...userWithPassword, isCreator: true });

      const res = await request(authedApp)
        .post('/api/users/me/toggle-creator')
        .expect(200);

      expect(mockStorage.updateUser).toHaveBeenCalledWith(mockUser.id, { isCreator: true });
      expect(res.body.isCreator).toBe(true);
      expect(res.body.password).toBeUndefined();
    });

    it('should return 404 if user not found', async () => {
      mockStorage.getUser.mockResolvedValue(null);

      await request(authedApp)
        .post('/api/users/me/toggle-creator')
        .expect(404);
    });

    it('should return 401 when not authenticated', async () => {
      await request(app)
        .post('/api/users/me/toggle-creator')
        .expect(401);
    });
  });
});
