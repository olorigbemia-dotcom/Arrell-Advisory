#!/usr/bin/env python3
"""Validate competitor dossiers against extraction schema v1.

Usage:  python3 validate_dossier.py research/<run>/dossiers/*.json

Exit 0 = all files valid (warnings allowed). Exit 1 = at least one error.
Stdlib only, by design: this repo has no build step and no dependencies.
"""
import json
import re
import sys
from datetime import date, datetime

SCHEMA_VERSION = "1"
MAX_QUOTE = 200
TIERS = {"direct", "adjacent", "substitute", "aspirational"}
STATUSES = {"claimed", "corroborated", "observed"}
CONFIDENCES = {"high", "medium", "low"}
DATE_CONFIDENCES = {"known", "inferred", "unknown"}
REQUIRED_TOP = ["schema_version", "slug", "name", "tier", "url", "retrieved_at",
                "positioning", "target_audience", "services", "pricing",
                "delivery_model", "differentiators", "sources", "gaps"]
PLACEHOLDERS = {"", "n/a", "na", "none", "unknown", "tbd", "-", "--", "?", "not found",
                "not available", "not applicable", "todo"}
FRESHNESS_DAYS = {"pricing": 365, "positioning": 548, "services": 548,
                  "delivery_model": 548, "target_audience": 548, "differentiators": 548}


class Report:
    def __init__(self, path):
        self.path = path
        self.errors = []
        self.warnings = []

    def error(self, where, msg):
        self.errors.append(f"{where}: {msg}")

    def warn(self, where, msg):
        self.warnings.append(f"{where}: {msg}")


def is_evidenced(obj):
    return isinstance(obj, dict) and "value" in obj and "source_url" in obj


def domain(url):
    m = re.match(r"https?://([^/]+)", str(url or ""))
    if not m:
        return ""
    return m.group(1).lower().removeprefix("www.")


def parse_date(s):
    try:
        return datetime.strptime(str(s), "%Y-%m-%d").date()
    except (ValueError, TypeError):
        return None


def walk(node, path, found):
    """Yield every evidenced-value dict in the document with its json path."""
    if is_evidenced(node):
        found.append((path, node))
        return
    if isinstance(node, dict):
        for k, v in node.items():
            walk(v, f"{path}.{k}", found)
    elif isinstance(node, list):
        for i, v in enumerate(node):
            walk(v, f"{path}[{i}]", found)


def check_evidenced(rep, path, ev, source_urls, top_section):
    for key in ("quote", "source_url", "retrieved_at"):
        if not ev.get(key):
            rep.error(path, f"missing required '{key}' (rule 1)")

    quote = ev.get("quote")
    if isinstance(quote, str) and len(quote) > MAX_QUOTE:
        rep.error(path, f"quote is {len(quote)} chars, limit {MAX_QUOTE} (rule 2)")

    url = ev.get("source_url")
    if url and url not in source_urls:
        rep.error(path, f"source_url not listed in top-level sources[] (rule 3): {url}")
    if url and re.match(r"^https?://[^/]+/?$", str(url)):
        rep.warn(path, "cites a domain root; deep pages are required for specific claims")
    if url and ("google." in str(url) or "/search?" in str(url) or "bing." in str(url)):
        rep.error(path, "cites a search results page, not a source page")

    status = ev.get("status")
    if status not in STATUSES:
        rep.error(path, f"status must be one of {sorted(STATUSES)}, got {status!r}")
    if status == "corroborated":
        extra = ev.get("corroborating_urls") or []
        domains = {domain(url)} | {domain(u) for u in extra}
        domains.discard("")
        if len(domains) < 2:
            rep.error(path, "status 'corroborated' needs >=2 distinct source domains "
                            "(rule 5); add corroborating_urls[]")

    if ev.get("confidence") not in CONFIDENCES:
        rep.error(path, f"confidence must be one of {sorted(CONFIDENCES)}")
    if ev.get("date_confidence") not in DATE_CONFIDENCES:
        rep.error(path, f"date_confidence must be one of {sorted(DATE_CONFIDENCES)}")

    val = ev.get("value")
    if isinstance(val, str) and val.strip().lower() in PLACEHOLDERS:
        rep.error(path, f"placeholder value {val!r}; use null plus a gaps[] entry (rule 6)")

    retrieved = parse_date(ev.get("retrieved_at"))
    if retrieved is None and ev.get("retrieved_at"):
        rep.error(path, f"retrieved_at not ISO-8601 date: {ev.get('retrieved_at')!r}")
    else:
        published = parse_date(ev.get("published_at"))
        limit = FRESHNESS_DAYS.get(top_section)
        ref = published or (retrieved if ev.get("date_confidence") == "known" else None)
        if limit and ref and (date.today() - ref).days > limit and not ev.get("stale"):
            rep.warn(path, f"source is {(date.today() - ref).days} days old, past the "
                           f"{limit}-day window for '{top_section}'; set stale: true")


