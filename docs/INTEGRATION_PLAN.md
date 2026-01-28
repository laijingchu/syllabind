# Syllabind Integration Plan: Template → Production Backend

## Overview

This plan integrates best practices from the VibeCode Template to create a production-ready backend for Syllabind. We'll wire up proper middleware, error handling, rate limiting, and security features while removing all mock data.

---

## Phase 1: Backend Infrastructure Setup

### 1.1 Middleware & Security (Template Patterns)

**Create new files:**

#### `server/middleware/auth.ts`
```typescript
import { Request, Response, NextFunction } from 'express';
import { logSecurity } from '../lib/audit';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    email?: string;
    name?: string;
    isCreator?: boolean;
    avatarUrl?: string;
    replitId?: string;
  };
}

// Middleware that requires authentication
export function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    logSecurity('auth_failed', { reason: 'not_authenticated', path: req.path, method: req.method, ip: req.ip });
    return res.status(401).json({
      error: 'Authentication required',
      code: 'auth/no-token'
    });
  }

  next();
}

// Optional authentication middleware
export function optionalAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  next();
}

// Creator-only middleware
export function requireCreator(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.user?.isCreator) {
    return res.status(403).json({
      error: 'Creator access required',
      code: 'auth/not-creator'
    });
  }
  next();
}

// Authorization: check if user owns resource
export function requireOwnership(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const username = req.user?.username;
  const resourceOwner = (req as any).resourceOwner; // Set by route handler

  if (username !== resourceOwner) {
    return res.status(403).json({
      error: 'Forbidden: You do not own this resource',
      code: 'auth/not-owner'
    });
  }
  next();
}

export function getUserId(req: AuthenticatedRequest): string | undefined {
  return req.user?.id;
}

export function getUsername(req: AuthenticatedRequest): string | undefined {
  return req.user?.username;
}
```

#### `server/lib/errors.ts`
```typescript
import { Response } from 'express';
import { ZodError } from 'zod';

export class AppError extends Error {
  public readonly status: number;
  public readonly code?: string;
  public readonly isOperational: boolean;

  constructor(message: string, status: number = 500, code?: string, isOperational: boolean = true) {
    super(message);
    this.status = status;
    this.code = code;
    this.isOperational = isOperational;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export function handleError(error: unknown, res: Response): void {
  console.error('Error occurred:', error);
  const requestId = (res as any)?.locals?.requestId;

  if (error instanceof ZodError) {
    res.status(400).json({
      error: 'Validation failed',
      details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
      requestId
    });
    return;
  }

  if (error instanceof AppError) {
    res.status(error.status).json({
      error: sanitizeErrorMessage(error.message, error.status),
      code: error.code,
      requestId
    });
    return;
  }

  if (error instanceof Error) {
    const status = getStatusFromError(error);
    res.status(status).json({
      error: sanitizeErrorMessage(error.message, status),
      requestId
    });
    return;
  }

  res.status(500).json({
    error: 'Internal Server Error',
    requestId
  });
}

function getStatusFromError(error: Error): number {
  if (error.message.toLowerCase().includes('not found')) return 404;
  if (error.message.toLowerCase().includes('unauthorized')) return 403;
  if (error.message.toLowerCase().includes('validation')) return 400;
  return 500;
}

function sanitizeErrorMessage(message: string, status: number): string {
  if (process.env.NODE_ENV === 'production') {
    const messages: Record<number, string> = {
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      409: 'Conflict',
      429: 'Too Many Requests',
      500: 'Internal Server Error'
    };
    return messages[status] || 'Internal Server Error';
  }
  return message;
}

export const errors = {
  notFound: (resource: string = 'Resource') =>
    new AppError(`${resource} not found`, 404, 'not_found'),
  unauthorized: (message: string = 'Unauthorized') =>
    new AppError(message, 401, 'unauthorized'),
  forbidden: (message: string = 'Access denied') =>
    new AppError(message, 403, 'forbidden'),
  validation: (message: string) =>
    new AppError(message, 400, 'validation_error'),
  conflict: (message: string) =>
    new AppError(message, 409, 'conflict'),
  internal: (message: string = 'Internal server error') =>
    new AppError(message, 500, 'internal_error')
};
```

#### `server/lib/audit.ts`
```typescript
// Lightweight audit logging (can integrate PostHog later)
export function logEvent(event: string, data: any) {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[EVENT] ${event}:`, JSON.stringify(data));
  }
  // TODO: Integrate with PostHog or other analytics
}

export function logSecurity(event: string, data: any) {
  console.warn(`[SECURITY] ${event}:`, JSON.stringify(data));
  // TODO: Integrate with security monitoring
}

export const posthog = null; // Placeholder for future integration
```

#### `server/middleware/sanitize.ts`
```typescript
import { Request, Response, NextFunction } from 'express';

// XSS sanitization middleware
export function sanitizeInputs(req: Request, res: Response, next: NextFunction) {
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }
  next();
}

