# September 2026 website redesign

The public positioning now addresses business owners and organizational leaders who want to understand where AI creates value and how to adopt it responsibly. The principal title is Responsible AI Transformation Consultant. Existing principal credentials, employer references, publications, and experience claims are retained at the owner's direction; they were not independently reverified.

## Service architecture

The former three-pillar service model is replaced by a connected journey: Learn, Assess, Align, Design, Adopt, Enable, Govern, Improve. Governance is considered throughout, and clients may enter at any appropriate stage. Services cover literacy, strategic alignment, workflow design, pilot advisory, workforce capability, and organizational governance. Assessment is the separate diagnostic entry point. Technical implementation is explicitly excluded.

## Assessment behavior

The primary assessment has 12 questions across six dimensions. Answers live only in page memory; they are not sent to an endpoint or stored in browser storage. Results are ungated and provide direction for each dimension, not a total score or certification. A low response controls its dimension's recommendation; strengths elsewhere cannot offset it. Unknown responses prompt clarification.

The original 15-question, three-pillar assessment is preserved at `/advanced-governance-assessment`, including its original scoring and email-gated flow. It is labeled as an advanced diagnostic, not a description of technical services Arrell delivers.

## Introductory conversation

The old session pricing and direct Calendly strategy links are removed. `/strategy` captures an introductory-call inquiry through the existing FormSubmit destination. It does not claim to book a calendar slot. An accepted submission explains that Arrell will follow up to arrange a conversation. The form includes organization, role, team size, AI use, business outcome, timing, desired support, and explicit inquiry-processing consent. It is not a marketing subscription.

The existing Calendly event may still represent the former paid offer. It is intentionally not linked. A future direct scheduling flow needs a confirmed introductory-call event and aligned intake settings.

## URL preservation

| URL | Treatment |
| --- | --- |
| `/` | Redesigned homepage |
| `/methodology` | Outcome-first approach at the same URL |
| `/ai-transformation-readiness-assessment` | New broad adoption assessment |
| `/advanced-governance-assessment` | Preserved original diagnostic |
| `/governance-readiness-assessment` | Existing redirect to primary assessment retained |
| `/principal`, `/training`, `/book`, `/insights` | Preserved with updated navigation and context |
| `/nested-governance-architecture`, `/nga-white-paper` | Preserved IP and research; entry/conversion context updated |
| `/strategy`, `/contact` | Introductory conversation and inquiry flow |
| `/start` | Redirect to unified `/how-we-help` journey |
| `/debrief`, `/speaking` | Existing redirects retained |
| Existing published articles | Preserved; missing ROI article links removed |

GitHub Pages remains the host. Static redirect pages use HTML refresh plus canonical metadata; these are not HTTP 301 responses. Hosting changes would be needed for server-side 301 rules.

## Editing and measurement

This remains a static HTML/CSS/JavaScript site with no build step. Service content is edited in its dedicated HTML file; no CMS was added. Existing training data remains in `data/`. `sitemap.xml` and `robots.txt` cover indexable pages.

Consent-gated analytics hooks cover assessment starts/completions, assessment-to-strategy clicks, resource opens, white-paper entry, and introductory inquiries. `AA_GA_ID` in `scripts.js` remains unset, as in the original site: no analytics destination is active until the owner supplies one. No booking-completed event is emitted for an inquiry. Existing providers and accounts were not reconfigured.

## Validation and limits

Run `node tests/assessment.test.cjs`, `node tests/javascript-syntax.test.cjs`, and `node tests/intake.test.cjs`. The delivery check also scans page links, duplicate IDs, new-page H1s, structured data, and local HTTP routes. Browser visual inspection and real external form delivery were not performed in this session. No test inquiry was sent to the business inbox.
