-- Rename "Health & Wellness" category to "Humanities"
UPDATE categories SET name = 'Humanities', slug = 'humanities', description = 'Philosophy, history, languages, and the study of human culture' WHERE slug = 'health-wellness';
