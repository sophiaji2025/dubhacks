-- Supabase schema for NeighborAid (minimal)

CREATE TABLE organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  website text,
  contact text,
  verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE resources (
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
  eligibility text,
  contact text,
  source_url text,
  last_verified date,
  published boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE resource_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_name text,
  resource_name text,
  payload jsonb,
  status text DEFAULT 'pending',
  reviewer_notes text,
  created_at timestamptz DEFAULT now()
);

-- Sample seed data
INSERT INTO organizations (id, name, website, contact, verified) VALUES
  ('11111111-1111-1111-1111-111111111111','Community Food Bank','https://example.org/foodbank','(206) 555-0101', true),
  ('22222222-2222-2222-2222-222222222222','Shelter Now','https://example.org/shelternow','(206) 555-0202', true);

INSERT INTO resources (organization_id, name, description, category, cost, address, city, eligibility, contact, source_url, last_verified, published) VALUES
  ('11111111-1111-1111-1111-111111111111','Community Food Bank','Provides groceries and prepared meals','Food assistance','Free','123 Example St','Seattle','Open to all residents','(206) 555-0101','https://example.org/foodbank','2026-10-01', true),
  ('22222222-2222-2222-2222-222222222222','Shelter Now','Emergency shelter and referral services','Housing and shelter','Free or low-cost','456 Shelter Ave','Seattle','Adults and families','(206) 555-0202','https://example.org/shelternow','2026-09-20', true);
