-- Migration: Normalize completed_steps from JSONB to relational table
-- Created: 2026-01-26

-- Create completed_steps table
CREATE TABLE completed_steps (
  enrollment_id integer NOT NULL,
  step_id integer NOT NULL,
  completed_at timestamp DEFAULT now() NOT NULL,
  PRIMARY KEY (enrollment_id, step_id),
  FOREIGN KEY (enrollment_id) REFERENCES enrollments(id) ON DELETE CASCADE,
  FOREIGN KEY (step_id) REFERENCES steps(id) ON DELETE CASCADE
);

-- Create indexes for efficient queries
CREATE INDEX completed_steps_enrollment_idx ON completed_steps(enrollment_id);
CREATE INDEX completed_steps_step_idx ON completed_steps(step_id);
CREATE INDEX completed_steps_completed_at_idx ON completed_steps(completed_at);

-- Migrate existing data from enrollments.completed_step_ids to completed_steps
-- Only if there's data (database might be empty)
INSERT INTO completed_steps (enrollment_id, step_id)
SELECT
  e.id as enrollment_id,
  jsonb_array_elements_text(e.completed_step_ids)::integer as step_id
FROM enrollments e
WHERE jsonb_array_length(e.completed_step_ids) > 0
ON CONFLICT DO NOTHING;
