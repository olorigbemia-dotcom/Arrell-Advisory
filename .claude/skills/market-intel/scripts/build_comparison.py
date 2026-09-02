#!/usr/bin/env python3
"""Generate the comparison document from validated dossiers.

Usage:  python3 build_comparison.py research/<run> > research/<run>/03-comparison.md

The comparison is DERIVED, never authored. Every cell traces to a dossier field and every
field carries a footnote to its source. If a cell is wrong, the dossier is wrong.
Stdlib only.
"""
import json
import pathlib
import sys
from collections import Counter, defaultdict

TIER_ORDER = ["direct", "adjacent", "substitute", "aspirational"]
CONF_MARK = {"high": "", "medium": " (m)", "low": " (l)"}


class Footnotes:
    def __init__(self):
        self.items = []
        self.index = {}

    def ref(self, ev):
        """Register a footnote for an evidenced value, return its marker."""
        if not isinstance(ev, dict):
            return ""
        url = ev.get("source_url")
        quote = (ev.get("quote") or "").replace("|", "\\|").replace("\n", " ")
        if not url:
            return ""
        key = (url, quote)
        if key not in self.index:
            self.index[key] = len(self.items) + 1
            self.items.append((url, quote, ev.get("retrieved_at"), ev.get("status")))
        return f"[^{self.index[key]}]"

    def render(self):
        out = ["", "## Sources", ""]
        for i, (url, quote, retrieved, status) in enumerate(self.items, 1):
            out.append(f'[^{i}]: {url} — retrieved {retrieved}, {status}. "{quote}"')
        return "\n".join(out)


def cell(ev, fn, fallback="not established"):
    if not isinstance(ev, dict) or ev.get("value") in (None, ""):
        return f"*{fallback}*"
    text = str(ev["value"]).replace("|", "\\|").replace("\n", " ")
    stale = " ⚠stale" if ev.get("stale") else ""
    return f"{text}{CONF_MARK.get(ev.get('confidence'), '')}{stale}{fn.ref(ev)}"


def load(run_dir):
    dpath = pathlib.Path(run_dir) / "dossiers"
    files = sorted(dpath.glob("*.json"))
    if not files:
        sys.exit(f"no dossiers found in {dpath}")
    docs = []
    for f in files:
        with open(f) as fh:
            docs.append(json.load(fh))
    docs.sort(key=lambda d: (TIER_ORDER.index(d.get("tier", "adjacent"))
                             if d.get("tier") in TIER_ORDER else 9, d.get("name", "")))
    return docs


def price_cell(doc, fn):
    p = doc.get("pricing") or {}
    figures = p.get("figures") or []
    if figures:
        parts = []
        for f in figures:
            amt = f.get("value") if isinstance(f, dict) else None
            parts.append(f"{amt}{fn.ref(f)}" if amt else "")
        return "; ".join(x for x in parts if x)
    model = p.get("model")
    model_txt = model.get("value") if isinstance(model, dict) else model
    signals = p.get("signals") or []
    sig = "; ".join(str(s.get("value")) + fn.ref(s) for s in signals
                    if isinstance(s, dict) and s.get("value"))
    if sig:
        return f"**not published** — signal: {sig}"
    return f"**not published**{f' ({model_txt})' if model_txt else ''}"


def section_matrix(docs, fn):
    out = ["## Comparison matrix", "",
           "Confidence markers: no mark = high, (m) = medium, (l) = low. "
           "⚠stale = source older than the freshness window.", "",
           "| Firm | Tier | Category (self-described) | Promise | Buyer | Unit of sale | "
           "Pricing | Delivery |", "|---|---|---|---|---|---|---|---|"]
    for d in docs:
        pos = d.get("positioning") or {}
        aud = d.get("target_audience") or {}
        svcs = d.get("services") or []
        dm = d.get("delivery_model") or {}
        units = []
        for s in svcs:
            u = s.get("unit_of_sale") if isinstance(s, dict) else None
            if isinstance(u, dict) and u.get("value"):
                units.append(str(u["value"]))
        unit_txt = ", ".join(sorted(set(units))) if units else "*not established*"
        out.append("| {} | {} | {} | {} | {} | {} | {} | {} |".format(
            d.get("name", "?"), d.get("tier", "?"),
            cell(pos.get("category"), fn), cell(pos.get("promise"), fn),
            cell(aud.get("buyer_role"), fn), unit_txt,
            price_cell(d, fn), cell(dm.get("format"), fn)))
    return "\n".join(out)


def section_services(docs, fn):
    out = ["", "## Service lines by firm", ""]
    for d in docs:
        out.append(f"### {d.get('name')} ({d.get('tier')})")
        svcs = d.get("services") or []
        if not svcs:
            out.append("*No discrete service lines published.*")
        for s in svcs:
            if not isinstance(s, dict):
                continue
            name = s.get("name")
            nm = name.get("value") if isinstance(name, dict) else name
            bits = []
            for key in ("unit_of_sale", "duration", "stated_outcome"):
                v = s.get(key)
                if isinstance(v, dict) and v.get("value"):
                    bits.append(f"{key.replace('_', ' ')}: {v['value']}{fn.ref(v)}")
            out.append(f"- **{nm}**{fn.ref(name) if isinstance(name, dict) else ''}"
                       + (" — " + "; ".join(bits) if bits else ""))
        out.append("")
    return "\n".join(out)


