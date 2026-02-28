BEGIN;
-- Rename tables
ALTER TABLE syllabi RENAME TO binders;
ALTER TABLE syllabind_tags RENAME TO binder_tags;

-- Columns: binders (was syllabi)
ALTER TABLE binders RENAME COLUMN creator_id TO curator_id;
ALTER TABLE binders RENAME COLUMN student_active TO reader_active;
ALTER TABLE binders RENAME COLUMN students_completed TO readers_completed;

-- Columns: users
ALTER TABLE users RENAME COLUMN is_creator TO is_curator;

-- Columns: enrollments
ALTER TABLE enrollments RENAME COLUMN student_id TO reader_id;
ALTER TABLE enrollments RENAME COLUMN syllabus_id TO binder_id;

-- Columns: weeks
ALTER TABLE weeks RENAME COLUMN syllabus_id TO binder_id;

-- Columns: cohorts
ALTER TABLE cohorts RENAME COLUMN creator_id TO curator_id;
ALTER TABLE cohorts RENAME COLUMN syllabus_id TO binder_id;

-- Columns: cohort_members
ALTER TABLE cohort_members RENAME COLUMN student_id TO reader_id;

-- Columns: binder_tags
ALTER TABLE binder_tags RENAME COLUMN syllabus_id TO binder_id;

-- Indexes
ALTER INDEX IF EXISTS syllabi_creator_id_idx RENAME TO binders_curator_id_idx;
ALTER INDEX IF EXISTS syllabi_status_idx RENAME TO binders_status_idx;
ALTER INDEX IF EXISTS syllabi_status_visibility_idx RENAME TO binders_status_visibility_idx;
ALTER INDEX IF EXISTS syllabi_category_id_idx RENAME TO binders_category_id_idx;
ALTER INDEX IF EXISTS enrollments_student_id_idx RENAME TO enrollments_reader_id_idx;
ALTER INDEX IF EXISTS enrollments_student_syllabus_idx RENAME TO enrollments_reader_binder_idx;
ALTER INDEX IF EXISTS enrollments_syllabus_id_idx RENAME TO enrollments_binder_id_idx;
ALTER INDEX IF EXISTS weeks_syllabus_id_idx RENAME TO weeks_binder_id_idx;

-- Data: waitlist role values (if table exists)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'waitlist') THEN
    UPDATE waitlist SET role = 'reader' WHERE role = 'learner';
    UPDATE waitlist SET role = 'curator' WHERE role = 'creator';
  END IF;
END $$;
COMMIT;
