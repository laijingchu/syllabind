import dns from "dns";
import { Agent, setGlobalDispatcher } from "undici";
import * as schema from "@shared/schema";

// Force IPv4 for all connections — fixes broken IPv6 routing on some networks
dns.setDefaultResultOrder("ipv4first");
setGlobalDispatcher(new Agent({ connect: { autoSelectFamily: true, autoSelectFamilyAttemptTimeout: 3000 } }));

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const isNeon = process.env.DATABASE_URL.includes("neon.tech");

let pool: any;
let db: any;

if (isNeon) {
  // Neon: use HTTP adapter (fetch-based) to avoid port 5432 issues
  const { neon } = require("@neondatabase/serverless");
  const { drizzle } = require("drizzle-orm/neon-http");
  const sql = neon(process.env.DATABASE_URL!);
  db = drizzle(sql, { schema });
  pool = null;
} else {
  // Standard PostgreSQL (Replit, etc.)
  const pg = require("pg");
  const { drizzle } = require("drizzle-orm/node-postgres");
  pool = new pg.default.Pool({ connectionString: process.env.DATABASE_URL });
  db = drizzle(pool, { schema });
}

export { pool, db };
