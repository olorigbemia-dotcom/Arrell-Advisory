#!/usr/bin/env python3
"""Audit citation coverage across a run's interpretation and hypothesis documents.

Usage:  python3 evidence_audit.py research/<run> [--min-coverage 0.85]

Checks four things a language model cannot reliably check about its own output:

  1. COVERAGE   Does every load-bearing claim carry a citation?
  2. PROVENANCE Does every cited URL actually appear in a dossier's sources[]?
                A URL that shows up first at interpretation time was invented there.
  3. LANGUAGE   Does the prose use claim strength the evidence does not support?
  4. STRUCTURE  Do the required sections and the three hypothesis shapes exist?

What it CANNOT check: whether the cited page actually says the thing. That is citation
drift, it is the residual risk of this whole system, and it is a human review action.

Writes audit.json into the run directory. Exit 1 on failure. Stdlib only.
"""
import argparse
import json
import pathlib
import re
import sys

CITATION = re.compile(r"\[\^[^\]]+\]|https?://\S+|\[\[[a-z0-9\-]+\]\]|`[a-z0-9\-]+\.json`")
URL = re.compile(r"https?://[^\s\)\]\>,\"']+")
SENTENCE = re.compile(r"(?<=[.!?])\s+")
ONLY_CITATIONS = re.compile(r"(?:\[\^[^\]]+\]|https?://\S+|\[\[[a-z0-9\-]+\]\]|`[a-z0-9\-]+\.json`|[\s.,;)\]]|and)+")

# Prose that asserts more than a 12-to-18 firm public-copy sample can support.
BANNED = [
    (r"\bthe market (is|wants|needs|demands|has)\b", "asserts market behaviour; the sample "
     "evidences category language, not market demand"),
    (r"\bclients (want|need|expect|demand)\b", "asserts buyer behaviour without records-class "
     "evidence"),
    (r"\b(industry|market) standard (pricing|rate|price)\b", "asserts a standard price"),
    (r"\b(the )?leading\b", "unquantified superlative"),
    (r"\bmost firms\b(?!.{0,40}\b\d+ of \d+)", "unquantified plural; use 'N of M'"),
    (r"\bmany (firms|competitors|providers)\b(?!.{0,40}\b\d+ of \d+)", "unquantified plural"),
    (r"\beveryone\b|\bnobody\b(?!.{0,60}\b\d+ of \d+)", "absolute without a count"),
    (r"\btypically charges?\b", "asserts pricing behaviour"),
    (r"\bis growing\b|\bis shrinking\b|\btrending\b", "change-over-time claim; requires dated "
     "sources per source-policy.md"),
]

HEDGES = ("may", "might", "could", "appears", "suggests", "unclear", "unknown", "we guess",
          "guess:", "hypothesis", "if true", "assumption", "unverified", "not established")

REQUIRED_SECTIONS = {
    "04-patterns-gaps.md": ["facts", "interpretations", "guesses", "absences"],
    "05-hypotheses.md": ["h1", "h2", "h3", "assumption", "test"],
}

REQUIRED_HYPOTHESIS_FIELDS = ["buyer", "problem", "offer", "delivery", "price",
                              "evidence", "assumption", "test"]

# A hypothesis document mixes two kinds of sentence and only one of them is citable.
# WORLD_CLAIM fields assert something about the market and must cite. PROPOSAL fields
# describe an offer that does not exist yet, or an action not yet taken; there is nothing
# to cite, and demanding a citation would push the agent to attach one anyway. That is the
# exact behaviour this audit exists to prevent, so the distinction is enforced structurally.
WORLD_CLAIM_LABELS = ("problem", "evidence", "gap discrimination", "the argument against")
PROPOSAL_LABELS = ("buyer", "offer", "delivery", "price", "price logic", "assumption",
                   "load-bearing assumption", "test", "disconfirming test", "second-order",
                   "second-order effects")
FIELD = re.compile(r"\*\*([^*]+?)\*\*\s*([^*]*)")


def dossier_urls(run):
    urls, slugs = set(), set()
    for f in sorted((pathlib.Path(run) / "dossiers").glob("*.json")):
        slugs.add(f.stem)
        try:
            doc = json.load(open(f))
        except (json.JSONDecodeError, OSError):
            continue
        for s in doc.get("sources") or []:
            if isinstance(s, dict) and s.get("url"):
                urls.add(s["url"].rstrip("/"))
        for m in URL.finditer(json.dumps(doc)):
            urls.add(m.group(0).rstrip("/").rstrip('",'))
    return urls, slugs


def claim_sentences(text, label_aware=False):
    """Sentences that assert something about the world.

    With label_aware, a line opening with a bolded proposal label is skipped: it
    describes an intention, not a fact, and cannot be cited.
    """
    out = []
    in_fence = False
    for raw in text.splitlines():
        line = raw.strip()
        if line.startswith("```"):
            in_fence = not in_fence
            continue
        if in_fence or not line:
            continue
        if line.startswith(("#", ">", "|", "[^", "---")):
            continue
        line = re.sub(r"^[-*+]\s+|^\d+\.\s+", "", line)
        if label_aware:
            # A line packs several **Label.** value fields. Keep only the world-claim ones.
            fields = FIELD.findall(line)
            if fields:
                lead = line[:line.index("**")].strip()
                kept = [lead] if lead else []
                for label, body in fields:
                    key = label.strip().rstrip(".").lower()
                    is_proposal = any(key.startswith(pl) for pl in PROPOSAL_LABELS)
                    is_claim = any(key.startswith(w) for w in WORLD_CLAIM_LABELS)
                    # Unrecognised labels are audited rather than exempted: an exemption
                    # you can create by inventing a label is not a control.
                    if is_claim or not is_proposal:
                        kept.append(body)
                line = " ".join(kept).strip()
            if not line:
                continue
        parts = []
        for s in SENTENCE.split(line):
            s = s.strip()
            if not s:
                continue
            # A fragment that is nothing but citations belongs to the sentence before it.
            # "Claim text. https://source" splits into two, and without this the claim
            # reads as uncited while the citation reads as too short to be a claim.
            if parts and ONLY_CITATIONS.fullmatch(s):
                parts[-1] = parts[-1] + " " + s
            else:
                parts.append(s)
        for s in parts:
            if len(CITATION.sub("", s).strip()) < 40:
                continue
            if s.startswith(("*", "_")) and s.endswith(("*", "_")):
                continue
            out.append(s)
    return out


