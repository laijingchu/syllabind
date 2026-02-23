-- Migration: Create waitlist table for alpha gating
-- Date: 2026-02-22

CREATE TABLE IF NOT EXISTS waitlist (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL,
  occupation TEXT NOT NULL,
  occupation_detail TEXT,
  topic_interest TEXT,
  referral_source TEXT,
  appeals TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_note TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  reviewed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS waitlist_status_idx ON waitlist (status);
CREATE INDEX IF NOT EXISTS waitlist_created_at_idx ON waitlist (created_at);
