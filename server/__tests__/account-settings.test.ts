import request from 'supertest';
import express from 'express';
import { resetAllMocks, mockStorage, mockUser } from './setup/mocks';
import { hashPassword, comparePassword } from '../auth/emailAuth';

// Get mocked versions
const mockHashPassword = hashPassword as jest.MockedFunction<typeof hashPassword>;
const mockComparePassword = comparePassword as jest.MockedFunction<typeof comparePassword>;

describe('Account Settings Routes', () => {
  function createAuthedApp(user: any) {
    const app = express();
    app.use(express.json());
    app.use((req, _res, next) => {
      req.user = user;
      (req as any).session = {
        userId: user.id,
        destroy: jest.fn((cb: any) => cb && cb()),
      };
      next();
    });
    registerRoutes(app);
    return app;
  }

  function createUnauthApp() {
    const app = express();
    app.use(express.json());
    registerRoutes(app);
    return app;
  }

  function registerRoutes(app: express.Express) {
    // PUT /api/users/me/password
    app.put('/api/users/me/password', (req, res, next) => {
      if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
      next();
    }, async (req, res) => {
      try {
        const userId = (req.user as any).id;
        const user = await mockStorage.getUser(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (!user.password) {
          return res.status(400).json({ message: 'Password change is only available for email accounts' });
        }

        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
          return res.status(400).json({ message: 'Current password and new password are required' });
        }

        const isValid = await mockComparePassword(currentPassword, user.password);
        if (!isValid) {
          return res.status(401).json({ message: 'Current password is incorrect' });
        }

        // Validate new password (simplified for test)
        if (newPassword.length < 8) {
          return res.status(400).json({ message: 'Password must be at least 8 characters' });
        }

        const hashed = await mockHashPassword(newPassword);
        await mockStorage.updateUser(userId, { password: hashed });
        res.json({ message: 'Password updated successfully' });
      } catch (error) {
        console.error('Password change error:', error);
        res.status(500).json({ message: 'Failed to change password' });
      }
    });

    // DELETE /api/users/me
    app.delete('/api/users/me', (req, res, next) => {
      if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
      next();
    }, async (req, res) => {
      try {
        const userId = (req.user as any).id;
        const user = await mockStorage.getUser(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (user.password) {
          const { password } = req.body;
          if (!password) {
            return res.status(400).json({ message: 'Password is required to delete your account' });
          }
          const isValid = await mockComparePassword(password, user.password);
          if (!isValid) {
            return res.status(401).json({ message: 'Incorrect password' });
          }
        }

        await mockStorage.deleteUser(userId);
        (req as any).session.destroy((err: any) => {
          if (err) console.error('Session destroy error:', err);
          res.clearCookie('connect.sid');
          res.json({ message: 'Account deleted successfully' });
        });
      } catch (error) {
        console.error('Account deletion error:', error);
        res.status(500).json({ message: 'Failed to delete account' });
      }
    });
  }

  beforeEach(() => {
    resetAllMocks();
  });

  describe('PUT /api/users/me/password', () => {
    it('should change password for email auth users', async () => {
      const emailUser = { ...mockUser, authProvider: 'email', password: '$2a$10$oldhash' };
      mockStorage.getUser.mockResolvedValue(emailUser);
      mockComparePassword.mockResolvedValue(true);
      mockHashPassword.mockResolvedValue('$2a$10$newhash');
      mockStorage.updateUser.mockResolvedValue({ ...emailUser, password: '$2a$10$newhash' });

      const app = createAuthedApp(emailUser);
      const res = await request(app)
        .put('/api/users/me/password')
        .send({ currentPassword: 'oldpassword1', newPassword: 'newpassword1' })
        .expect(200);

      expect(res.body.message).toBe('Password updated successfully');
      expect(mockComparePassword).toHaveBeenCalledWith('oldpassword1', '$2a$10$oldhash');
      expect(mockHashPassword).toHaveBeenCalledWith('newpassword1');
      expect(mockStorage.updateUser).toHaveBeenCalledWith(emailUser.id, { password: '$2a$10$newhash' });
    });

    it('should work for legacy accounts with null authProvider but valid password', async () => {
      const legacyUser = { ...mockUser, authProvider: null, password: '$2a$10$oldhash' };
      mockStorage.getUser.mockResolvedValue(legacyUser);
      mockComparePassword.mockResolvedValue(true);
      mockHashPassword.mockResolvedValue('$2a$10$newhash');
      mockStorage.updateUser.mockResolvedValue({ ...legacyUser, password: '$2a$10$newhash' });

      const app = createAuthedApp(legacyUser);
      const res = await request(app)
        .put('/api/users/me/password')
        .send({ currentPassword: 'oldpassword1', newPassword: 'newpassword1' })
        .expect(200);

      expect(res.body.message).toBe('Password updated successfully');
    });

    it('should reject if current password is wrong', async () => {
      const emailUser = { ...mockUser, authProvider: 'email', password: '$2a$10$oldhash' };
      mockStorage.getUser.mockResolvedValue(emailUser);
      mockComparePassword.mockResolvedValue(false);

      const app = createAuthedApp(emailUser);
      const res = await request(app)
        .put('/api/users/me/password')
        .send({ currentPassword: 'wrongpassword', newPassword: 'newpassword1' })
        .expect(401);

      expect(res.body.message).toBe('Current password is incorrect');
    });

    it('should reject for OAuth users with no password', async () => {
      const googleUser = { ...mockUser, authProvider: 'google', password: null };
      mockStorage.getUser.mockResolvedValue(googleUser);

      const app = createAuthedApp(googleUser);
      const res = await request(app)
        .put('/api/users/me/password')
        .send({ currentPassword: 'test', newPassword: 'newpassword1' })
        .expect(400);

      expect(res.body.message).toBe('Password change is only available for email accounts');
    });

    it('should require both current and new password', async () => {
      const emailUser = { ...mockUser, authProvider: 'email', password: '$2a$10$oldhash' };
      mockStorage.getUser.mockResolvedValue(emailUser);

      const app = createAuthedApp(emailUser);
      const res = await request(app)
        .put('/api/users/me/password')
        .send({ currentPassword: 'old' })
        .expect(400);

      expect(res.body.message).toBe('Current password and new password are required');
    });

    it('should return 401 when not authenticated', async () => {
      const app = createUnauthApp();
      await request(app)
        .put('/api/users/me/password')
        .send({ currentPassword: 'old', newPassword: 'new' })
        .expect(401);
    });

    it('should return 500 with message on unexpected error', async () => {
      const emailUser = { ...mockUser, authProvider: 'email', password: '$2a$10$oldhash' };
      mockStorage.getUser.mockRejectedValue(new Error('DB connection lost'));

      const app = createAuthedApp(emailUser);
      const res = await request(app)
        .put('/api/users/me/password')
        .send({ currentPassword: 'old', newPassword: 'newpassword1' })
        .expect(500);

      expect(res.body.message).toBe('Failed to change password');
    });
  });

  describe('DELETE /api/users/me', () => {
    it('should delete email auth account with correct password', async () => {
      const emailUser = { ...mockUser, authProvider: 'email', password: '$2a$10$hash' };
      mockStorage.getUser.mockResolvedValue(emailUser);
      mockComparePassword.mockResolvedValue(true);

      const app = createAuthedApp(emailUser);
      const res = await request(app)
        .delete('/api/users/me')
        .send({ password: 'mypassword1' })
        .expect(200);

      expect(res.body.message).toBe('Account deleted successfully');
      expect(mockStorage.deleteUser).toHaveBeenCalledWith(emailUser.id);
    });

    it('should reject email auth account with wrong password', async () => {
      const emailUser = { ...mockUser, authProvider: 'email', password: '$2a$10$hash' };
      mockStorage.getUser.mockResolvedValue(emailUser);
      mockComparePassword.mockResolvedValue(false);

      const app = createAuthedApp(emailUser);
      const res = await request(app)
        .delete('/api/users/me')
        .send({ password: 'wrong' })
        .expect(401);

      expect(res.body.message).toBe('Incorrect password');
      expect(mockStorage.deleteUser).not.toHaveBeenCalled();
    });

    it('should require password for users with a stored password', async () => {
      const emailUser = { ...mockUser, authProvider: 'email', password: '$2a$10$hash' };
      mockStorage.getUser.mockResolvedValue(emailUser);

      const app = createAuthedApp(emailUser);
      const res = await request(app)
        .delete('/api/users/me')
        .send({})
        .expect(400);

      expect(res.body.message).toBe('Password is required to delete your account');
      expect(mockStorage.deleteUser).not.toHaveBeenCalled();
    });

    it('should delete OAuth account without password', async () => {
      const googleUser = { ...mockUser, authProvider: 'google', password: null, googleId: 'google123' };
      mockStorage.getUser.mockResolvedValue(googleUser);

      const app = createAuthedApp(googleUser);
      const res = await request(app)
        .delete('/api/users/me')
        .send({})
        .expect(200);

      expect(res.body.message).toBe('Account deleted successfully');
      expect(mockStorage.deleteUser).toHaveBeenCalledWith(googleUser.id);
      expect(mockComparePassword).not.toHaveBeenCalled();
    });

    it('should return 401 when not authenticated', async () => {
      const app = createUnauthApp();
      await request(app)
        .delete('/api/users/me')
        .send({ password: 'test' })
        .expect(401);
    });

    it('should return 404 when user not found', async () => {
      mockStorage.getUser.mockResolvedValue(null);

      const app = createAuthedApp(mockUser);
      const res = await request(app)
        .delete('/api/users/me')
        .expect(404);

      expect(res.body.message).toBe('User not found');
    });

    it('should return 500 with message on unexpected error', async () => {
      mockStorage.getUser.mockRejectedValue(new Error('DB connection lost'));

      const app = createAuthedApp(mockUser);
      const res = await request(app)
        .delete('/api/users/me')
        .expect(500);

      expect(res.body.message).toBe('Failed to delete account');
    });
  });
});