def audit_file(path, urls, slugs, min_cov):
    res = {"file": path.name, "errors": [], "warnings": [],
           "claims": 0, "cited": 0, "coverage": 1.0}
    if not path.exists():
        res["errors"].append("required document is missing")
        res["coverage"] = 0.0
        return res
    text = path.read_text()
    low = text.lower()

    for token in REQUIRED_SECTIONS.get(path.name, []):
        if token not in low:
            res["errors"].append(f"required section or token '{token}' not found")

    if path.name == "05-hypotheses.md":
        for field in REQUIRED_HYPOTHESIS_FIELDS:
            if low.count(field) < 3:
                res["errors"].append(
                    f"'{field}' appears {low.count(field)}x; each of the three hypotheses "
                    f"must state it (hypothesis-rubric.md)")

    is_hypotheses = path.name == "05-hypotheses.md"
    sentences = claim_sentences(text, label_aware=is_hypotheses)
    uncited = []
    for s in sentences:
        # A guess or an explicit hedge does not need a citation; it needs a label.
        if any(h in s.lower() for h in HEDGES):
            continue
        res["claims"] += 1
        if CITATION.search(s):
            res["cited"] += 1
        else:
            uncited.append(s[:140])
    if res["claims"]:
        res["coverage"] = round(res["cited"] / res["claims"], 3)
    if res["coverage"] < min_cov:
        res["errors"].append(
            f"citation coverage {res['coverage']:.0%} below the {min_cov:.0%} threshold; "
            f"{len(uncited)} unhedged claim(s) carry no citation")
    res["uncited_examples"] = uncited[:10]

    if is_hypotheses:
        blocks = re.split(r"^##\s+", text, flags=re.M)[1:]
        for block in blocks:
            head = block.splitlines()[0].strip()
            if not re.match(r"H[123]\b", head):
                continue
            ev = re.search(r"\*\*Evidence\.?\*\*(.*?)(?=\*\*|$)", block, re.S)
            if not ev:
                res["errors"].append(f"'{head}': no **Evidence** field")
            elif not CITATION.search(ev.group(1)):
                res["errors"].append(
                    f"'{head}': the Evidence field cites nothing. A hypothesis with "
                    f"uncited evidence is an idea, not a hypothesis (hypothesis-rubric.md)")

    for m in URL.finditer(text):
        u = m.group(0).rstrip("/").rstrip('.,)"\'')
        if u not in urls:
            res["errors"].append(
                f"cited URL never appeared in any dossier's sources: {u} — a URL that first "
                f"appears at interpretation time was not researched, it was produced")

    for m in re.finditer(r"\[\[([a-z0-9\-]+)\]\]", text):
        if m.group(1) not in slugs:
            res["errors"].append(f"reference to unknown dossier '{m.group(1)}'")

    for pattern, why in BANNED:
        for m in re.finditer(pattern, text, re.I):
            ctx = text[max(0, m.start() - 60):m.end() + 60].replace("\n", " ")
            res["warnings"].append(f"claim-strength: '{m.group(0)}' — {why} … {ctx.strip()}")

    return res


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("run")
    ap.add_argument("--min-coverage", type=float, default=0.85)
    args = ap.parse_args(argv)

    run = pathlib.Path(args.run)
    if not run.is_dir():
        sys.exit(f"run directory not found: {run}")

    urls, slugs = dossier_urls(run)
    if not slugs:
        sys.exit(f"no dossiers in {run}/dossiers — nothing to audit against")

    results = [audit_file(run / name, urls, slugs, args.min_coverage)
               for name in ("04-patterns-gaps.md", "05-hypotheses.md")]

    failed = any(r["errors"] for r in results)
    out = {"run": str(run), "dossiers": len(slugs), "known_urls": len(urls),
           "min_coverage": args.min_coverage,
           "result": "fail" if failed else "pass", "files": results}
    (run / "audit.json").write_text(json.dumps(out, indent=2))

    for r in results:
        head = "FAIL" if r["errors"] else ("WARN" if r["warnings"] else "OK")
        print(f"[{head}] {r['file']} — coverage {r['coverage']:.0%} "
              f"({r['cited']}/{r['claims']} claims cited)")
        for e in r["errors"]:
            print(f"    ERROR   {e}")
        for w in r["warnings"][:12]:
            print(f"    warning {w}")
        for u in r.get("uncited_examples", [])[:5]:
            print(f"    uncited > {u}")
    print(f"\naudit.json written. Result: {'FAIL' if failed else 'PASS'}")
    print("Reminder: this audit proves citations EXIST. It cannot prove the cited page says "
          "the thing. Spot-check five citations by hand before acting on any hypothesis.")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
