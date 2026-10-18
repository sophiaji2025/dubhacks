# NeighborAid

A Seattle directory that matches people with published community resources. Choose the kind of help you need, a city or ZIP code, and any preferences the listings actually record. Results explain why each listing appeared, list practical next steps, and show a map when a listing has a street address or saved coordinates.

Nonprofit submissions stay out of public search until an administrator approves them.

The homepage map pins every published listing that has saved coordinates or a street address. A search focuses those pins on the matches. A citywide program with no street address stays off the map.

## Run locally

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local` and fill in the Supabase and admin values.
3. Start the site with `npm run dev`.

Search and review need a Supabase project loaded from `supabase/schema.sql`. `scripts/load-schema.sh` applies that file when `SUPABASE_DB_URL` is set, and it can be run again without duplicating the sample listings.

`supabase/add-resource-location.sql` and `supabase/add-resource-coordinates.sql` are only for a database created before those columns existed. A new database gets them from `schema.sql`.

## Scripts

- `npm run dev` starts the local site
- `npm test` runs the matching, submission, map, and language checks
- `npm run typecheck` runs the TypeScript check
- `npm run lint` runs ESLint
- `npm run build` builds the production site

## Environment

- `SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `SUPABASE_ANON_KEY` or `NEXT_PUBLIC_SUPABASE_ANON_KEY`: public reads and new submissions
- `SUPABASE_SERVICE_ROLE_KEY`: approving submissions and publishing listings. Server routes use this key to read the live directory when it is set.
- `ADMIN_API_KEY`: review page, sent as the `x-admin-key` header

The service role key and admin key stay on the server. The review page asks for the admin key and does not store it.
