-- Add generation tracking columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS generation_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_generated_at TIMESTAMP;

-- Add demo flag to binders table
ALTER TABLE binders ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT FALSE;
