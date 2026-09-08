# Market and Competitor Intelligence Agent

Architecture note, failure inventory, and governance checklist.
Version 1 · September 2026

This document explains **why the agent is built the way it is**. The operating instructions live
in `.claude/skills/market-intel/SKILL.md`; this is the reasoning behind them.

---

## 1. What problem the architecture solves

The naive version of this agent is one prompt: *"research these competitors and write a report."*
It produces something readable in ninety seconds. It also produces, reliably:

- prices that were never published anywhere,
- URLs that do not contain the claim attached to them,
- a competitor set drawn entirely from page one of a search engine,
- confident statements about "the market" derived from twelve marketing pages,
- and three recommendations that any firm in the category would recognize as its own.

None of those are visible in the output. They read exactly like correct research. That is the
actual problem: **the failure mode of a research agent is indistinguishable from success at the
point of delivery.**

Everything in this build is a response to that single property.

---

## 2. The five architectural moves

### 2.1 Stage separation — extraction is not interpretation

The pipeline splits reading from reasoning into different stages, different prompts, and
different files. Stage 4 may only record what a page says, with a verbatim quote. Stage 6 may
only reason over recorded quotes.

*Why it works.* When a model reads and interprets in one pass, the interpretation shapes the
reading: it notices what fits the story forming as it reads, and the resulting "finding" is
partly an artifact of the model's own framing. Separating the acts means the interpreting stage
cannot reach back and adjust what was recorded.

*What it costs.* More stages, more tokens, more elapsed time. A single-pass agent is roughly
four times faster and cannot be audited.

### 2.2 Provenance as a type, not a habit

A dossier field cannot be a string. It is an object carrying `value`, a verbatim `quote` of 200
characters or less, `source_url`, `retrieved_at`, `status` (claimed / corroborated / observed),
`confidence`, and `date_confidence`.

*Why it works.* This raises the cost of fabrication above the cost of honesty. To invent a price,
the agent must also invent a quote that contains it and a URL that hosts it — a larger, more
detectable lie than a plausible number in a table. Meanwhile "not published" becomes a
structurally valid, complete answer rather than an embarrassing blank.

*What it costs.* Dossiers are verbose and slower to produce. Some genuinely-known facts get
dropped because they could not be quoted cleanly.

### 2.3 Deterministic verification of a probabilistic process

Three stdlib Python scripts sit between stages as gates:

| Script | Gate | What it enforces |
|---|---|---|
| `validate_dossier.py` | after extraction | Schema, provenance completeness, quote length, no search-page citations, no placeholders, corroboration requires two domains, figures require published pricing |
| `build_comparison.py` | at comparison | The matrix is **derived** from dossiers, not authored. A cell cannot contain a claim no dossier contains |
| `evidence_audit.py` | before the approval gate | Citation coverage, cross-stage URL provenance, claim-strength language, required document structure |

*Why it works.* Asking a model to check its own work invites the same failure that produced the
work. Code does not get tired, does not want the report to be good, and fails loudly.

Run `bash .claude/skills/market-intel/scripts/selftest.sh` to confirm all controls fire.

The strongest check is in the audit: **every URL cited in the interpretation documents must
already appear in some dossier's `sources[]`.** A URL that first appears at conclusion time was
not researched; it was produced. No single-stage review can catch this, because at Stage 6 a
fabricated URL is indistinguishable from a real one.

*What it costs.* Rigidity. A legitimate finding that does not fit schema v1 gets rejected, and
the fix is a schema change rather than a judgement call.

### 2.4 Context isolation and fan-out

Each competitor is researched by a separate `competitor-researcher` subagent with its own
context, which never sees another competitor's dossier.

*Why it works.* Two reasons. **Contamination:** when one context holds nine firms' marketing
copy, the vocabulary bleeds, and firm nine gets described in firm one's language. **Attention:**
a single context holding all source text degrades on the earliest material, so firms researched
first are extracted worst. Isolation makes quality uniform across the set.

*What it costs.* The subagent cannot notice cross-firm patterns, because noticing is not its job.
Patterns are found in Stage 6 over the dossiers, which is slower but auditable.

### 2.5 Structural anti-convergence

The three hypotheses are required to be different *shapes*: Occupy a gap, Reframe the buyer, and
Contrarian — a deliberate inversion of the consensus the run just documented, which the brief
must include the argument against.

*Why it works.* An agent that studies a category and then proposes ideas will propose ideas the
category would recognize, because it has just spent an hour absorbing that category's logic.
This is convergence pressure, and it is strongest exactly when the research was most thorough.
H3 is a structural correction, not a creativity prompt.