function sanitizeObject(obj: any): any {
  if (typeof obj === 'string') {
    return obj
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  if (obj && typeof obj === 'object') {
    const sanitized: any = {};
    for (const key in obj) {
      sanitized[key] = sanitizeObject(obj[key]);
    }
    return sanitized;
  }

  return obj;
}
```

### 1.2 Update `server/index.ts`

Add security middleware, rate limiting, CORS, and better error handling:

```typescript
import express, { type Request, Response, NextFunction } from "express";
import { randomUUID } from 'crypto';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { registerRoutes } from "./routes";
import { createServer } from "http";
import { sanitizeInputs } from './middleware/sanitize';
import { logEvent, logSecurity } from './lib/audit';

const app = express();
const httpServer = createServer(app);
const PORT = parseInt(process.env.PORT || "5000", 10);

// Trust proxy for Replit infrastructure
app.set('trust proxy', true);

// Security headers with Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: process.env.NODE_ENV === 'production'
        ? ["'self'", "https://fonts.googleapis.com"]
        : ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: process.env.NODE_ENV === 'production'
        ? ["'self'"]
        : ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https://*.dicebear.com"],
    }
  },
  crossOriginEmbedderPolicy: false,
}));

// Request ID middleware
app.use((req, res, next) => {
  const requestId = randomUUID();
  (res as any).locals = { requestId };
  res.setHeader('X-Request-Id', requestId);
  next();
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: any) => req.user?.username ?? ipKeyGenerator(req),
  handler: (req: any, res, _next, options) => {
    logSecurity('rate_limit', {
      method: req.method,
      path: req.path,
      username: req.user?.username,
      ip: req.ip
    });
    res.status(429).json(options.message);
  },
  skip: (req) => req.path === '/health' || req.path === '/ready'
});

app.use('/api', limiter);

// Health checks
app.get('/health', (_req, res) => res.status(200).json({ status: 'ok' }));

try {
  const { db } = await import('./db');
  app.get('/ready', async (_req, res) => {
    try {
      await db.execute({ sql: 'SELECT 1', args: [] });
      res.status(200).json({ status: 'ready' });
    } catch (e) {
      res.status(503).json({ status: 'degraded' });
    }
  });
} catch {
  app.get('/ready', (_req, res) => res.status(200).json({ status: 'ready' }));
}

// CORS
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? [
        process.env.FRONTEND_URL,
        `https://${process.env.REPL_SLUG}-${process.env.REPL_OWNER}.replit.app`
      ].filter(Boolean)
    : ['http://localhost:5173', `http://localhost:${PORT}`, 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));
app.use(cookieParser());

// XSS sanitization for API routes
app.use('/api', sanitizeInputs);

// Request logging in development
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      if (req.path.startsWith('/api')) {
        console.log(`${req.method} ${req.path} ${res.statusCode} in ${duration}ms`);
      }
    });
    next();
  });
}

