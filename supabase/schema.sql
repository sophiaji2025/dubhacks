-- NeighborAid schema. Safe to apply more than once: tables are created if
-- missing, sample rows are skipped when they already exist, and later columns
-- are added for databases created before them.

CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  website text,
  contact text,
  verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  category text CHECK (
    category IS NULL OR category IN (
      'Food assistance',
      'Housing and shelter',
      'Healthcare',
      'Employment',
      'Transportation',
      'Utilities',
      'Financial assistance',
      'Childcare',
      'Legal assistance',
      'Mental health',
      'Other community services'
    )
  ),
  cost text,
  address text,
  city text,
  service_area text,
  zip_codes text[],
  eligibility text,
  contact text,
  source_url text,
  application_instructions text,
  last_verified date,
  -- Null means the listing does not say. False is an explicit no.
  wheelchair_accessible boolean,
  serves_children_or_families boolean,
  appointment_required boolean,
  walk_in boolean,
  latitude double precision,
  longitude double precision,
  published boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS resource_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_name text,
  resource_name text,
  payload jsonb,
  status text DEFAULT 'pending',
  reviewer_notes text,
  created_at timestamptz DEFAULT now()
);

-- For a database created before the location and preference columns existed.
ALTER TABLE resources ADD COLUMN IF NOT EXISTS service_area text;
ALTER TABLE resources ADD COLUMN IF NOT EXISTS zip_codes text[];
ALTER TABLE resources ADD COLUMN IF NOT EXISTS application_instructions text;
ALTER TABLE resources ADD COLUMN IF NOT EXISTS wheelchair_accessible boolean;
ALTER TABLE resources ADD COLUMN IF NOT EXISTS serves_children_or_families boolean;
ALTER TABLE resources ADD COLUMN IF NOT EXISTS appointment_required boolean;
ALTER TABLE resources ADD COLUMN IF NOT EXISTS walk_in boolean;
ALTER TABLE resources ADD COLUMN IF NOT EXISTS latitude double precision;
ALTER TABLE resources ADD COLUMN IF NOT EXISTS longitude double precision;

-- Sample seed data
INSERT INTO organizations (id, name, website, contact, verified) VALUES
  ('11111111-1111-1111-1111-111111111111','Community Food Bank','https://example.org/foodbank','(206) 555-0101', true),
  ('22222222-2222-2222-2222-222222222222','Shelter Now','https://example.org/shelternow','(206) 555-0202', true)
ON CONFLICT (id) DO NOTHING;

-- Sample coordinates are map pins in Seattle, not surveyed entrances.
INSERT INTO resources (organization_id, name, description, category, cost, address, city, eligibility, contact, source_url, last_verified, latitude, longitude, published)
SELECT seed.organization_id, seed.name, seed.description, seed.category, seed.cost, seed.address, seed.city, seed.eligibility, seed.contact, seed.source_url, seed.last_verified, seed.latitude, seed.longitude, seed.published
FROM (VALUES
  ('11111111-1111-1111-1111-111111111111'::uuid, 'Community Food Bank', 'Provides groceries and prepared meals', 'Food assistance', 'Free', '123 Example St', 'Seattle', 'Open to all residents', '(206) 555-0101', 'https://example.org/foodbank', DATE '2026-10-01', 47.5486, -122.3631, true),
  ('22222222-2222-2222-2222-222222222222'::uuid, 'Shelter Now', 'Emergency shelter and referral services', 'Housing and shelter', 'Free or low-cost', '456 Shelter Ave', 'Seattle', 'Adults and families', '(206) 555-0202', 'https://example.org/shelternow', DATE '2026-09-20', 47.6189, -122.3301, true)
) AS seed(organization_id, name, description, category, cost, address, city, eligibility, contact, source_url, last_verified, latitude, longitude, published)
WHERE NOT EXISTS (
  SELECT 1 FROM resources existing
  WHERE existing.name = seed.name AND existing.address = seed.address
);
