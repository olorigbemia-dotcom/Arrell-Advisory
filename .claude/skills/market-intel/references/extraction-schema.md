# Extraction schema v1

The dossier contract. `validate_dossier.py` enforces this; the schema here is the human-readable
statement of the same rules.

One JSON file per competitor at `research/<run>/dossiers/<slug>.json`.

## Shape

```json
{
  "schema_version": "1",
  "slug": "example-advisory",
  "name": "Example Advisory",
  "tier": "direct",
  "url": "https://example.com",
  "retrieved_at": "2026-09-02",
  "positioning": { "<field>": "<evidenced value>" },
  "target_audience": { },
  "services": [ ],
  "pricing": { },
  "delivery_model": { },
  "differentiators": [ ],
  "sources": [ ],
  "gaps": [ "fields that could not be established, and why" ]
}
```

## The evidenced value

Every substantive value is an object, never a bare string:

```json
{
  "value": "board-defensible AI governance for regulated mid-market",
  "quote": "We make AI governance board-defensible for banks and health systems.",
  "source_url": "https://example.com/services",
  "retrieved_at": "2026-09-02",
  "status": "claimed",
  "confidence": "high",
  "date_confidence": "known"
}
```

| Key | Rule |
|---|---|
| `value` | The agent's normalized reading. May paraphrase. |
| `quote` | Verbatim from the source, 200 characters or less. Must actually appear at `source_url`. |
| `source_url` | The page opened, not a search result page. |
| `status` | `claimed` (the firm says it) / `corroborated` (an independent source confirms it) / `observed` (a transacted fact from records) |
| `confidence` | `high` / `medium` / `low` per `evidence-standard.md` |
| `date_confidence` | `known` / `inferred` / `unknown` |

## Field definitions

**positioning** — `category` (the noun the firm uses for what it sells), `promise` (the outcome
claimed), `proof` (what it offers as evidence), `frame` (the problem framing it asserts).

**target_audience** — `sectors`, `org_size`, `buyer_role`, `regulatory_regime`, `geography`.
Record the *stated* audience. If the firm states none, that is a `gap`, not an inference from
its case studies. Inferred audience goes in `positioning.frame` notes at most.

**services** — array. Each: `name`, `description`, `unit_of_sale` (engagement, retainer, day
rate, assessment, licence, seat, workshop), `duration`, `stated_outcome`.

**pricing** — `published` (boolean), `model` (fixed, day rate, retainer, tiered, value-based,
not published), `figures` (array of evidenced values with `amount`, `currency`, `unit`, `scope`),
`signals` (qualitative price signals: "starting at", "enterprise", "investment level").

> **Pricing is the field under maximum hallucination pressure.** It is the most requested and
> least published. If no figure is published, `published: false` and `figures: []`. A figure
> that came from anywhere other than a citable page does not enter this object. Estimated price
> ranges belong in the interpretation layer, labelled as guesses, and never in a dossier.

**delivery_model** — `format` (advisory, embedded, training, productized assessment, software,
hybrid), `team_shape` (solo principal, boutique bench, partner network, scaled firm),
`engagement_arc`, `client_effort` (what the client must supply).

**differentiators** — array of evidenced values, each with `claim` and `substantiation`
(`none`, `assertion`, `example`, `credential`, `data`). Most differentiator copy substantiates
at `assertion`. Recording that is the point: a category where everyone asserts and nobody
substantiates is a gap.

**sources** — every URL opened, per `source-policy.md`, including dead ends.

**gaps** — explicit list of what could not be established. A dossier with an empty `gaps` array
on a small firm is a signal that the agent inferred rather than found.

## Hard rules the validator enforces

1. No evidenced value without `source_url`, `quote`, and `retrieved_at`.
2. `quote` no longer than 200 characters.
3. Any `source_url` used in a field must also appear in `sources`.
4. `pricing.figures` non-empty requires `pricing.published: true`.
5. `status: "corroborated"` requires at least two distinct source domains for that field.
6. Unknown values must be `null` with a `gaps` entry, never the empty string, never "N/A",
   never a plausible-sounding placeholder.