(async () => {
  await registerRoutes(httpServer, app);

  // Global error handler
  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    const requestId = (res as any)?.locals?.requestId;

    logEvent('api.error', { requestId, method: req.method, path: req.path, status });

    res.status(status).json({
      error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : message,
      requestId
    });
  });

  // Setup Vite in development
  if (process.env.NODE_ENV === "production") {
    const { serveStatic } = await import("./static");
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  httpServer.listen({ port: PORT, host: "0.0.0.0" }, () => {
    console.log(`Server running on port ${PORT}`);
  });
})();
```

---

## Phase 2: Comprehensive API Routes

### 2.1 Update `server/routes.ts`

Complete API coverage for all Syllabind features:

```typescript
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupCustomAuth } from "./auth";
import { requireAuth, requireCreator, getUsername, AuthenticatedRequest } from "./middleware/auth";
import { handleError, errors } from "./lib/errors";
import {
  insertSyllabusSchema,
  insertEnrollmentSchema,
  insertUserSchema,
  insertSubmissionSchema,
  insertWeekSchema,
  insertStepSchema,
} from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  setupCustomAuth(app);

  // ========== USER ROUTES ==========

  // Get current user
  app.get("/api/users/me", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const username = getUsername(req);
      if (!username) throw errors.unauthorized();

      const user = await storage.getUserByUsername(username);
      if (!user) throw errors.notFound('User');

      res.json(user);
    } catch (error) {
      handleError(error, res);
    }
  });

  // Update user profile
  app.put("/api/users/me", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const username = getUsername(req);
      if (!username) throw errors.unauthorized();

      const user = await storage.getUserByUsername(username);
      if (!user) throw errors.notFound('User');

      const updated = await storage.updateUser(user.id, req.body);
      res.json(updated);
    } catch (error) {
      handleError(error, res);
    }
  });

  // Toggle creator mode
  app.post("/api/users/me/toggle-creator", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const username = getUsername(req);
      if (!username) throw errors.unauthorized();

      const user = await storage.getUserByUsername(username);
      if (!user) throw errors.notFound('User');

      const updated = await storage.updateUser(user.id, { isCreator: !user.isCreator });
      res.json(updated);
    } catch (error) {
      handleError(error, res);
    }
  });

  // Get user by username (public profile)
  app.get("/api/users/:username", async (req, res) => {
    try {
      const user = await storage.getUserByUsername(req.params.username);
      if (!user) throw errors.notFound('User');

      // Only return public info if shareProfile is false
      if (!user.shareProfile) {
        res.json({ username: user.username, name: user.name, avatarUrl: user.avatarUrl });
        return;
      }

      res.json(user);
    } catch (error) {
      handleError(error, res);
    }
  });

  // ========== SYLLABUS ROUTES ==========

  // List all published syllabi (public)
  app.get("/api/syllabi", async (_req, res) => {
    try {
      const syllabi = await storage.listPublishedSyllabi();
      res.json(syllabi);
    } catch (error) {
      handleError(error, res);
    }
  });

  // Get syllabus by ID (public, but only published)
  app.get("/api/syllabi/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const syllabus = await storage.getSyllabusWithContent(id);

      if (!syllabus) throw errors.notFound('Syllabus');
      if (syllabus.status !== 'published') throw errors.forbidden('Syllabus is not published');

      res.json(syllabus);
    } catch (error) {
      handleError(error, res);
    }
  });

  // Get creator's syllabi (including drafts)
  app.get("/api/creator/syllabi", requireAuth, requireCreator, async (req: AuthenticatedRequest, res) => {
    try {
      const username = getUsername(req);
      if (!username) throw errors.unauthorized();

      const syllabi = await storage.getSyllabiByCreator(username);
      res.json(syllabi);
    } catch (error) {
      handleError(error, res);
    }
  });

  // Create syllabus
  app.post("/api/syllabi", requireAuth, requireCreator, async (req: AuthenticatedRequest, res) => {
    try {
      const username = getUsername(req);
      if (!username) throw errors.unauthorized();

      const parsed = insertSyllabusSchema.safeParse({ ...req.body, creatorId: username });
      if (!parsed.success) throw parsed.error;

      const syllabus = await storage.createSyllabus(parsed.data);
      res.json(syllabus);
    } catch (error) {
      handleError(error, res);
    }
  });

  // Update syllabus
  app.put("/api/syllabi/:id", requireAuth, requireCreator, async (req: AuthenticatedRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const username = getUsername(req);
      if (!username) throw errors.unauthorized();

      const syllabus = await storage.getSyllabus(id);
      if (!syllabus) throw errors.notFound('Syllabus');
      if (syllabus.creatorId !== username) throw errors.forbidden('Not syllabus owner');

      const updated = await storage.updateSyllabus(id, req.body);
      res.json(updated);
    } catch (error) {
      handleError(error, res);
    }
  });

  // Delete syllabus
  app.delete("/api/syllabi/:id", requireAuth, requireCreator, async (req: AuthenticatedRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const username = getUsername(req);
      if (!username) throw errors.unauthorized();

      const syllabus = await storage.getSyllabus(id);
      if (!syllabus) throw errors.notFound('Syllabus');
      if (syllabus.creatorId !== username) throw errors.forbidden('Not syllabus owner');

      await storage.deleteSyllabus(id);
      res.json({ success: true });
    } catch (error) {
      handleError(error, res);
    }
  });

  // Publish/unpublish syllabus
  app.post("/api/syllabi/:id/publish", requireAuth, requireCreator, async (req: AuthenticatedRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const username = getUsername(req);
      if (!username) throw errors.unauthorized();

      const syllabus = await storage.getSyllabus(id);
      if (!syllabus) throw errors.notFound('Syllabus');
      if (syllabus.creatorId !== username) throw errors.forbidden('Not syllabus owner');

      const newStatus = syllabus.status === 'published' ? 'draft' : 'published';
      const updated = await storage.updateSyllabus(id, { status: newStatus });
      res.json(updated);
    } catch (error) {
      handleError(error, res);
    }
  });

  // ========== WEEK ROUTES ==========

  // Create week
  app.post("/api/weeks", requireAuth, requireCreator, async (req: AuthenticatedRequest, res) => {
    try {
      const username = getUsername(req);
      if (!username) throw errors.unauthorized();

      // Verify syllabus ownership
      const syllabus = await storage.getSyllabus(req.body.syllabusId);
      if (!syllabus) throw errors.notFound('Syllabus');
      if (syllabus.creatorId !== username) throw errors.forbidden('Not syllabus owner');

      const parsed = insertWeekSchema.safeParse(req.body);
      if (!parsed.success) throw parsed.error;

      const week = await storage.createWeek(parsed.data);
      res.json(week);
    } catch (error) {
      handleError(error, res);
    }
  });

  // ========== STEP ROUTES ==========

  // Create step
  app.post("/api/steps", requireAuth, requireCreator, async (req: AuthenticatedRequest, res) => {
    try {
      const username = getUsername(req);
      if (!username) throw errors.unauthorized();

      // Verify week/syllabus ownership (need to get week → syllabus)
      const week = await storage.getWeek(req.body.weekId);
      if (!week) throw errors.notFound('Week');

      const syllabus = await storage.getSyllabus(week.syllabusId);
      if (!syllabus) throw errors.notFound('Syllabus');
      if (syllabus.creatorId !== username) throw errors.forbidden('Not syllabus owner');

      const parsed = insertStepSchema.safeParse(req.body);
      if (!parsed.success) throw parsed.error;

      const step = await storage.createStep(parsed.data);
      res.json(step);
    } catch (error) {
      handleError(error, res);
    }
  });

  // ========== ENROLLMENT ROUTES ==========

  // Get user's enrollments
  app.get("/api/enrollments", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const username = getUsername(req);
      if (!username) throw errors.unauthorized();

      const enrollments = await storage.getUserEnrollments(username);
      res.json(enrollments);
    } catch (error) {
      handleError(error, res);
    }
  });

  // Enroll in syllabus
  app.post("/api/enrollments", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const username = getUsername(req);
      if (!username) throw errors.unauthorized();

      const parsed = insertEnrollmentSchema.safeParse({ ...req.body, studentId: username });
      if (!parsed.success) throw parsed.error;

      // Check if already enrolled
      const existing = await storage.getEnrollment(username, parsed.data.syllabusId!);
      if (existing) throw errors.conflict('Already enrolled in this syllabus');

      const enrollment = await storage.createEnrollment(parsed.data);
      res.json(enrollment);
    } catch (error) {
      handleError(error, res);
    }
  });

  // Update enrollment progress
  app.put("/api/enrollments/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const username = getUsername(req);
      if (!username) throw errors.unauthorized();

      const enrollment = await storage.getEnrollmentById(id);
      if (!enrollment) throw errors.notFound('Enrollment');
      if (enrollment.studentId !== username) throw errors.forbidden('Not your enrollment');

      const updated = await storage.updateEnrollment(id, req.body);
      res.json(updated);
    } catch (error) {
      handleError(error, res);
    }
  });

  // ========== COMPLETION TRACKING ROUTES ==========

  // Mark step complete
  app.post("/api/enrollments/:enrollmentId/steps/:stepId/complete", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const enrollmentId = parseInt(req.params.enrollmentId);
      const stepId = parseInt(req.params.stepId);
      const username = getUsername(req);
      if (!username) throw errors.unauthorized();

      const enrollment = await storage.getEnrollmentById(enrollmentId);
      if (!enrollment) throw errors.notFound('Enrollment');
      if (enrollment.studentId !== username) throw errors.forbidden('Not your enrollment');

      const completion = await storage.markStepCompleted(enrollmentId, stepId);
      res.json(completion);
    } catch (error) {
      handleError(error, res);
    }
  });

  // Mark step incomplete
  app.delete("/api/enrollments/:enrollmentId/steps/:stepId/complete", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const enrollmentId = parseInt(req.params.enrollmentId);
      const stepId = parseInt(req.params.stepId);
      const username = getUsername(req);
      if (!username) throw errors.unauthorized();

      const enrollment = await storage.getEnrollmentById(enrollmentId);
      if (!enrollment) throw errors.notFound('Enrollment');
      if (enrollment.studentId !== username) throw errors.forbidden('Not your enrollment');

      await storage.markStepIncomplete(enrollmentId, stepId);
      res.json({ success: true });
    } catch (error) {
      handleError(error, res);
    }
  });

  // Get completed steps for enrollment
  app.get("/api/enrollments/:enrollmentId/completed-steps", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const enrollmentId = parseInt(req.params.enrollmentId);
      const username = getUsername(req);
      if (!username) throw errors.unauthorized();

      const enrollment = await storage.getEnrollmentById(enrollmentId);
      if (!enrollment) throw errors.notFound('Enrollment');
      if (enrollment.studentId !== username) throw errors.forbidden('Not your enrollment');

      const completedStepIds = await storage.getCompletedSteps(enrollmentId);
      res.json(completedStepIds);
    } catch (error) {
      handleError(error, res);
    }
  });

  // ========== SUBMISSION ROUTES ==========

  // Create submission
  app.post("/api/submissions", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const parsed = insertSubmissionSchema.safeParse(req.body);
      if (!parsed.success) throw parsed.error;

      // Verify enrollment ownership
      const username = getUsername(req);
      if (!username) throw errors.unauthorized();

      const enrollment = await storage.getEnrollmentById(parsed.data.enrollmentId);
      if (!enrollment) throw errors.notFound('Enrollment');
      if (enrollment.studentId !== username) throw errors.forbidden('Not your enrollment');

      const submission = await storage.createSubmission(parsed.data);
      res.json(submission);
    } catch (error) {
      handleError(error, res);
    }
  });

  // Get submissions for enrollment
  app.get("/api/enrollments/:id/submissions", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const enrollmentId = parseInt(req.params.id);
      const username = getUsername(req);
      if (!username) throw errors.unauthorized();

      const enrollment = await storage.getEnrollmentById(enrollmentId);
      if (!enrollment) throw errors.notFound('Enrollment');
      if (enrollment.studentId !== username) throw errors.forbidden('Not your enrollment');

      const submissions = await storage.getSubmissionsByEnrollmentId(enrollmentId);
      res.json(submissions);
    } catch (error) {
      handleError(error, res);
    }
  });

  // Update submission feedback (creator only)
  app.put("/api/submissions/:id/feedback", requireAuth, requireCreator, async (req: AuthenticatedRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const { feedback, grade, rubricUrl } = req.body;
      const username = getUsername(req);
      if (!username) throw errors.unauthorized();

      // Verify creator owns the syllabus
      const submission = await storage.getSubmission(id);
      if (!submission) throw errors.notFound('Submission');

      const enrollment = await storage.getEnrollmentById(submission.enrollmentId);
      if (!enrollment) throw errors.notFound('Enrollment');

      const syllabus = await storage.getSyllabus(enrollment.syllabusId!);
      if (!syllabus) throw errors.notFound('Syllabus');
      if (syllabus.creatorId !== username) throw errors.forbidden('Not syllabus owner');

      const updated = await storage.updateSubmissionFeedback(id, feedback, grade, rubricUrl);
      res.json(updated);
    } catch (error) {
      handleError(error, res);
    }
  });

  // ========== ANALYTICS ROUTES (Creator Only) ==========

  // Get step completion rates
  app.get("/api/syllabi/:id/analytics/completion-rates", requireAuth, requireCreator, async (req: AuthenticatedRequest, res) => {
    try {
      const syllabusId = parseInt(req.params.id);
      const username = getUsername(req);
      if (!username) throw errors.unauthorized();

      const syllabus = await storage.getSyllabus(syllabusId);
      if (!syllabus) throw errors.notFound('Syllabus');
      if (syllabus.creatorId !== username) throw errors.forbidden('Not syllabus owner');

      const rates = await storage.getStepCompletionRates(syllabusId);
      res.json(rates);
    } catch (error) {
      handleError(error, res);
    }
  });

  // Get average completion times
  app.get("/api/syllabi/:id/analytics/completion-times", requireAuth, requireCreator, async (req: AuthenticatedRequest, res) => {
    try {
      const syllabusId = parseInt(req.params.id);
      const username = getUsername(req);
      if (!username) throw errors.unauthorized();

      const syllabus = await storage.getSyllabus(syllabusId);
      if (!syllabus) throw errors.notFound('Syllabus');
      if (syllabus.creatorId !== username) throw errors.forbidden('Not syllabus owner');

      const times = await storage.getAverageCompletionTimes(syllabusId);
      res.json(times);
    } catch (error) {
      handleError(error, res);
    }
  });

  // Get learners for syllabus (creator only)
  app.get("/api/syllabi/:id/learners", requireAuth, requireCreator, async (req: AuthenticatedRequest, res) => {
    try {
      const syllabusId = parseInt(req.params.id);
      const username = getUsername(req);
      if (!username) throw errors.unauthorized();

      const syllabus = await storage.getSyllabus(syllabusId);
      if (!syllabus) throw errors.notFound('Syllabus');
      if (syllabus.creatorId !== username) throw errors.forbidden('Not syllabus owner');

      const learners = await storage.getLearnersBySyllabusId(syllabusId);
      res.json(learners);
    } catch (error) {
      handleError(error, res);
    }
  });

  return httpServer;
}
```

---

## Phase 3: Enhanced Storage Layer

### 3.1 Update `server/storage.ts`

Add missing methods:

```typescript
// Add these methods to the DatabaseStorage class:

