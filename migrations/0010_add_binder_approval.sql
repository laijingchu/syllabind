-- Add binder approval workflow columns
ALTER TABLE binders ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP;
ALTER TABLE binders ADD COLUMN IF NOT EXISTS review_note TEXT;

-- Index for efficiently querying the review queue
CREATE INDEX IF NOT EXISTS binders_pending_review_idx
  ON binders(status, submitted_at) WHERE status = 'pending_review';
