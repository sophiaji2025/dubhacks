# NeighborAid — Barebones app skeleton

This branch contains a minimal Next.js + TypeScript + Tailwind skeleton implementing the structure described in docs/SPEC.md.

What's included:
- Frontend: simple search form and resource cards
- API route stubs: /api/match, /api/resources, /api/submissions, /api/admin/submissions
- Supabase schema and seed SQL

How to run locally
1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env.local` and add the Supabase URL and keys
3. Run the dev server: `npm run dev`

The homepage map shows Seattle even before you search. Pins for published listings appear after a search, and that search needs a connected `.env.local`. If `leaflet` is missing, run `npm install` again.

Notes
- This is a minimal starting point for the hackathon MVP. Fill in authentication, DB integration, and UI polish as next steps.
