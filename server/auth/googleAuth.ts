import { Express } from "express";
import crypto from "crypto";
import { db } from "../db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

export function registerGoogleAuthRoutes(app: Express): void {
  // Initiate Google OAuth with state for CSRF protection
  app.get("/api/auth/google", (req, res) => {
    if (!GOOGLE_CLIENT_ID) {
      return res.status(500).json({ message: "Google OAuth not configured. Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET." });
    }

    // Generate state for CSRF protection
    const state = crypto.randomBytes(32).toString('hex');
    (req as any).session.oauthState = state;

    // Store returnTo for post-auth redirect (validate it starts with / to prevent open redirect)
    const returnTo = (req.query.returnTo as string) || '/';
    (req as any).session.oauthReturnTo = returnTo.startsWith('/') ? returnTo : '/';

    const redirectUri = `${req.protocol}://${req.get('host')}/api/auth/google/callback`;
    const scope = encodeURIComponent("openid email profile");
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${GOOGLE_CLIENT_ID}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code` +
      `&scope=${scope}` +
      `&access_type=offline` +
      `&prompt=consent` +
      `&state=${state}`;
    
    res.redirect(authUrl);
  });

  // Google OAuth callback with state verification
  app.get("/api/auth/google/callback", async (req, res) => {
    try {
      const { code, state } = req.query;
      const sessionState = (req as any).session?.oauthState;
      
      // Verify state to prevent CSRF
      if (!state || state !== sessionState) {
        console.error("OAuth state mismatch - potential CSRF attack");
        return res.redirect("/login?error=invalid_state");
      }
      
      // Clear the state after verification
      delete (req as any).session.oauthState;

      if (!code || !GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
        return res.redirect("/login?error=google_auth_failed");
      }

      const redirectUri = `${req.protocol}://${req.get('host')}/api/auth/google/callback`;

      // Exchange code for tokens via secure server-to-server call
      // Security: The token endpoint is accessed over HTTPS with our client secret,
      // so the returned tokens are trusted without additional signature verification
      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code: code as string,
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
      });

      if (!tokenResponse.ok) {
        console.error("Token exchange failed:", await tokenResponse.text());
        return res.redirect("/login?error=google_token_failed");
      }

      const tokens = await tokenResponse.json();

      if (!tokens.access_token) {
        console.error("No access_token in Google response");
        return res.redirect("/login?error=google_token_failed");
      }

      // Use userinfo endpoint for user data (more reliable than decoding id_token)
      // The access_token was obtained via secure token exchange, so userinfo is trusted
      const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });

      if (!userInfoResponse.ok) {
        console.error("Userinfo fetch failed");
        return res.redirect("/login?error=google_userinfo_failed");
      }

      const googleUser = await userInfoResponse.json();
      const googleUserId = googleUser.id;
      const email = googleUser.email;
      const name = googleUser.name;
      const picture = googleUser.picture;

      if (!googleUserId) {
        console.error("No user ID from Google");
        return res.redirect("/login?error=google_auth_failed");
      }

      // Find or create user
      let [user] = await db.select().from(users).where(eq(users.googleId, googleUserId));
      
      if (!user) {
        // Check if email already exists
        if (email) {
          [user] = await db.select().from(users).where(eq(users.email, email));
          
          if (user) {
            // Link Google account to existing user
            [user] = await db.update(users)
              .set({ googleId: googleUserId, avatarUrl: picture || user.avatarUrl })
              .where(eq(users.id, user.id))
              .returning();
          }
        }

        if (!user) {
          // Create new user
          const username = (email?.split('@')[0] || 'user') + '_' + Date.now().toString(36);
          [user] = await db.insert(users).values({
            googleId: googleUserId,
            email: email,
            username,
            name: name || email?.split('@')[0] || 'Google User',
            avatarUrl: picture,
            authProvider: 'google',
          }).returning();
        }
      }

      // Set session
      (req as any).session.userId = user.id;

      // Redirect to stored returnTo or default to /
      const returnTo = (req as any).session.oauthReturnTo || '/';
      delete (req as any).session.oauthReturnTo;
      res.redirect(returnTo);
    } catch (error) {
      console.error("Google auth error:", error);
      res.redirect("/login?error=google_auth_failed");
    }
  });
}
