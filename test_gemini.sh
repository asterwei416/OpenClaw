#!/bin/bash
KEY="AIzaSyBdahoeoLjmg_OHYTuzia5J8HEoKP7d510"
echo "=== Testing Gemini API (gemini-2.5-flash) ==="
curl -s -m 15 \
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=$KEY" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"contents":[{"parts":[{"text":"Reply with just the word: WORKING"}]}]}' \
  2>&1 | python3 -c "import sys,json; d=json.load(sys.stdin); print('API OK:', d['candidates'][0]['content']['parts'][0]['text'][:50])" \
  || echo "API FAILED or network error"

echo "=== OpenClaw auth profiles ==="
cat /home/openclaw/.openclaw/openclaw.json | python3 -c "import sys,json; d=json.load(sys.stdin); print(json.dumps(d.get('auth',{}), indent=2))"

echo "=== Checking stored tokens ==="
ls -la /home/openclaw/.openclaw/ 2>&1 | grep -v ".json.bak"
