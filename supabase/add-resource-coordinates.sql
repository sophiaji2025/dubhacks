-- Run this on a database created before map coordinates existed.
-- schema.sql already creates these columns for a new database.

ALTER TABLE resources ADD COLUMN IF NOT EXISTS latitude double precision;
ALTER TABLE resources ADD COLUMN IF NOT EXISTS longitude double precision;

-- Sample pins for the original skeleton listings. Skipped once a point is saved.
UPDATE resources
SET latitude = 47.5486, longitude = -122.3631
WHERE name = 'Community Food Bank'
  AND address = '123 Example St'
  AND latitude IS NULL
  AND longitude IS NULL;

UPDATE resources
SET latitude = 47.6189, longitude = -122.3301
WHERE name = 'Shelter Now'
  AND address = '456 Shelter Ave'
  AND latitude IS NULL
  AND longitude IS NULL;