async getWeek(id: number): Promise<Week | undefined> {
  const [week] = await db.select().from(weeks).where(eq(weeks.id, id));
  return week;
}

async getSubmission(id: number): Promise<Submission | undefined> {
  const [submission] = await db.select().from(submissions).where(eq(submissions.id, id));
  return submission;
}

async listPublishedSyllabi(): Promise<Syllabus[]> {
  return await db.select().from(syllabi).where(eq(syllabi.status, 'published'));
}

async getSyllabiByCreator(username: string): Promise<Syllabus[]> {
  return await db.select().from(syllabi).where(eq(syllabi.creatorId, username));
}

async getLearnersBySyllabusId(syllabusId: number): Promise<any[]> {
  // Get all enrollments for this syllabus
  const enrollmentsData = await db.select()
    .from(enrollments)
    .where(eq(enrollments.syllabusId, syllabusId));

  // Get user data for each enrollment
  const learners = await Promise.all(
    enrollmentsData.map(async (enrollment) => {
      const user = await this.getUserByUsername(enrollment.studentId!);
      return {
        user,
        status: enrollment.status,
        joinedDate: enrollment.joinedAt?.toISOString(),
        enrollmentId: enrollment.id
      };
    })
  );

  return learners;
}
```

---

## Phase 4: Database Seed Data

### 4.1 Create `server/seed.ts`

Convert mock data to real database entries:

```typescript
import { storage } from './storage';
import { MOCK_SYLLABI, MOCK_LEARNERS, MOCK_USER } from '../client/src/lib/mockData';

