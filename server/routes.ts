import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupCustomAuth, isAuthenticated } from "./auth";
import {
  insertSyllabusSchema,
  insertEnrollmentSchema,
  insertUserSchema,
  insertSubmissionSchema
} from "@shared/schema";
import multer from "multer";
import { client, CLAUDE_MODEL } from "./utils/claudeClient";
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

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Set up custom authentication
  setupCustomAuth(app);

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

    const allowedFields = ['name', 'bio', 'expertise', 'linkedin', 'website', 'twitter', 'threads', 'shareProfile', 'avatarUrl'] as const;
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

  // Toggle creator mode
  app.post("/api/users/me/toggle-creator", isAuthenticated, async (req, res) => {
    const userId = (req.user as any).id;
    const user = await storage.getUser(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const updated = await storage.updateUser(userId, { isCreator: !user.isCreator });
    const { password, ...userWithoutPassword } = updated;
    res.json(userWithoutPassword);
  });

  // Debug route to check uploads path
  app.get("/api/debug/uploads-path", (req, res) => {
    res.json({
      currentDirPath,
      uploadsPath: path.join(currentDirPath, "../uploads"),
      resolved: path.resolve(currentDirPath, "../uploads")
    });
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

  // ========== SYLLABIND ROUTES ==========

  // List all published syllabinds (public)
  app.get("/api/syllabinds", async (_req, res) => {
    const syllabinds = await storage.listSyllabinds();
    res.json(syllabinds);
  });

  app.get("/api/syllabinds/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const syllabus = await storage.getSyllabusWithContent(id);
    if (!syllabus) return res.status(404).json({ message: "Syllabind not found" });

    // Normalize week indices to 1-based (some syllabinds have 0-based indices)
    if (syllabus.weeks?.length > 0) {
      const sorted = [...syllabus.weeks].sort((a, b) => a.index - b.index);
      sorted.forEach((week, i) => { week.index = i + 1; });
      syllabus.weeks = sorted;
    }

    res.json(syllabus);
  });

  app.put("/api/syllabinds/:id", isAuthenticated, async (req, res) => {
    const id = parseInt(req.params.id);
    const username = (req.user as any).username;

    // Authorization: only creator can edit
    const syllabus = await storage.getSyllabus(id);
    if (!syllabus) return res.status(404).json({ message: "Syllabind not found" });
    if (syllabus.creatorId !== username) {
      return res.status(403).json({ error: "Forbidden: Only creator can edit this syllabind" });
    }

    const updated = await storage.updateSyllabus(id, req.body);

    // Sync weeks and steps if provided
    const weeksData = req.body.weeks;
    if (Array.isArray(weeksData)) {
      const savedWeeks = await storage.saveWeeksAndSteps(id, weeksData);
      return res.json({ ...updated, weeks: savedWeeks });
    }

    res.json(updated);
  });

  app.delete("/api/syllabinds/:id", isAuthenticated, async (req, res) => {
    const id = parseInt(req.params.id);
    const username = (req.user as any).username;

    // Authorization: only creator can delete
    const syllabus = await storage.getSyllabus(id);
    if (!syllabus) return res.status(404).json({ message: "Syllabind not found" });
    if (syllabus.creatorId !== username) {
      return res.status(403).json({ error: "Forbidden: Only creator can delete this syllabind" });
    }

    await storage.deleteSyllabus(id);
    res.json({ success: true });
  });

  // Batch delete syllabinds
  app.post("/api/syllabinds/batch-delete", isAuthenticated, async (req, res) => {
    const username = (req.user as any).username;
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "Invalid request: ids must be a non-empty array" });
    }

    // Authorization: verify all syllabinds belong to the user
    const syllabinds = await Promise.all(
      ids.map(id => storage.getSyllabus(parseInt(id)))
    );

    for (const syllabus of syllabinds) {
      if (!syllabus) {
        return res.status(404).json({ message: "One or more syllabinds not found" });
      }
      if (syllabus.creatorId !== username) {
        return res.status(403).json({ error: "Forbidden: You can only delete your own syllabinds" });
      }
    }

    await storage.batchDeleteSyllabinds(ids.map(id => parseInt(id)));
    res.json({ success: true, count: ids.length });
  });

  app.post("/api/syllabinds", isAuthenticated, async (req, res) => {
    const username = (req.user as any).username;
    const user = req.user as any;

    // Check if user is a creator
    if (!user.isCreator) {
      return res.status(403).json({ error: "Creator access required" });
    }

    const parsed = insertSyllabusSchema.safeParse({ ...req.body, creatorId: username });
    if (!parsed.success) return res.status(400).json(parsed.error);
    const syllabus = await storage.createSyllabus(parsed.data);

    // Save weeks and steps if provided
    const weeksData = req.body.weeks;
    if (Array.isArray(weeksData) && weeksData.length > 0) {
      const savedWeeks = await storage.saveWeeksAndSteps(syllabus.id, weeksData);
      return res.json({ ...syllabus, weeks: savedWeeks });
    }

    res.json(syllabus);
  });

  // Get creator's syllabinds (including drafts)
  app.get("/api/creator/syllabinds", isAuthenticated, async (req, res) => {
    const username = (req.user as any).username;
    const user = req.user as any;

    if (!user.isCreator) {
      return res.status(403).json({ error: "Creator access required" });
    }

    const syllabinds = await storage.getSyllabindsByCreator(username);
    res.json(syllabinds);
  });

  // Get learners for a syllabind (creator only)
  app.get("/api/syllabinds/:id/learners", isAuthenticated, async (req, res) => {
    const syllabusId = parseInt(req.params.id);
    const username = (req.user as any).username;

    const syllabus = await storage.getSyllabus(syllabusId);
    if (!syllabus) return res.status(404).json({ message: "Syllabind not found" });
    if (syllabus.creatorId !== username) {
      return res.status(403).json({ error: "Not syllabind owner" });
    }

    const learners = await storage.getLearnersBySyllabusId(syllabusId);
    res.json(learners);
  });

  // Get classmates for a syllabind (public -- only shows users who opted in)
  app.get("/api/syllabinds/:id/classmates", async (req, res) => {
    const syllabusId = parseInt(req.params.id);
    const classmates = await storage.getClassmatesBySyllabusId(syllabusId);
    res.json(classmates);
  });

  // Publish/unpublish syllabind
  app.post("/api/syllabinds/:id/publish", isAuthenticated, async (req, res) => {
    const id = parseInt(req.params.id);
    const username = (req.user as any).username;

    const syllabus = await storage.getSyllabus(id);
    if (!syllabus) return res.status(404).json({ message: "Syllabind not found" });
    if (syllabus.creatorId !== username) {
      return res.status(403).json({ error: "Not syllabind owner" });
    }

    const newStatus = syllabus.status === 'published' ? 'draft' : 'published';
    const updated = await storage.updateSyllabus(id, { status: newStatus });
    res.json(updated);
  });

  // Enrollment API
  app.get("/api/enrollments", isAuthenticated, async (req, res) => {
    const username = (req.user as any).username;
    const enrollments = await storage.getUserEnrollments(username);
    res.json(enrollments);
  });

  app.post("/api/enrollments", isAuthenticated, async (req, res) => {
    const username = (req.user as any).username;
    const { shareProfile, ...enrollmentBody } = req.body;
    const parsed = insertEnrollmentSchema.safeParse({
      ...enrollmentBody,
      studentId: username,
      shareProfile: shareProfile === true
    });
    if (!parsed.success) return res.status(400).json(parsed.error);

    // Check if already enrolled in this specific syllabus
    const existing = await storage.getEnrollment(username, parsed.data.syllabusId!);
    if (existing) {
      // If previously dropped, reactivate the enrollment
      if (existing.status === 'dropped') {
        await storage.dropActiveEnrollments(username, parsed.data.syllabusId!);
        const reactivated = await storage.updateEnrollment(existing.id, { status: 'in-progress' });
        return res.json(reactivated);
      }
      return res.status(409).json({ message: "Already enrolled in this syllabind" });
    }

    // Drop any other in-progress enrollments (user can only have one active syllabus)
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
    if (enrollment.studentId !== username) {
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
    if (enrollment.studentId !== username) {
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

    // Get submission and verify creator owns the syllabind
    const submission = await storage.getSubmission(id);
    if (!submission) return res.status(404).json({ message: "Submission not found" });

    const enrollment = await storage.getEnrollmentById(submission.enrollmentId);
    if (!enrollment) return res.status(404).json({ message: "Enrollment not found" });

    const syllabus = await storage.getSyllabus(enrollment.syllabusId!);
    if (!syllabus) return res.status(404).json({ message: "Syllabind not found" });
    if (syllabus.creatorId !== username) {
      return res.status(403).json({ error: "Not syllabind owner" });
    }

    const updated = await storage.updateSubmissionFeedback(id, feedback, grade, rubricUrl);
    res.json(updated);
  });

  // Delete a step (creator only)
  app.delete("/api/steps/:id", isAuthenticated, async (req, res) => {
    const stepId = parseInt(req.params.id);
    const username = (req.user as any).username;

    const step = await storage.getStep(stepId);
    if (!step) return res.status(404).json({ message: "Step not found" });

    const week = await storage.getWeek(step.weekId);
    if (!week) return res.status(404).json({ message: "Week not found" });

    const syllabus = await storage.getSyllabus(week.syllabusId);
    if (!syllabus || syllabus.creatorId !== username) {
      return res.status(403).json({ error: "Not syllabind owner" });
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
    if (!enrollment || enrollment.studentId !== (req.user as any).username) {
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
    if (!enrollment || enrollment.studentId !== (req.user as any).username) {
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
    if (!enrollment || enrollment.studentId !== username) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const completedStepIds = await storage.getCompletedSteps(enrollmentId);
    res.json(completedStepIds);
  });

  // Analytics API (creator only)
  app.get("/api/syllabinds/:id/analytics", isAuthenticated, async (req, res) => {
    const syllabusId = parseInt(req.params.id);
    const username = (req.user as any).username;

    // Verify user is creator
    const syllabus = await storage.getSyllabus(syllabusId);
    if (!syllabus || syllabus.creatorId !== username) {
      return res.status(403).json({ error: "Only creator can view analytics" });
    }

    const analytics = await storage.getSyllabusAnalytics(syllabusId);
    res.json(analytics);
  });

  app.get("/api/syllabinds/:id/analytics/completion-rates", isAuthenticated, async (req, res) => {
    const syllabusId = parseInt(req.params.id);
    const username = (req.user as any).username;

    // Verify user is creator
    const syllabus = await storage.getSyllabus(syllabusId);
    if (!syllabus || syllabus.creatorId !== username) {
      return res.status(403).json({ error: "Only creator can view analytics" });
    }

    const rates = await storage.getStepCompletionRates(syllabusId);
    res.json(rates);
  });

  app.get("/api/syllabinds/:id/analytics/completion-times", isAuthenticated, async (req, res) => {
    const syllabusId = parseInt(req.params.id);
    const username = (req.user as any).username;

    // Verify user is creator
    const syllabus = await storage.getSyllabus(syllabusId);
    if (!syllabus || syllabus.creatorId !== username) {
      return res.status(403).json({ error: "Only creator can view analytics" });
    }

    const times = await storage.getAverageCompletionTimes(syllabusId);
    res.json(times);
  });

  // ========== AI SYLLABIND GENERATION ==========

  app.post("/api/generate-syllabind", isAuthenticated, async (req, res) => {
    const username = (req.user as any).username;
    const user = req.user as any;

    if (!user.isCreator) {
      return res.status(403).json({ error: "Creator access required" });
    }

    const { syllabusId } = req.body;

    if (!syllabusId || typeof syllabusId !== 'number') {
      return res.status(400).json({ error: "Valid syllabusId required" });
    }

    const syllabus = await storage.getSyllabus(syllabusId);
    if (!syllabus || syllabus.creatorId !== username) {
      return res.status(403).json({ error: "Not your syllabind" });
    }

    if (!syllabus.title || !syllabus.description || !syllabus.audienceLevel || !syllabus.durationWeeks) {
      return res.status(400).json({ error: "Complete basics fields before generating" });
    }

    if (syllabus.status === 'generating') {
      return res.status(409).json({ error: "Generation already in progress" });
    }

    await storage.updateSyllabus(syllabusId, { status: 'generating' });

    res.json({
      success: true,
      syllabusId,
      websocketUrl: `/ws/generate-syllabind/${syllabusId}`
    });
  });

  // Improve writing with AI (grammar, spelling, punctuation)
  app.post("/api/improve-text", isAuthenticated, async (req, res) => {
    const { html } = req.body;

    if (!html || typeof html !== 'string') {
      return res.status(400).json({ error: "HTML text is required" });
    }

    if (html.length > 50000) {
      return res.status(400).json({ error: "Text too long" });
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
        return res.status(500).json({ error: "No response from AI" });
      }

      res.json({ improved: textBlock.text });
    } catch (error: any) {
      console.error("Improve text error:", error?.message || error);
      res.status(500).json({ error: "Failed to improve text" });
    }
  });

  // Regenerate a single week's content
  app.post("/api/regenerate-week", isAuthenticated, async (req, res) => {
    const username = (req.user as any).username;
    const user = req.user as any;

    if (!user.isCreator) {
      return res.status(403).json({ error: "Creator access required" });
    }

    const { syllabusId, weekIndex } = req.body;

    if (!syllabusId || typeof syllabusId !== 'number') {
      return res.status(400).json({ error: "Valid syllabusId required" });
    }

    if (!weekIndex || typeof weekIndex !== 'number' || weekIndex < 1) {
      return res.status(400).json({ error: "Valid weekIndex required" });
    }

    const syllabus = await storage.getSyllabus(syllabusId);
    if (!syllabus || syllabus.creatorId !== username) {
      return res.status(403).json({ error: "Not your syllabind" });
    }

    if (weekIndex > (syllabus.durationWeeks || 0)) {
      return res.status(400).json({ error: "weekIndex exceeds syllabus duration" });
    }

    res.json({
      success: true,
      syllabusId,
      weekIndex,
      websocketUrl: `/ws/regenerate-week/${syllabusId}/${weekIndex}`
    });
  });

  app.get("/api/syllabinds/:id/chat-messages", isAuthenticated, async (req, res) => {
    const syllabusId = parseInt(req.params.id);
    const username = (req.user as any).username;

    const syllabus = await storage.getSyllabus(syllabusId);
    if (!syllabus || syllabus.creatorId !== username) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const messages = await storage.getChatMessages(syllabusId);
    res.json(messages);
  });

  app.post("/api/syllabinds/:id/chat-messages", isAuthenticated, async (req, res) => {
    const syllabusId = parseInt(req.params.id);
    const username = (req.user as any).username;
    const { role, content } = req.body;

    const syllabus = await storage.getSyllabus(syllabusId);
    if (!syllabus || syllabus.creatorId !== username) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const message = await storage.createChatMessage({
      syllabusId,
      role,
      content
    });
    res.json(message);
  });

  return httpServer;
}