def section_counts(docs):
    """Aggregate facts, always stated as N of M."""
    m = len(docs)
    published = sum(1 for d in docs if (d.get("pricing") or {}).get("published"))
    with_figures = sum(1 for d in docs if (d.get("pricing") or {}).get("figures"))
    tiers = Counter(d.get("tier") for d in docs)

    subst = Counter()
    for d in docs:
        for diff in d.get("differentiators") or []:
            if isinstance(diff, dict):
                s = diff.get("substantiation")
                subst[s.get("value") if isinstance(s, dict) else s] += 1

    formats = Counter()
    for d in docs:
        f = (d.get("delivery_model") or {}).get("format")
        if isinstance(f, dict) and f.get("value"):
            formats[str(f["value"]).lower()] += 1

    gaps = Counter()
    for d in docs:
        for g in d.get("gaps") or []:
            gaps[str(g)[:60]] += 1

    out = ["", "## Aggregate counts", "",
           f"Set size: **{m} firms** — " + ", ".join(f"{v} {k}" for k, v in tiers.most_common()),
           "",
           f"- Pricing published on a citable page: **{published} of {m}**",
           f"- Specific figures recoverable: **{with_figures} of {m}**",
           ""]
    if formats:
        out.append("Delivery formats: " + ", ".join(f"{k} ({v} of {m})"
                                                    for k, v in formats.most_common()))
        out.append("")
    if subst:
        out.append("Differentiator substantiation level across all claims: "
                   + ", ".join(f"{k or 'unrecorded'}: {v}" for k, v in subst.most_common()))
        out.append("")
    if gaps:
        out.append("Most common unestablished fields (candidate category-level absences):")
        for g, c in gaps.most_common(8):
            out.append(f"- {g} — {c} of {m} firms")
        out.append("")
    return "\n".join(out)


def collect_quotes(node, out):
    """Gather every verbatim `quote` string: the competitors' own words, nothing else."""
    if isinstance(node, dict):
        for k, v in node.items():
            if k == "quote" and isinstance(v, str):
                out.append(v)
            else:
                collect_quotes(v, out)
    elif isinstance(node, list):
        for v in node:
            collect_quotes(v, out)
    return out


def section_language(docs):
    """Vocabulary convergence measured over competitor copy only.

    Deliberately reads only `quote` fields. Schema keys would flood the counts with our own
    scaffolding, and `value` fields are the agent's paraphrase, which would measure the
    model's vocabulary rather than the category's.
    """
    stop = set("the a an and or of for for to in with your our we you that this is are as on "
               "by from at it its their they be can will more most than into across who what "
               "when how all any not no other only also new have has had was were been our us "
               "them then there here about over under between each every some such which "
               "make makes made help helps get gets one two out up down".split())
    per_firm = defaultdict(set)
    for d in docs:
        words = []
        for q in collect_quotes({k: v for k, v in d.items() if k != "sources"}, []):
            for w in q.lower().replace("-", " ").split():
                w = "".join(ch for ch in w if ch.isalpha())
                if len(w) > 3 and w not in stop:
                    words.append(w)
        per_firm[d.get("name", "?")].update(words)

    counts = Counter()
    for words in per_firm.values():
        counts.update(words)
    m = len(docs)
    threshold = max(2, (m + 1) // 2)
    shared = [(w, c) for w, c in counts.most_common(400) if c >= threshold][:25]
    unique = defaultdict(list)
    for firm, words in per_firm.items():
        for w in words:
            if counts[w] == 1 and len(w) > 5:
                unique[firm].append(w)

    out = ["", "## Category language", "",
           f"Measured over verbatim quotes only ({m} firms). Terms appearing in the copy of "
           f"{threshold} or more firms (convergence):", ""]
    out.append(", ".join(f"`{w}` ({c} of {m})" for w, c in shared) or "*none*")
    out += ["", "Terms unique to a single firm (differentiated vocabulary):", ""]
    any_unique = False
    for firm, words in sorted(unique.items()):
        if words:
            any_unique = True
            out.append(f"- **{firm}**: " + ", ".join(f"`{w}`" for w in sorted(words)[:12]))
    if not any_unique:
        out.append("*None. Every substantive term in this set is shared by at least two firms, "
                   "which is itself a finding about the category.*")
    out += ["", "> Convergence is a signal to investigate, not a conclusion. Consulting "
                "vocabulary propagates: one firm's phrase becomes six firms' phrase within a "
                "year. Shared language may mean shared buyer demand, or it may mean shared "
                "copywriting influence.", ""]
    return "\n".join(out)


def main(argv):
    if len(argv) < 2:
        print(__doc__)
        return 2
    run_dir = argv[1]
    docs = load(run_dir)
    fn = Footnotes()
    body = [f"# Comparison — {pathlib.Path(run_dir).name}", "",
            "> Generated by `build_comparison.py` from validated dossiers. Do not edit this "
            "file. To change a cell, correct the dossier and regenerate.", ""]
    body.append(section_matrix(docs, fn))
    body.append(section_services(docs, fn))
    body.append(section_counts(docs))
    body.append(section_language(docs))
    body.append(fn.render())
    print("\n".join(body))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