export async function seedDatabase() {
  console.log('🌱 Seeding database...');

  // 1. Create users
  console.log('Creating users...');

  const mainUser = await storage.createUser({
    username: MOCK_USER.username,
    name: MOCK_USER.name,
    email: `${MOCK_USER.username}@example.com`,
    isCreator: false,
    bio: MOCK_USER.bio,
    linkedin: MOCK_USER.linkedin,
    twitter: MOCK_USER.twitter,
    shareProfile: MOCK_USER.shareProfile,
    password: 'password123' // Temp password for testing
  });

  // Create a creator user
  const creatorUser = await storage.createUser({
    username: 'creator1',
    name: 'Course Creator',
    email: 'creator@example.com',
    isCreator: true,
    bio: 'Experienced educator and content creator',
    linkedin: 'coursecreator',
    shareProfile: true,
    password: 'password123'
  });

  // Create learner users
  const learnerUsers = await Promise.all(
    MOCK_LEARNERS.map(learner =>
      storage.createUser({
        username: learner.user.username,
        name: learner.user.name,
        email: `${learner.user.username}@example.com`,
        isCreator: false,
        bio: learner.user.bio,
        avatarUrl: learner.user.avatarUrl,
        linkedin: learner.user.linkedin,
        twitter: learner.user.twitter,
        threads: learner.user.threads,
        website: learner.user.website,
        shareProfile: true,
        password: 'password123'
      })
    )
  );

  // 2. Create syllabi with weeks and steps
  console.log('Creating syllabi...');

  for (const mockSyllabus of MOCK_SYLLABI) {
    const syllabus = await storage.createSyllabus({
      title: mockSyllabus.title,
      description: mockSyllabus.description,
      audienceLevel: mockSyllabus.audienceLevel,
      durationWeeks: mockSyllabus.durationWeeks,
      status: mockSyllabus.status,
      creatorId: creatorUser.username
    });

    // Create weeks for this syllabus
    for (const mockWeek of mockSyllabus.weeks) {
      const week = await storage.createWeek({
        syllabusId: syllabus.id,
        index: mockWeek.index,
        title: mockWeek.title,
        description: mockWeek.description
      });

      // Create steps for this week
      for (const mockStep of mockWeek.steps) {
        await storage.createStep({
          weekId: week.id,
          position: mockStep.position,
          type: mockStep.type,
          title: mockStep.title,
          url: mockStep.url,
          note: mockStep.note,
          promptText: mockStep.promptText,
          estimatedMinutes: mockStep.estimatedMinutes,
          author: (mockStep as any).author,
          creationDate: (mockStep as any).creationDate,
          mediaType: (mockStep as any).mediaType
        });
      }
    }
  }

  // 3. Create enrollments for learners
  console.log('Creating enrollments...');

  const syllabi = await storage.listSyllabi();

  for (let i = 0; i < learnerUsers.length; i++) {
    const learner = learnerUsers[i];
    const mockLearner = MOCK_LEARNERS[i];

    // Enroll in first syllabus
    const enrollment = await storage.createEnrollment({
      studentId: learner.username,
      syllabusId: syllabi[0].id,
      status: mockLearner.status,
      currentWeekIndex: 1
    });

    // Mark some steps as complete for "in-progress" learners
    if (mockLearner.status === 'in-progress') {
      const syllabusWithContent = await storage.getSyllabusWithContent(syllabi[0].id);
      const firstWeekSteps = syllabusWithContent?.weeks[0]?.steps || [];

      // Mark first 2 steps as complete
      for (let j = 0; j < Math.min(2, firstWeekSteps.length); j++) {
        await storage.markStepCompleted(enrollment.id!, firstWeekSteps[j].id);
      }
    }
  }

  console.log('✅ Database seeded successfully!');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('❌ Seed failed:', err);
      process.exit(1);
    });
}
```

---

## Phase 5: Client-Side Integration

### 5.1 Remove Mock Data

**Delete:**
- `client/src/lib/mockData.ts` (completely remove)

### 5.2 Update `client/src/lib/store.tsx`

Replace mock data with real API calls:

```typescript
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Syllabus, Enrollment, LearnerProfile, Submission } from './types';

