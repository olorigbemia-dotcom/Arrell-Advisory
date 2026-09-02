#!/usr/bin/env bash
# Proves the governance controls actually fire. Run from the repository root.
#   bash .claude/skills/market-intel/scripts/selftest.sh
set -uo pipefail
S=".claude/skills/market-intel/scripts"
F=".claude/skills/market-intel/fixtures"
fails=0

check() { # name expected_exit actual_exit
  if [ "$2" -eq "$3" ]; then printf '  PASS  %s\n' "$1"
  else printf '  FAIL  %s (expected exit %s, got %s)\n' "$1" "$2" "$3"; fails=$((fails+1)); fi
}

echo "validate_dossier"
python3 "$S/validate_dossier.py" "$F"/pass-run/dossiers/*.json >/dev/null 2>&1
check "clean dossiers pass" 0 $?
python3 "$S/validate_dossier.py" "$F"/fail-run/dossiers/bad-advisory.json >/dev/null 2>&1
check "corrupted dossier is rejected" 1 $?

echo "build_comparison"
out=$(python3 "$S/build_comparison.py" "$F/pass-run" 2>/dev/null)
check "comparison generates" 0 $?
grep -q "not published" <<<"$out"; check "absent pricing renders as a finding" 0 $?
grep -q "1 of 2" <<<"$out";       check "aggregates state N of M" 0 $?
grep -q "\[\^1\]" <<<"$out";      check "cells carry footnotes" 0 $?

echo "evidence_audit"
python3 "$S/evidence_audit.py" "$F/pass-run" >/dev/null 2>&1
check "well-cited run passes the gate" 0 $?
python3 "$S/evidence_audit.py" "$F/fail-run" >/dev/null 2>&1
check "under-cited run is blocked" 1 $?

echo
if [ "$fails" -eq 0 ]; then echo "All controls firing."; else echo "$fails control(s) not firing."; fi
exit $((fails > 0))
