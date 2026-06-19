#!/usr/bin/env bash
# test_tax_chat.sh — interactive CLI for the /tax-chat endpoint
# Usage:
#   bash test_tax_chat.sh                  # connects to localhost:5050
#   bash test_tax_chat.sh http://my-server # connects to a remote server

BASE="${1:-http://localhost:5050}"
ENDPOINT="$BASE/tax-chat"
MESSAGES="[]"

echo ""
echo "  CloudAct · Tax Calculator (CLI)"
echo "  Connected to: $ENDPOINT"
echo "  Type your message and press Enter. Ctrl+C to quit."
echo ""

while true; do
  printf "You: "
  IFS= read -r USER_INPUT
  [ -z "$USER_INPUT" ] && continue

  # Append user message to the conversation history
  MESSAGES=$(echo "$MESSAGES" | python3 -c "
import json, sys
msgs = json.load(sys.stdin)
import sys
user_input = sys.argv[1]
msgs.append({'role': 'user', 'content': user_input})
print(json.dumps(msgs))
" "$USER_INPUT")

  # Send to /tax-chat and parse reply + updated messages
  RESPONSE=$(curl -s -X POST "$ENDPOINT" \
    -H "Content-Type: application/json" \
    -d "{\"messages\": $MESSAGES}")

  ERROR=$(echo "$RESPONSE" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('error',''))" 2>/dev/null)

  if [ -n "$ERROR" ]; then
    echo "  [Error] $ERROR"
    continue
  fi

  # Update messages with the full conversation history returned by the server
  MESSAGES=$(echo "$RESPONSE" | python3 -c "import json,sys; d=json.load(sys.stdin); print(json.dumps(d['messages']))")

  REPLY=$(echo "$RESPONSE" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['reply'])")

  echo ""
  echo "Assistant: $REPLY"
  echo ""
done
