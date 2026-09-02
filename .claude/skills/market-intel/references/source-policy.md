# Source policy

The boundary of what this agent may look at, and how looking is recorded.

## Permitted

| Class | Examples | Weight |
|---|---|---|
| **Firm-owned public pages** | Homepage, services, pricing, case studies, about, careers | Primary for positioning and service claims |
| **Firm public collateral** | Published rate cards, capability statements, GSA/state schedule listings, published SOWs, conference decks the firm posted | Primary for pricing; the highest-value pricing source |
| **Third-party corroboration** | Trade press, analyst mentions, association directories, conference programs, award notices, public registries | Required to promote a claim to `corroborated` |
| **Buyer-side signal** | Public job postings, published RFP and RFI documents, public procurement awards, regulator guidance, public community discussion | Primary for demand patterns and buyer vocabulary |
| **Public financial or contract records** | Government contract awards, published grant records, public filings | Primary for real transacted prices |

## Prohibited

- Anything behind a paywall, login, or gate, including a gate the agent could satisfy with an
  email address. Do not create accounts. Do not use an email address to obtain a gated asset.
- Content the site's `robots.txt` or terms disallow for automated access.
- Redistribution of paid analyst reports. A public press summary of one is permitted; the
  report body is not.
- Personal data about named individuals beyond their public professional role at the firm.
  Roles, titles, and published bios are in scope. Anything else is not.
- Automated scraping of platforms whose terms prohibit it, including LinkedIn. A public page
  that a browser renders without login may be read; a crawler run against a platform may not.
- Any source the agent cannot cite by URL. If it cannot be cited, it cannot be used.

## Recording

Every source that is opened is recorded, **including dead ends**. A dead end is evidence: three
competitors with no pricing page is a finding about the category, and it is only visible if the
attempts were logged.

For each source record:

```
url                the exact URL opened, not a search query
retrieved_at       ISO-8601 date
outcome            used | no_relevant_content | unreachable | out_of_policy
class              firm_owned | firm_collateral | third_party | buyer_signal | records
```

## Freshness

| Field type | Maximum age before flagged stale |
|---|---|
| Pricing | 12 months |
| Positioning and messaging | 18 months |
| Service line descriptions | 18 months |
| Trend and demand claims | 6 months |
| Firm structure, size, leadership | 24 months |

A stale field is not discarded. It is carried with `stale: true` and its age stated in the
comparison, because "this firm has not updated its positioning in three years" is itself a
competitive fact.

## The undated-source problem

Much consulting web copy carries no publication date. When a page has no date:

1. Look for a date signal: copyright footer, referenced events, case study dates, a sitemap
   `lastmod`, or an archive snapshot.
2. If none is found, record `retrieved_at` as the retrieval date and set `date_confidence: "unknown"`.
3. A field with `date_confidence: "unknown"` may **not** be used to support a claim about
   change over time, trend direction, or recency. It may support a claim about current state.

This rule exists because undated copy is the most common route to a confident false statement
about where a market is heading.
