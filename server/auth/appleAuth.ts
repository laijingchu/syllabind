import { Express } from "express";
import crypto from "crypto";
import { db } from "../db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

const APPLE_CLIENT_ID = process.env.APPLE_CLIENT_ID;
const APPLE_CLIENT_SECRET = process.env.APPLE_CLIENT_SECRET;

export function registerAppleAuthRoutes(app: Express): void {
  // Initiate Apple Sign In with state for CSRF protection
  app.get("/api/auth/apple", (req, res) => {
    if (!APPLE_CLIENT_ID) {
      return res.status(500).json({ message: "Apple Sign In not configured. Please add APPLE_CLIENT_ID and APPLE_CLIENT_SECRET." });
    }

    // Generate state for CSRF protection
    const state = crypto.randomBytes(32).toString('hex');
    (req as any).session.oauthState = state;

    // Store returnTo for post-auth redirect (validate it starts with / to prevent open redirect)
    const returnTo = (req.query.returnTo as string) || '/';
    (req as any).session.oauthReturnTo = returnTo.startsWith('/') ? returnTo : '/';

    const redirectUri = `${req.protocol}://${req.get('host')}/api/auth/apple/callback`;
    const scope = "name email";
    
    // Request authorization code only - we'll exchange it server-side
    const authUrl = `https://appleid.apple.com/auth/authorize?` +
      `client_id=${APPLE_CLIENT_ID}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code` +
      `&scope=${encodeURIComponent(scope)}` +
      `&response_mode=form_post` +
      `&state=${state}`;
    
    res.redirect(authUrl);
  });

  // Apple Sign In callback (POST because Apple uses form_post)
  app.post("/api/auth/apple/callback", async (req, res) => {
    try {
      const { code, state, user: appleUserData } = req.body;
      const sessionState = (req as any).session?.oauthState;
      
      // Verify state to prevent CSRF
      if (!state || state !== sessionState) {
        console.error("OAuth state mismatch - potential CSRF attack");
        return res.redirect("/login?error=invalid_state");
      }
      
      // Clear OAuth session data after verification
      delete (req as any).session.oauthState;

      if (!code || !APPLE_CLIENT_ID || !APPLE_CLIENT_SECRET) {
        return res.redirect("/login?error=apple_auth_failed");
      }

      const redirectUri = `${req.protocol}://${req.get('host')}/api/auth/apple/callback`;

      // Exchange authorization code for tokens via secure server-to-server call
      // Security: This is a direct HTTPS call to Apple's token endpoint with our client secret
      const tokenResponse = await fetch("https://appleid.apple.com/auth/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code: code as string,
          client_id: APPLE_CLIENT_ID,
          client_secret: APPLE_CLIENT_SECRET,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
      });

      if (!tokenResponse.ok) {
        console.error("Apple token exchange failed:", await tokenResponse.text());
        return res.redirect("/login?error=apple_token_failed");
      }

      const tokens = await tokenResponse.json();

      if (!tokens.id_token) {
        console.error("No id_token in Apple response");
        return res.redirect("/login?error=apple_token_failed");
      }

      // Decode the id_token from Apple's token endpoint
      // Security: Since this token came directly from Apple's token endpoint via HTTPS
      // with our client secret, it is trusted. The token endpoint validates the code
      // and returns verified tokens.
      const idTokenParts = tokens.id_token.split('.');
      if (idTokenParts.length !== 3) {
        console.error("Invalid ID token format");
        return res.redirect("/login?error=invalid_token");
      }

      const payload = JSON.parse(Buffer.from(idTokenParts[1], 'base64').toString());
      
      // Basic sanity checks on the token
      if (payload.iss !== 'https://appleid.apple.com') {
        console.error("Invalid token issuer");
        return res.redirect("/login?error=invalid_issuer");
      }
      
      if (payload.aud !== APPLE_CLIENT_ID) {
        console.error("Invalid token audience");
        return res.redirect("/login?error=invalid_audience");
      }

      const appleUserId = payload.sub;
      const email = payload.email;

      if (!appleUserId) {
        console.error("No user ID in Apple token");
        return res.redirect("/login?error=apple_auth_failed");
      }

      // Parse user data if provided (only on first sign in)
      let userName = "Apple User";
      if (appleUserData) {
        try {
          const userData = typeof appleUserData === 'string' ? JSON.parse(appleUserData) : appleUserData;
          if (userData.name) {
            userName = `${userData.name.firstName || ''} ${userData.name.lastName || ''}`.trim() || "Apple User";
          }
        } catch (e) {
          // Ignore parsing errors
        }
      }

      // Find or create user
      let [user] = await db.select().from(users).where(eq(users.appleId, appleUserId));
      
      if (!user) {
        // Check if email already exists
        if (email) {
          [user] = await db.select().from(users).where(eq(users.email, email));
          
          if (user) {
            // Link Apple account to existing user
            [user] = await db.update(users)
              .set({ appleId: appleUserId })
              .where(eq(users.id, user.id))
              .returning();
          }
        }

        if (!user) {
          // Create new user
          const username = (email?.split('@')[0] || 'user') + '_' + Date.now().toString(36);
          [user] = await db.insert(users).values({
            appleId: appleUserId,
            email: email,
            username,
            name: userName,
            authProvider: 'apple',
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
      console.error("Apple auth error:", error);
      res.redirect("/login?error=apple_auth_failed");
    }
  });
}
