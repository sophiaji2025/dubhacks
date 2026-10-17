
# NeighborAid — Product Specification (MVP)

**Project:** AI-Powered Neighborhood Resource Matcher  
**Launch Area:** Seattle, Washington  
**Timeline:** Weekend Hackathon  
**Target Users:** Community members seeking assistance and nonprofits providing local services

## 1. Product Overview

NeighborAid is a web application that helps people find free or affordable community resources by describing their situation in plain English.

The platform uses AI to understand a user's needs, searches a database of local resources, and returns relevant programs with explanations, contact information, and suggested next steps.

Nonprofits can also submit their own resources for review and publication, helping keep the directory useful and up to date.

## 2. Problem Statement

People who need assistance often struggle to find appropriate services because:
- They don't know which organizations or programs exist.
- Information is spread across many websites and directories.
- Eligibility requirements and application processes can be confusing.
- Existing directories may not account for transportation, location, or multiple needs.
- Nonprofits need a simple way to make their services discoverable.

## 3. Goals

The MVP should:
- Let users describe their needs using natural language.
- Match users with relevant Seattle-area resources.
- Explain why each resource may be helpful.
- Provide practical next steps and official contact links.
- Allow nonprofits to submit resources for review.
- Prevent unreviewed submissions from appearing as verified resources.

## 4. Target Users

### Community Members

People looking for assistance with food, housing, healthcare, employment, transportation, utilities, childcare, or financial support.

### Nonprofits and Community Organizations

Organizations that want residents to discover their services and access accurate program information.

### Administrators

Team members responsible for reviewing submissions and maintaining listing quality.

## 5. Core Features

### Feature A: Natural-Language Resource Search

Users can describe their situation in a text box.

Example:

> I lost my job, have two children, need groceries, and don't have a car. I live in Seattle.

The system should:
1. Extract relevant needs and constraints.
2. Identify the user's location or ask for it if missing.
3. Search published resources in the database.
4. Rank results based on relevance, eligibility information, location, accessibility, and information freshness.
5. Display the best matches.

### Feature B: Resource Results

Each result should display:
- Resource or organization name
- Service category
- Description of available assistance
- Cost, where known
- Address or service area
- Eligibility requirements, where known
- Contact details and official website
- Application instructions, where available
- Source and last-verified date
- Explanation of why the resource matched

The system must clearly label unknown or unverified information.

### Feature C: Suggested Action Plan

After matching resources, the AI generates a short, ordered list of practical next steps.

Example:
1. Review the nearest relevant food assistance options.
2. Confirm service area, opening hours, and any required documents.
3. Contact the selected organization before traveling.
4. Explore employment and utility assistance options.
5. Contact Washington 211 if additional referrals are needed.

Recommendations must be grounded in retrieved information. The AI must not invent services, eligibility rules, opening hours, or availability.

### Feature D: Nonprofit Resource Submission

A nonprofit representative can submit a resource through a form.

Required fields:
- Organization name
- Resource name
- Service description
- Categories
- Cost
- Location or service area
- Eligibility information, where known
- Contact information
- Official source URL

Submitted resources enter a pending-review queue and are not immediately published.

### Feature E: Admin Review

An administrator can:
- View pending submissions.
- Inspect resource details and source links.
- Approve or reject submissions.
- Add review notes.
- Publish approved resources to the searchable directory.

Only published resources can appear in public search results.

## 6. Resource Categories

The initial directory should support:
- Food assistance
- Housing and shelter
- Healthcare
- Employment
- Transportation
- Utilities
- Financial assistance
- Childcare
- Legal assistance
- Mental health
- Other community services

## 7. User Flows

### Community Member Flow
1. Open the homepage.
2. Describe their situation.
3. Enter a city or ZIP code if needed.
4. Submit the search.
5. View ranked resources.
6. Open an official website or contact a provider.
7. Follow the suggested action plan.

### Nonprofit Flow
1. Open the resource submission page.
2. Enter organization and service information.
3. Submit the resource.
4. Receive a confirmation that the submission is pending review.

### Administrator Flow
1. Open the admin review page.
2. Select a pending submission.
3. Check its source and details.
4. Approve or reject it.
5. If approved, make the resource available in public search.

## 8. Technical Architecture

**Frontend**
- Next.js
- TypeScript
- Tailwind CSS

**Backend**
- Next.js API routes
- Server-side validation and matching logic

**Database**
- Supabase PostgreSQL

**AI**
- An LLM API with structured outputs to extract needs and generate explanations and action plans.

**Mapping**
- OpenStreetMap or another suitable map provider.

The AI should interpret user input and explain results. The database must remain the source of truth for resource details.

## 9. Database Entities

### Organizations

Stores organization names, websites, contact details, and verification status.

### Resources

Stores resource names, descriptions, categories, cost, location, eligibility, contact information, source URLs, verification dates, and publication status.

### Resource Submissions

Stores submitted resource information, submitter contact details, review status, and reviewer notes.

### Optional Match Sessions

Stores minimal, non-sensitive search metadata if needed for debugging or analytics. User stories should not be retained by default.

## 10. API Endpoints

- `POST /api/match` — interpret user needs, find matching resources, and generate an action plan.
- `GET /api/resources` — search published resources by category and location.
- `POST /api/submissions` — submit a resource for review.
- `GET /api/admin/submissions` — list pending submissions for authorized administrators.
- `PATCH /api/admin/submissions/:id` — approve or reject a submission.

Admin endpoints must require authorization. Public endpoints should validate input and use appropriate rate limits.

## 11. Nonfunctional Requirements

- Responsive and accessible on mobile and desktop.
- Clear loading, error, and no-results states.
- Resource results include source links.
- User input is handled with appropriate privacy protections.
- API keys and administrative credentials remain server-side.
- Database permissions prevent unauthorized publication or modification.
- Unverified information is clearly identified.
- The application does not promise that a service has space, funding, or immediate availability without confirmation.

## 12. MVP Scope and Exclusions

### Included
- Natural-language search
- AI-based need extraction
- Search and ranking of published resources
- Resource result cards
- Suggested action plan
- Nonprofit submission form
- Admin approval workflow
- A curated Seattle resource dataset

### Excluded from the Weekend MVP
- Full nonprofit account management
- Automated website scraping
- Real-time program capacity tracking
- Appointment booking
- Complex public transit routing
- User accounts and saved search history
- Nationwide coverage

## 13. Success Criteria

The MVP is considered complete when:
1. A user can submit a natural-language description and receive relevant results from the actual database.
2. Results contain valid source links and clearly distinguish known facts from unknown information.
3. The matching system handles multiple needs in one request.
4. A nonprofit can submit a resource successfully.
5. An administrator can approve a submission and make it searchable.
6. The team can demonstrate the complete user journey on a deployed website.

## 14. Weekend Deliverables

- Working, responsive website
- Search and matching API
- Supabase database and seed script
- Curated set of approximately 20–50 resource listings
- Nonprofit submission form
- Admin review interface
- Three tested user scenarios
- Deployed demo and short presentation

## 15. Product Principle

**Help people take their next step, not just find another directory.**

NeighborAid should make community resources easier to discover while being transparent about eligibility, availability, and information that still needs verification.
