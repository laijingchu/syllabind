import type { Express } from "express";
import { authStorage } from "./storage";
import { isAuthenticated } from "./replitAuth";

// Register auth-specific routes
export function registerAuthRoutes(app: Express): void {
  // Login route that redirects to Replit Auth
  app.get("/api/auth/login", (req, res) => {
    // Replit provides a standard way to trigger auth
    // This is often handled by the frontend but having a backend redirect is safe
    res.redirect("/"); 
  });

  // Get current authenticated user
  app.get("/api/auth/user", async (req: any, res) => {
    try {
      // Replit Auth headers are automatically populated by the platform
      const replitUserId = req.headers["x-replit-user-id"];
      const replitUserName = req.headers["x-replit-user-name"];
      const replitUserRoles = req.headers["x-replit-user-roles"];

      if (!replitUserId) {
        return res.status(401).json(null);
      }

      // Upsert user in our database
      const user = await authStorage.upsertUser({
        replitId: replitUserId as string,
        username: (replitUserName as string) || `user_${replitUserId}`,
        name: (replitUserName as string) || "Replit User",
        isCreator: (replitUserRoles as string || "").includes("admin"), // Basic mapping
      });

      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Logout route
  app.get("/api/logout", (req, res) => {
    // In Replit Auth, logout is usually handled by the platform
    // but we can clear any local state or just redirect
    res.redirect("/");
  });
}
