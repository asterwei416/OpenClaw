## Skills 使用說明

### google-map-screenshot

使用 Playwright MCP 截取 Google Maps 路線截圖。

#### 前置需求

1. **安裝 Playwright MCP Server**
   ```bash
   # 安裝 Playwright（WSL2）
   wsl -d Ubuntu -- bash -c "source ~/.nvm/nvm.sh && npm install -g @playwright/test playwright"

   # 安裝瀏覽器（使用者目錄，不需要 sudo）
   wsl -d Ubuntu -- bash -c "source ~/.nvm/nvm.sh && PLAYWRIGHT_BROWSERS_PATH=/home/lavi/.cache/ms-playwright npx playwright install chromium"

   # 安裝系統依賴（需要 root 權限）
   wsl -d Ubuntu -u root -- bash -c "DEBIAN_FRONTEND=noninteractive apt-get install -y libasound2t64 libatk-bridge2.0-0t64 libatk1.0-0t64 libatspi2.0-0t64 libcairo2 libcups2t64 libdbus-1-3 libdrm2 libgbm1 libglib2.0-0t64 libgtk-3-0t64 libnspr4 libnss3 libpango-1.0-0 libx11-6 libxcb1 libxcomposite1 libxdamage1 libxext6 libxfixes3 libxkbcommon0 libxrandr2"
   ```

2. **安裝 mcporter（如尚未安裝）**
   ```bash
   wsl -d Ubuntu -- bash -c "source ~/.nvm/nvm.sh && npm install -g mcporter"
   ```

3. **配置 Playwright MCP Server**
   ```bash
   # 新增 Playwright MCP server 到 mcporter
   wsl -d Ubuntu -- bash -c "source ~/.nvm/nvm.sh && mcporter config add playwright --command 'npx' --arg '@playwright/mcp' --scope home"

   # 驗證安裝
   wsl -d Ubuntu -- bash -c "source ~/.nvm/nvm.sh && mcporter list"
   # 應該顯示: playwright (22 tools)
   ```

4. **啟用 Skill**
   ```bash
   wsl -d Ubuntu -- bash -c "source ~/.nvm/nvm.sh && openclaw config set skills.entries.google-map-screenshot.enabled true --json"
   ```

#### 使用方式

**重要提示**: MCP server 名稱是 `playwright`，不是 `playwright-googlemaps`

**基本範例：截取 Google Maps 路線圖**
```bash
# 1. 開啟 Google Maps 路線（從台北車站到台北 101）
mcporter call playwright.browser_navigate url="https://www.google.com/maps/dir/台北車站/台北101"

# 2. 等待頁面載入完成（建議 5-8 秒）
mcporter call playwright.browser_wait_for time=8

# 3. 截圖（儲存為 route.png）
mcporter call playwright.browser_take_screenshot filename=route.png

# 4. 關閉瀏覽器
mcporter call playwright.browser_close
```

**截圖檔案位置**: `/tmp/playwright-output/`（WSL2 環境）

**進階範例：自訂起點和終點**
```bash
# 截取從東京到大阪的路線
mcporter call playwright.browser_navigate url="https://www.google.com/maps/dir/東京駅/大阪駅"
mcporter call playwright.browser_wait_for time=8
mcporter call playwright.browser_take_screenshot filename=tokyo-osaka.png
mcporter call playwright.browser_close
```

#### 注意事項

- 截圖前務必等待 5-8 秒，讓 Google Maps 完全載入路線
- 截圖檔案會儲存在 `/tmp/playwright-output/` 目錄
- 使用後請關閉瀏覽器（`browser_close`）以釋放資源
- 如果遇到 "Unknown MCP server" 錯誤，請確認 MCP server 名稱是 `playwright`，不是 `playwright-googlemaps`

---