#!/usr/bin/env bash
# ============================================================
# OpenClaw Node - WSL2 安裝與配對腳本
# Gateway: wss://asterwei-openclaw.zeabur.app
# ============================================================
set -e

GATEWAY_HOST="asterwei-openclaw.zeabur.app"
GATEWAY_PORT="443"
OPENCLAW_DIR="$HOME/openclaw"
WIN_PROJECT="/mnt/c/Users/trist/Desktop/Google_Antigravity/Side Project/OpenClaw"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo ""
echo "=========================================="
echo "  OpenClaw Node 安裝腳本"
echo "  Gateway: $GATEWAY_HOST"
echo "=========================================="
echo ""

# ─── Step 1：確認 Node.js ───────────────────────────────────
echo -e "${YELLOW}[1/5] 檢查 Node.js...${NC}"

if ! command -v node &>/dev/null; then
  echo "Node.js 未安裝，正在用 nvm 安裝..."
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
  export NVM_DIR="$HOME/.nvm"
  # shellcheck disable=SC1091
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
  nvm install 22
  nvm use 22
  nvm alias default 22
else
  NODE_VERSION=$(node --version)
  echo -e "${GREEN}Node.js 已安裝: $NODE_VERSION${NC}"
fi

# 確保 nvm 在 shell 啟動時載入
if ! grep -q 'NVM_DIR' "$HOME/.bashrc" 2>/dev/null; then
  echo '' >> "$HOME/.bashrc"
  echo 'export NVM_DIR="$HOME/.nvm"' >> "$HOME/.bashrc"
  echo '[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"' >> "$HOME/.bashrc"
fi

# ─── Step 2：安裝或更新 OpenClaw CLI ──────────────────────
echo ""
echo -e "${YELLOW}[2/5] 安裝 OpenClaw CLI...${NC}"

if command -v openclaw &>/dev/null; then
  CURRENT_VER=$(openclaw --version 2>/dev/null || echo "unknown")
  echo -e "${GREEN}OpenClaw 已安裝: $CURRENT_VER${NC}"
  echo "略過重新安裝（若需更新請手動執行：curl -fsSL https://get.openclaw.ai | sh）"
else
  echo "從官方安裝..."
  curl -fsSL https://get.openclaw.ai | sh
  # 重新載入 PATH
  export PATH="$HOME/.local/bin:$HOME/bin:$PATH"
fi

# 備用：如果全域安裝失敗，使用 Windows 專案目錄中的版本
if ! command -v openclaw &>/dev/null; then
  echo -e "${YELLOW}嘗試使用 Windows 專案目錄中的 openclaw...${NC}"
  if [ -f "$WIN_PROJECT/openclaw.mjs" ]; then
    mkdir -p "$HOME/.local/bin"
    ln -sf "$WIN_PROJECT/openclaw.mjs" "$HOME/.local/bin/openclaw"
    chmod +x "$HOME/.local/bin/openclaw"
    export PATH="$HOME/.local/bin:$PATH"
    echo -e "${GREEN}已建立 openclaw symlink 到 Windows 專案${NC}"
  else
    echo -e "${RED}找不到 openclaw，請手動執行: curl -fsSL https://get.openclaw.ai | sh${NC}"
    exit 1
  fi
fi

# ─── Step 3：登入 / 確認認證 ──────────────────────────────
echo ""
echo -e "${YELLOW}[3/5] 確認認證狀態...${NC}"

# 嘗試複製現有 credentials
if [ -f "$WIN_PROJECT/credentials.json" ]; then
  mkdir -p "$HOME/.config/openclaw"
  if [ ! -f "$HOME/.config/openclaw/credentials.json" ]; then
    cp "$WIN_PROJECT/credentials.json" "$HOME/.config/openclaw/"
    echo -e "${GREEN}已複製 credentials.json${NC}"
  else
    echo "credentials 已存在"
  fi
fi

# ─── Step 4：測試 Gateway 連線 ────────────────────────────
echo ""
echo -e "${YELLOW}[4/5] 測試 Gateway 連線...${NC}"
if curl -s --max-time 5 "https://$GATEWAY_HOST/health" &>/dev/null; then
  echo -e "${GREEN}Gateway 可達到！${NC}"
elif curl -s --max-time 5 "https://$GATEWAY_HOST" &>/dev/null; then
  echo -e "${GREEN}Gateway 線上${NC}"
else
  echo -e "${YELLOW}無法 ping Gateway（這可能是正常的，WebSocket 依然可能可用）${NC}"
fi

# ─── Step 5：執行 Node 配對 ────────────────────────────────
echo ""
echo -e "${YELLOW}[5/5] 啟動 Node 配對...${NC}"
echo ""
echo "執行指令："
echo "  openclaw node run --host $GATEWAY_HOST --port $GATEWAY_PORT --tls"
echo ""
echo -e "${YELLOW}配對申請送出後，請在 Gateway 端執行：${NC}"
echo "  openclaw nodes pending"
echo "  openclaw nodes approve <requestId>"
echo ""
echo "=========================================="

# 實際執行連線
openclaw node run \
  --host "$GATEWAY_HOST" \
  --port "$GATEWAY_PORT" \
  --tls
