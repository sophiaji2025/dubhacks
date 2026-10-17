
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

### Feature A: Structured Resource Search

The homepage should present a form that allows users to select multiple needs.

**Question 1: What do you need help with?**

Users can select any combination of these stored category names:
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

The form should use checkboxes or selectable cards rather than requiring users to type a description. The search form, the API, and the `resources.category` column all use these exact strings.

Resources:
1. https://www.seattle.gov/human-services/services-and-programs/food-resources/afterschool-meals-program
    -Afterschool meals program (free meal + snack)
    -Eligibility: 1-18 years old, 18+ if documented disability
2. https://www.seattlefreshbucks.org/
    -Customers receive monthly benefits ($60) to spend at participating farmers markets, independent grocers, and supermarkets using the Fresh Bucks Card or HealthyBenefits+ app.
    -Eligibility: Need to meet income requirements & live within city limits, MUST fill out wailist application
3. https://www.marysplaceseattle.org/get-help?utm_source=chatgpt.com
    -Emergency housing/shelter for families and pregnant women (2 locations)
    -Mobile outreach specialists (supplies, resources, transition to stable housing)
4. https://rootsinfo.org/
    -Young adult shelter for people 18-25
    -Accomodates up to 45 people a night
    -No proof of ID, income, etc to stay
    -Warm meals, a place to sleep, access to support resources
5. https://www.muslimhousing.org/
    -Homelessness prevention
    -Rapid re-housing (provides rent assistance)
    



**Question 2: What should we consider?**

Optional preferences include:

Transportation:
- Public transportation or walking
- Access to a car
- Wheelchair-accessible services

Cost:
- Only completely free services
- Include free and discounted services

Other circumstances:
- Looking for help for children or family
- Need assistance as soon as possible
- Prefer services that do not require an appointment

These preferences should influence matching only when the resource database contains the information needed to apply them reliably.

**Question 3: Where do you need help?**

Users enter a city or ZIP code.

For the MVP, the default service area is Seattle, Washington. Location is required to perform a local search, but the user should not need to provide an exact street address.

**Question 4: Anything else? (Optional)**

An optional text box allows users to describe circumstances not covered by the selections.

Example:

"I recently lost my job and have two children."

This information can refine matching and help personalize the action plan, but users should be able to complete a search without entering any free text.

### Feature B: Resource Matching Engine

The backend converts checkbox selections into structured search criteria.

The matching process should:
1. Retrieve published resources from the database.
2. Identify resources matching the selected categories.
3. Apply explicit filters, such as free-only services, where the data supports them.
4. Rank remaining resources based on relevance, location, eligibility information, accessibility, and information freshness.
5. Optionally use AI to interpret additional text.
6. Return the strongest matches with explanations.

Checkbox selections should be the primary input to the matching engine.

AI must not override explicit user preferences without clarification or invent resources that do not exist in the database.

### Feature C: Resource Results

Each result should display:
- Resource or organization name
- Service category
- Description of the service
- Cost, where known
- Address or service area
- Eligibility requirements, where known
- Contact information and official website
- Application instructions, where available
- Source URL and last-verified date
- Explanation of why the resource matches the user's selections

Unknown information should be clearly labeled.

The results page should support opening official websites and contacting providers.

### Feature D: Suggested Action Plan

After matching resources, the system generates a short, ordered checklist of practical next steps.

Example:
1. Review the best-matching food assistance options.
2. Confirm the provider's service area and current opening hours.
3. Check whether any identification or documentation is required.
4. Contact the provider before traveling.
5. Explore relevant employment or utility assistance resources.

AI may personalize the language and order of these steps using the selected needs and retrieved resource data.

The system must not claim that a user qualifies for a program or that assistance is available unless the relevant information supports that claim.

### Feature E: Nonprofit Resource Submission

Nonprofits can submit their services through a form.

Required fields:
- Organization name
- Resource or program name
- Service description
- Categories
- Cost
- Location or service area
- Eligibility information, where known
- Contact information
- Official source URL

New submissions enter a pending-review queue and must not appear in public search until approved.

### Feature F: Admin Review

An administrator can:
- View pending submissions.
- Inspect resource details and source links.
- Approve or reject submissions.
- Add review notes.
- Publish approved resources.
- Update or unpublish outdated listings.

Only published resources should be eligible for public search and matching.

## 6. Resource Categories

The initial directory stores these exact category strings, the same list as Question 1:
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
