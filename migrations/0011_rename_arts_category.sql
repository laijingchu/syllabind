-- Rename "Arts & Humanities" category to "Arts & Culture"
UPDATE categories SET name = 'Arts & Culture', slug = 'arts-culture' WHERE slug = 'arts-humanities';
