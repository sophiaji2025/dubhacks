-- Eight Seattle programs from docs/SPEC.md.
-- Facts were checked against each official page on 2026-10-18.
-- Map coordinates are OpenStreetMap Nominatim pins for a published street
-- address, not surveyed entrances. Programs with no single service site have
-- no pin.
--
-- The publishable API key cannot insert these rows. Row-level security rejects
-- it. Run this in the Supabase SQL editor, or:
--   psql "$SUPABASE_DB_URL" -f supabase/seed-spec-resources.sql
--
-- Safe to re-run. Rows are matched on organization name and resource source URL.

BEGIN;

ALTER TABLE organizations ADD COLUMN IF NOT EXISTS contact text;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS city text;

ALTER TABLE resources ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE resources ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE resources ADD COLUMN IF NOT EXISTS service_area text;
ALTER TABLE resources ADD COLUMN IF NOT EXISTS zip_codes text[];
ALTER TABLE resources ADD COLUMN IF NOT EXISTS application_instructions text;
ALTER TABLE resources ADD COLUMN IF NOT EXISTS wheelchair_accessible boolean;
ALTER TABLE resources ADD COLUMN IF NOT EXISTS serves_children_or_families boolean;
ALTER TABLE resources ADD COLUMN IF NOT EXISTS appointment_required boolean;
ALTER TABLE resources ADD COLUMN IF NOT EXISTS walk_in boolean;
ALTER TABLE resources ADD COLUMN IF NOT EXISTS latitude double precision;
ALTER TABLE resources ADD COLUMN IF NOT EXISTS longitude double precision;

INSERT INTO organizations (name, website, contact, address, city, verified)
SELECT 'Seattle Human Services',
       'https://www.seattle.gov/human-services/services-and-programs/food-resources/afterschool-meals-program',
       'outofschooltimeprogram@seattle.gov, (206) 386-1016',
       '700 5th Ave, Suite 5800',
       'Seattle',
       false
WHERE NOT EXISTS (SELECT 1 FROM organizations WHERE name = 'Seattle Human Services');

INSERT INTO organizations (name, website, contact, address, city, verified)
SELECT 'Seattle Fresh Bucks',
       'https://www.seattlefreshbucks.org/',
       '(206) 256-5438, freshbucks@seattle.gov',
       'PO Box 94729',
       'Seattle',
       false
WHERE NOT EXISTS (SELECT 1 FROM organizations WHERE name = 'Seattle Fresh Bucks');

INSERT INTO organizations (name, website, contact, address, city, verified)
SELECT 'Mary''s Place',
       'https://www.marysplaceseattle.org/',
       '(206) 245-1026',
       NULL,
       'Seattle',
       false
WHERE NOT EXISTS (SELECT 1 FROM organizations WHERE name = 'Mary''s Place');

INSERT INTO organizations (name, website, contact, address, city, verified)
SELECT 'ROOTS Young Adult Shelter',
       'https://rootsinfo.org/',
       '(206) 632-1635',
       '207 10th Ave E',
       'Seattle',
       false
WHERE NOT EXISTS (SELECT 1 FROM organizations WHERE name = 'ROOTS Young Adult Shelter');

INSERT INTO organizations (name, website, contact, address, city, verified)
SELECT 'Muslim Housing Services',
       'https://www.muslimhousing.org/',
       '(206) 723-1712, info@muslimhousing.org',
       '7928 Rainier Avenue S',
       'Seattle',
       false
WHERE NOT EXISTS (SELECT 1 FROM organizations WHERE name = 'Muslim Housing Services');

INSERT INTO organizations (name, website, contact, address, city, verified)
SELECT 'United Churches Emergency Fund',
       'https://www.ucef-seattle.org/',
       '(206) 524-7885, director@ucef-seattle.org',
       '4515 16th Ave NE',
       'Seattle',
       false
WHERE NOT EXISTS (SELECT 1 FROM organizations WHERE name = 'United Churches Emergency Fund');

INSERT INTO organizations (name, website, contact, address, city, verified)
SELECT 'Seattle City Light and Seattle Public Utilities',
       'https://utilityassistance.seattle.gov/uap/public/landing',
       '(206) 584-3000',
       NULL,
       'Seattle',
       false
