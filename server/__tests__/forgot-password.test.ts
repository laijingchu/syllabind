import request from 'supertest';
import express from 'express';
import crypto from 'crypto';

// Mock brevo
jest.mock('../lib/brevo', () => ({
  sendEmail: jest.fn().mockResolvedValue(true),
}));

// Mock emailTemplates
jest.mock('../lib/emailTemplates', () => ({
  buildPasswordResetEmail: jest.fn().mockReturnValue({
    subject: 'Reset',
    html: '<p>Reset</p>',
    text: 'Reset',
  }),
}));

// Mock bcryptjs
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed_new_password'),
  compare: jest.fn().mockResolvedValue(true),
}));

const { sendEmail } = require('../lib/brevo');
const { passwordSchema } = require('../../shared/schema');

// In-memory user store for these tests
let mockUsers: any[] = [];

function createApp() {
  const app = express();
  app.use(express.json());

  // POST /api/auth/forgot-password
  app.post('/api/auth/forgot-password', async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: 'Email is required' });
      }

      const user = mockUsers.find(u => u.email === email);
      if (!user || !user.password) {
        return res.json({ message: 'If an account exists with that email, a reset link has been sent.' });
      }

      const token = crypto.randomBytes(32).toString('base64url');
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      user.passwordResetToken = tokenHash;
      user.passwordResetExpiresAt = expiresAt;

      const resetUrl = `http://localhost:3000/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
      const { buildPasswordResetEmail } = require('../lib/emailTemplates');
      const { subject, html, text } = buildPasswordResetEmail({ name: user.name, resetUrl });
      await sendEmail({ to: email, from: 'noreply@syllabind.com', subject, html, text });

      res.json({ message: 'If an account exists with that email, a reset link has been sent.' });
    } catch (error) {
      res.status(500).json({ message: 'Something went wrong.' });
    }
  });

  // POST /api/auth/reset-password
  app.post('/api/auth/reset-password', async (req, res) => {
    try {
      const { email, token, newPassword } = req.body;
      if (!email || !token || !newPassword) {
        return res.status(400).json({ message: 'Email, token, and new password are required' });
      }

      const user = mockUsers.find(u => u.email === email);
      if (!user) {
        return res.status(400).json({ message: 'Invalid or expired reset link' });
      }

      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      if (!user.passwordResetToken || user.passwordResetToken !== tokenHash) {
        return res.status(400).json({ message: 'Invalid or expired reset link' });
      }

      if (!user.passwordResetExpiresAt || new Date() > user.passwordResetExpiresAt) {
        return res.status(400).json({ message: 'This reset link has expired. Please request a new one.' });
      }

      const pwResult = passwordSchema.safeParse(newPassword);
      if (!pwResult.success) {
        return res.status(400).json({ message: pwResult.error.errors[0].message });
      }

      const bcrypt = require('bcryptjs');
      user.password = await bcrypt.hash(newPassword, 10);
      user.passwordResetToken = null;
      user.passwordResetExpiresAt = null;
      user.mustChangePassword = false;

      res.json({ message: 'Password has been reset. You can now log in.' });
    } catch (error) {
      res.status(500).json({ message: 'Something went wrong.' });
    }
  });

  return app;
}

describe('Forgot/Reset Password', () => {
  let app: express.Express;

  beforeAll(() => {
    app = createApp();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    sendEmail.mockResolvedValue(true);
    mockUsers = [
      {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashed_password',
        passwordResetToken: null,
        passwordResetExpiresAt: null,
        mustChangePassword: false,
      },
      {
        id: 'user-2',
        email: 'oauth@example.com',
        name: 'OAuth User',
        password: null, // OAuth user, no password
        passwordResetToken: null,
        passwordResetExpiresAt: null,
      },
    ];
  });

  // ========== POST /api/auth/forgot-password ==========

  describe('POST /api/auth/forgot-password', () => {
    it('sends reset email for valid user', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'test@example.com' });

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('reset link has been sent');
      expect(sendEmail).toHaveBeenCalled();
      expect(mockUsers[0].passwordResetToken).toBeTruthy();
      expect(mockUsers[0].passwordResetExpiresAt).toBeInstanceOf(Date);
    });

    it('returns same message for non-existent email (no enumeration)', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'nobody@example.com' });

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('reset link has been sent');
      expect(sendEmail).not.toHaveBeenCalled();
    });

    it('returns same message for OAuth user (no password)', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'oauth@example.com' });

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('reset link has been sent');
      expect(sendEmail).not.toHaveBeenCalled();
    });

    it('rejects missing email', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({});

      expect(res.status).toBe(400);
    });
  });

  // ========== POST /api/auth/reset-password ==========

  describe('POST /api/auth/reset-password', () => {
    const validToken = 'test-reset-token-abc123';

    function setResetToken(userIndex: number, token: string, expiresInMs = 3600000) {
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      mockUsers[userIndex].passwordResetToken = tokenHash;
      mockUsers[userIndex].passwordResetExpiresAt = new Date(Date.now() + expiresInMs);
    }

    it('resets password with valid token', async () => {
      setResetToken(0, validToken);

      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({ email: 'test@example.com', token: validToken, newPassword: 'NewPass123' });

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('Password has been reset');
      expect(mockUsers[0].passwordResetToken).toBeNull();
      expect(mockUsers[0].passwordResetExpiresAt).toBeNull();
      expect(mockUsers[0].mustChangePassword).toBe(false);
    });

    it('rejects invalid token', async () => {
      setResetToken(0, validToken);

      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({ email: 'test@example.com', token: 'wrong-token', newPassword: 'NewPass123' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Invalid or expired');
    });

    it('rejects expired token', async () => {
      setResetToken(0, validToken, -1000); // already expired

      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({ email: 'test@example.com', token: validToken, newPassword: 'NewPass123' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('expired');
    });

    it('rejects weak password', async () => {
      setResetToken(0, validToken);

      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({ email: 'test@example.com', token: validToken, newPassword: 'short' });

      expect(res.status).toBe(400);
    });

    it('rejects non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({ email: 'nobody@example.com', token: validToken, newPassword: 'NewPass123' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Invalid or expired');
    });

    it('rejects missing fields', async () => {
      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({ email: 'test@example.com' });

      expect(res.status).toBe(400);
    });

    it('clears token after successful reset (prevents reuse)', async () => {
      setResetToken(0, validToken);

      await request(app)
        .post('/api/auth/reset-password')
        .send({ email: 'test@example.com', token: validToken, newPassword: 'NewPass123' });

      // Try to use the same token again
      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({ email: 'test@example.com', token: validToken, newPassword: 'AnotherPass456' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Invalid or expired');
    });
  });
});
