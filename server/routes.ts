import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupCustomAuth, isAuthenticated } from "./auth";
import {
  insertSyllabusSchema,
  insertEnrollmentSchema,
  insertUserSchema,
  insertSubmissionSchema
} from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Set up custom authentication
  setupCustomAuth(app);

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
    const updated = await storage.updateUser(userId, req.body);
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

  // ========== SYLLABUS ROUTES ==========

  // List all published syllabi (public)
  app.get("/api/syllabi", async (_req, res) => {
    const syllabi = await storage.listSyllabi();
    res.json(syllabi);
  });

  app.get("/api/syllabi/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const syllabus = await storage.getSyllabusWithContent(id);
    if (!syllabus) return res.status(404).json({ message: "Syllabus not found" });
    res.json(syllabus);
  });

  app.put("/api/syllabi/:id", isAuthenticated, async (req, res) => {
    const id = parseInt(req.params.id);
    const username = (req.user as any).username;

    // Authorization: only creator can edit
    const syllabus = await storage.getSyllabus(id);
    if (!syllabus) return res.status(404).json({ message: "Syllabus not found" });
    if (syllabus.creatorId !== username) {
      return res.status(403).json({ error: "Forbidden: Only creator can edit this syllabus" });
    }

    const updated = await storage.updateSyllabus(id, req.body);
    res.json(updated);
  });

  app.delete("/api/syllabi/:id", isAuthenticated, async (req, res) => {
    const id = parseInt(req.params.id);
    const username = (req.user as any).username;

    // Authorization: only creator can delete
    const syllabus = await storage.getSyllabus(id);
    if (!syllabus) return res.status(404).json({ message: "Syllabus not found" });
    if (syllabus.creatorId !== username) {
      return res.status(403).json({ error: "Forbidden: Only creator can delete this syllabus" });
    }

    await storage.deleteSyllabus(id);
    res.json({ success: true });
  });

  app.post("/api/syllabi", isAuthenticated, async (req, res) => {
    const username = (req.user as any).username;
    const user = req.user as any;

    // Check if user is a creator
    if (!user.isCreator) {
      return res.status(403).json({ error: "Creator access required" });
    }

    const parsed = insertSyllabusSchema.safeParse({ ...req.body, creatorId: username });
    if (!parsed.success) return res.status(400).json(parsed.error);
    const syllabus = await storage.createSyllabus(parsed.data);
    res.json(syllabus);
  });

  // Get creator's syllabi (including drafts)
  app.get("/api/creator/syllabi", isAuthenticated, async (req, res) => {
    const username = (req.user as any).username;
    const user = req.user as any;

    if (!user.isCreator) {
      return res.status(403).json({ error: "Creator access required" });
    }

    const syllabi = await storage.getSyllabiByCreator(username);
    res.json(syllabi);
  });

  // Get learners for a syllabus (creator only)
  app.get("/api/syllabi/:id/learners", isAuthenticated, async (req, res) => {
    const syllabusId = parseInt(req.params.id);
    const username = (req.user as any).username;

    const syllabus = await storage.getSyllabus(syllabusId);
    if (!syllabus) return res.status(404).json({ message: "Syllabus not found" });
    if (syllabus.creatorId !== username) {
      return res.status(403).json({ error: "Not syllabus owner" });
    }

    const learners = await storage.getLearnersBySyllabusId(syllabusId);
    res.json(learners);
  });

  // Publish/unpublish syllabus
  app.post("/api/syllabi/:id/publish", isAuthenticated, async (req, res) => {
    const id = parseInt(req.params.id);
    const username = (req.user as any).username;

    const syllabus = await storage.getSyllabus(id);
    if (!syllabus) return res.status(404).json({ message: "Syllabus not found" });
    if (syllabus.creatorId !== username) {
      return res.status(403).json({ error: "Not syllabus owner" });
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
    const parsed = insertEnrollmentSchema.safeParse({ ...req.body, studentId: username });
    if (!parsed.success) return res.status(400).json(parsed.error);

    // Check if already enrolled
    const existing = await storage.getEnrollment(username, parsed.data.syllabusId!);
    if (existing) {
      return res.status(409).json({ message: "Already enrolled in this syllabus" });
    }

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

    // Get submission and verify creator owns the syllabus
    const submission = await storage.getSubmission(id);
    if (!submission) return res.status(404).json({ message: "Submission not found" });

    const enrollment = await storage.getEnrollmentById(submission.enrollmentId);
    if (!enrollment) return res.status(404).json({ message: "Enrollment not found" });

    const syllabus = await storage.getSyllabus(enrollment.syllabusId!);
    if (!syllabus) return res.status(404).json({ message: "Syllabus not found" });
    if (syllabus.creatorId !== username) {
      return res.status(403).json({ error: "Not syllabus owner" });
    }

    const updated = await storage.updateSubmissionFeedback(id, feedback, grade, rubricUrl);
    res.json(updated);
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
  app.get("/api/syllabi/:id/analytics/completion-rates", isAuthenticated, async (req, res) => {
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

  app.get("/api/syllabi/:id/analytics/completion-times", isAuthenticated, async (req, res) => {
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

  return httpServer;
}