WHERE NOT EXISTS (
  SELECT 1 FROM organizations WHERE name = 'Seattle City Light and Seattle Public Utilities'
);

INSERT INTO organizations (name, website, contact, address, city, verified)
SELECT 'West Seattle Food Bank',
       'https://westseattlefoodbank.org/',
       '(206) 932-9023',
       '3419 SW Morgan St',
       'Seattle',
       false
WHERE NOT EXISTS (SELECT 1 FROM organizations WHERE name = 'West Seattle Food Bank');

UPDATE organizations SET
  website = 'https://www.seattle.gov/human-services/services-and-programs/food-resources/afterschool-meals-program',
  contact = 'outofschooltimeprogram@seattle.gov, (206) 386-1016',
  address = '700 5th Ave, Suite 5800',
  city = 'Seattle'
WHERE name = 'Seattle Human Services';

UPDATE organizations SET
  website = 'https://www.seattlefreshbucks.org/',
  contact = '(206) 256-5438, freshbucks@seattle.gov',
  address = 'PO Box 94729',
  city = 'Seattle'
WHERE name = 'Seattle Fresh Bucks';

UPDATE organizations SET
  website = 'https://www.marysplaceseattle.org/',
  contact = '(206) 245-1026',
  address = NULL,
  city = 'Seattle'
WHERE name = 'Mary''s Place';

UPDATE organizations SET
  website = 'https://rootsinfo.org/',
  contact = '(206) 632-1635',
  address = '207 10th Ave E',
  city = 'Seattle'
WHERE name = 'ROOTS Young Adult Shelter';

UPDATE organizations SET
  website = 'https://www.muslimhousing.org/',
  contact = '(206) 723-1712, info@muslimhousing.org',
  address = '7928 Rainier Avenue S',
  city = 'Seattle'
WHERE name = 'Muslim Housing Services';

UPDATE organizations SET
  website = 'https://www.ucef-seattle.org/',
  contact = '(206) 524-7885, director@ucef-seattle.org',
  address = '4515 16th Ave NE',
  city = 'Seattle'
WHERE name = 'United Churches Emergency Fund';

UPDATE organizations SET
  website = 'https://utilityassistance.seattle.gov/uap/public/landing',
  contact = '(206) 584-3000',
  address = NULL,
  city = 'Seattle'
WHERE name = 'Seattle City Light and Seattle Public Utilities';

UPDATE organizations SET
  website = 'https://westseattlefoodbank.org/',
  contact = '(206) 932-9023',
  address = '3419 SW Morgan St',
  city = 'Seattle'
WHERE name = 'West Seattle Food Bank';

INSERT INTO resources (
  organization_id, name, description, category, cost, address, city, service_area, zip_codes,
  eligibility, contact, source_url, application_instructions, last_verified,
  wheelchair_accessible, serves_children_or_families, appointment_required, walk_in,
  latitude, longitude, published
)
SELECT o.id,
       'Afterschool Meals Program',
       'Provides a free meal and/or snack at participating afterschool programs during the school year. Youth can receive up to one meal and one snack per day, eaten on site, at partners such as libraries, school-based programs, parks programs, and cultural organizations.',
       'Food assistance',
       'Free',
       NULL,
       'Seattle',
       'Seattle',
       NULL,
       'Ages 1-18 and attending a participating afterschool program. Young adults over 18 with a documented disability are eligible. Age alone does not confirm a seat at a site.',
       'outofschooltimeprogram@seattle.gov, (206) 386-1016',
       'https://www.seattle.gov/human-services/services-and-programs/food-resources/afterschool-meals-program',
       'Contact outofschooltimeprogram@seattle.gov or call (206) 386-1016 to find a participating site. Sites operate during the school year.',
       '2026-10-18',
       NULL,
       true,
       NULL,
       NULL,
       NULL,
       NULL,
       true
FROM organizations o
WHERE o.name = 'Seattle Human Services'
  AND NOT EXISTS (
    SELECT 1 FROM resources r
    WHERE r.source_url = 'https://www.seattle.gov/human-services/services-and-programs/food-resources/afterschool-meals-program'
  );

