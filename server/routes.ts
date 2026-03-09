import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupCustomAuth, isAuthenticated, optionalAuth } from "./auth";
import { isAdminUser } from "./auth/admin";
import {
  insertBinderSchema,
  insertEnrollmentSchema,
  insertUserSchema,
  insertSubmissionSchema,
  passwordSchema,
} from "@shared/schema";
import { hashPassword, comparePassword } from "./auth/emailAuth";
import { sendEmail } from "./lib/brevo";
import { buildWelcomeEmail, buildBinderSubmittedEmail, buildBinderApprovedEmail, buildBinderRejectedEmail } from "./lib/emailTemplates";
import crypto from "crypto";
import { registerStripeRoutes } from "./routes/stripe";
import { registerWebhookRoutes } from "./routes/webhook";
import multer from "multer";
import { client, CLAUDE_MODEL } from "./utils/claudeClient";
import {
  CREDIT_COSTS, FREE_ENROLLMENT_LIMIT, FREE_MANUAL_BINDER_LIMIT,
  FREE_MAX_WEEKS, PRO_MAX_WEEKS,
  reserveCredits, refundCredits, getGenerationCost, getMaxWeeks, isProTier,
  grantSignupCredits
} from "./utils/creditService";
import * as path from "path";
import fs from "fs/promises";
import { fileURLToPath } from "url";

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirPath = path.dirname(currentFilePath);

// Configure multer for file uploads
const uploadStorage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, path.join(currentDirPath, "../uploads"));
  },
  filename: function (_req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: uploadStorage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB limit
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"));
    }
  }
});

function getBaseUrl(req: express.Request): string {
  const proto = req.headers['x-forwarded-proto'] || req.protocol || 'https';
  const host = req.headers['x-forwarded-host'] || req.get('host') || 'syllabind.com';
  return `${proto}://${host}`;
}