interface StoreContextType {
  user: any;
  isAuthenticated: boolean;
  logout: () => void;
  isLoading: boolean;
  syllabi: Syllabus[];
  enrollment: Enrollment | null;
  toggleCreatorMode: () => Promise<void>;
  completeActiveSyllabus: () => Promise<void>;
  updateEnrollment: (updates: Partial<Enrollment>) => void;
  completeStep: (stepId: number) => Promise<void>;
  markStepComplete: (stepId: number) => Promise<void>;
  markStepIncomplete: (stepId: number) => Promise<void>;
  saveExercise: (stepId: number, answer: string, isShared: boolean) => Promise<void>;
  getSubmission: (stepId: number) => Submission | undefined;
  getActiveSyllabus: () => Syllabus | undefined;
  getSyllabusById: (id: number) => Syllabus | undefined;
  getOverallProgress: (syllabusId: number) => number;
  enrollInSyllabus: (syllabusId: number) => Promise<void>;
  isStepCompleted: (stepId: number) => boolean;
  getLearnersForSyllabus: (syllabusId: number) => Promise<LearnerProfile[]>;
  updateUser: (updates: any) => Promise<void>;
  getProgressForWeek: (syllabusId: number, weekIndex: number) => number;
  createSyllabus: (syllabus: any) => Promise<Syllabus>;
  updateSyllabus: (syllabus: Syllabus) => Promise<void>;
  fetchSyllabi: () => Promise<void>;
  fetchEnrollments: () => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, logout, isLoading } = useAuth();
  const [syllabi, setSyllabi] = useState<Syllabus[]>([]);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [completedStepIds, setCompletedStepIds] = useState<number[]>([]);

  // Fetch syllabi on mount
  useEffect(() => {
    fetchSyllabi();
  }, []);

  // Fetch enrollments when user logs in
  useEffect(() => {
    if (isAuthenticated) {
      fetchEnrollments();
    }
  }, [isAuthenticated]);

  // Fetch completed steps when enrollment changes
  useEffect(() => {
    if (enrollment?.id) {
      fetch(`/api/enrollments/${enrollment.id}/completed-steps`, { credentials: 'include' })
        .then(res => res.json())
        .then(data => setCompletedStepIds(data))
        .catch(err => console.error('Failed to fetch completed steps:', err));

      fetch(`/api/enrollments/${enrollment.id}/submissions`, { credentials: 'include' })
        .then(res => res.json())
        .then(data => setSubmissions(data))
        .catch(err => console.error('Failed to fetch submissions:', err));
    }
  }, [enrollment?.id]);

  const fetchSyllabi = async () => {
    try {
      const res = await fetch('/api/syllabi');
      const data = await res.json();
      setSyllabi(data);
    } catch (err) {
      console.error('Failed to fetch syllabi:', err);
    }
  };

  const fetchEnrollments = async () => {
    try {
      const res = await fetch('/api/enrollments', { credentials: 'include' });
      const data = await res.json();
      if (data.length > 0) {
        setEnrollment(data[0]); // Use first active enrollment
      }
    } catch (err) {
      console.error('Failed to fetch enrollments:', err);
    }
  };

  const toggleCreatorMode = async () => {
    try {
      const res = await fetch('/api/users/me/toggle-creator', {
        method: 'POST',
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to toggle creator mode');
      window.location.reload(); // Refresh to update auth state
    } catch (err) {
      console.error('Failed to toggle creator mode:', err);
    }
  };

  const enrollInSyllabus = async (syllabusId: number) => {
    try {
      const res = await fetch('/api/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ syllabusId })
      });
      if (!res.ok) throw new Error('Failed to enroll');
      const newEnrollment = await res.json();
      setEnrollment(newEnrollment);
    } catch (err) {
      console.error('Failed to enroll:', err);
      throw err;
    }
  };

  const markStepComplete = async (stepId: number) => {
    if (!enrollment?.id) return;

    try {
      const res = await fetch(`/api/enrollments/${enrollment.id}/steps/${stepId}/complete`, {
        method: 'POST',
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to mark step complete');

      setCompletedStepIds(prev => [...prev, stepId]);
    } catch (err) {
      console.error('Failed to mark step complete:', err);
    }
  };

  const markStepIncomplete = async (stepId: number) => {
    if (!enrollment?.id) return;

    try {
      const res = await fetch(`/api/enrollments/${enrollment.id}/steps/${stepId}/complete`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to mark step incomplete');

      setCompletedStepIds(prev => prev.filter(id => id !== stepId));
    } catch (err) {
      console.error('Failed to mark step incomplete:', err);
    }
  };

  const saveExercise = async (stepId: number, answer: string, isShared: boolean) => {
    if (!enrollment?.id) return;

    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          enrollmentId: enrollment.id,
          stepId,
          answer,
          isShared
        })
      });

      if (!res.ok) throw new Error('Failed to save submission');

      const submission = await res.json();
      setSubmissions(prev => [...prev.filter(s => s.stepId !== stepId), submission]);
    } catch (err) {
      console.error('Failed to save exercise:', err);
    }
  };

  const updateUser = async (updates: any) => {
    try {
      const res = await fetch('/api/users/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updates)
      });
      if (!res.ok) throw new Error('Failed to update user');
      window.location.reload(); // Refresh to update user state
    } catch (err) {
      console.error('Failed to update user:', err);
    }
  };

  const createSyllabus = async (syllabusData: any): Promise<Syllabus> => {
    try {
      const res = await fetch('/api/syllabi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(syllabusData)
      });
      if (!res.ok) throw new Error('Failed to create syllabus');
      const syllabus = await res.json();
      await fetchSyllabi();
      return syllabus;
    } catch (err) {
      console.error('Failed to create syllabus:', err);
      throw err;
    }
  };

  const updateSyllabus = async (syllabus: Syllabus) => {
    try {
      const res = await fetch(`/api/syllabi/${syllabus.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(syllabus)
      });
      if (!res.ok) throw new Error('Failed to update syllabus');
      await fetchSyllabi();
    } catch (err) {
      console.error('Failed to update syllabus:', err);
    }
  };

  const getLearnersForSyllabus = async (syllabusId: number): Promise<LearnerProfile[]> => {
    try {
      const res = await fetch(`/api/syllabi/${syllabusId}/learners`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch learners');
      return await res.json();
    } catch (err) {
      console.error('Failed to fetch learners:', err);
      return [];
    }
  };

  const completeStep = markStepComplete;

  const completeActiveSyllabus = async () => {
    if (!enrollment?.id) return;

    try {
      const res = await fetch(`/api/enrollments/${enrollment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: 'completed' })
      });
      if (!res.ok) throw new Error('Failed to complete syllabus');

      const updated = await res.json();
      setEnrollment(updated);
    } catch (err) {
      console.error('Failed to complete syllabus:', err);
    }
  };

  const updateEnrollment = (updates: Partial<Enrollment>) => {
    if (enrollment) {
      setEnrollment({ ...enrollment, ...updates });
    }
  };

  const getSubmission = (stepId: number) => {
    return submissions.find(s => s.stepId === stepId);
  };

  const getActiveSyllabus = () => {
    if (!enrollment?.activeSyllabusId) return undefined;
    return syllabi.find(s => s.id === enrollment.activeSyllabusId);
  };

  const getSyllabusById = (id: number) => {
    return syllabi.find(s => s.id === id);
  };

  const isStepCompleted = (stepId: number) => {
    return completedStepIds.includes(stepId);
  };

  const getOverallProgress = (syllabusId: number) => {
    const syllabus = syllabi.find(s => s.id === syllabusId);
    if (!syllabus) return 0;

    const totalSteps = syllabus.weeks.reduce((sum, week) => sum + week.steps.length, 0);
    if (totalSteps === 0) return 0;

    const completed = syllabus.weeks.reduce((sum, week) => {
      return sum + week.steps.filter(step => completedStepIds.includes(step.id)).length;
    }, 0);

    return Math.round((completed / totalSteps) * 100);
  };

  const getProgressForWeek = (syllabusId: number, weekIndex: number) => {
    const syllabus = syllabi.find(s => s.id === syllabusId);
    if (!syllabus) return 0;

    const week = syllabus.weeks.find(w => w.index === weekIndex);
    if (!week || week.steps.length === 0) return 0;

    const completed = week.steps.filter(step => completedStepIds.includes(step.id)).length;
    return Math.round((completed / week.steps.length) * 100);
  };

  return (
    <StoreContext.Provider
      value={{
        user,
        isAuthenticated,
        logout,
        isLoading,
        syllabi,
        enrollment,
        toggleCreatorMode,
        completeActiveSyllabus,
        updateEnrollment,
        completeStep,
        markStepComplete,
        markStepIncomplete,
        saveExercise,
        getSubmission,
        getActiveSyllabus,
        getSyllabusById,
        getOverallProgress,
        enrollInSyllabus,
        isStepCompleted,
        getLearnersForSyllabus,
        updateUser,
        getProgressForWeek,
        createSyllabus,
        updateSyllabus,
        fetchSyllabi,
        fetchEnrollments
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within StoreProvider');
  return context;
};
```

---

## Phase 6: Package Dependencies

### 6.1 Install Required Packages

```bash
npm install helmet cors express-rate-limit cookie-parser
npm install --save-dev @types/cors @types/cookie-parser
```

---

## Commands to Run

### Database Setup
```bash
# 1. Push schema to database (creates tables)
npm run db:push

# 2. Seed database with mock data converted to real data
tsx server/seed.ts
```

### Development
```bash
# Start development server
npm run dev
```

---

## Summary of Changes

### ✅ What We're Adopting from Template:
1. **Security**: Helmet, CORS, rate limiting, XSS sanitization
2. **Error Handling**: Centralized error handling with AppError class
3. **Middleware**: Auth middleware with proper authorization checks
4. **Logging**: Request ID tracking and audit logging
5. **Health Checks**: `/health` and `/ready` endpoints
6. **Request Parsing**: Proper body size limits

### ✅ What We're Keeping from Syllabind:
1. **Auth System**: Replit Auth (no Firebase integration)
2. **Database**: PostgreSQL + Drizzle ORM with normalized schema
3. **Data Model**: Users, Syllabi, Weeks, Steps, Enrollments, Submissions
4. **UI Components**: All React components and pages

### ✅ What We're Removing:
1. **Mock Data**: All mock data files deleted
2. **Mock State**: Local state replaced with API calls
3. **Stubs**: All console.log stubs replaced with real implementations

### ✅ What We're Adding:
1. **Complete API Coverage**: All CRUD operations for all resources
2. **Authorization**: Proper ownership checks for resources
3. **Real Data Flow**: Client ↔ API ↔ Database
4. **Seed Script**: Convert mock data to real database entries
5. **Error Responses**: Consistent error handling with request IDs

---

## Testing Checklist

After implementation:

- [ ] Can view syllabi catalog
- [ ] Can enroll in a syllabus
- [ ] Can mark steps complete/incomplete
- [ ] Can submit exercises
- [ ] Can toggle creator mode
- [ ] Creator can create syllabi
- [ ] Creator can view learners
- [ ] Creator can provide feedback
- [ ] Error handling works (try unauthorized access)
- [ ] Rate limiting works (make 500+ requests)
- [ ] Health checks respond correctly

---

## Next Steps After This Integration

1. **Add Cohorts**: Implement cohort management endpoints
2. **Add Search**: Add search/filter for syllabi catalog
3. **Add Pagination**: Add pagination to list endpoints
4. **Add Caching**: Add Redis for caching frequently accessed data
5. **Add File Upload**: Integrate file upload for avatar images
6. **Add Email**: Integrate SendGrid for notifications
7. **Add Analytics**: Integrate PostHog for usage analytics
