import request from 'supertest';
import express from 'express';
import { resetAllMocks, mockStorage, mockAdmin, mockUser } from './setup/mocks';

// Mock sendEmail
jest.mock('../lib/brevo', () => ({
  sendEmail: jest.fn().mockResolvedValue(true),
}));

// Mock emailTemplates
jest.mock('../lib/emailTemplates', () => ({
  buildWelcomeEmail: jest.fn().mockReturnValue({
    subject: 'Welcome',
    html: '<p>Welcome</p>',
    text: 'Welcome',
  }),
}));

// Mock hashPassword
jest.mock('../auth/emailAuth', () => ({
  hashPassword: jest.fn().mockResolvedValue('hashed_password'),
  comparePassword: jest.fn(),
}));

// Mock creditService
jest.mock('../utils/creditService', () => ({
  grantSignupCredits: jest.fn().mockResolvedValue({ newBalance: 100 }),
  CREDIT_COSTS: { per_week: 10, improve_writing: 5, auto_fill: 5 },
  FREE_ENROLLMENT_LIMIT: 3,
  FREE_MANUAL_BINDER_LIMIT: 2,
  FREE_MAX_WEEKS: 2,
  PRO_MAX_WEEKS: 8,
  reserveCredits: jest.fn(),
  refundCredits: jest.fn(),
  getGenerationCost: jest.fn(),
  getMaxWeeks: jest.fn(),
  isProTier: jest.fn(),
}));

const { sendEmail } = require('../lib/brevo');
const { grantSignupCredits } = require('../utils/creditService');
const { passwordSchema } = require('../../shared/schema');

