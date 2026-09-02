# Evidence standard

## Confidence tiers

| Tier | Requirement | Usable for |
|---|---|---|
| **high** | Direct quote from a firm-owned or records-class page, dated within the freshness window | Any conclusion, including client-facing work |
| **medium** | Direct quote, but undated, near the freshness boundary, or from a third-party summary of a firm claim | Internal conclusions; needs a hedge if published |
| **low** | Indirect signal, single ambiguous source, or a reading that required interpretation to extract | Directional only; may not be the sole support for a hypothesis |

## Citation rules

1. **A citation names the page that contains the claim**, never a search query, never a domain
   root standing in for a deep page, never an archive of a different version than the one read.
2. **One claim, one citation minimum.** A paragraph with a citation at the end covers only its
   last sentence.
3. **Claim and quote must match.** The most common silent failure in research agents is a real
   URL attached to a claim the page does not make. `evidence_audit.py` checks that every claim
   has a citation; it cannot check that the citation supports the claim. That check is human,
   and it is the single highest-value review action on any run.
4. **Aggregate claims cite every source they aggregate.** "Most firms in the set do not publish
   pricing" cites each dossier it counted.

## Claim strength language

Bind the language to the evidence so the writing cannot outrun the data:

| Evidence | Permitted language |
|---|---|
| One source, `claimed` | "X states", "X's site describes" |
| Two or more sources, `corroborated` | "X positions itself as", "X offers" |
| Records-class, `observed` | "X was awarded", "X charged" |
| Pattern across the set, each cited | "N of M firms in this set..." — always with N and M |
| No evidence | "unknown", "not published", "not established" |

Never permitted: "leading", "the market is", "clients want", "industry standard pricing is",
or any unquantified plural, unless directly quoted from a cited source and attributed to it.

## The n problem

This method examines a deliberately small set, typically 12 to 18 firms. That is enough to
describe a *category's public language* and not remotely enough to describe a *market*.

Therefore:

- Claims about **what the category says** are supportable at this n.
- Claims about **what the market buys** are not. Public positioning is a claim about intended
  demand, not evidence of realized demand. Only records-class sources (awards, contracts,
  filings) evidence realized demand.
- Every conclusion states its n inline. "3 of 14 firms" is a finding; "few firms" is a vibe.

## Corroboration is not agreement

Two firms saying the same thing is a fact about the category's vocabulary, not corroboration of
the underlying claim. Corroboration requires *independent* sources on the *same* fact about the
*same* firm. Consulting copy propagates: one firm's phrase becomes six firms' phrase within a
year. Treat vocabulary convergence as a signal to investigate, not as validation.
