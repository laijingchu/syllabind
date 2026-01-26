-- Manual migration: Change to username foreign keys
BEGIN;

-- Drop existing foreign key constraints
ALTER TABLE syllabi DROP CONSTRAINT IF EXISTS syllabi_creator_id_users_id_fk;
ALTER TABLE enrollments DROP CONSTRAINT IF EXISTS enrollments_user_id_users_id_fk;

-- Change syllabi.creator_id to text and update data
ALTER TABLE syllabi ALTER COLUMN creator_id TYPE text;
UPDATE syllabi s SET creator_id = u.username FROM users u WHERE s.creator_id::uuid = u.id::uuid;

-- Rename enrollments.user_id to student_id and change type
ALTER TABLE enrollments RENAME COLUMN user_id TO student_id;
ALTER TABLE enrollments ALTER COLUMN student_id TYPE text;
UPDATE enrollments e SET student_id = u.username FROM users u WHERE e.student_id::uuid = u.id::uuid;

-- Add new foreign key constraints
ALTER TABLE syllabi
  ADD CONSTRAINT syllabi_creator_id_users_username_fk
  FOREIGN KEY (creator_id) REFERENCES users(username)
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE enrollments
  ADD CONSTRAINT enrollments_student_id_users_username_fk
  FOREIGN KEY (student_id) REFERENCES users(username)
  ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT;
