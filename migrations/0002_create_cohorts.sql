-- Migration: Create cohorts and cohort_members tables
-- Created: 2026-01-26
-- Purpose: Add cohort grouping functionality for learners

-- Create cohorts table
CREATE TABLE cohorts (
  id serial PRIMARY KEY,
  name text NOT NULL,
  syllabus_id integer NOT NULL REFERENCES syllabi(id) ON DELETE CASCADE,
  creator_id text REFERENCES users(username) ON UPDATE CASCADE ON DELETE SET NULL,
  description text,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamp DEFAULT now() NOT NULL
);

-- Indexes for efficient queries
CREATE INDEX cohorts_syllabus_idx ON cohorts(syllabus_id);
CREATE INDEX cohorts_creator_idx ON cohorts(creator_id);
CREATE INDEX cohorts_active_idx ON cohorts(is_active) WHERE is_active = true;

-- Create cohort members junction table
CREATE TABLE cohort_members (
  cohort_id integer NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
  student_id text NOT NULL REFERENCES users(username) ON UPDATE CASCADE ON DELETE CASCADE,
  joined_at timestamp DEFAULT now() NOT NULL,
  role text DEFAULT 'member' NOT NULL,
  PRIMARY KEY (cohort_id, student_id)
);

-- Indexes for efficient queries
CREATE INDEX cohort_members_student_idx ON cohort_members(student_id);
CREATE INDEX cohort_members_role_idx ON cohort_members(role);

-- Comments for documentation
COMMENT ON TABLE cohorts IS 'Groups of learners studying a syllabus together';
COMMENT ON TABLE cohort_members IS 'Junction table tracking cohort membership';
COMMENT ON COLUMN cohorts.syllabus_id IS 'FK to syllabi - one syllabus can have many cohorts';
COMMENT ON COLUMN cohort_members.role IS 'Member role: member, moderator, etc.';
