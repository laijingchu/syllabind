// This file runs BEFORE the Jest test framework is installed
// Use this for environment variables and module mocks only
// For Jest APIs (jest.fn, expect, beforeEach), use jest.afterEnv.js instead

// Mock environment variables for tests
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test_db';
process.env.NODE_ENV = 'test';
process.env.SESSION_SECRET = 'test-session-secret';

// --- Enhanced chainable DB mock ---
// Every method returns `this` (the proxy) so any chain resolves to mockDbQuery()
const mockDbQuery = jest.fn().mockResolvedValue([]);

function createChainProxy() {
  const handler = {
    get(_target, prop) {
      // Allow awaiting at any point in the chain
      if (prop === 'then') {
        const result = mockDbQuery();
        return result.then.bind(result);
      }
      // Return a jest.fn that returns the proxy so chaining continues
      return jest.fn().mockReturnValue(new Proxy({}, handler));
    }
  };
  return new Proxy({}, handler);
}

jest.mock('./server/db', () => ({
  db: createChainProxy(),
  pool: {
    connect: jest.fn(),
    query: jest.fn(),
    end: jest.fn()
  }
}));

// Mock Drizzle ORM
jest.mock('drizzle-orm/node-postgres', () => ({
  drizzle: jest.fn(() => createChainProxy())
}));

// Mock pg (PostgreSQL)
jest.mock('pg', () => ({
  Pool: jest.fn(() => ({
    connect: jest.fn(),
    query: jest.fn(),
    end: jest.fn()
  }))
}));

// Mock WebSocket
jest.mock('ws', () => ({}));

// Mock connect-pg-simple (used by auth/index.ts setupCustomAuth)
jest.mock('connect-pg-simple', () => {
  return jest.fn(() => {
    return jest.fn().mockImplementation(() => ({
      on: jest.fn(),
      get: jest.fn(),
      set: jest.fn(),
      destroy: jest.fn(),
      touch: jest.fn(),
    }));
  });
});

// Mock express-session (used by auth/index.ts setupCustomAuth)
jest.mock('express-session', () => {
  const sessionMiddleware = (req, res, next) => {
    if (!req.session) {
      req.session = { destroy: jest.fn((cb) => cb && cb()) };
    }
    next();
  };
  sessionMiddleware.Store = jest.fn();
  return jest.fn(() => sessionMiddleware);
});

// Mock multer (routes.ts configures multer at module load)
jest.mock('multer', () => {
  const multerMock = jest.fn(() => ({
    single: jest.fn(() => (req, res, next) => {
      req.file = { filename: 'test-upload.jpg', originalname: 'test.jpg' };
      next();
    }),
    array: jest.fn(() => (req, res, next) => next()),
  }));
  multerMock.diskStorage = jest.fn(() => ({}));
  return multerMock;
});

// Mock the auth module — setupCustomAuth is a no-op, isAuthenticated checks req.user
jest.mock('./server/auth', () => ({
  setupCustomAuth: jest.fn(),
  isAuthenticated: jest.fn((req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    next();
  }),
  authenticateWebSocket: jest.fn().mockResolvedValue(null),
}));

// Mock individual auth route modules so they don't register real routes
jest.mock('./server/auth/emailAuth', () => ({
  registerEmailAuthRoutes: jest.fn(),
  hashPassword: jest.fn().mockResolvedValue('$2a$10$hashedpassword'),
  comparePassword: jest.fn().mockResolvedValue(true),
}));

jest.mock('./server/auth/googleAuth', () => ({
  registerGoogleAuthRoutes: jest.fn(),
}));

jest.mock('./server/auth/appleAuth', () => ({
  registerAppleAuthRoutes: jest.fn(),
}));