INSERT INTO resources (
  organization_id, name, description, category, cost, address, city, service_area, zip_codes,
  eligibility, contact, source_url, application_instructions, last_verified,
  wheelchair_accessible, serves_children_or_families, appointment_required, walk_in,
  latitude, longitude, published
)
SELECT o.id,
       'Seattle Fresh Bucks',
       'Enrolled customers receive a monthly benefit to spend on fruits and vegetables at participating farmers markets, independent grocers, and supermarkets, using the Fresh Bucks Card or HealthyBenefits+ app. The program says monthly benefits increase from $40 to $60 in 2026. The waitlist application stays open. Benefits are not available until someone is enrolled, and customers who do not use benefits for three months in a row can be removed.',
       'Food assistance',
       'Free ($60 monthly benefit)',
       NULL,
       'Seattle',
       'Seattle city limits',
       NULL,
       'Must meet income requirements and live within Seattle city limits. Applicants must fill out the waitlist application. Meeting those conditions does not confirm enrollment or that benefits are available.',
       '(206) 256-5438, freshbucks@seattle.gov',
       'https://www.seattlefreshbucks.org/',
       'Fill out the waitlist application on the official website. The mailing address listed on the site is PO Box 94729, Seattle, WA 98124.',
       '2026-10-18',
       NULL,
       NULL,
       NULL,
       NULL,
       NULL,
       NULL,
       true
FROM organizations o
WHERE o.name = 'Seattle Fresh Bucks'
  AND NOT EXISTS (
    SELECT 1 FROM resources r WHERE r.source_url = 'https://www.seattlefreshbucks.org/'
  );

INSERT INTO resources (
  organization_id, name, description, category, cost, address, city, service_area, zip_codes,
  eligibility, contact, source_url, application_instructions, last_verified,
  wheelchair_accessible, serves_children_or_families, appointment_required, walk_in,
  latitude, longitude, published
)
SELECT o.id,
       'Mary''s Place Emergency Shelter',
       'Emergency housing and shelter for families and pregnant women, with two locations. Mobile outreach can help with supplies, resources, and the transition to stable housing. The Allen Family Center offers weekday drop-in services for families with children experiencing housing insecurity. This listing does not confirm that a shelter bed is open.',
       'Housing and shelter',
       NULL,
       NULL,
       'Seattle',
       'Seattle',
       NULL,
       'Families and pregnant women. The source page does not list every requirement, so other limits may apply.',
       'Shelter line (206) 245-1026. Allen Family Center (206) 584-2832.',
       'https://www.marysplaceseattle.org/get-help',
       'Call (206) 245-1026 about emergency family shelter. Allen Family Center drop-in: 3190 S. Martin Luther King Jr Way, Seattle, Monday through Friday, 8 a.m. to 5 p.m., (206) 584-2832.',
       '2026-10-18',
       NULL,
       true,
       NULL,
       NULL,
       NULL,
       NULL,
       true
FROM organizations o
WHERE o.name = 'Mary''s Place'
  AND NOT EXISTS (
    SELECT 1 FROM resources r WHERE r.source_url = 'https://www.marysplaceseattle.org/get-help'
  );

INSERT INTO resources (
  organization_id, name, description, category, cost, address, city, service_area, zip_codes,
  eligibility, contact, source_url, application_instructions, last_verified,
  wheelchair_accessible, serves_children_or_families, appointment_required, walk_in,
  latitude, longitude, published
)
SELECT o.id,
       'ROOTS Young Adult Shelter',
       'Young adult shelter in Seattle''s University District for up to 45 people a night. Offers a warm meal, a place to sleep, and access to support resources. No proof of ID, income, or other documents is required to stay. This listing does not confirm that a bed is open tonight.',
       'Housing and shelter',
       NULL,
       '207 10th Ave E',
       'Seattle',
       'University District',
       NULL,
       'Young adults ages 18-25. No proof of ID, income, or other documents is required to stay.',
       '(206) 632-1635',
       'https://rootsinfo.org/',
       'Call (206) 632-1635 before going. Proof of ID, income, or other documents is not required to stay. A bed is not guaranteed.',
       '2026-10-18',
       NULL,
       NULL,
       NULL,
       NULL,
       47.6201783,
       -122.3198459,
       true
FROM organizations o
WHERE o.name = 'ROOTS Young Adult Shelter'
  AND NOT EXISTS (
    SELECT 1 FROM resources r WHERE r.source_url = 'https://rootsinfo.org/'
  );

