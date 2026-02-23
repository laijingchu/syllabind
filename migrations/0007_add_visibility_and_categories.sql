-- Migration: Add visibility, categories, tags, and full-text search
-- Date: 2026-02-23

-- 1. Create categories table (admin-managed)
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Add visibility column to syllabi table
ALTER TABLE syllabi ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'public';

-- 3. Add category_id FK to syllabi table
ALTER TABLE syllabi ADD COLUMN IF NOT EXISTS category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL;

-- 4. Add search_vector column
ALTER TABLE syllabi ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- 5. Create indexes
CREATE INDEX IF NOT EXISTS syllabi_status_visibility_idx ON syllabi(status, visibility);
CREATE INDEX IF NOT EXISTS syllabi_category_id_idx ON syllabi(category_id);
CREATE INDEX IF NOT EXISTS syllabi_search_vector_idx ON syllabi USING GIN(search_vector);

-- 6. Create tags table
CREATE TABLE IF NOT EXISTS tags (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 7. Create syllabind_tags junction table
CREATE TABLE IF NOT EXISTS syllabind_tags (
  syllabus_id INTEGER NOT NULL REFERENCES syllabi(id) ON DELETE CASCADE,
  tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (syllabus_id, tag_id)
);

-- 8. Create trigger to maintain search_vector on syllabi INSERT/UPDATE
CREATE OR REPLACE FUNCTION syllabi_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS syllabi_search_vector_trigger ON syllabi;
CREATE TRIGGER syllabi_search_vector_trigger
  BEFORE INSERT OR UPDATE OF title, description ON syllabi
  FOR EACH ROW EXECUTE FUNCTION syllabi_search_vector_update();

-- 9. Seed initial categories
INSERT INTO categories (name, slug, description, display_order) VALUES
  ('Philosophy', 'philosophy', 'Explore foundational ideas about knowledge, existence, and ethics', 1),
  ('Design', 'design', 'Visual design, UX, product design, and design thinking', 2),
  ('Technology', 'technology', 'Software engineering, AI, data science, and emerging tech', 3),
  ('Business', 'business', 'Strategy, entrepreneurship, management, and leadership', 4),
  ('Science', 'science', 'Natural sciences, research methods, and scientific thinking', 5),
  ('Arts & Humanities', 'arts-humanities', 'Literature, history, art, music, and cultural studies', 6),
  ('Social Sciences', 'social-sciences', 'Psychology, sociology, economics, and political science', 7),
  ('Health & Wellness', 'health-wellness', 'Physical health, mental well-being, and lifestyle habits', 8),
  ('Personal Development', 'personal-development', 'Productivity, communication, habits, and self-improvement', 9),
  ('Other', 'other', 'Topics that don''t fit neatly into other categories', 10)
ON CONFLICT (slug) DO NOTHING;

-- 10. Backfill search_vector for existing rows
UPDATE syllabi SET search_vector =
  setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(description, '')), 'B')
WHERE search_vector IS NULL;
