#!/usr/bin/env bash
# test_chat.sh — smoke-test the /chat endpoint for 4 scenarios
# Usage: bash test_chat.sh [BASE_URL]
# Default BASE_URL is http://localhost:5050

BASE="${1:-http://localhost:5050}"

run() {
  local label="$1"
  local payload="$2"
  echo ""
  echo "══════════════════════════════════════════════"
  echo "  $label"
  echo "══════════════════════════════════════════════"
  curl -s -X POST "$BASE/chat" \
    -H "Content-Type: application/json" \
    -d "$payload" | python3 -c "
import json,sys
d=json.load(sys.stdin)
if 'error' in d:
    print('ERROR:', d['error'])
else:
    print(d['reply'])
"
}

# ── Scenario 1: Sole custody ──────────────────────────────────────────────────
run "Scenario 1 — Sole custody (Alex \$85k, Jordan \$55k, Sam lives w/ Jordan)" \
'{"messages":[{"role":"user","content":"Hi, I need to figure out child support. Alex earns $85,000 a year and Jordan earns $55,000. They have one child, Sam, born June 1 2015, who lives with Jordan full time. No court-ordered overrides."}]}'

# ── Scenario 2: Shared custody ────────────────────────────────────────────────
run "Scenario 2 — Shared custody (Party 1 \$90k, Party 2 \$60k, Riley 50/50)" \
'{"messages":[{"role":"user","content":"Can you calculate child support? Party 1 makes $90,000 and Party 2 makes $60,000. They have one child Riley born March 15 2016. The child spends equal time with both parents — 50/50 split. No override amounts."}]}'

# ── Scenario 3: Split custody ─────────────────────────────────────────────────
run "Scenario 3 — Split custody (Party 1 \$75k, Party 2 \$80k, 2 kids one each)" \
'{"messages":[{"role":"user","content":"Child support calculation please. Party 1 income is $75,000 and Party 2 income is $80,000. Two kids: Avery born August 20 2013 lives with Party 1, and Casey born November 30 2017 lives with Party 2. No overrides."}]}'

# ── Scenario 4: Adult + minor mix ─────────────────────────────────────────────
run "Scenario 4 — Adult + minor (Party 1 \$95k, Party 2 \$45k, Taylor adult + Robin minor)" \
'{"messages":[{"role":"user","content":"I need child support calculated. Party 1 earns $95,000, Party 2 earns $45,000. There are two children: Taylor born February 10 2005 and Robin born September 5 2014. Both live with Party 2. No court-ordered amounts."}]}'

echo ""
echo "Done."
