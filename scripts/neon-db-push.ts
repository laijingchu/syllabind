/**
 * Push schema to Neon database using the HTTP API (fetch-based).
 * Bypasses port 5432 connectivity issues by using HTTPS.
 *
 * Usage: NODE_OPTIONS='--dns-result-order=ipv4first' npx tsx scripts/neon-db-push.ts
 */
import dns from "dns";
import { Agent, setGlobalDispatcher } from "undici";
dns.setDefaultResultOrder("ipv4first");
setGlobalDispatcher(new Agent({ connect: { autoSelectFamily: true, autoSelectFamilyAttemptTimeout: 3000 } }));

import "dotenv/config";
import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

const sql = neon(process.env.DATABASE_URL);
const exec = (query: string) => sql(query as any);

const statements = [
  // Sessions
  `CREATE TABLE IF NOT EXISTS "sessions" (
    "sid" varchar PRIMARY KEY NOT NULL,
    "sess" jsonb NOT NULL,
    "expire" timestamp NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS "sessions_expire_idx" ON "sessions" ("expire")`,

  // Users
  `CREATE TABLE IF NOT EXISTS "users" (
    "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "email" text UNIQUE,
    "password" text,
    "replit_id" text UNIQUE,
    "google_id" text UNIQUE,
    "apple_id" text UNIQUE,
    "username" text NOT NULL UNIQUE,
    "name" text,
    "avatar_url" text,
    "is_curator" boolean DEFAULT false,
    "bio" text,
    "expertise" text,
    "linkedin" text,
    "website" text,
    "twitter" text,
    "threads" text,
    "profile_title" text,
    "scheduling_url" text,
    "share_profile" boolean DEFAULT true,
    "auth_provider" text DEFAULT 'email',
    "stripe_customer_id" text UNIQUE,
    "subscription_status" text NOT NULL DEFAULT 'free',
    "generation_count" integer NOT NULL DEFAULT 0,
    "last_generated_at" timestamp,
    "notifications_acked_at" timestamp,
    "credit_balance" integer NOT NULL DEFAULT 0,
    "subscription_tier" text NOT NULL DEFAULT 'free',
    "credits_granted_at" timestamp
  )`,

  // Categories
  `CREATE TABLE IF NOT EXISTS "categories" (
    "id" serial PRIMARY KEY,
    "name" text NOT NULL UNIQUE,
    "slug" text NOT NULL UNIQUE,
    "description" text,
    "display_order" integer NOT NULL DEFAULT 0,
    "created_at" timestamp DEFAULT now()
  )`,

  // Binders
  `CREATE TABLE IF NOT EXISTS "binders" (
    "id" serial PRIMARY KEY,
    "title" text NOT NULL,
    "description" text NOT NULL,
    "audience_level" text NOT NULL,
    "duration_weeks" integer NOT NULL,
    "status" text NOT NULL DEFAULT 'draft',
    "visibility" text NOT NULL DEFAULT 'public',
    "curator_id" text REFERENCES "users"("username") ON DELETE SET NULL ON UPDATE CASCADE,
    "category_id" integer REFERENCES "categories"("id") ON DELETE SET NULL,
    "created_at" timestamp DEFAULT now(),
    "updated_at" timestamp DEFAULT now(),
    "submitted_at" timestamp,
    "reviewed_at" timestamp,
    "review_note" text,
    "reader_active" integer DEFAULT 0,
    "readers_completed" integer DEFAULT 0,
    "show_scheduling_link" boolean DEFAULT true,
    "is_demo" boolean DEFAULT false,
    "media_preference" text DEFAULT 'auto',
    "is_ai_generated" boolean DEFAULT false,
    "search_vector" tsvector
  )`,
  `CREATE INDEX IF NOT EXISTS "binders_curator_id_idx" ON "binders" ("curator_id")`,
  `CREATE INDEX IF NOT EXISTS "binders_status_idx" ON "binders" ("status")`,
  `CREATE INDEX IF NOT EXISTS "binders_status_visibility_idx" ON "binders" ("status", "visibility")`,
  `CREATE INDEX IF NOT EXISTS "binders_category_id_idx" ON "binders" ("category_id")`,

  // Enrollments
  `CREATE TABLE IF NOT EXISTS "enrollments" (
    "id" serial PRIMARY KEY,
    "reader_id" text REFERENCES "users"("username") ON DELETE CASCADE ON UPDATE CASCADE,
    "binder_id" integer REFERENCES "binders"("id") ON DELETE CASCADE,
    "status" text NOT NULL DEFAULT 'in-progress',
    "current_week_index" integer DEFAULT 1,
    "share_profile" boolean DEFAULT false,
    "joined_at" timestamp DEFAULT now()
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "enrollments_reader_binder_idx" ON "enrollments" ("reader_id", "binder_id")`,
  `CREATE INDEX IF NOT EXISTS "enrollments_reader_id_idx" ON "enrollments" ("reader_id")`,
  `CREATE INDEX IF NOT EXISTS "enrollments_binder_id_idx" ON "enrollments" ("binder_id")`,

  // Weeks
  `CREATE TABLE IF NOT EXISTS "weeks" (
    "id" serial PRIMARY KEY,
    "binder_id" integer NOT NULL REFERENCES "binders"("id") ON DELETE CASCADE,
    "index" integer NOT NULL,
    "title" text,
    "description" text
  )`,
  `CREATE INDEX IF NOT EXISTS "weeks_binder_id_idx" ON "weeks" ("binder_id")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "weeks_binder_id_index_idx" ON "weeks" ("binder_id", "index")`,

  // Steps
  `CREATE TABLE IF NOT EXISTS "steps" (
    "id" serial PRIMARY KEY,
    "week_id" integer NOT NULL REFERENCES "weeks"("id") ON DELETE CASCADE,
    "position" integer NOT NULL,
    "type" text NOT NULL,
    "title" text NOT NULL,
    "url" text,
    "note" text,
    "author" text,
    "creation_date" text,
    "media_type" text,
    "prompt_text" text,
    "estimated_minutes" integer
  )`,
  `CREATE INDEX IF NOT EXISTS "steps_week_id_idx" ON "steps" ("week_id")`,

  // Submissions
  `CREATE TABLE IF NOT EXISTS "submissions" (
    "id" serial PRIMARY KEY,
    "enrollment_id" integer NOT NULL REFERENCES "enrollments"("id") ON DELETE CASCADE,
    "step_id" integer NOT NULL REFERENCES "steps"("id") ON DELETE CASCADE,
    "answer" text NOT NULL,
    "is_shared" boolean NOT NULL DEFAULT false,
    "submitted_at" timestamp NOT NULL DEFAULT now(),
    "feedback" text,
    "grade" text,
    "rubric_url" text
  )`,
  `CREATE INDEX IF NOT EXISTS "submissions_enrollment_id_idx" ON "submissions" ("enrollment_id")`,
  `CREATE INDEX IF NOT EXISTS "submissions_step_id_idx" ON "submissions" ("step_id")`,

  // Completed Steps
  `CREATE TABLE IF NOT EXISTS "completed_steps" (
    "enrollment_id" integer NOT NULL REFERENCES "enrollments"("id") ON DELETE CASCADE,
    "step_id" integer NOT NULL REFERENCES "steps"("id") ON DELETE CASCADE,
    "completed_at" timestamp NOT NULL DEFAULT now(),
    PRIMARY KEY ("enrollment_id", "step_id")
  )`,

  // Cohorts
  `CREATE TABLE IF NOT EXISTS "cohorts" (
    "id" serial PRIMARY KEY,
    "name" text NOT NULL,
    "binder_id" integer NOT NULL REFERENCES "binders"("id") ON DELETE CASCADE,
    "curator_id" text REFERENCES "users"("username") ON DELETE SET NULL ON UPDATE CASCADE,
    "description" text,
    "is_active" boolean NOT NULL DEFAULT true,
    "created_at" timestamp NOT NULL DEFAULT now()
  )`,

  // Cohort Members
  `CREATE TABLE IF NOT EXISTS "cohort_members" (
    "cohort_id" integer NOT NULL REFERENCES "cohorts"("id") ON DELETE CASCADE,
    "reader_id" text NOT NULL REFERENCES "users"("username") ON DELETE CASCADE ON UPDATE CASCADE,
    "joined_at" timestamp NOT NULL DEFAULT now(),
    "role" text NOT NULL DEFAULT 'member',
    PRIMARY KEY ("cohort_id", "reader_id")
  )`,

  // Credit Transactions
  `CREATE TABLE IF NOT EXISTS "credit_transactions" (
    "id" serial PRIMARY KEY,
    "user_id" varchar NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "amount" integer NOT NULL,
    "balance" integer NOT NULL,
    "type" text NOT NULL,
    "description" text NOT NULL,
    "metadata" text,
    "created_at" timestamp NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS "credit_transactions_user_id_idx" ON "credit_transactions" ("user_id")`,
  `CREATE INDEX IF NOT EXISTS "credit_transactions_created_at_idx" ON "credit_transactions" ("created_at")`,
  `CREATE INDEX IF NOT EXISTS "credit_transactions_type_idx" ON "credit_transactions" ("type")`,

  // Subscriptions
  `CREATE TABLE IF NOT EXISTS "subscriptions" (
    "id" serial PRIMARY KEY,
    "user_id" varchar NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "stripe_subscription_id" text NOT NULL UNIQUE,
    "stripe_price_id" text,
    "status" text NOT NULL,
    "current_period_start" timestamp,
    "current_period_end" timestamp,
    "cancel_at_period_end" boolean DEFAULT false,
    "created_at" timestamp DEFAULT now(),
    "updated_at" timestamp DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS "subscriptions_user_id_idx" ON "subscriptions" ("user_id")`,
  `CREATE INDEX IF NOT EXISTS "subscriptions_stripe_subscription_id_idx" ON "subscriptions" ("stripe_subscription_id")`,

  // Waitlist
  `CREATE TABLE IF NOT EXISTS "waitlist" (
    "id" serial PRIMARY KEY,
    "name" text NOT NULL,
    "email" text NOT NULL UNIQUE,
    "role" text NOT NULL,
    "occupation" text NOT NULL,
    "occupation_detail" text,
    "topic_interest" text,
    "referral_source" text,
    "appeals" text NOT NULL,
    "status" text NOT NULL DEFAULT 'pending',
    "admin_note" text,
    "created_at" timestamp DEFAULT now(),
    "reviewed_at" timestamp
  )`,
  `CREATE INDEX IF NOT EXISTS "waitlist_status_idx" ON "waitlist" ("status")`,
  `CREATE INDEX IF NOT EXISTS "waitlist_created_at_idx" ON "waitlist" ("created_at")`,

  // Site Settings
  `CREATE TABLE IF NOT EXISTS "site_settings" (
    "id" serial PRIMARY KEY,
    "key" text NOT NULL UNIQUE,
    "value" text,
    "updated_at" timestamp DEFAULT now()
  )`,

  // Tags
  `CREATE TABLE IF NOT EXISTS "tags" (
    "id" serial PRIMARY KEY,
    "name" text NOT NULL,
    "slug" text NOT NULL UNIQUE,
    "created_at" timestamp DEFAULT now()
  )`,

  // Binder Tags
  `CREATE TABLE IF NOT EXISTS "binder_tags" (
    "binder_id" integer NOT NULL REFERENCES "binders"("id") ON DELETE CASCADE,
    "tag_id" integer NOT NULL REFERENCES "tags"("id") ON DELETE CASCADE,
    PRIMARY KEY ("binder_id", "tag_id")
  )`,
];

