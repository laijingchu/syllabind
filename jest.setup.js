// This file runs BEFORE the Jest test framework is installed
// Use this for environment variables and module mocks only
// For Jest APIs (jest.fn, expect, beforeEach), use jest.afterEnv.js instead

// Mock environment variables for tests
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test_db';
process.env.NODE_ENV = 'test';
process.env.SESSION_SECRET = 'test-session-secret';

// Mock the database module before any imports
const mockDbQuery = jest.fn().mockResolvedValue([]);

jest.mock('./server/db', () => ({
  db: {
    select: jest.fn().mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockImplementation(() => mockDbQuery())
      })
    }),
    insert: jest.fn().mockReturnValue({
      values: jest.fn().mockReturnValue({
        returning: jest.fn().mockImplementation(() => mockDbQuery())
      })
    }),
    update: jest.fn().mockReturnValue({
      set: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockImplementation(() => mockDbQuery())
        })
      })
    }),
    delete: jest.fn().mockReturnValue({
      where: jest.fn().mockImplementation(() => mockDbQuery())
    })
  },
  pool: {
    connect: jest.fn(),
    query: jest.fn(),
    end: jest.fn()
  }
}));

// Mock Drizzle ORM
jest.mock('drizzle-orm/node-postgres', () => ({
  drizzle: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    returning: jest.fn().mockResolvedValue([]),
  }))
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

// Mock Storage
jest.mock('./server/storage', () => ({
  getUserByEmail: jest.fn().mockResolvedValue(null),
  getUserByUsername: jest.fn().mockResolvedValue(null),
  createUser: jest.fn(),
  updateUser: jest.fn(),
  getAllSyllabi: jest.fn().mockResolvedValue([]),
  getSyllabusById: jest.fn().mockResolvedValue(null),
  createSyllabus: jest.fn(),
  updateSyllabus: jest.fn(),
  deleteSyllabus: jest.fn(),
  getEnrollmentsByUserId: jest.fn().mockResolvedValue([]),
  createEnrollment: jest.fn(),
  updateEnrollment: jest.fn(),
  getCompletedSteps: jest.fn().mockResolvedValue([]),
  markStepComplete: jest.fn(),
  markStepIncomplete: jest.fn(),
  getSubmissionsByEnrollmentId: jest.fn().mockResolvedValue([]),
  createSubmission: jest.fn(),
  updateSubmission: jest.fn(),
  getLearnersBySyllabusId: jest.fn().mockResolvedValue([])
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
      // Mock authentication
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
    // Mock successful authentication
    req.login = jest.fn((user, cb) => {
      req.user = user;
      cb();
    });
    req.isAuthenticated = () => true;
    req.user = { id: 'test-user-id', email: 'test@example.com' };
    next();
  })
}));
