import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import crypto from "crypto";
import connectPg from "connect-pg-simple";
import { registerEmailAuthRoutes } from "./emailAuth";
import { registerGoogleAuthRoutes } from "./googleAuth";
import { registerAppleAuthRoutes } from "./appleAuth";
import { db } from "../db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

export function setupCustomAuth(app: Express): void {
  // Session secret handling
  const sessionSecret = process.env.SESSION_SECRET;
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (!sessionSecret) {
    if (isProduction) {
      console.error("FATAL: SESSION_SECRET is required in production. Please set it in your environment variables.");
      process.exit(1);
    }
    console.warn("WARNING: SESSION_SECRET not set. Using a random secret for development. Sessions will not persist across restarts.");
  }

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
    secret: sessionSecret || crypto.randomBytes(32).toString('hex'),
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
    (req as any).user = userWithoutPassword;
    
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(500).json({ message: "Authentication error" });
  }
}
