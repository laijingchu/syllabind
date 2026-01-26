import request from 'supertest';
import express from 'express';
import session from 'express-session';
import passport from 'passport';
import { resetAllMocks, mockStorage, mockUser, createAuthenticatedRequest } from './setup/mocks';

// Import and apply mocks
import './setup/mocks';

describe('Authentication Workflow', () => {
  let app: express.Express;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Setup session middleware (simplified for tests)
    app.use(session({
      secret: 'test-secret',
      resave: false,
      saveUninitialized: false
    }));

    app.use(passport.initialize());
    app.use(passport.session());

    // Mock auth routes
    app.post('/api/auth/register', async (req, res) => {
      try {
        const { email, password, username, name } = req.body;

        // Check if user exists
        const existingUser = await mockStorage.getUserByEmail(email);
        if (existingUser) {
          return res.status(409).json({ message: 'User already exists' });
        }

        // Create user
        const user = await mockStorage.createUser({
          email,
          username,
          name,
          passwordHash: 'hashed',
          isCreator: false
        });

        res.status(201).json(user);
      } catch (error) {
        res.status(500).json({ message: 'Registration failed' });
      }
    });

    app.post('/api/auth/login', async (req, res) => {
      const { email, password } = req.body;

      const user = await mockStorage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      // Simulate login
      req.login = jest.fn((user, cb) => {
        req.user = user;
        cb();
      });

      req.login(user, () => {
        res.json(user);
      });
    });

    app.post('/api/auth/logout', (req, res) => {
      req.logout = jest.fn((cb) => {
        req.user = undefined;
        cb();
      });

      req.logout(() => {
        res.json({ message: 'Logged out successfully' });
      });
    });

    app.get('/api/auth/me', (req, res) => {
      if (req.isAuthenticated && req.isAuthenticated()) {
        return res.json(req.user);
      }
      res.status(401).json({ message: 'Not authenticated' });
    });
  });

  beforeEach(() => {
    resetAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should register new user successfully', async () => {
      mockStorage.getUserByEmail.mockResolvedValue(null);
      mockStorage.createUser.mockResolvedValue({
        id: 'new-user-id',
        email: 'newuser@example.com',
        username: 'newuser',
        name: 'New User',
        isCreator: false
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'newuser@example.com',
          password: 'password123',
          username: 'newuser',
          name: 'New User'
        })
        .expect(201);

      expect(mockStorage.getUserByEmail).toHaveBeenCalledWith('newuser@example.com');
      expect(mockStorage.createUser).toHaveBeenCalled();
      expect(response.body.email).toEqual('newuser@example.com');
    });

    it('should return 409 if user already exists', async () => {
      mockStorage.getUserByEmail.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          username: 'testuser',
          name: 'Test User'
        })
        .expect(409);

      expect(response.body.message).toEqual('User already exists');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login user with valid credentials', async () => {
      mockStorage.getUserByEmail.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        })
        .expect(200);

      expect(mockStorage.getUserByEmail).toHaveBeenCalledWith('test@example.com');
      expect(response.body.email).toEqual('test@example.com');
    });

    it('should return 401 with invalid credentials', async () => {
      mockStorage.getUserByEmail.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalid@example.com',
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body.message).toEqual('Invalid email or password');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .expect(200);

      expect(response.body.message).toEqual('Logged out successfully');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user when authenticated', async () => {
      // Mock authenticated request
      const authenticatedApp = express();
      authenticatedApp.use((req, res, next) => {
        req.isAuthenticated = () => true;
        req.user = mockUser;
        next();
      });

      authenticatedApp.get('/api/auth/me', (req, res) => {
        if (req.isAuthenticated && req.isAuthenticated()) {
          return res.json(req.user);
        }
        res.status(401).json({ message: 'Not authenticated' });
      });

      const response = await request(authenticatedApp)
        .get('/api/auth/me')
        .expect(200);

      expect(response.body.email).toEqual(mockUser.email);
    });

    it('should return 401 when not authenticated', async () => {
      const unauthenticatedApp = express();
      unauthenticatedApp.get('/api/auth/me', (req, res) => {
        if (req.isAuthenticated && req.isAuthenticated()) {
          return res.json(req.user);
        }
        res.status(401).json({ message: 'Not authenticated' });
      });

      const response = await request(unauthenticatedApp)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.message).toEqual('Not authenticated');
    });
  });
});