async function execWithRetry(query: string, retries = 3): Promise<void> {
  for (let i = 0; i < retries; i++) {
    try {
      await exec(query);
      return;
    } catch (error: any) {
      if (error.message?.includes("already exists")) throw error;
      if (i === retries - 1) throw error;
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
}

console.log("Pushing schema to Neon database...\n");

let success = 0;
let skipped = 0;
let failed = 0;

for (const stmt of statements) {
  const name = stmt.match(/"(\w+)"/)?.[1] || "unknown";
  const isTable = stmt.includes("CREATE TABLE");
  try {
    await execWithRetry(stmt);
    success++;
    if (isTable) console.log(`  Created table: ${name}`);
  } catch (error: any) {
    if (error.message?.includes("already exists")) {
      skipped++;
      if (isTable) console.log(`  Exists: ${name}`);
    } else {
      failed++;
      console.error(`  FAILED (${name}):`, error.message);
    }
  }
}

console.log(`\nDone! ${success} applied, ${skipped} skipped, ${failed} failed.`);

// List all tables
const tables = await sql`
  SELECT table_name FROM information_schema.tables
  WHERE table_schema = 'public' ORDER BY table_name
`;
console.log("\nTables in database:");
tables.forEach((t: any) => console.log(`  - ${t.table_name}`));

if (failed > 0) {
  console.log("\nSome statements failed. Re-run this script to retry.");
  process.exit(1);
}