describe('Admin Create User', () => {
  let adminApp: express.Express;
  let readerApp: express.Express;
  let unauthApp: express.Express;

  function registerRoutes(a: express.Express) {
    const authMiddleware = (req: any, res: any, next: any) => {
      if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
      next();
    };

    // POST /api/admin/create-user
    a.post('/api/admin/create-user', authMiddleware, async (req, res) => {
      const user = req.user as any;
      if (!user.isAdmin) {
        return res.status(403).json({ error: 'Admin access required' });
      }

      try {
        const { name, email } = req.body;

        if (!name || !email) {
          return res.status(400).json({ error: 'Name and email are required' });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return res.status(400).json({ error: 'Invalid email format' });
        }

        const existingUser = await mockStorage.getUserByEmail(email);

        if (existingUser) {
          if (!existingUser.mustChangePassword) {
            return res.status(409).json({ error: 'A user with this email already exists and has already signed in' });
          }

          const { hashPassword } = require('../auth/emailAuth');
          const crypto = require('crypto');
          const tempPassword = crypto.randomBytes(6).toString('base64url');
          const hashedPassword = await hashPassword(tempPassword);
          await mockStorage.updateUser(existingUser.id, { password: hashedPassword });

          const { buildWelcomeEmail } = require('../lib/emailTemplates');
          const loginUrl = 'http://localhost:3000/login';
          const { subject, html, text } = buildWelcomeEmail({ name: existingUser.name || name, email, tempPassword, loginUrl });
          const emailSent = await sendEmail({ to: email, from: 'noreply@syllabind.com', subject, html, text });

          return res.json({ success: true, username: existingUser.username, emailSent, resent: true });
        }

        const { hashPassword } = require('../auth/emailAuth');
        const crypto = require('crypto');
        const tempPassword = crypto.randomBytes(6).toString('base64url');
        const hashedPassword = await hashPassword(tempPassword);

        const username = email.split('@')[0] + '_' + Date.now().toString(36);

        const newUser = await mockStorage.createUser({
          email,
          password: hashedPassword,
          username,
          name,
          authProvider: 'email',
          mustChangePassword: true,
        });

        try {
          await grantSignupCredits(newUser.id);
        } catch (err) {
          // continue
        }

        const { buildWelcomeEmail } = require('../lib/emailTemplates');
        const loginUrl = 'http://localhost:3000/login';
        const { subject, html, text } = buildWelcomeEmail({ name, email, tempPassword, loginUrl });
        const emailSent = await sendEmail({ to: email, from: 'noreply@syllabind.com', subject, html, text });

        res.json({ success: true, username: newUser.username, emailSent });
      } catch (error) {
        res.status(500).json({ error: 'Failed to create user' });
      }
    });

    // PUT /api/users/me/set-password
    a.put('/api/users/me/set-password', authMiddleware, async (req, res) => {
      try {
        const userId = (req.user as any).id;
        const user = await mockStorage.getUser(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (!user.mustChangePassword) {
          return res.status(403).json({ message: 'Password change not required' });
        }

        const { newPassword } = req.body;
        if (!newPassword) {
          return res.status(400).json({ message: 'New password is required' });
        }

        const pwResult = passwordSchema.safeParse(newPassword);
        if (!pwResult.success) {
          return res.status(400).json({ message: pwResult.error.errors[0].message });
        }

        const { hashPassword } = require('../auth/emailAuth');
        const hashed = await hashPassword(newPassword);
        await mockStorage.updateUser(userId, { password: hashed, mustChangePassword: false });
        res.json({ message: 'Password set successfully' });
      } catch (error) {
        res.status(500).json({ message: 'Failed to set password' });
      }
    });
  }

  beforeAll(() => {
    adminApp = express();
    adminApp.use(express.json());
    adminApp.use((req, _res, next) => { req.user = mockAdmin; next(); });
    registerRoutes(adminApp);

    readerApp = express();
    readerApp.use(express.json());
    readerApp.use((req, _res, next) => { req.user = mockUser; next(); });
    registerRoutes(readerApp);

    unauthApp = express();
    unauthApp.use(express.json());
    registerRoutes(unauthApp);
  });

  beforeEach(() => {
    resetAllMocks();
    sendEmail.mockResolvedValue(true);
  });

  // ========== POST /api/admin/create-user ==========

  describe('POST /api/admin/create-user', () => {
    const validPayload = { name: 'New User', email: 'new@example.com' };

    it('creates a user successfully', async () => {
      const createdUser = { ...mockUser, username: 'new_abc123', id: 'new-id', mustChangePassword: true };
      mockStorage.getUserByEmail.mockResolvedValue(null);
      mockStorage.createUser.mockResolvedValue(createdUser);

      const res = await request(adminApp)
        .post('/api/admin/create-user')
        .send(validPayload);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.username).toBe('new_abc123');
      expect(res.body.emailSent).toBe(true);
      expect(mockStorage.createUser).toHaveBeenCalledWith(expect.objectContaining({
        email: 'new@example.com',
        name: 'New User',
        mustChangePassword: true,
        authProvider: 'email',
      }));
      expect(grantSignupCredits).toHaveBeenCalledWith('new-id');
    });

    it('resends welcome email for user who has not logged in', async () => {
      const pendingUser = { ...mockUser, username: 'existing_abc', mustChangePassword: true };
      mockStorage.getUserByEmail.mockResolvedValue(pendingUser);
      mockStorage.updateUser.mockResolvedValue(pendingUser);

      const res = await request(adminApp)
        .post('/api/admin/create-user')
        .send(validPayload);

      expect(res.status).toBe(200);
      expect(res.body.resent).toBe(true);
      expect(res.body.username).toBe('existing_abc');
      expect(mockStorage.updateUser).toHaveBeenCalledWith(pendingUser.id, expect.objectContaining({
        password: 'hashed_password',
      }));
      expect(sendEmail).toHaveBeenCalled();
    });

    it('rejects resend for user who already set their password', async () => {
      const activeUser = { ...mockUser, mustChangePassword: false };
      mockStorage.getUserByEmail.mockResolvedValue(activeUser);

      const res = await request(adminApp)
        .post('/api/admin/create-user')
        .send(validPayload);

      expect(res.status).toBe(409);
      expect(res.body.error).toContain('already exists and has already signed in');
    });

    it('rejects non-admin users', async () => {
      const res = await request(readerApp)
        .post('/api/admin/create-user')
        .send(validPayload);

      expect(res.status).toBe(403);
    });

    it('rejects unauthenticated users', async () => {
      const res = await request(unauthApp)
        .post('/api/admin/create-user')
        .send(validPayload);

      expect(res.status).toBe(401);
    });

    it('rejects missing fields', async () => {
      const res = await request(adminApp)
        .post('/api/admin/create-user')
        .send({ name: 'Test' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('required');
    });

    it('rejects invalid email format', async () => {
      const res = await request(adminApp)
        .post('/api/admin/create-user')
        .send({ name: 'Test', email: 'not-an-email' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('email');
    });

    it('handles email send failure gracefully', async () => {
      const createdUser = { ...mockUser, username: 'new_abc123', id: 'new-id' };
      mockStorage.getUserByEmail.mockResolvedValue(null);
      mockStorage.createUser.mockResolvedValue(createdUser);
      sendEmail.mockResolvedValue(false);

      const res = await request(adminApp)
        .post('/api/admin/create-user')
        .send(validPayload);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.emailSent).toBe(false);
    });
  });

  // ========== PUT /api/users/me/set-password ==========

  describe('PUT /api/users/me/set-password', () => {
    it('sets password and clears mustChangePassword flag', async () => {
      const userWithFlag = { ...mockUser, mustChangePassword: true, password: 'old_hash' };
      mockStorage.getUser.mockResolvedValue(userWithFlag);
      mockStorage.updateUser.mockResolvedValue({ ...userWithFlag, mustChangePassword: false });

      // Use readerApp (authenticated as regular user)
      const res = await request(readerApp)
        .put('/api/users/me/set-password')
        .send({ newPassword: 'NewPass123' });

      expect(res.status).toBe(200);
      expect(mockStorage.updateUser).toHaveBeenCalledWith(mockUser.id, {
        password: 'hashed_password',
        mustChangePassword: false,
      });
    });

    it('rejects when mustChangePassword is false', async () => {
      const userNoFlag = { ...mockUser, mustChangePassword: false };
      mockStorage.getUser.mockResolvedValue(userNoFlag);

      const res = await request(readerApp)
        .put('/api/users/me/set-password')
        .send({ newPassword: 'NewPass123' });

      expect(res.status).toBe(403);
    });

    it('rejects weak password', async () => {
      const userWithFlag = { ...mockUser, mustChangePassword: true };
      mockStorage.getUser.mockResolvedValue(userWithFlag);

      const res = await request(readerApp)
        .put('/api/users/me/set-password')
        .send({ newPassword: 'short' });

      expect(res.status).toBe(400);
    });

    it('rejects missing password', async () => {
      const userWithFlag = { ...mockUser, mustChangePassword: true };
      mockStorage.getUser.mockResolvedValue(userWithFlag);

      const res = await request(readerApp)
        .put('/api/users/me/set-password')
        .send({});

      expect(res.status).toBe(400);
    });

    it('rejects unauthenticated requests', async () => {
      const res = await request(unauthApp)
        .put('/api/users/me/set-password')
        .send({ newPassword: 'NewPass123' });

      expect(res.status).toBe(401);
    });
  });
});
