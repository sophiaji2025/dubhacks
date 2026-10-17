-- Run this on a database created before service area and preference columns existed.
-- schema.sql already creates these columns for a new database.

ALTER TABLE resources ADD COLUMN IF NOT EXISTS service_area text;
ALTER TABLE resources ADD COLUMN IF NOT EXISTS zip_codes text[];
ALTER TABLE resources ADD COLUMN IF NOT EXISTS application_instructions text;
ALTER TABLE resources ADD COLUMN IF NOT EXISTS wheelchair_accessible boolean;
ALTER TABLE resources ADD COLUMN IF NOT EXISTS serves_children_or_families boolean;
ALTER TABLE resources ADD COLUMN IF NOT EXISTS appointment_required boolean;
ALTER TABLE resources ADD COLUMN IF NOT EXISTS walk_in boolean;