INSERT INTO resources (
  organization_id, name, description, category, cost, address, city, service_area, zip_codes,
  eligibility, contact, source_url, application_instructions, last_verified,
  wheelchair_accessible, serves_children_or_families, appointment_required, walk_in,
  latitude, longitude, published
)
SELECT o.id,
       'Muslim Housing Services',
       'Homelessness prevention and rapid re-housing. Rapid re-housing provides rent assistance. The organization also describes short-term help for low-income renters who have a 14-day eviction notice, and transitional housing rented at a reduced amount. Office: 7928 Rainier Avenue S, Seattle, WA 98118. This listing does not confirm that funding or an opening is available.',
       'Housing and shelter',
       'Reduced rent for transitional housing; rent assistance amount depends on need',
       '7928 Rainier Avenue S',
       'Seattle',
       'Seattle and King County',
       NULL,
       'Homelessness prevention is described for low-income renters with a 14-day eviction notice. Rapid re-housing is described for people who are homeless. The organization says it serves anyone who qualifies, regardless of background. This listing is not a decision that a household qualifies.',
       '(206) 723-1712, info@muslimhousing.org',
       'https://www.muslimhousing.org/',
       'Call (206) 723-1712 or email info@muslimhousing.org. The source page does not list a public application form.',
       '2026-10-18',
       NULL,
       true,
       NULL,
       NULL,
       47.5311770,
       -122.2698687,
       true
FROM organizations o
WHERE o.name = 'Muslim Housing Services'
  AND NOT EXISTS (
    SELECT 1 FROM resources r WHERE r.source_url = 'https://www.muslimhousing.org/'
  );

INSERT INTO resources (
  organization_id, name, description, category, cost, address, city, service_area, zip_codes,
  eligibility, contact, source_url, application_instructions, last_verified,
  wheelchair_accessible, serves_children_or_families, appointment_required, walk_in,
  latitude, longitude, published
)
SELECT o.id,
       'United Churches Emergency Fund',
       'Emergency rent, utility, and deposit assistance. Assistance is limited to the ZIP codes below. Office hours listed on the source page are 10:30 a.m. to 12:15 p.m. on Mondays, Wednesdays, and Fridays. This listing does not confirm that funds are available.',
       'Financial assistance',
       NULL,
       '4515 16th Ave NE',
       'Seattle',
       'North Seattle',
       ARRAY['98103', '98105', '98115', '98125'],
       'Available only in ZIP codes 98103, 98105, 98115, and 98125.',
       '(206) 524-7885, director@ucef-seattle.org',
       'https://www.ucef-seattle.org/',
       'Contact the office during the posted hours. The source page does not publish a separate application form.',
       '2026-10-18',
       NULL,
       NULL,
       NULL,
       NULL,
       47.6618095,
       -122.3112180,
       true
FROM organizations o
WHERE o.name = 'United Churches Emergency Fund'
  AND NOT EXISTS (
    SELECT 1 FROM resources r WHERE r.source_url = 'https://www.ucef-seattle.org/'
  );

INSERT INTO resources (
  organization_id, name, description, category, cost, address, city, service_area, zip_codes,
  eligibility, contact, source_url, application_instructions, last_verified,
  wheelchair_accessible, serves_children_or_families, appointment_required, walk_in,
  latitude, longitude, published
)
SELECT o.id,
       'Seattle Utility Assistance',
       'Help with utility and electricity bills. One application covers the Utility Discount Program, bill assistance from Seattle Public Utilities and Seattle City Light, and City Light''s Project Share. The source page describes the discount program as 60% off electricity bills and 50% off water, sewer, and garbage bills for qualified customers, plus emergency bill credits. This listing does not confirm that an application will be approved.',
       'Utilities',
       'Discounted utility bills for eligible customers',
       NULL,
       'Seattle',
       'Seattle City Light and Seattle Public Utilities customers',
       NULL,
       'Qualified residential customers. The person whose name is on the Seattle City Light or Seattle Public Utilities account must apply. Income limits depend on household size and are on the source page.',
       '(206) 584-3000',
       'https://utilityassistance.seattle.gov/uap/public/landing',
       'Apply on the official website. Applicants sign in with a City of Seattle account and may need photo ID and income documents for adults in the household. If the account holder receives SNAP, the page says a DSHS award letter can be used and recommends the paper application.',
       '2026-10-18',
       NULL,
       NULL,
       NULL,
       NULL,
       NULL,
       NULL,
       true
