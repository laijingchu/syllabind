import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { insertSyllabusSchema, insertEnrollmentSchema, insertUserSchema } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Set up authentication first
  await setupAuth(app);
  registerAuthRoutes(app);

  // Syllabus API
  app.get("/api/syllabi", async (_req, res) => {
    const syllabi = await storage.listSyllabi();
    res.json(syllabi);
  });

  app.get("/api/syllabi/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const syllabus = await storage.getSyllabus(id);
    if (!syllabus) return res.status(404).json({ message: "Syllabus not found" });
    res.json(syllabus);
  });

  app.post("/api/syllabi", isAuthenticated, async (req, res) => {
    const userId = (req.user as any).id; // Assuming replit auth sets this
    const parsed = insertSyllabusSchema.safeParse({ ...req.body, creatorId: userId });
    if (!parsed.success) return res.status(400).json(parsed.error);
    const syllabus = await storage.createSyllabus(parsed.data);
    res.json(syllabus);
  });

  // Enrollment API
  app.get("/api/enrollments", isAuthenticated, async (req, res) => {
    const userId = (req.user as any).id;
    const enrollments = await storage.getUserEnrollments(userId);
    res.json(enrollments);
  });

  app.post("/api/enrollments", isAuthenticated, async (req, res) => {
    const userId = (req.user as any).id;
    const parsed = insertEnrollmentSchema.safeParse({ ...req.body, userId });
    if (!parsed.success) return res.status(400).json(parsed.error);
    const enrollment = await storage.createEnrollment(parsed.data);
    res.json(enrollment);
  });

  return httpServer;
}
