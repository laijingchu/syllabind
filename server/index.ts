import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { WebSocketServer } from 'ws';
import { handleGenerateSyllabindWS, handleRegenerateWeekWS } from './websocket/generateSyllabind';
import { handleChatSyllabindWS } from './websocket/chatSyllabind';
import { authenticateWebSocket } from './auth';
import { storage } from './storage';

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        const jsonStr = JSON.stringify(capturedJsonResponse);
        if (jsonStr.length > 100) {
          logLine += ` :: ${jsonStr.slice(0, 100)}...`;
        } else {
          logLine += ` :: ${jsonStr}`;
        }
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  await registerRoutes(httpServer, app);

  // WebSocket server
  const wss = new WebSocketServer({ server: httpServer });

  // Keepalive: ping every 25s to prevent proxy idle-timeout disconnects
  const pingInterval = setInterval(() => {
    wss.clients.forEach(ws => {
      if ((ws as any).isAlive === false) return ws.terminate();
      (ws as any).isAlive = false;
      ws.ping();
    });
  }, 25_000);
  wss.on('close', () => clearInterval(pingInterval));

  wss.on('connection', async (ws, req) => {
    (ws as any).isAlive = true;
    ws.on('pong', () => { (ws as any).isAlive = true; });
    const url = req.url;

    // Authenticate the WebSocket connection via session cookie
    const user = await authenticateWebSocket(req);
    if (!user) {
      ws.send(JSON.stringify({ type: 'error', data: { message: 'Authentication failed. Please log in again.' } }));
      ws.close(4401, 'Unauthorized');
      return;
    }

    // Parse syllabusId from URL for ownership check
    let syllabusId: number | undefined;
    if (url?.startsWith('/ws/generate-syllabind/')) {
      const urlObj = new URL(url, 'http://localhost');
      const pathParts = urlObj.pathname.split('/');
      syllabusId = parseInt(pathParts[pathParts.length - 1] || '');
    } else if (url?.startsWith('/ws/regenerate-week/')) {
      const urlObj = new URL(url, 'http://localhost');
      const pathParts = urlObj.pathname.split('/');
      syllabusId = parseInt(pathParts[3] || '');
    } else if (url?.startsWith('/ws/chat-syllabind/')) {
      syllabusId = parseInt(url.split('/').pop() || '');
    }

    if (!syllabusId) {
      ws.send(JSON.stringify({ type: 'error', data: { message: 'Missing syllabus ID in WebSocket URL.' } }));
      ws.close(4400, 'Bad Request');
      return;
    }

    // Verify ownership
    const syllabus = await storage.getSyllabus(syllabusId);
    if (!syllabus) {
      ws.send(JSON.stringify({ type: 'error', data: { message: 'Syllabus not found.' } }));
      ws.close(4404, 'Syllabus not found');
      return;
    }
    if (syllabus.creatorId !== user.username) {
      ws.send(JSON.stringify({ type: 'error', data: { message: 'Not authorized to modify this syllabus.' } }));
      ws.close(4403, 'Forbidden');
      return;
    }

    // Route to appropriate handler
    if (url?.startsWith('/ws/generate-syllabind/')) {
      const urlObj = new URL(url, 'http://localhost');
      const useMock = urlObj.searchParams.get('mock') === 'true';
      handleGenerateSyllabindWS(ws, syllabusId, useMock);
    } else if (url?.startsWith('/ws/regenerate-week/')) {
      const urlObj = new URL(url, 'http://localhost');
      const pathParts = urlObj.pathname.split('/');
      const weekIndex = parseInt(pathParts[4] || '');
      const useMock = urlObj.searchParams.get('mock') === 'true';
      if (weekIndex) {
        handleRegenerateWeekWS(ws, syllabusId, weekIndex, useMock);
      } else {
        ws.send(JSON.stringify({ type: 'error', data: { message: 'Invalid week index.' } }));
        ws.close(4400, 'Bad Request');
      }
    } else if (url?.startsWith('/ws/chat-syllabind/')) {
      handleChatSyllabindWS(ws, syllabusId);
    }
  });

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
    },
    () => {
      log(`serving on port ${port}`);
    },
  );

  // Graceful shutdown on SIGTERM and SIGINT
  const shutdown = () => {
    log('Shutting down gracefully...');
    httpServer.close(() => {
      log('Server closed');
      process.exit(0);
    });

    // Force shutdown after 5 seconds if graceful shutdown fails
    setTimeout(() => {
      log('Forcing shutdown');
      process.exit(1);
    }, 5000);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  // Handle uncaught errors to prevent server crashes from WebSocket frame errors
  process.on('uncaughtException', (err) => {
    // Ignore Vite WebSocket errors (invalid frames from bots/scanners)
    if (err.message?.includes('Invalid WebSocket frame') || 
        err.message?.includes('invalid status code') ||
        err.message?.includes('invalid UTF-8 sequence')) {
      log(`Ignoring WebSocket frame error: ${err.message}`);
      return;
    }
    console.error('Uncaught Exception:', err);
    shutdown();
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  });
})();
