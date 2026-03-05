// Patches Node's module resolution so drizzle-kit uses @neondatabase/serverless
// instead of the standard pg driver. This enables db:push over WebSockets
// when direct TCP to port 5432 is blocked (e.g. local development with Neon).
const Module = require('module');
const originalResolveFilename = Module._resolveFilename;

Module._resolveFilename = function (request, parent, isMain, options) {
  if (request === 'pg') {
    return originalResolveFilename.call(this, '@neondatabase/serverless', parent, isMain, options);
  }
  return originalResolveFilename.call(this, request, parent, isMain, options);
};

// Configure WebSocket for Neon serverless
const { neonConfig } = require('@neondatabase/serverless');
const ws = require('ws');
neonConfig.webSocketConstructor = ws;
