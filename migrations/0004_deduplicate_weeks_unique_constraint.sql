-- Migration: Add unique constraint on weeks(syllabus_id, index)
-- First clean up duplicate weeks created by concurrent generation race conditions.
-- For each (syllabus_id, index) pair, keep only the week with the highest ID
-- (most recent generation) and delete the rest. Steps cascade-delete with weeks.

DELETE FROM weeks
WHERE id NOT IN (
  SELECT MAX(id)
  FROM weeks
  GROUP BY syllabus_id, index
);

-- Now add the unique constraint to prevent future duplicates
CREATE UNIQUE INDEX IF NOT EXISTS weeks_syllabus_id_index_idx ON weeks (syllabus_id, index);
