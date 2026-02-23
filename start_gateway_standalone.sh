#!/bin/bash
set -euo pipefail
source /home/openclaw/.nvm/nvm.sh
pkill -f 'openclaw/dist/index.js gateway --port 18789' >/dev/null 2>&1 || true
nohup openclaw gateway --port 18789 > /home/openclaw/.openclaw/logs/gateway-standalone.log 2>&1 < /dev/null &
PID=$!
echo "$PID" > /home/openclaw/.openclaw/gateway.pid
sleep 3
if ps -p "$PID" >/dev/null 2>&1; then
  echo "RUNNING:$PID"
else
  echo "FAILED:$PID"
fi

tail -n 40 /home/openclaw/.openclaw/logs/gateway-standalone.log 2>/dev/null || true