async function getAdminEmails(): Promise<string[]> {
  const raw = process.env.ADMIN_USERNAMES;
  if (!raw) return [];
  const usernames = raw.split(',').map(u => u.trim()).filter(Boolean);
  const emails: string[] = [];
  for (const username of usernames) {
    const user = await storage.getUserByUsername(username);
    if (user?.email) emails.push(user.email);
  }
  return emails;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Set up custom authentication
  setupCustomAuth(app);

  // Ensure default categories exist (idempotent — no-op if already populated)
  await storage.initializeDefaultCategories();

  // Register Stripe payment and webhook routes
  await registerStripeRoutes(app);
  await registerWebhookRoutes(app);

  // Serve uploaded files statically
  app.use("/uploads", express.static(path.join(currentDirPath, "../uploads")));

  // ========== USER ROUTES ==========

  // Get user by username (public profile)
  app.get("/api/users/:username", async (req, res) => {
    const user = await storage.getUserByUsername(req.params.username);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Only return public info if shareProfile is false
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

  // Update user profile
  app.put("/api/users/me", isAuthenticated, async (req, res) => {
    const userId = (req.user as any).id;

    // Validate avatarUrl if present - reject blob URLs
    if (req.body.avatarUrl && typeof req.body.avatarUrl === 'string' && req.body.avatarUrl.startsWith('blob:')) {
      return res.status(400).json({ message: "Invalid avatar URL: blob URLs are not allowed" });
    }

    const allowedFields = ['name', 'bio', 'expertise', 'profileTitle', 'linkedin', 'website', 'twitter', 'threads', 'schedulingUrl', 'shareProfile', 'avatarUrl'] as const;
    const profileUpdate: Record<string, any> = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        profileUpdate[field] = req.body[field];
      }
    }

    // Delete old avatar file from disk when removing or replacing
    if ('avatarUrl' in req.body) {
      const currentUser = await storage.getUser(userId);
      if (currentUser?.avatarUrl?.startsWith('/uploads/')) {
        const oldPath = path.join(process.cwd(), currentUser.avatarUrl);
        fs.unlink(oldPath).catch(() => {});
      }
    }

    const updated = await storage.updateUser(userId, profileUpdate);
    const { password, ...userWithoutPassword } = updated;
    res.json(userWithoutPassword);
  });

  // Toggle curator mode
  app.post("/api/users/me/toggle-curator", isAuthenticated, async (req, res) => {
    const userId = (req.user as any).id;
    const user = await storage.getUser(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const updated = await storage.updateUser(userId, { isCurator: !user.isCurator });
    const { password, ...userWithoutPassword } = updated;
    res.json(userWithoutPassword);
  });

  // Change password (email auth only)
  app.put("/api/users/me/password", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      // Allow password change if user has a stored password (handles null authProvider for legacy accounts)
      if (!user.password) {
        return res.status(400).json({ message: "Password change is only available for email accounts" });
      }

      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current password and new password are required" });
      }

      const isValid = await comparePassword(currentPassword, user.password);
      if (!isValid) {
        return res.status(401).json({ message: "Current password is incorrect" });
      }

      const pwResult = passwordSchema.safeParse(newPassword);
      if (!pwResult.success) {
        return res.status(400).json({ message: pwResult.error.errors[0].message });
      }

      const hashed = await hashPassword(newPassword);
      await storage.updateUser(userId, { password: hashed });
      res.json({ message: "Password updated successfully" });
    } catch (error) {
      console.error("Password change error:", error);
      res.status(500).json({ message: "Failed to change password" });
    }
  });

  // Set password (forced change for admin-created accounts)
  app.put("/api/users/me/set-password", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      if (!user.mustChangePassword) {
        return res.status(403).json({ message: "Password change not required" });
      }

      const { newPassword } = req.body;
      if (!newPassword) {
        return res.status(400).json({ message: "New password is required" });
      }

      const pwResult = passwordSchema.safeParse(newPassword);
      if (!pwResult.success) {
        return res.status(400).json({ message: pwResult.error.errors[0].message });
      }

      const hashed = await hashPassword(newPassword);
      await storage.updateUser(userId, { password: hashed, mustChangePassword: false });
      res.json({ message: "Password set successfully" });
    } catch (error) {
      console.error("Set password error:", error);
      res.status(500).json({ message: "Failed to set password" });
    }
  });

  // Delete account
  app.delete("/api/users/me", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      // Users with a stored password must confirm it (handles null authProvider for legacy accounts)
      if (user.password) {
        const { password } = req.body;
        if (!password) {
          return res.status(400).json({ message: "Password is required to delete your account" });
        }
        const isValid = await comparePassword(password, user.password);
        if (!isValid) {
          return res.status(401).json({ message: "Incorrect password" });
        }
      }

      await storage.deleteUser(userId);

      // Destroy session and clear cookie
      (req as any).session.destroy((err: any) => {
        if (err) console.error("Session destroy error:", err);
        res.clearCookie('connect.sid');
        res.json({ message: "Account deleted successfully" });
      });
    } catch (error) {
      console.error("Account deletion error:", error);
      res.status(500).json({ message: "Failed to delete account" });
    }
  });

  // Upload avatar image
  app.post("/api/upload", isAuthenticated, (req, res) => {
    console.log("Upload request received from user:", (req.user as any)?.username || "unauthenticated");
    console.log("Request headers:", req.headers['content-type']);

    upload.single("file")(req, res, (err) => {
      if (err) {
        console.error("Multer error:", err);
        return res.status(400).json({ message: err.message || "Failed to upload file" });
      }

      if (!req.file) {
        console.error("No file in request");
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Return the URL to access the uploaded file
      const fileUrl = `/uploads/${req.file.filename}`;
      console.log("File uploaded successfully:", fileUrl);
      res.json({ url: fileUrl });
    });
  });

  // ========== SITE SETTINGS ROUTES ==========

  // Get a site setting (public)
  app.get("/api/site-settings/:key", async (req, res) => {
    try {
      const value = await storage.getSiteSetting(req.params.key);
      res.json({ value });
    } catch (err) {
      console.error("Failed to fetch site setting:", req.params.key, err);
      res.json({ value: null });
    }
  });


  // Update a site setting (admin only)
  app.put("/api/admin/settings", isAuthenticated, async (req, res) => {
    const user = req.user as any;
    if (!user.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }

    const { key, value } = req.body;
    if (!key || typeof key !== 'string') {
      return res.status(400).json({ error: "key is required" });
    }
    if (typeof value !== 'string') {
      return res.status(400).json({ error: "value must be a string" });
    }

    await storage.setSiteSetting(key, value);
    res.json({ success: true });
  });

  // ========== ADMIN CREATE USER ==========

  // Create a user account (admin only) — sends welcome email with temp password
  app.post("/api/admin/create-user", isAuthenticated, async (req, res) => {
    const user = req.user as any;
    if (!user.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }

    try {
      const { email, role } = req.body;

      if (!email || !role) {
        return res.status(400).json({ error: "Email and role are required" });
      }

      if (role !== 'reader' && role !== 'curator') {
        return res.status(400).json({ error: "Role must be 'reader' or 'curator'" });
      }

      // Basic email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: "Invalid email format" });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);

      if (existingUser) {
        // Allow resend only if user hasn't logged in yet
        if (!existingUser.mustChangePassword) {
          return res.status(409).json({ error: "A user with this email already exists and has already signed in" });
        }

        // Reset temp password and resend
        const tempPassword = crypto.randomBytes(6).toString('base64url');
        const hashedPassword = await hashPassword(tempPassword);
        await storage.updateUser(existingUser.id, { password: hashedPassword });

        const loginUrl = (process.env.APP_URL || `${req.protocol}://${req.get('host')}`) + '/login';
        const { subject, html, text } = buildWelcomeEmail({ email, tempPassword, loginUrl });
        const fromEmail = process.env.BREVO_FROM || 'noreply@syllabind.com';
        const emailSent = await sendEmail({ to: email, from: fromEmail, subject, html, text });

        return res.json({ success: true, username: existingUser.username, emailSent, resent: true });
      }

      // Generate temp password
      const tempPassword = crypto.randomBytes(6).toString('base64url');
      const hashedPassword = await hashPassword(tempPassword);

      // Generate username from email
      const username = email.split('@')[0] + '_' + Date.now().toString(36);

      // Create user
      const newUser = await storage.createUser({
        email,
        password: hashedPassword,
        username,
        isCurator: role === 'curator',
        authProvider: 'email',
        mustChangePassword: true,
      });

      // Grant signup credits
      try {
        await grantSignupCredits(newUser.id);
      } catch (err) {
        console.error('[AdminCreateUser] Failed to grant signup credits:', err);
      }

      // Send welcome email
      const loginUrl = (process.env.APP_URL || `${req.protocol}://${req.get('host')}`) + '/login';
      const { subject, html, text } = buildWelcomeEmail({ email, tempPassword, loginUrl });
      const fromEmail = process.env.BREVO_FROM || 'noreply@syllabind.com';
      const emailSent = await sendEmail({ to: email, from: fromEmail, subject, html, text });

      res.json({ success: true, username: newUser.username, emailSent });
    } catch (error) {
      console.error("Admin create user error:", error);
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  // ========== ADMIN REVIEW QUEUE ==========

  // Get pending review queue (admin only)
  app.get("/api/admin/review-queue", isAuthenticated, async (req, res) => {
    const user = req.user as any;
    if (!user.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }
    try {
      const queue = await storage.getBindersByStatus('pending_review');
      res.json(queue);
    } catch (err) {
      console.error("Failed to fetch review queue:", err);
      res.status(500).json({ error: "Failed to fetch review queue" });
    }
  });

  // Approve a binder (admin only)
  app.post("/api/admin/binders/:id/approve", isAuthenticated, async (req, res) => {
    const user = req.user as any;
    if (!user.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }
    const id = parseInt(req.params.id);
    const binder = await storage.getBinder(id);
    if (!binder) return res.status(404).json({ message: "Binder not found" });
    if (binder.status !== 'pending_review') {
      return res.status(400).json({ error: "Binder is not pending review" });
    }
    const note = req.body?.note || null;
    const updated = await storage.updateBinder(id, {
      status: 'published',
      reviewNote: note,
      reviewedAt: new Date(),
    });

    // Notify curator via email
    if (binder.curatorId) {
      const curator = await storage.getUserByUsername(binder.curatorId);
      if (curator?.email) {
        const baseUrl = getBaseUrl(req);
        const fromEmail = process.env.BREVO_FROM || 'noreply@syllabind.com';
        const { subject, html, text } = buildBinderApprovedEmail({
          binderTitle: binder.title,
          curatorName: curator.name || binder.curatorId,
          binderUrl: `${baseUrl}/binder/${id}`,
          note,
        });
        sendEmail({ to: curator.email, from: fromEmail, subject, html, text });
      }
    }

    res.json(updated);
  });

  // Reject a binder (admin only)
  app.post("/api/admin/binders/:id/reject", isAuthenticated, async (req, res) => {
    const user = req.user as any;
    if (!user.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }
    const id = parseInt(req.params.id);
    const binder = await storage.getBinder(id);
    if (!binder) return res.status(404).json({ message: "Binder not found" });
    if (binder.status !== 'pending_review') {
      return res.status(400).json({ error: "Binder is not pending review" });
    }
    const { reason } = req.body;
    if (!reason || typeof reason !== 'string') {
      return res.status(400).json({ error: "reason is required" });
    }
    const updated = await storage.updateBinder(id, {
      status: 'draft',
      reviewNote: reason,
      submittedAt: null,
      reviewedAt: new Date(),
    });

    // Notify curator via email
    if (binder.curatorId) {
      const curator = await storage.getUserByUsername(binder.curatorId);
      if (curator?.email) {
        const baseUrl = getBaseUrl(req);
        const fromEmail = process.env.BREVO_FROM || 'noreply@syllabind.com';
        const { subject, html, text } = buildBinderRejectedEmail({
          binderTitle: binder.title,
          curatorName: curator.name || binder.curatorId,
          reason,
          editorUrl: `${baseUrl}/binder/${id}/edit`,
        });
        sendEmail({ to: curator.email, from: fromEmail, subject, html, text });
      }
    }

    res.json(updated);
  });

  // ========== NOTIFICATION ROUTES ==========

  // Get notification status for the current user
  app.get("/api/notifications/status", isAuthenticated, async (req, res) => {
    const user = req.user as any;
    const dbUser = await storage.getUser(user.id);
    if (!dbUser) return res.status(404).json({ message: "User not found" });

    const ackedAt = dbUser.notificationsAckedAt || null;

    if (user.isAdmin) {
      const pendingCount = await storage.getAdminUnreadCount(ackedAt);
      return res.json({
        hasUnread: pendingCount > 0,
        pendingCount,
        items: [],
      });
    }

    // Curator notifications
    const unread = await storage.getCuratorUnreadNotifications(dbUser.username, ackedAt);
    const items = unread.map(n => ({
      binderId: n.binderId,
      title: n.title,
      type: n.status === 'published' ? 'approved' : 'rejected',
    }));

    res.json({
      hasUnread: items.length > 0,
      pendingCount: 0,
      items,
    });
  });

  // Acknowledge notifications
  app.post("/api/notifications/acknowledge", isAuthenticated, async (req, res) => {
    const userId = (req.user as any).id;
    await storage.acknowledgeNotifications(userId);
    res.json({ success: true });
  });

  // ========== CATEGORY & TAG ROUTES ==========

  // List all categories (public)
  app.get("/api/categories", async (_req, res) => {
    const cats = await storage.listCategories();
    res.json(cats);
  });

  // List/search tags (public, for autocomplete)
  app.get("/api/tags", async (req, res) => {
    const query = req.query.q as string | undefined;
    const tagList = await storage.listTags(query);
    res.json(tagList);
  });

  // ========== DEMO & PREVIEW ROUTES ==========

  // Get demo binders for guest experience (public, no auth)
  app.get("/api/demo-binders", async (_req, res) => {
    try {
      const demoBinders = await storage.getDemoBinders();
      res.json(demoBinders);
    } catch (error) {
      console.error("Failed to fetch demo binders:", error);
      res.json([]);
    }
  });

  // ========== BINDER ROUTES ==========

  // List binders. When catalog=true, use server-side search with filters.
  app.get("/api/binders", async (req, res) => {
    if (req.query.catalog === 'true') {
      const visibility = req.query.visibility as string | undefined;
      const allowedVisibilities = ['public', 'unlisted', 'private'];
      // Resolve curator filter — "@admin" expands to ADMIN_USERNAMES
      let curator: string[] | undefined;
      if (req.query.curator) {
        const raw = (req.query.curator as string).split(',').filter(Boolean);
        curator = raw.flatMap(c => {
          if (c === '@admin') {
            const admins = (process.env.ADMIN_USERNAMES || '').split(',').map(u => u.trim()).filter(Boolean);
            return admins;
          }
          return [c];
        });
        if (curator.length === 0) curator = undefined;
      }

      const result = await storage.searchCatalog({
        query: req.query.q as string | undefined,
        category: req.query.category ? (req.query.category as string).split(',').filter(Boolean) : undefined,
        level: req.query.level as string | undefined,
        visibility: visibility && allowedVisibilities.includes(visibility) ? visibility : 'public',
        curator,
        sort: (req.query.sort as any) || 'newest',
        limit: Math.min(parseInt(req.query.limit as string) || 20, 50),
        offset: parseInt(req.query.offset as string) || 0,
      });
      return res.json(result);
    }
    const binders = await storage.listBinders();
    res.json(binders);
  });

  app.get("/api/binders/:id", optionalAuth, async (req, res) => {
    const id = parseInt(req.params.id);
    const binder = await storage.getBinderWithContent(id);
    if (!binder) return res.status(404).json({ message: "Binder not found" });

    // Visibility enforcement: private binders only visible to curator
    const currentUsername = (req.user as any)?.username;
    const isPreview = req.query.preview === 'true';
    if (binder.visibility === 'private' && binder.curatorId !== currentUsername) {
      return res.status(404).json({ message: "Binder not found" });
    }
    // Unlisted: accessible by link (no catalog filtering needed here)

    // Normalize week indices to 1-based (some binders have 0-based indices)
    if (binder.weeks?.length > 0) {
      const sorted = [...binder.weeks].sort((a, b) => a.index - b.index);
      sorted.forEach((week, i) => { week.index = i + 1; });
      binder.weeks = sorted;
    }

    // Attach tags and category
    const binderTagsResult = await storage.getTagsByBinderId(id);
    const categoryList = await storage.listCategories();
    const category = (binder as any).categoryId
      ? categoryList.find(c => c.id === (binder as any).categoryId) || null
      : null;

    res.json({ ...binder, tags: binderTagsResult, category });
  });

  app.put("/api/binders/:id", isAuthenticated, async (req, res) => {
    const id = parseInt(req.params.id);
    const username = (req.user as any).username;

    // Authorization: only curator (or admin) can edit
    const binder = await storage.getBinder(id);
    if (!binder) return res.status(404).json({ message: "Binder not found" });
    const isAdmin = (req.user as any).isAdmin === true;
    if (binder.curatorId !== username && !isAdmin) {
      return res.status(403).json({ error: "Forbidden: Only curator can edit this binder" });
    }

    // Strip privileged fields from non-admin updates
    const updatePayload = { ...req.body };
    if (!isAdmin) {
      delete updatePayload.isDemo;
      delete updatePayload.status; // status changes must go through /publish
      delete updatePayload.visibility; // visibility changes must go through /publish
      delete updatePayload.reviewNote;
      delete updatePayload.reviewedAt;
      delete updatePayload.submittedAt;
      delete updatePayload.readerActive;
      delete updatePayload.readersCompleted;
      delete updatePayload.searchVector;
    }

    const updated = await storage.updateBinder(id, updatePayload);

    // Sync weeks and steps if provided
    const weeksData = req.body.weeks;
    if (Array.isArray(weeksData)) {
      const savedWeeks = await storage.saveWeeksAndSteps(id, weeksData);
      return res.json({ ...updated, weeks: savedWeeks });
    }

    res.json(updated);
  });

  app.delete("/api/binders/:id", isAuthenticated, async (req, res) => {
    const id = parseInt(req.params.id);
    const username = (req.user as any).username;

    // Authorization: only curator (or admin) can delete
    const binder = await storage.getBinder(id);
    if (!binder) return res.status(404).json({ message: "Binder not found" });
    const isAdmin = (req.user as any).isAdmin === true;
    if (binder.curatorId !== username && !isAdmin) {
      return res.status(403).json({ error: "Forbidden: Only curator can delete this binder" });
    }

    await storage.deleteBinder(id);
    res.json({ success: true });
  });

  // Batch delete binders
  app.post("/api/binders/batch-delete", isAuthenticated, async (req, res) => {
    const username = (req.user as any).username;
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "Invalid request: ids must be a non-empty array" });
    }

    // Authorization: verify all binders belong to the user (or user is admin)
    const isAdmin = (req.user as any).isAdmin === true;
    const binders = await Promise.all(
      ids.map(id => storage.getBinder(parseInt(id)))
    );

    for (const binder of binders) {
      if (!binder) {
        return res.status(404).json({ message: "One or more binders not found" });
      }
      if (binder.curatorId !== username && !isAdmin) {
        return res.status(403).json({ error: "Forbidden: You can only delete your own binders" });
      }
    }

    await storage.batchDeleteBinders(ids.map(id => parseInt(id)));
    res.json({ success: true, count: ids.length });
  });

  app.post("/api/binders", isAuthenticated, async (req, res) => {
    const username = (req.user as any).username;
    const user = req.user as any;

    // Check if user is a curator (or admin)
    if (!user.isCurator && !user.isAdmin) {
      return res.status(403).json({ error: "Curator access required" });
    }

    // Free curators limited to 3 manual (non-AI) binders (admins bypass, Pro unlimited)
    if (!isProTier(user.subscriptionTier || 'free') && !user.isAdmin) {
      const manualCount = await storage.countManualBinders(username);
      if (manualCount >= FREE_MANUAL_BINDER_LIMIT) {
        return res.status(403).json({ error: "SUBSCRIPTION_REQUIRED", message: `Free plan limited to ${FREE_MANUAL_BINDER_LIMIT} manual binders. Upgrade to Pro for unlimited.` });
      }
    }

    const parsed = insertBinderSchema.safeParse({ ...req.body, curatorId: username });
    if (!parsed.success) return res.status(400).json(parsed.error);
    const binder = await storage.createBinder(parsed.data);

    // Save weeks and steps if provided
    const weeksData = req.body.weeks;
    if (Array.isArray(weeksData) && weeksData.length > 0) {
      const savedWeeks = await storage.saveWeeksAndSteps(binder.id, weeksData);
      return res.json({ ...binder, weeks: savedWeeks });
    }

    res.json(binder);
  });

  // Get curator's binders (including drafts)
  // Admin can pass ?all=true to list all binders site-wide
  app.get("/api/curator/binders", isAuthenticated, async (req, res) => {
    const username = (req.user as any).username;
    const user = req.user as any;

    if (!user.isCurator && !user.isAdmin) {
      return res.status(403).json({ error: "Curator access required" });
    }

    if (user.isAdmin && req.query.all === 'true') {
      const binders = await storage.listBinders();
      return res.json(binders);
    }

    const binders = await storage.getBindersByCurator(username);
    res.json(binders);
  });

  // Get readers for a binder (curator only)
  app.get("/api/binders/:id/readers", isAuthenticated, async (req, res) => {
    const binderId = parseInt(req.params.id);
    const username = (req.user as any).username;

    const binder = await storage.getBinder(binderId);
    if (!binder) return res.status(404).json({ message: "Binder not found" });
    const isAdmin = (req.user as any).isAdmin === true;
    if (binder.curatorId !== username && !isAdmin) {
      return res.status(403).json({ error: "Not binder owner" });
    }

    const readers = await storage.getReadersByBinderId(binderId);
    res.json(readers);
  });

  // Get classmates for a binder (public -- only shows users who opted in)
  app.get("/api/binders/:id/classmates", async (req, res) => {
    const binderId = parseInt(req.params.id);
    const classmates = await storage.getClassmatesByBinderId(binderId);
    res.json(classmates);
  });

  // Set tags for a binder (curator only)
  app.put("/api/binders/:id/tags", isAuthenticated, async (req, res) => {
    const id = parseInt(req.params.id);
    const username = (req.user as any).username;

    const binder = await storage.getBinder(id);
    if (!binder) return res.status(404).json({ message: "Binder not found" });
    const isAdmin = (req.user as any).isAdmin === true;
    if (binder.curatorId !== username && !isAdmin) {
      return res.status(403).json({ error: "Not binder owner" });
    }

    const { tags: tagNames } = req.body;
    if (!Array.isArray(tagNames)) {
      return res.status(400).json({ error: "tags must be an array of strings" });
    }
    if (tagNames.length > 5) {
      return res.status(400).json({ error: "Maximum 5 tags allowed" });
    }

    const resultTags = await storage.setBinderTags(id, tagNames);
    res.json(resultTags);
  });

  // Publish/unpublish binder (role-aware: admins publish directly, curators submit for review)
  app.post("/api/binders/:id/publish", isAuthenticated, async (req, res) => {
    const id = parseInt(req.params.id);
    const username = (req.user as any).username;

    const binder = await storage.getBinder(id);
    if (!binder) return res.status(404).json({ message: "Binder not found" });
    const isAdmin = (req.user as any).isAdmin === true;
    if (binder.curatorId !== username && !isAdmin) {
      return res.status(403).json({ error: "Not binder owner" });
    }

    const visibility = req.body?.visibility || binder.visibility || 'public';

    if (isAdmin) {
      // Admin: direct toggle (draft/pending_review ↔ published)
      const newStatus = binder.status === 'published' ? 'draft' : 'published';
      const updated = await storage.updateBinder(id, { status: newStatus, visibility });
      return res.json(updated);
    }

    // Non-admin curator
    if (binder.status === 'draft') {
      if (visibility === 'public') {
        // Free users cannot submit public binders for review
        if (!isProTier((req.user as any).subscriptionTier || 'free') && !isAdmin) {
          return res.status(403).json({ error: "SUBSCRIPTION_REQUIRED", message: "Pro subscription required to submit public binders for review. Unlisted and private publishing is available on the free plan." });
        }
        // Public = catalog listing, requires admin review
        const updated = await storage.updateBinder(id, {
          status: 'pending_review',
          visibility,
          submittedAt: new Date(),
          reviewNote: null,
        });

        // Notify admins via email
        const baseUrl = getBaseUrl(req);
        const curatorUser = await storage.getUserByUsername(username);
        const adminEmails = await getAdminEmails();
        const fromEmail = process.env.BREVO_FROM || 'noreply@syllabind.com';
        const { subject, html, text } = buildBinderSubmittedEmail({
          binderTitle: binder.title,
          curatorName: curatorUser?.name || username,
          reviewUrl: `${baseUrl}/admin/review`,
        });
        for (const adminEmail of adminEmails) {
          sendEmail({ to: adminEmail, from: fromEmail, subject, html, text });
        }

        return res.json(updated);
      } else {
        // Unlisted/private: publish directly (not in catalog)
        const updated = await storage.updateBinder(id, { status: 'published', visibility });
        return res.json(updated);
      }
    } else if (binder.status === 'pending_review') {
      // Withdraw submission
      const updated = await storage.updateBinder(id, {
        status: 'draft',
        submittedAt: null,
      });
      return res.json(updated);
    } else if (binder.status === 'published') {
      // Unpublish
      const updated = await storage.updateBinder(id, { status: 'draft' });
      return res.json(updated);
    }

    res.json(binder);
  });

  // Enrollment API
  app.get("/api/enrollments", isAuthenticated, async (req, res) => {
    const username = (req.user as any).username;
    const enrollments = await storage.getUserEnrollments(username);
    res.json(enrollments);
  });

  app.post("/api/enrollments", isAuthenticated, async (req, res) => {
    const username = (req.user as any).username;
    const user = req.user as any;

    // Free users limited to 1 active enrollment (admins and Pro bypass)
    if (!isProTier(user.subscriptionTier || 'free') && !user.isAdmin) {
      const activeCount = await storage.countActiveEnrollments(username);
      if (activeCount >= FREE_ENROLLMENT_LIMIT) {
        return res.status(403).json({ error: "SUBSCRIPTION_REQUIRED", message: "Free plan limited to 1 active enrollment. Upgrade to Pro for unlimited." });
      }
    }

    // Block enrollment on private binders for non-curators
    if (req.body.binderId) {
      const targetBinder = await storage.getBinder(parseInt(req.body.binderId));
      if (targetBinder?.visibility === 'private' && targetBinder.curatorId !== username) {
        return res.status(404).json({ message: "Binder not found" });
      }
    }

    const { shareProfile, ...enrollmentBody } = req.body;
    const parsed = insertEnrollmentSchema.safeParse({
      ...enrollmentBody,
      readerId: username,
      shareProfile: shareProfile === true
    });
    if (!parsed.success) return res.status(400).json(parsed.error);

    // Check if already enrolled in this specific binder
    const existing = await storage.getEnrollment(username, parsed.data.binderId!);
    if (existing) {
      // If previously dropped, reactivate the enrollment
      if (existing.status === 'dropped') {
        await storage.dropActiveEnrollments(username, parsed.data.binderId!);
        const reactivated = await storage.updateEnrollment(existing.id, { status: 'in-progress' });
        return res.json(reactivated);
      }
      return res.status(409).json({ message: "Already enrolled in this binder" });
    }

    // Drop any other in-progress enrollments (user can only have one active binder)
    await storage.dropActiveEnrollments(username);

    const enrollment = await storage.createEnrollment(parsed.data);
    res.json(enrollment);
  });

  // Update enrollment progress
  app.put("/api/enrollments/:id", isAuthenticated, async (req, res) => {
    const id = parseInt(req.params.id);
    const username = (req.user as any).username;

    const enrollment = await storage.getEnrollmentById(id);
    if (!enrollment) return res.status(404).json({ message: "Enrollment not found" });
    if (enrollment.readerId !== username) {
      return res.status(403).json({ error: "Not your enrollment" });
    }

    const updated = await storage.updateEnrollment(id, req.body);
    res.json(updated);
  });

  // Toggle enrollment shareProfile
  app.patch("/api/enrollments/:id/share-profile", isAuthenticated, async (req, res) => {
    const id = parseInt(req.params.id);
    const username = (req.user as any).username;

    const enrollment = await storage.getEnrollmentById(id);
    if (!enrollment) return res.status(404).json({ message: "Enrollment not found" });
    if (enrollment.readerId !== username) {
      return res.status(403).json({ error: "Not your enrollment" });
    }

    const { shareProfile } = req.body;
    if (typeof shareProfile !== 'boolean') {
      return res.status(400).json({ error: "shareProfile must be a boolean" });
    }

    const updated = await storage.updateEnrollmentShareProfile(id, shareProfile);
    res.json(updated);
  });

  // Submission API
  app.post("/api/submissions", isAuthenticated, async (req, res) => {
    const parsed = insertSubmissionSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error);
    const submission = await storage.createSubmission(parsed.data);
    res.json(submission);
  });

  app.get("/api/enrollments/:id/submissions", isAuthenticated, async (req, res) => {
    const enrollmentId = parseInt(req.params.id);
    const submissions = await storage.getSubmissionsByEnrollmentId(enrollmentId);
    res.json(submissions);
  });

  app.put("/api/submissions/:id/feedback", isAuthenticated, async (req, res) => {
    const id = parseInt(req.params.id);
    const { feedback, grade, rubricUrl } = req.body;
    const username = (req.user as any).username;

    // Get submission and verify curator owns the binder
    const submission = await storage.getSubmission(id);
    if (!submission) return res.status(404).json({ message: "Submission not found" });

    const enrollment = await storage.getEnrollmentById(submission.enrollmentId);
    if (!enrollment) return res.status(404).json({ message: "Enrollment not found" });

    const binder = await storage.getBinder(enrollment.binderId!);
    if (!binder) return res.status(404).json({ message: "Binder not found" });
    const isAdmin = (req.user as any).isAdmin === true;
    if (binder.curatorId !== username && !isAdmin) {
      return res.status(403).json({ error: "Not binder owner" });
    }

    const updated = await storage.updateSubmissionFeedback(id, feedback, grade, rubricUrl);
    res.json(updated);
  });

  // Delete a step (curator only)
  app.delete("/api/steps/:id", isAuthenticated, async (req, res) => {
    const stepId = parseInt(req.params.id);
    const username = (req.user as any).username;

    const step = await storage.getStep(stepId);
    if (!step) return res.status(404).json({ message: "Step not found" });

    const week = await storage.getWeek(step.weekId);
    if (!week) return res.status(404).json({ message: "Week not found" });

    const binder = await storage.getBinder(week.binderId);
    const isAdmin = (req.user as any).isAdmin === true;
    if (!binder || (binder.curatorId !== username && !isAdmin)) {
      return res.status(403).json({ error: "Not binder owner" });
    }

    await storage.deleteStep(stepId);
    res.json({ success: true });
  });

  // Completion Tracking API
  app.post("/api/enrollments/:enrollmentId/steps/:stepId/complete", isAuthenticated, async (req, res) => {
    const enrollmentId = parseInt(req.params.enrollmentId);
    const stepId = parseInt(req.params.stepId);

    // Verify enrollment belongs to user
    const enrollment = await storage.getEnrollmentById(enrollmentId);
    if (!enrollment || enrollment.readerId !== (req.user as any).username) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const completion = await storage.markStepCompleted(enrollmentId, stepId);
    res.json(completion);
  });

  app.delete("/api/enrollments/:enrollmentId/steps/:stepId/complete", isAuthenticated, async (req, res) => {
    const enrollmentId = parseInt(req.params.enrollmentId);
    const stepId = parseInt(req.params.stepId);

    // Verify enrollment belongs to user
    const enrollment = await storage.getEnrollmentById(enrollmentId);
    if (!enrollment || enrollment.readerId !== (req.user as any).username) {
      return res.status(403).json({ error: "Not authorized" });
    }

    await storage.markStepIncomplete(enrollmentId, stepId);
    res.json({ success: true });
  });

  app.get("/api/enrollments/:enrollmentId/completed-steps", isAuthenticated, async (req, res) => {
    const enrollmentId = parseInt(req.params.enrollmentId);
    const username = (req.user as any).username;

    // Verify enrollment belongs to user
    const enrollment = await storage.getEnrollmentById(enrollmentId);
    if (!enrollment || enrollment.readerId !== username) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const completedStepIds = await storage.getCompletedSteps(enrollmentId);
    res.json(completedStepIds);
  });

  // Analytics API (curator only)
  app.get("/api/binders/:id/analytics", isAuthenticated, async (req, res) => {
    const binderId = parseInt(req.params.id);
    const username = (req.user as any).username;

    // Verify user is curator (or admin)
    const binder = await storage.getBinder(binderId);
    const isAdmin = (req.user as any).isAdmin === true;
    if (!binder || (binder.curatorId !== username && !isAdmin)) {
      return res.status(403).json({ error: "Only curator can view analytics" });
    }

    const analytics = await storage.getBinderAnalytics(binderId);
    res.json(analytics);
  });

  app.get("/api/binders/:id/analytics/completion-rates", isAuthenticated, async (req, res) => {
    const binderId = parseInt(req.params.id);
    const username = (req.user as any).username;

    // Verify user is curator (or admin)
    const binder = await storage.getBinder(binderId);
    const isAdmin = (req.user as any).isAdmin === true;
    if (!binder || (binder.curatorId !== username && !isAdmin)) {
      return res.status(403).json({ error: "Only curator can view analytics" });
    }

    const rates = await storage.getStepCompletionRates(binderId);
    res.json(rates);
  });

  app.get("/api/binders/:id/analytics/completion-times", isAuthenticated, async (req, res) => {
    const binderId = parseInt(req.params.id);
    const username = (req.user as any).username;

    // Verify user is curator (or admin)
    const binder = await storage.getBinder(binderId);
    const isAdmin = (req.user as any).isAdmin === true;
    if (!binder || (binder.curatorId !== username && !isAdmin)) {
      return res.status(403).json({ error: "Only curator can view analytics" });
    }

    const times = await storage.getAverageCompletionTimes(binderId);
    res.json(times);
  });

  // ========== CREDIT ENDPOINTS ==========

  app.get("/api/credits/info", isAuthenticated, async (req, res) => {
    const user = req.user as any;
    const creditBalance = await storage.getCreditBalance(user.id);
    const userIsPro = isProTier(user.subscriptionTier || 'free') || user.isAdmin === true;

    res.json({
      creditBalance,
      subscriptionTier: user.subscriptionTier || 'free',
      isPro: userIsPro,
      isAdmin: user.isAdmin === true,
      costs: CREDIT_COSTS,
      limits: {
        enrollmentLimit: userIsPro ? null : FREE_ENROLLMENT_LIMIT,
        manualBinderLimit: userIsPro ? null : FREE_MANUAL_BINDER_LIMIT,
        maxWeeks: getMaxWeeks(user.subscriptionTier || 'free', user.isAdmin === true),
      },
    });
  });

  app.get("/api/credits/history", isAuthenticated, async (req, res) => {
    const user = req.user as any;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = parseInt(req.query.offset as string) || 0;

    const transactions = await storage.getCreditTransactions(user.id, limit, offset);
    res.json({ transactions });
  });

  // ========== GENERATION INFO ==========

  app.get("/api/generation-info", isAuthenticated, async (req, res) => {
    const user = req.user as any;
    const userIsPro = isProTier(user.subscriptionTier || 'free') || user.isAdmin === true;
    const creditBalance = await storage.getCreditBalance(user.id);

    res.json({
      creditBalance,
      isPro: userIsPro,
      isAdmin: user.isAdmin === true,
      subscriptionTier: user.subscriptionTier || 'free',
      costs: CREDIT_COSTS,
      maxWeeks: getMaxWeeks(user.subscriptionTier || 'free', user.isAdmin === true),
      // Backwards-compatible fields
      generationCount: 0,
      generationLimit: null,
      remaining: null,
      cooldownRemaining: 0,
    });
  });

  // ========== AI BINDER GENERATION ==========

  app.post("/api/generate-binder", isAuthenticated, async (req, res) => {
    const username = (req.user as any).username;
    const user = req.user as any;

    if (!user.isCurator && !user.isAdmin) {
      return res.status(403).json({ error: "Curator access required" });
    }

    const { binderId } = req.body;

    if (!binderId || typeof binderId !== 'number') {
      return res.status(400).json({ error: "Valid binderId required" });
    }

    const binder = await storage.getBinder(binderId);
    const isAdmin = (req.user as any).isAdmin === true;
    if (!binder || (binder.curatorId !== username && !isAdmin)) {
      return res.status(403).json({ error: "Not your binder" });
    }

    if (!binder.title || !binder.description || !binder.audienceLevel || !binder.durationWeeks) {
      return res.status(400).json({ error: "Complete basics fields before generating" });
    }

    // Max weeks based on tier
    const maxWeeks = getMaxWeeks(user.subscriptionTier || 'free', user.isAdmin === true);
    if (binder.durationWeeks > maxWeeks) {
      return res.status(403).json({ error: "SUBSCRIPTION_REQUIRED", message: `Your plan supports up to ${maxWeeks}-week binders. Upgrade to Pro for up to ${PRO_MAX_WEEKS} weeks.` });
    }

    if (binder.status === 'generating') {
      return res.status(409).json({ error: "Generation already in progress" });
    }

    // Credit-based limits (admins bypass)
    const cost = getGenerationCost(binder.durationWeeks);
    let reservationResult: { success: true; transactionId: number; newBalance: number } | null = null;

    if (!isAdmin) {
      const result = await reserveCredits(user.id, cost, 'generation', `Generate ${binder.durationWeeks}-week binder: ${binder.title}`, `binder:${binderId}`);
      if (!result.success) {
        return res.status(403).json({ error: "INSUFFICIENT_CREDITS", message: `Not enough credits. Need ${cost}, check your balance.`, cost });
      }
      reservationResult = result;
    }

    await storage.updateBinder(binderId, { status: 'generating', isAiGenerated: true });

    res.json({
      success: true,
      binderId,
      websocketUrl: `/ws/generate-binder/${binderId}`,
      creditsDeducted: cost,
      newBalance: reservationResult?.newBalance,
      transactionId: reservationResult?.transactionId,
    });
  });

  // Improve writing with AI (grammar, spelling, punctuation)
  app.post("/api/improve-text", isAuthenticated, async (req, res) => {
    const user = req.user as any;
    const { html } = req.body;

    if (!html || typeof html !== 'string') {
      return res.status(400).json({ error: "HTML text is required" });
    }

    if (html.length > 50000) {
      return res.status(400).json({ error: "Text too long" });
    }

    // Reserve 1 credit (admins bypass)
    const isAdmin = user.isAdmin === true;
    let reservationResult: { transactionId: number; newBalance: number } | null = null;

    if (!isAdmin) {
      const result = await reserveCredits(user.id, CREDIT_COSTS.improve_writing, 'improve_writing', 'Improve writing');
      if (!result.success) {
        return res.status(403).json({ error: "INSUFFICIENT_CREDITS", message: "Not enough credits for improve writing.", cost: CREDIT_COSTS.improve_writing });
      }
      reservationResult = result;
    }

    try {
      const response = await client.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 4096,
        system: "You are an expert academic editor. Improve the provided HTML text by: (1) fixing grammar, spelling, and punctuation, (2) expanding fragmented or shorthand phrasing into complete, well-formed sentences, (3) elevating the tone to be more formal and academic while keeping language succinct — no filler or fluff. Preserve the original meaning and HTML structure/tags exactly. Return only the improved HTML with no explanation or wrapping.",
        messages: [{ role: "user", content: html }],
      });

      const textBlock = response.content.find(b => b.type === 'text');
      if (!textBlock || textBlock.type !== 'text') {
        // Refund on AI failure
        if (reservationResult) {
          await refundCredits(user.id, CREDIT_COSTS.improve_writing, reservationResult.transactionId, 'AI returned no response');
        }
        return res.status(500).json({ error: "No response from AI" });
      }

      res.json({ improved: textBlock.text, newBalance: reservationResult?.newBalance });
    } catch (error: any) {
      console.error("Improve text error:", error?.message || error);
      // Refund on API error
      if (reservationResult) {
        await refundCredits(user.id, CREDIT_COSTS.improve_writing, reservationResult.transactionId, 'AI API error');
      }
      res.status(500).json({ error: "Failed to improve text" });
    }
  });

  // Regenerate a single week's content
  app.post("/api/regenerate-week", isAuthenticated, async (req, res) => {
    const username = (req.user as any).username;
    const user = req.user as any;

    if (!user.isCurator && !user.isAdmin) {
      return res.status(403).json({ error: "Curator access required" });
    }

    const { binderId, weekIndex } = req.body;

    if (!binderId || typeof binderId !== 'number') {
      return res.status(400).json({ error: "Valid binderId required" });
    }

    if (!weekIndex || typeof weekIndex !== 'number' || weekIndex < 1) {
      return res.status(400).json({ error: "Valid weekIndex required" });
    }

    const binder = await storage.getBinder(binderId);
    const isAdmin = user.isAdmin === true;
    if (!binder || (binder.curatorId !== username && !isAdmin)) {
      return res.status(403).json({ error: "Not your binder" });
    }

    if (weekIndex > (binder.durationWeeks || 0)) {
      return res.status(400).json({ error: "weekIndex exceeds binder duration" });
    }

    // Reserve credits for week regeneration (admins bypass)
    const cost = CREDIT_COSTS.per_week;
    let reservationResult: { success: true; transactionId: number; newBalance: number } | null = null;

    if (!isAdmin) {
      const result = await reserveCredits(user.id, cost, 'week_regen', `Regenerate week ${weekIndex} of: ${binder.title}`, `binder:${binderId}`);
      if (!result.success) {
        return res.status(403).json({ error: "INSUFFICIENT_CREDITS", message: `Not enough credits. Need ${cost}, check your balance.`, cost });
      }
      reservationResult = result;
    }

    res.json({
      success: true,
      binderId,
      weekIndex,
      websocketUrl: `/ws/regenerate-week/${binderId}/${weekIndex}`,
      creditsDeducted: cost,
      newBalance: reservationResult?.newBalance,
      transactionId: reservationResult?.transactionId,
    });
  });


  return httpServer;
}
