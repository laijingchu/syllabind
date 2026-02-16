/**
 * Email Auth Coverage Tests
 *
 * Tests uncovered paths in server/auth/emailAuth.ts:
 * - Login success path (user found, password valid)
 * - Login with invalid password
 * - /api/auth/me with user found in db
 * - /api/auth/me error path
 * - Logout session.destroy error
 * - comparePassword function
 * - Register with existing email (duplicate)
 *
 * Uses a controllable db mock for sequential query returns.
 */

const mockDbResult = jest.fn().mockResolvedValue([]);

function createControllableProxy() {
  const handler: ProxyHandler<object> = {
    get(_target, prop) {
      if (prop === 'then') {
        const result = mockDbResult();
        return result.then.bind(result);
      }
      return jest.fn().mockReturnValue(new Proxy({}, handler));
    },
  };
  return new Proxy({}, handler);
}

jest.mock('../db', () => ({
  db: createControllableProxy(),
  pool: { connect: jest.fn(), query: jest.fn(), end: jest.fn() },
}));

// Unmock emailAuth to get real handlers
jest.unmock('../auth/emailAuth');

// Keep bcrypt mocked but make compare controllable
const mockBcryptCompare = jest.fn().mockResolvedValue(true);
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('$2a$10$hashedpassword'),
  compare: (...args: any[]) => mockBcryptCompare(...args),
  genSalt: jest.fn().mockResolvedValue('$2a$10$salt'),
}));

import express from 'express';
import request from 'supertest';
import { registerEmailAuthRoutes } from '../auth/emailAuth';

const mockUser = {
  id: 'user-123',
  username: 'testuser',
  name: 'Test User',
  email: 'test@example.com',
  password: '$2a$10$hashedpassword',
  replitId: null,
  googleId: null,
  appleId: null,
  isCreator: false,
  bio: null,
  expertise: null,
  avatarUrl: null,
  linkedin: null,
  website: null,
  twitter: null,
  threads: null,
  shareProfile: false,
  authProvider: 'email',
};

describe('Email Auth Coverage', () => {
  let app: express.Express;
  let sessionStore: Record<string, any>;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    // Session middleware that supports controllable state
    app.use((req: any, _res, next) => {
      if (!req.session) {
        sessionStore = {
          userId: null,
          destroy: jest.fn((cb: any) => cb && cb()),
        };
        req.session = sessionStore;
      }
      next();
    });
    registerEmailAuthRoutes(app);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockDbResult.mockResolvedValue([]);
    mockBcryptCompare.mockResolvedValue(true);
  });

  describe('POST /api/auth/register', () => {
    it('returns 400 when email already exists', async () => {
      // Select for existing user returns a user
      mockDbResult.mockResolvedValueOnce([mockUser]);

      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@example.com', password: 'pass123', name: 'Test' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('already registered');
    });

    it('returns user data on successful registration', async () => {
      // Check existing user → not found
      mockDbResult.mockResolvedValueOnce([]);
      // Insert new user → returns created user
      const newUser = { ...mockUser, id: 'new-user-id' };
      mockDbResult.mockResolvedValueOnce([newUser]);

      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'new@example.com', password: 'pass123', name: 'New User' });

      expect(res.status).toBe(200);
      expect(res.body.username).toBe('testuser');
      expect(res.body.password).toBeUndefined();
    });
  });

  describe('POST /api/auth/login', () => {
    it('returns user data on successful login', async () => {
      // Select user by email → found
      mockDbResult.mockResolvedValueOnce([mockUser]);
      mockBcryptCompare.mockResolvedValueOnce(true);

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'correctpassword' });

      expect(res.status).toBe(200);
      expect(res.body.username).toBe('testuser');
      expect(res.body.password).toBeUndefined();
    });

    it('returns 401 when password is invalid', async () => {
      mockDbResult.mockResolvedValueOnce([mockUser]);
      mockBcryptCompare.mockResolvedValueOnce(false);

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'wrongpassword' });

      expect(res.status).toBe(401);
      expect(res.body.message).toContain('Invalid');
    });

    it('returns 401 when user has no password (OAuth user)', async () => {
      const oauthUser = { ...mockUser, password: null };
      mockDbResult.mockResolvedValueOnce([oauthUser]);

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'password' });

      expect(res.status).toBe(401);
    });

    it('returns 500 on internal error', async () => {
      mockDbResult.mockRejectedValueOnce(new Error('DB error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'pass' });

      expect(res.status).toBe(500);
      expect(res.body.message).toContain('Login failed');
      consoleSpy.mockRestore();
    });
  });

  describe('GET /api/auth/me', () => {
    it('returns user data when session has valid userId', async () => {
      // Override session middleware for this test
      const meApp = express();
      meApp.use(express.json());
      meApp.use((req: any, _res, next) => {
        req.session = { userId: 'user-123', destroy: jest.fn() };
        next();
      });
      registerEmailAuthRoutes(meApp);

      mockDbResult.mockResolvedValueOnce([mockUser]);

      const res = await request(meApp).get('/api/auth/me');

      expect(res.status).toBe(200);
      expect(res.body.username).toBe('testuser');
      expect(res.body.password).toBeUndefined();
    });

    it('returns 401 when user not found in db', async () => {
      const meApp = express();
      meApp.use(express.json());
      meApp.use((req: any, _res, next) => {
        req.session = { userId: 'deleted-user', destroy: jest.fn() };
        next();
      });
      registerEmailAuthRoutes(meApp);

      mockDbResult.mockResolvedValueOnce([]);

      const res = await request(meApp).get('/api/auth/me');
      expect(res.status).toBe(401);
    });

    it('returns 500 on db error', async () => {
      const meApp = express();
      meApp.use(express.json());
      meApp.use((req: any, _res, next) => {
        req.session = { userId: 'user-123', destroy: jest.fn() };
        next();
      });
      registerEmailAuthRoutes(meApp);

      mockDbResult.mockRejectedValueOnce(new Error('DB error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const res = await request(meApp).get('/api/auth/me');
      expect(res.status).toBe(500);
      expect(res.body.message).toContain('Failed to get user');
      consoleSpy.mockRestore();
    });
  });

  describe('POST /api/auth/logout', () => {
    it('returns 500 when session destroy fails', async () => {
      const logoutApp = express();
      logoutApp.use(express.json());
      logoutApp.use((req: any, _res, next) => {
        req.session = {
          destroy: jest.fn((cb: any) => cb(new Error('session error'))),
        };
        next();
      });
      registerEmailAuthRoutes(logoutApp);

      const res = await request(logoutApp).post('/api/auth/logout');
      expect(res.status).toBe(500);
      expect(res.body.message).toContain('Logout failed');
    });
  });
});