def validate(path):
    rep = Report(path)
    try:
        with open(path) as fh:
            doc = json.load(fh)
    except json.JSONDecodeError as exc:
        rep.error("file", f"invalid JSON: {exc}")
        return rep
    except OSError as exc:
        rep.error("file", str(exc))
        return rep

    for key in REQUIRED_TOP:
        if key not in doc:
            rep.error("root", f"missing required key '{key}'")

    if doc.get("schema_version") != SCHEMA_VERSION:
        rep.error("root", f"schema_version must be {SCHEMA_VERSION!r}")
    if doc.get("tier") not in TIERS:
        rep.error("root", f"tier must be one of {sorted(TIERS)}, got {doc.get('tier')!r}")

    sources = doc.get("sources") or []
    if not isinstance(sources, list) or not sources:
        rep.error("sources", "must be a non-empty list, including dead ends")
        sources = []
    source_urls = set()
    for i, src in enumerate(sources):
        if not isinstance(src, dict):
            rep.error(f"sources[{i}]", "must be an object with url/retrieved_at/outcome/class")
            continue
        if not src.get("url"):
            rep.error(f"sources[{i}]", "missing url")
        else:
            source_urls.add(src["url"])
        if not src.get("outcome"):
            rep.warn(f"sources[{i}]", "missing outcome; dead ends must be recorded as evidence")
    if not any((s.get("outcome") if isinstance(s, dict) else None) != "used" for s in sources):
        rep.warn("sources", "every source was 'used'; dead ends are usually informative "
                            "and their absence suggests incomplete logging")

    pricing = doc.get("pricing") or {}
    figures = pricing.get("figures") or []
    if figures and not pricing.get("published"):
        rep.error("pricing", "figures present but published is false (rule 4). A figure that "
                             "is not published on a citable page must not be in a dossier")
    if not figures and pricing.get("published"):
        rep.warn("pricing", "published is true but no figures recorded")
    if not figures and not pricing.get("model"):
        rep.warn("pricing", "no figures and no model; record model 'not published' explicitly")

    gaps = doc.get("gaps")
    if not isinstance(gaps, list):
        rep.error("gaps", "must be a list")
    elif not gaps:
        rep.warn("gaps", "empty gaps list; a complete dossier from public sources alone is "
                         "rare and usually means a field was inferred rather than found")

    found = []
    for section in ("positioning", "target_audience", "services", "pricing",
                    "delivery_model", "differentiators"):
        walk(doc.get(section), section, found)
    if not found:
        rep.error("root", "no evidenced values found; every substantive value must be an "
                          "object with value/quote/source_url")
    for jpath, ev in found:
        check_evidenced(rep, jpath, ev, source_urls, jpath.split(".")[0].split("[")[0])

    return rep


def main(argv):
    paths = argv[1:]
    if not paths:
        print(__doc__)
        return 2
    reports = [validate(p) for p in paths]
    failed = 0
    for rep in reports:
        status = "FAIL" if rep.errors else ("WARN" if rep.warnings else "OK")
        print(f"[{status}] {rep.path}")
        for e in rep.errors:
            print(f"    ERROR   {e}")
        for w in rep.warnings:
            print(f"    warning {w}")
        if rep.errors:
            failed += 1
    print(f"\n{len(reports)} dossier(s) checked, {failed} with errors.")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