FROM organizations o
WHERE o.name = 'Seattle City Light and Seattle Public Utilities'
  AND NOT EXISTS (
    SELECT 1 FROM resources r
    WHERE r.source_url = 'https://utilityassistance.seattle.gov/uap/public/landing'
  );

INSERT INTO resources (
  organization_id, name, description, category, cost, address, city, service_area, zip_codes,
  eligibility, contact, source_url, application_instructions, last_verified,
  wheelchair_accessible, serves_children_or_families, appointment_required, walk_in,
  latitude, longitude, published
)
SELECT o.id,
       'West Seattle Food Bank',
       'Grocery distribution, home delivery, and rent and utility assistance. Food distribution does not require an appointment. Clothing distribution is at a separate Clothesline site. Rent and utility help is through a helpline and is not confirmed to be open.',
       'Food assistance',
       NULL,
       '3419 SW Morgan St',
       'Seattle',
       'West Seattle',
       NULL,
       NULL,
       'Food bank (206) 932-9023. Rent and utilities helpline (206) 932-4357, listed for the 1st through the 7th of the month.',
       'https://westseattlefoodbank.org/',
       'Food distribution hours listed on the source page: Tuesday 10 a.m. to 2 p.m., Wednesday 12 p.m. to 7 p.m., Thursday and Friday 10 a.m. to 2 p.m. No appointment is needed for food. For home delivery, call (206) 932-9023. For rent or utilities, call (206) 932-4357 between the 1st and 7th of the month.',
       '2026-10-18',
       NULL,
       NULL,
       false,
       true,
       47.5443163,
       -122.3758640,
       true
FROM organizations o
WHERE o.name = 'West Seattle Food Bank'
  AND NOT EXISTS (
    SELECT 1 FROM resources r WHERE r.source_url = 'https://westseattlefoodbank.org/'
  );

UPDATE resources SET
  organization_id = (SELECT id FROM organizations WHERE name = 'Seattle Human Services'),
  name = 'Afterschool Meals Program',
  description = 'Provides a free meal and/or snack at participating afterschool programs during the school year. Youth can receive up to one meal and one snack per day, eaten on site, at partners such as libraries, school-based programs, parks programs, and cultural organizations.',
  category = 'Food assistance',
  cost = 'Free',
  address = NULL,
  city = 'Seattle',
  service_area = 'Seattle',
  zip_codes = NULL,
  eligibility = 'Ages 1-18 and attending a participating afterschool program. Young adults over 18 with a documented disability are eligible. Age alone does not confirm a seat at a site.',
  contact = 'outofschooltimeprogram@seattle.gov, (206) 386-1016',
  application_instructions = 'Contact outofschooltimeprogram@seattle.gov or call (206) 386-1016 to find a participating site. Sites operate during the school year.',
  last_verified = '2026-10-18',
  wheelchair_accessible = NULL,
  serves_children_or_families = true,
  appointment_required = NULL,
  walk_in = NULL,
  latitude = NULL,
  longitude = NULL,
  published = true
WHERE source_url = 'https://www.seattle.gov/human-services/services-and-programs/food-resources/afterschool-meals-program';

UPDATE resources SET
  organization_id = (SELECT id FROM organizations WHERE name = 'Seattle Fresh Bucks'),
  name = 'Seattle Fresh Bucks',
  description = 'Enrolled customers receive a monthly benefit to spend on fruits and vegetables at participating farmers markets, independent grocers, and supermarkets, using the Fresh Bucks Card or HealthyBenefits+ app. The program says monthly benefits increase from $40 to $60 in 2026. The waitlist application stays open. Benefits are not available until someone is enrolled, and customers who do not use benefits for three months in a row can be removed.',
  category = 'Food assistance',
  cost = 'Free ($60 monthly benefit)',
  address = NULL,
  city = 'Seattle',
  service_area = 'Seattle city limits',
  zip_codes = NULL,
  eligibility = 'Must meet income requirements and live within Seattle city limits. Applicants must fill out the waitlist application. Meeting those conditions does not confirm enrollment or that benefits are available.',
  contact = '(206) 256-5438, freshbucks@seattle.gov',
  application_instructions = 'Fill out the waitlist application on the official website. The mailing address listed on the site is PO Box 94729, Seattle, WA 98124.',
  last_verified = '2026-10-18',
  wheelchair_accessible = NULL,
  serves_children_or_families = NULL,
  appointment_required = NULL,
  walk_in = NULL,
  latitude = NULL,
  longitude = NULL,
  published = true