// Mock Storage — the `storage` named export is an object with mock methods
jest.mock('./server/storage', () => ({
  storage: {
    getUserByEmail: jest.fn().mockResolvedValue(null),
    getUserByUsername: jest.fn().mockResolvedValue(null),
    getUserByReplitId: jest.fn().mockResolvedValue(null),
    getUser: jest.fn().mockResolvedValue(null),
    createUser: jest.fn(),
    updateUser: jest.fn(),
    getAllSyllabi: jest.fn().mockResolvedValue([]),
    getSyllabusById: jest.fn().mockResolvedValue(null),
    getSyllabus: jest.fn().mockResolvedValue(null),
    getSyllabusWithContent: jest.fn().mockResolvedValue(null),
    getSyllabiByCreator: jest.fn().mockResolvedValue([]),
    listSyllabi: jest.fn().mockResolvedValue([]),
    listPublishedSyllabi: jest.fn().mockResolvedValue([]),
    createSyllabus: jest.fn(),
    updateSyllabus: jest.fn(),
    deleteSyllabus: jest.fn(),
    batchDeleteSyllabi: jest.fn(),
    getEnrollmentsByUserId: jest.fn().mockResolvedValue([]),
    getUserEnrollments: jest.fn().mockResolvedValue([]),
    getEnrollment: jest.fn().mockResolvedValue(null),
    getEnrollmentById: jest.fn().mockResolvedValue(null),
    createEnrollment: jest.fn(),
    updateEnrollment: jest.fn(),
    dropActiveEnrollments: jest.fn(),
    updateEnrollmentShareProfile: jest.fn(),
    getCompletedSteps: jest.fn().mockResolvedValue([]),
    markStepComplete: jest.fn(),
    markStepCompleted: jest.fn(),
    markStepIncomplete: jest.fn(),
    getSubmissionsByEnrollmentId: jest.fn().mockResolvedValue([]),
    getSubmission: jest.fn().mockResolvedValue(null),
    createSubmission: jest.fn(),
    updateSubmission: jest.fn(),
    updateSubmissionFeedback: jest.fn(),
    getLearnersBySyllabusId: jest.fn().mockResolvedValue([]),
    getClassmatesBySyllabusId: jest.fn().mockResolvedValue({ classmates: [], totalEnrolled: 0 }),
    getSyllabusAnalytics: jest.fn().mockResolvedValue({}),
    getStepCompletionRates: jest.fn().mockResolvedValue([]),
    getAverageCompletionTimes: jest.fn().mockResolvedValue([]),
    getStep: jest.fn().mockResolvedValue(null),
    getWeek: jest.fn().mockResolvedValue(null),
    deleteStep: jest.fn(),
    getChatMessages: jest.fn().mockResolvedValue([]),
    createChatMessage: jest.fn(),
    clearChatMessages: jest.fn(),
    createWeek: jest.fn(),
    getWeeksBySyllabusId: jest.fn().mockResolvedValue([]),
    updateWeek: jest.fn(),
    createStep: jest.fn(),
    getStepsByWeekId: jest.fn().mockResolvedValue([]),
    deleteStepsByWeekId: jest.fn(),
    deleteWeeksBySyllabusId: jest.fn(),
    isStepCompleted: jest.fn().mockResolvedValue(false),
  },
  DatabaseStorage: jest.fn(),
}));

// Mock bcrypt for password hashing
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('$2a$10$hashedpassword'),
  compare: jest.fn().mockResolvedValue(true),
  genSalt: jest.fn().mockResolvedValue('$2a$10$salt')
}));

// Mock passport-local Strategy
jest.mock('passport-local', () => ({
  Strategy: jest.fn().mockImplementation(function(options, verify) {
    this.name = 'local';
    this.authenticate = function(req, options) {
      if (req.body.email === 'test@example.com') {
        return this.success({ id: 'test-user-id', email: 'test@example.com' });
      }
      return this.fail('Invalid credentials');
    };
  })
}));

// Mock passport
jest.mock('passport', () => ({
  use: jest.fn(),
  serializeUser: jest.fn(),
  deserializeUser: jest.fn(),
  initialize: jest.fn(() => (req, res, next) => next()),
  session: jest.fn(() => (req, res, next) => next()),
  authenticate: jest.fn((strategy, options) => (req, res, next) => {
    req.login = jest.fn((user, cb) => {
      req.user = user;
      cb();
    });
    req.isAuthenticated = () => true;
    req.user = { id: 'test-user-id', email: 'test@example.com' };
    next();
  })
}));