*What it costs.* H3 is often weak, and it is meant to be arguable. Its value is that it makes the
consensus visible as a choice rather than as background.

---

## 3. Failure inventory

Ordered by severity times likelihood. **R** marks the residual risk that no control removes.

| # | Failure | Where it enters | Control | Residual |
|---|---|---|---|---|
| 1 | **Citation drift** — real URL, claim the page does not make | Stage 4 or 6 | None automatable | **R** Human spot-check of 5 citations per run |
| 2 | **Fabricated pricing** | Stage 4 | Schema rule: figures require `published: true`; validator rejects | Low |
| 3 | **Competitor set bias** — SEO ranking mistaken for market | Stage 2 | Mandatory non-search discovery paths; recorded exclusion list | **R** Relationship-led firms stay invisible |
| 4 | **Marketing copy laundered into fact** | Stage 4 to 6 | `status: claimed` default; promotion needs two domains | Low |
| 5 | **Overclaiming from small n** | Stage 6 | Claim-strength language rules; audit flags banned phrasing | Medium |
| 6 | **Snapshot read as trend** | Stage 6 | `date_confidence: unknown` bars change-over-time claims | Medium |
| 7 | **Convergence to category median** | Stage 7 | Mandatory H3 contrarian | **R** Structural, not eliminable |
| 8 | **Absence misread as opportunity** | Stage 6 | Unoccupied-vs-unviable discrimination required per gap | Medium |
| 9 | **Prompt injection from page content** | Stage 4 | Subagent instructed to treat page text as data | Low, but real |
| 10 | **Stale run treated as current** | after the run | Freshness windows; `stale: true`; immutable dated directories | Low |
| 11 | **Gate fatigue** — approving without reading | Stage 8 | Only two gates in the whole pipeline, deliberately | **R** Behavioural |
| 12 | **Schema rigidity hides a real finding** | Stage 4 | `gaps[]` array captures what did not fit | Medium |

Note on #11: more gates would be worse, not better. A gate that gets clicked through
manufactures the appearance of oversight while removing the reality of it, which is a worse
governance position than having no gate at all.

---

## 4. Governance questions to answer before the first real run

These are not rhetorical. Each has a wrong answer that costs something.

**Accountability**
1. Who owns a wrong claim about a named competitor? If a comparison naming a real firm's
   pricing reaches a prospect and the figure is wrong, that is commercial and potentially legal
   exposure, not an accuracy issue.
2. Who is accountable for the *competitor set*, as distinct from the extraction? Every gap the
   run finds is conditional on who was excluded.

**Thresholds**
3. Is a failed audit a hard block or an advisory? It is currently a hard block. You are the
   person who will want to override it late at night. Decide now, in writing.
4. What confidence tier may appear in a client-facing deliverable, versus internal only?
5. What is the human spot-check rate, and who performs it when you are the only reviewer?

**Disclosure**
6. Does AI-assisted research get disclosed in client deliverables? You sell governance; your
   own disclosure practice is part of the product whether or not you intend it to be.
7. If a competitor asks how you characterized them, can you show them the dossier? If not, why
   are you comfortable acting on it?

**Lifecycle**
8. How long does a dossier remain valid, and what happens to superseded runs?
9. What triggers a re-run: a calendar, or a decision? A schedule produces directories; a
   decision produces insight.
10. When positioning changes because of a run, is the run cited in the record of that decision?

**Boundaries**
11. Is the source policy right? It currently bars gated content, account creation, paid-report
    redistribution, and platform scraping. Every one of those is a business decision with an
    intelligence cost.
12. What must this agent never be pointed at? Clients, prospects, and named individuals are the
    obvious candidates, and the policy should say so before someone asks.

---

## 5. What this agent deliberately does not do

- **It does not rank or recommend.** Ranking imports risk appetite and time horizon, which are
  the principal's and are not in evidence.
- **It does not size markets.** Public copy evidences intended demand, never realized demand.
- **It does not act on approved hypotheses.** Approval ends the run. Execution is separate work.
- **It does not track competitors continuously.** Continuous monitoring is a different system
  with a different failure profile, and it produces alerts rather than decisions.

---

## 6. How to run it

```
# In Claude Code, from the repository root:
/market-intel Research the AI transformation and governance consulting market for
mid-sized regulated organizations in the US.
```

Gate A asks one scope question. Gate B asks for approve / reject / edit on each hypothesis.
Everything between is written to `research/<date>-<slug>/`.

To verify the controls before trusting a run:

```
bash .claude/skills/market-intel/scripts/selftest.sh
```