WHERE source_url = 'https://www.seattlefreshbucks.org/';

UPDATE resources SET
  organization_id = (SELECT id FROM organizations WHERE name = 'Mary''s Place'),
  name = 'Mary''s Place Emergency Shelter',
  description = 'Emergency housing and shelter for families and pregnant women, with two locations. Mobile outreach can help with supplies, resources, and the transition to stable housing. The Allen Family Center offers weekday drop-in services for families with children experiencing housing insecurity. This listing does not confirm that a shelter bed is open.',
  category = 'Housing and shelter',
  cost = NULL,
  address = NULL,
  city = 'Seattle',
  service_area = 'Seattle',
  zip_codes = NULL,
  eligibility = 'Families and pregnant women. The source page does not list every requirement, so other limits may apply.',
  contact = 'Shelter line (206) 245-1026. Allen Family Center (206) 584-2832.',
  application_instructions = 'Call (206) 245-1026 about emergency family shelter. Allen Family Center drop-in: 3190 S. Martin Luther King Jr Way, Seattle, Monday through Friday, 8 a.m. to 5 p.m., (206) 584-2832.',
  last_verified = '2026-10-18',
  wheelchair_accessible = NULL,
  serves_children_or_families = true,
  appointment_required = NULL,
  walk_in = NULL,
  latitude = NULL,
  longitude = NULL,
  published = true
WHERE source_url = 'https://www.marysplaceseattle.org/get-help';

UPDATE resources SET
  organization_id = (SELECT id FROM organizations WHERE name = 'ROOTS Young Adult Shelter'),
  name = 'ROOTS Young Adult Shelter',
  description = 'Young adult shelter in Seattle''s University District for up to 45 people a night. Offers a warm meal, a place to sleep, and access to support resources. No proof of ID, income, or other documents is required to stay. This listing does not confirm that a bed is open tonight.',
  category = 'Housing and shelter',
  cost = NULL,
  address = '207 10th Ave E',
  city = 'Seattle',
  service_area = 'University District',
  zip_codes = NULL,
  eligibility = 'Young adults ages 18-25. No proof of ID, income, or other documents is required to stay.',
  contact = '(206) 632-1635',
  application_instructions = 'Call (206) 632-1635 before going. Proof of ID, income, or other documents is not required to stay. A bed is not guaranteed.',
  last_verified = '2026-10-18',
  wheelchair_accessible = NULL,
  serves_children_or_families = NULL,
  appointment_required = NULL,
  walk_in = NULL,
  latitude = 47.6201783,
  longitude = -122.3198459,
  published = true
WHERE source_url = 'https://rootsinfo.org/';

UPDATE resources SET
  organization_id = (SELECT id FROM organizations WHERE name = 'Muslim Housing Services'),
  name = 'Muslim Housing Services',
  description = 'Homelessness prevention and rapid re-housing. Rapid re-housing provides rent assistance. The organization also describes short-term help for low-income renters who have a 14-day eviction notice, and transitional housing rented at a reduced amount. Office: 7928 Rainier Avenue S, Seattle, WA 98118. This listing does not confirm that funding or an opening is available.',
  category = 'Housing and shelter',
  cost = 'Reduced rent for transitional housing; rent assistance amount depends on need',
  address = '7928 Rainier Avenue S',
  city = 'Seattle',
  service_area = 'Seattle and King County',
  zip_codes = NULL,
  eligibility = 'Homelessness prevention is described for low-income renters with a 14-day eviction notice. Rapid re-housing is described for people who are homeless. The organization says it serves anyone who qualifies, regardless of background. This listing is not a decision that a household qualifies.',
  contact = '(206) 723-1712, info@muslimhousing.org',
  application_instructions = 'Call (206) 723-1712 or email info@muslimhousing.org. The source page does not list a public application form.',
  last_verified = '2026-10-18',
  wheelchair_accessible = NULL,
  serves_children_or_families = true,
  appointment_required = NULL,
  walk_in = NULL,
  latitude = 47.5311770,
  longitude = -122.2698687,
  published = true
