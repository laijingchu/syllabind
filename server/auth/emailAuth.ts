import bcrypt from "bcryptjs";
import crypto from "crypto";
import { Express } from "express";
import { db } from "../db";
import { users, type InsertUser, type User, passwordSchema } from "@shared/schema";
import { eq } from "drizzle-orm";
import { isAdminUser } from "./admin";
import { logSecurity } from "../lib/audit";
import { grantSignupCredits } from "../utils/creditService";
import { sendEmail } from "../lib/brevo";
import { buildPasswordResetEmail } from "../lib/emailTemplates";

const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function getOAuthProviderMessage(user: User): string | null {
  if (user.password) return null;
  if (user.googleId || user.authProvider === 'google') {
    return "This account uses Google Sign-In. Please log in with Google instead.";
  }
  if (user.appleId || user.authProvider === 'apple') {
    return "This account uses Apple Sign-In. Please log in with Apple instead.";
  }
  return "This account uses a third-party login provider. Please use the original sign-in method.";
}

export function registerEmailAuthRoutes(app: Express): void {
  // Email/Password Registration
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, name, isCurator } = req.body;

      if (!email || !password || !name) {
        return res.status(400).json({ message: "Email, password, and name are required" });
      }

      // Validate password strength
      const passwordResult = passwordSchema.safeParse(password);
      if (!passwordResult.success) {
        return res.status(400).json({ message: passwordResult.error.errors[0].message });
      }

      // Check if email already exists
      const [existingUser] = await db.select().from(users).where(eq(users.email, email));
      if (existingUser) {
        const oauthMsg = getOAuthProviderMessage(existingUser);
        if (oauthMsg) {
          return res.status(409).json({ message: oauthMsg });
        }
        return res.status(400).json({ message: "Email already registered" });
      }

      // Hash password
      const hashedPassword = await hashPassword(password);

      // Create username from email
      const username = email.split('@')[0] + '_' + Date.now().toString(36);

      // Create user
      const [newUser] = await db.insert(users).values({
        email,
        password: hashedPassword,
        username,
        name,
        isCurator: isCurator || false,
        authProvider: 'email',
      }).returning();

      // Grant signup credits
      try {
        await grantSignupCredits(newUser.id);
      } catch (err) {
        console.error('[Register] Failed to grant signup credits:', err);
      }

      // Set session
      (req as any).session.userId = newUser.id;

      // Return user without password
      const { password: _, ...userWithoutPassword } = newUser;
      res.json({ ...userWithoutPassword, creditBalance: 100, isAdmin: isAdminUser(newUser.username) });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  // Email/Password Login
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      // Find user by email
      const [user] = await db.select().from(users).where(eq(users.email, email));
      if (!user) {
        logSecurity("login_failed", { email, reason: "user_not_found", ip: req.ip });
        return res.status(401).json({ message: "Invalid email or password" });
      }
      if (!user.password) {
        const oauthMsg = getOAuthProviderMessage(user);
        logSecurity("login_failed", { email, reason: "oauth_account", ip: req.ip });
        return res.status(401).json({ message: oauthMsg || "Invalid email or password" });
      }

      // Compare password
      const isValid = await comparePassword(password, user.password);
      if (!isValid) {
        logSecurity("login_failed", { email, reason: "invalid_password", ip: req.ip });
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Set session
      (req as any).session.userId = user.id;

      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      res.json({ ...userWithoutPassword, isAdmin: isAdminUser(user.username) });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Get current user
  app.get("/api/auth/me", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      
      if (!userId) {
        return res.status(401).json(null);
      }

      const [user] = await db.select().from(users).where(eq(users.id, userId));
      if (!user) {
        return res.status(401).json(null);
      }

      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      res.json({ ...userWithoutPassword, isAdmin: isAdminUser(user.username) });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  // Request password reset
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      // Always return success to prevent email enumeration
      const [user] = await db.select().from(users).where(eq(users.email, email));
      if (!user || !user.password) {
        return res.json({ message: "If an account exists with that email, a reset link has been sent." });
      }

      // Generate token and hash it for storage
      const token = crypto.randomBytes(32).toString('base64url');
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await db.update(users).set({
        passwordResetToken: tokenHash,
        passwordResetExpiresAt: expiresAt,
      }).where(eq(users.id, user.id));

      // Build reset URL
      const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
      const resetUrl = `${baseUrl}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
      const { subject, html, text } = buildPasswordResetEmail({ name: user.name || 'there', resetUrl });
      const fromEmail = process.env.BREVO_FROM || 'noreply@syllabind.com';
      await sendEmail({ to: email, from: fromEmail, subject, html, text });

      res.json({ message: "If an account exists with that email, a reset link has been sent." });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ message: "Something went wrong. Please try again." });
    }
  });

  // Reset password with token
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { email, token, newPassword } = req.body;
      if (!email || !token || !newPassword) {
        return res.status(400).json({ message: "Email, token, and new password are required" });
      }

      const [user] = await db.select().from(users).where(eq(users.email, email));
      if (!user) {
        return res.status(400).json({ message: "Invalid or expired reset link" });
      }

      // Verify token
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      if (!user.passwordResetToken || user.passwordResetToken !== tokenHash) {
        return res.status(400).json({ message: "Invalid or expired reset link" });
      }

      // Check expiry
      if (!user.passwordResetExpiresAt || new Date() > user.passwordResetExpiresAt) {
        return res.status(400).json({ message: "This reset link has expired. Please request a new one." });
      }

      // Validate password
      const pwResult = passwordSchema.safeParse(newPassword);
      if (!pwResult.success) {
        return res.status(400).json({ message: pwResult.error.errors[0].message });
      }

      // Update password and clear reset token
      const hashed = await hashPassword(newPassword);
      await db.update(users).set({
        password: hashed,
        passwordResetToken: null,
        passwordResetExpiresAt: null,
        mustChangePassword: false,
      }).where(eq(users.id, user.id));

      res.json({ message: "Password has been reset. You can now log in." });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ message: "Something went wrong. Please try again." });
    }
  });

  // Logout
  app.post("/api/auth/logout", (req, res) => {
    (req as any).session.destroy((err: any) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.clearCookie('connect.sid');
      res.json({ message: "Logged out successfully" });
    });
  });
}
