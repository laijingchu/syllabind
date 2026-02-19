import { Express, Request, Response, NextFunction } from "express";
import type { IncomingMessage } from "http";
import session from "express-session";
import crypto from "crypto";
import cookie from "cookie";
import cookieSignature from "cookie-signature";
import connectPg from "connect-pg-simple";
import { registerEmailAuthRoutes } from "./emailAuth";
import { registerGoogleAuthRoutes } from "./googleAuth";
import { registerAppleAuthRoutes } from "./appleAuth";
import { isAdminUser } from "./admin";
import { db } from "../db";
import { users } from "@shared/schema";
import { eq, sql } from "drizzle-orm";

// Module-level session secret so it's shared between setupCustomAuth and authenticateWebSocket
const isProduction = process.env.NODE_ENV === 'production';
let resolvedSessionSecret: string;

if (process.env.SESSION_SECRET) {
  resolvedSessionSecret = process.env.SESSION_SECRET;
} else if (isProduction) {
  console.error("FATAL: SESSION_SECRET is required in production. Please set it in your environment variables.");
  process.exit(1);
} else {
  console.warn("WARNING: SESSION_SECRET not set. Using a random secret for development. Sessions will not persist across restarts.");
  resolvedSessionSecret = crypto.randomBytes(32).toString('hex');
}

export function setupCustomAuth(app: Express): void {
  // Session configuration
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);

  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });

  app.set("trust proxy", 1);

  app.use(session({
    store: sessionStore,
    secret: resolvedSessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isProduction,
      maxAge: sessionTtl,
      sameSite: 'lax',
    },
  }));

  // Register all auth routes
  registerEmailAuthRoutes(app);
  registerGoogleAuthRoutes(app);
  registerAppleAuthRoutes(app);
}

// Middleware to check if user is authenticated
// Sets req.user for compatibility with existing routes
export async function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  const userId = (req as any).session?.userId;
  
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    // Fetch user from database and attach to request
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Attach user to request for use in routes (without password)
    const { password: _, ...userWithoutPassword } = user;
    (req as any).user = { ...userWithoutPassword, isAdmin: isAdminUser(user.username) };
    
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(500).json({ message: "Authentication error" });
  }
}

/**
 * Authenticate a WebSocket connection using the session cookie.
 * Returns the user (without password) or null if unauthenticated.
 */
export async function authenticateWebSocket(req: IncomingMessage): Promise<(Omit<typeof users.$inferSelect, 'password'> & { isAdmin: boolean }) | null> {
  try {
    const cookies = cookie.parse(req.headers.cookie || '');
    const raw = cookies['connect.sid'];
    if (!raw) return null;

    // express-session signs cookies as "s:<id>.<sig>" (URL-encoded as "s%3A...")
    const decoded = decodeURIComponent(raw);
    if (!decoded.startsWith('s:')) return null;

    const sessionId = cookieSignature.unsign(decoded.slice(2), resolvedSessionSecret);
    if (sessionId === false) return null;

    // Look up session directly in the sessions table
    const result = await db.execute(
      sql`SELECT sess FROM sessions WHERE sid = ${sessionId}`
    );
    const rows = (result as any).rows as any[];
    if (!rows || rows.length === 0) return null;

    const sess = typeof rows[0].sess === 'string' ? JSON.parse(rows[0].sess) : rows[0].sess;
    const userId = sess?.userId;
    if (!userId) return null;

    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) return null;

    const { password: _, ...userWithoutPassword } = user;
    return { ...userWithoutPassword, isAdmin: isAdminUser(user.username) };
  } catch (error) {
    console.error('WebSocket auth error:', error);
    return null;
  }
}
