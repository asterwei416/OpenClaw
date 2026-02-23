#!/bin/bash
set -euo pipefail

TOKEN=$(python3 - <<'PY'
import json
with open('/mnt/c/Users/trist/Desktop/Google_Antigravity/Side Project/OpenClaw/final_openclaw.json','r',encoding='utf-8') as f:
    cfg=json.load(f)
print(cfg['channels']['telegram']['botToken'])
PY
)

probe() {
  local name="$1"
  local url="$2"
  echo "== $name =="
  for i in 1 2 3 4 5; do
    code=$(curl -4 -sS -m 8 -o /dev/null -w "%{http_code}" "$url" || echo "ERR")
    echo "attempt $i: $code"
    sleep 1
  done
}

probe "Telegram getMe" "https://api.telegram.org/bot${TOKEN}/getMe"
probe "Gemini model endpoint" "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash?key=AIzaSyBdahoeoLjmg_OHYTuzia5J8HEoKP7d510"
