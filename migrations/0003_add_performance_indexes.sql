-- Migration: Add performance indexes to all tables
-- Tables already indexed: completed_steps (0001), cohorts/cohort_members (0002), users (unique constraints)
--
-- Pre-flight check for unique index on enrollments:
--   SELECT student_id, syllabus_id, COUNT(*) FROM enrollments
--   GROUP BY student_id, syllabus_id HAVING COUNT(*) > 1;

-- Sessions: cleanup queries filter by expiration
CREATE INDEX IF NOT EXISTS sessions_expire_idx ON sessions (expire);

-- Syllabi: creator dashboard + catalog page
CREATE INDEX IF NOT EXISTS syllabi_creator_id_idx ON syllabi (creator_id);
CREATE INDEX IF NOT EXISTS syllabi_status_idx ON syllabi (status);

-- Enrollments: one-enrollment-per-student business rule + dashboard + analytics
CREATE UNIQUE INDEX IF NOT EXISTS enrollments_student_syllabus_idx ON enrollments (student_id, syllabus_id);
CREATE INDEX IF NOT EXISTS enrollments_student_id_idx ON enrollments (student_id);
CREATE INDEX IF NOT EXISTS enrollments_syllabus_id_idx ON enrollments (syllabus_id);

-- Weeks: every syllabus view joins weeks by syllabus_id
CREATE INDEX IF NOT EXISTS weeks_syllabus_id_idx ON weeks (syllabus_id);

-- Steps: every syllabus view joins steps by week_id
CREATE INDEX IF NOT EXISTS steps_week_id_idx ON steps (week_id);

-- Submissions: learner submissions list + FK cascade on step deletion
CREATE INDEX IF NOT EXISTS submissions_enrollment_id_idx ON submissions (enrollment_id);
CREATE INDEX IF NOT EXISTS submissions_step_id_idx ON submissions (step_id);

-- Chat messages: chat panel loads messages by syllabus
CREATE INDEX IF NOT EXISTS chat_messages_syllabus_id_idx ON chat_messages (syllabus_id);