WHERE source_url = 'https://www.muslimhousing.org/';

UPDATE resources SET
  organization_id = (SELECT id FROM organizations WHERE name = 'United Churches Emergency Fund'),
  name = 'United Churches Emergency Fund',
  description = 'Emergency rent, utility, and deposit assistance. Assistance is limited to the ZIP codes below. Office hours listed on the source page are 10:30 a.m. to 12:15 p.m. on Mondays, Wednesdays, and Fridays. This listing does not confirm that funds are available.',
  category = 'Financial assistance',
  cost = NULL,
  address = '4515 16th Ave NE',
  city = 'Seattle',
  service_area = 'North Seattle',
  zip_codes = ARRAY['98103', '98105', '98115', '98125'],
  eligibility = 'Available only in ZIP codes 98103, 98105, 98115, and 98125.',
  contact = '(206) 524-7885, director@ucef-seattle.org',
  application_instructions = 'Contact the office during the posted hours. The source page does not publish a separate application form.',
  last_verified = '2026-10-18',
  wheelchair_accessible = NULL,
  serves_children_or_families = NULL,
  appointment_required = NULL,
  walk_in = NULL,
  latitude = 47.6618095,
  longitude = -122.3112180,
  published = true
WHERE source_url = 'https://www.ucef-seattle.org/';

UPDATE resources SET
  organization_id = (SELECT id FROM organizations WHERE name = 'Seattle City Light and Seattle Public Utilities'),
  name = 'Seattle Utility Assistance',
  description = 'Help with utility and electricity bills. One application covers the Utility Discount Program, bill assistance from Seattle Public Utilities and Seattle City Light, and City Light''s Project Share. The source page describes the discount program as 60% off electricity bills and 50% off water, sewer, and garbage bills for qualified customers, plus emergency bill credits. This listing does not confirm that an application will be approved.',
  category = 'Utilities',
  cost = 'Discounted utility bills for eligible customers',
  address = NULL,
  city = 'Seattle',
  service_area = 'Seattle City Light and Seattle Public Utilities customers',
  zip_codes = NULL,
  eligibility = 'Qualified residential customers. The person whose name is on the Seattle City Light or Seattle Public Utilities account must apply. Income limits depend on household size and are on the source page.',
  contact = '(206) 584-3000',
  application_instructions = 'Apply on the official website. Applicants sign in with a City of Seattle account and may need photo ID and income documents for adults in the household. If the account holder receives SNAP, the page says a DSHS award letter can be used and recommends the paper application.',
  last_verified = '2026-10-18',
  wheelchair_accessible = NULL,
  serves_children_or_families = NULL,
  appointment_required = NULL,
  walk_in = NULL,
  latitude = NULL,
  longitude = NULL,
  published = true
WHERE source_url = 'https://utilityassistance.seattle.gov/uap/public/landing';

UPDATE resources SET
  organization_id = (SELECT id FROM organizations WHERE name = 'West Seattle Food Bank'),
  name = 'West Seattle Food Bank',
  description = 'Grocery distribution, home delivery, and rent and utility assistance. Food distribution does not require an appointment. Clothing distribution is at a separate Clothesline site. Rent and utility help is through a helpline and is not confirmed to be open.',
  category = 'Food assistance',
  cost = NULL,
  address = '3419 SW Morgan St',
  city = 'Seattle',
  service_area = 'West Seattle',
  zip_codes = NULL,
  eligibility = NULL,
  contact = 'Food bank (206) 932-9023. Rent and utilities helpline (206) 932-4357, listed for the 1st through the 7th of the month.',
  application_instructions = 'Food distribution hours listed on the source page: Tuesday 10 a.m. to 2 p.m., Wednesday 12 p.m. to 7 p.m., Thursday and Friday 10 a.m. to 2 p.m. No appointment is needed for food. For home delivery, call (206) 932-9023. For rent or utilities, call (206) 932-4357 between the 1st and 7th of the month.',
  last_verified = '2026-10-18',
  wheelchair_accessible = NULL,
  serves_children_or_families = NULL,
  appointment_required = false,
  walk_in = true,
  latitude = 47.5443163,
  longitude = -122.3758640,
  published = true
WHERE source_url = 'https://westseattlefoodbank.org/';

COMMIT;
