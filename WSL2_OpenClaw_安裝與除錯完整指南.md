# WSL2 + OpenClaw 安裝與除錯完整指南

本文件提供 WSL2 環境中安裝 OpenClaw 的詳細步驟與常見問題排查。

**適用對象**：Windows 11 使用者，想在 WSL2 中運行 OpenClaw

**預估時間**：15-30 分鐘（含網路修復）

---

## 目錄

1. [環境準備](#1-環境準備)
2. [WSL2 安裝](#2-wsl2-安裝)
3. [Node.js 與 OpenClaw 安裝](#3-nodejs-與-openclaw-安裝)
4. [網路問題修復（關鍵！）](#4-網路問題修復關鍵)
5. [Python 環境配置](#5-python-環境配置)
6. [Playwright 瀏覽器自動化](#6-playwright-瀏覽器自動化)
7. [中文字型安裝](#7-中文字型安裝)
8. [OpenClaw 配置](#8-openclaw-配置)
9. [環境驗證](#9-環境驗證)
10. [常見錯誤排查](#10-常見錯誤排查)

---

## 1. 環境準備

### 1.1 系統需求

- Windows 11（或 Windows 10 版本 2004+）
- 管理員權限
- 至少 20GB 可用硬碟空間
- 穩定的網路連線

### 1.2 確認 Windows 版本

```powershell
# 在 PowerShell 中執行
winver
```

應該顯示 Windows 11 或 Windows 10 版本 2004 以上。

---

## 2. WSL2 安裝

### 2.1 啟用 WSL2

以**管理員權限**打開 PowerShell：

```powershell
# 安裝 WSL2 和 Ubuntu
wsl --install
```

這個指令會自動：
- 啟用 Windows Subsystem for Linux
- 啟用虛擬機器平台
- 下載並安裝 Ubuntu（預設發行版）
- 設定 WSL2 為預設版本

### 2.2 重啟電腦

安裝完成後**必須重啟**電腦。

### 2.3 初次設定 Ubuntu

重啟後，系統會自動啟動 Ubuntu 設定：

```
Enter new UNIX username: [輸入使用者名稱，例如：lavi]
New password: [輸入密碼]
Retype new password: [再次輸入密碼]
```

**重要**：記住這組使用者名稱和密碼，後續會用到。

### 2.4 驗證安裝

```bash
# 檢查 WSL 版本
wsl --list --verbose

# 應該顯示：
# NAME      STATE           VERSION
# Ubuntu    Running         2
```

---

## 3. Node.js 與 OpenClaw 安裝

### 3.1 為什麼要用 nvm？

WSL2 內建的 Node.js 版本通常過舊（v12-v14），OpenClaw 需要 **Node.js 25** 以上。

使用 nvm（Node Version Manager）可以輕鬆管理多個 Node.js 版本。

### 3.2 安裝 nvm

在 WSL2 終端機中執行：

```bash
# 下載並安裝 nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# 重新載入 shell 設定
source ~/.bashrc

# 驗證安裝
nvm --version
# 應該顯示：0.39.7
```

### 3.3 安裝 Node.js 25

```bash
# 安裝 Node.js 25
nvm install 25

# 設為預設版本
nvm use 25
nvm alias default 25

# 驗證安裝
node --version  # 應該顯示 v25.x.x
npm --version   # 應該顯示 10.x.x
```

### 3.4 安裝 OpenClaw

```bash
# 全域安裝 OpenClaw
npm install -g openclaw@latest

# 驗證安裝
openclaw --version

# 初始化設定（會自動建立 ~/.openclaw 目錄）
openclaw config list
```

---

## 4. 網路問題修復（關鍵！）

**這是最關鍵但最容易被忽略的步驟！**

WSL2 的網路架構依賴 Windows 的 HNS（Host Network Service），但有兩個常見問題會導致無法連外網。

### 4.1 問題 A：APIPA 位址問題

#### 症狀

```bash
ping 8.8.8.8  # ✅ 成功
curl https://www.google.com  # ❌ 超時
```

#### 原因

WSL 網路介面卡取得了錯誤的 **APIPA 位址（169.254.x.x）**，而不是正確的 `172.x.x.x`。

#### 檢查方式

在 Windows PowerShell 中執行：

```powershell
ipconfig | Select-String "WSL"
```

如果看到 `169.254.x.x`，表示 APIPA 問題。

### 4.2 問題 B：IPv6 干擾問題（更常見）

#### 症狀

```bash
curl https://www.google.com
# * Immediate connect fail for 2404:6800:4012:9::2004: Cannot assign requested address
# * connect to 142.250.196.196 port 443 from 172.29.37.90 port 43856 failed: Connection timed out
```

即使 IP 位址正常（`172.x.x.x`），HTTPS 連線仍然 timeout。

#### 根本原因

1. `curl` 和其他工具優先嘗試 IPv6 連線
2. WSL2 的 IPv6 支援不完整，連線失敗
3. TCP stack 卡住，**不會自動 fallback 到 IPv4**
4. 結果：所有 HTTPS 連線都 timeout（等待 2+ 分鐘）

### 4.3 統一解決方案：停用 IPv6 + 重建網路

#### 方法 1：使用修復腳本（推薦）

**Step 1：建立修復腳本**

在 Windows 中建立檔案 `C:\Users\你的使用者名稱\fix-wsl-network-startup.ps1`：

```powershell
# WSL2 網路修復腳本

Write-Host "=== WSL2 Network Fix ===" -ForegroundColor Cyan
Write-Host "Time: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
Write-Host ""

$wslAdapter = "vEthernet (WSL (Hyper-V firewall))"

# 1. 停用 IPv6
Write-Host "[1/6] Disabling IPv6..." -ForegroundColor Yellow
try {
    Disable-NetAdapterBinding -Name $wslAdapter -ComponentID ms_tcpip6 -ErrorAction SilentlyContinue
    Write-Host "  OK - Windows adapter IPv6 disabled" -ForegroundColor Green
} catch {
    Write-Host "  Warning: $_" -ForegroundColor Yellow
}

wsl -d Ubuntu -- bash -c "sudo sysctl -w net.ipv6.conf.all.disable_ipv6=1 2>/dev/null; sudo sysctl -w net.ipv6.conf.default.disable_ipv6=1 2>/dev/null" 2>$null
Write-Host "  OK - WSL2 IPv6 disabled" -ForegroundColor Green

# 2. 重啟 WSL 網路介面
Write-Host "`n[2/6] Restarting WSL network adapter..." -ForegroundColor Yellow
Disable-NetAdapter -Name $wslAdapter -Confirm:$false
Start-Sleep -Seconds 2
Enable-NetAdapter -Name $wslAdapter
Start-Sleep -Seconds 3

# 3. 重啟 HNS
Write-Host "`n[3/6] Restarting Host Network Service..." -ForegroundColor Yellow
Restart-Service hns -Force
Start-Sleep -Seconds 3

# 4. 關閉 WSL
Write-Host "`n[4/6] Shutting down WSL..." -ForegroundColor Yellow
wsl --shutdown
Start-Sleep -Seconds 2

# 5. 清除 HNS 網路
Write-Host "`n[5/6] Cleaning HNS networks..." -ForegroundColor Yellow
Get-HnsNetwork | Where-Object { $_.Name -like "*WSL*" } | Remove-HnsNetwork

# 6. 重新啟動 WSL 並測試
Write-Host "`n[6/6] Starting WSL and testing..." -ForegroundColor Yellow
wsl -d Ubuntu -- echo "WSL restarted"

$testResult = wsl -d Ubuntu -- timeout 5 curl -s -o /dev/null -w "%{http_code}" https://www.google.com 2>$null
if ($testResult -eq "200") {
    Write-Host "  OK - HTTPS connectivity working (HTTP $testResult)" -ForegroundColor Green
} else {
    Write-Host "  Warning - HTTPS test failed (got: $testResult)" -ForegroundColor Yellow
}

Write-Host "`n===========================================" -ForegroundColor Green
Write-Host "Network Fix Complete!" -ForegroundColor Green
Write-Host "===========================================" -ForegroundColor Green
```

**Step 2：執行修復**

以**管理員權限**打開 PowerShell，執行：

```powershell
powershell -ExecutionPolicy Bypass -File C:\Users\你的使用者名稱\fix-wsl-network-startup.ps1
```

#### 方法 2：手動執行步驟

如果不想用腳本，可以手動執行以下步驟：

**在 Windows PowerShell（管理員）：**

```powershell
# 停用 IPv6
Disable-NetAdapterBinding -Name "vEthernet (WSL (Hyper-V firewall))" -ComponentID ms_tcpip6 -Confirm:$false

# 重啟 WSL 網路介面
$adapter = "vEthernet (WSL (Hyper-V firewall))"
Disable-NetAdapter -Name $adapter -Confirm:$false
Start-Sleep -Seconds 2
Enable-NetAdapter -Name $adapter

# 重啟 HNS
Restart-Service hns -Force

# 關閉 WSL
wsl --shutdown

# 清除 HNS 網路
Get-HnsNetwork | Where-Object { $_.Name -like "*WSL*" } | Remove-HnsNetwork
```

**在 WSL2 終端機：**

```bash
# 停用 IPv6
sudo sysctl -w net.ipv6.conf.all.disable_ipv6=1
sudo sysctl -w net.ipv6.conf.default.disable_ipv6=1

# 測試連線
curl -s -o /dev/null -w "%{http_code}" https://www.google.com
# 應該輸出：200
```

### 4.4 開機自動修復（選擇性）

如果希望每次開機都自動修復網路，可以建立 VBS 啟動腳本。

**建立檔案**：`C:\Users\你的使用者名稱\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup\fix-wsl-network.vbs`

```vbscript
' WSL2 網路修復 - 開機自動執行（隱藏視窗）

Set objShell = CreateObject("WScript.Shell")

' 以管理員權限執行 PowerShell 腳本（隱藏視窗）
objShell.Run "powershell -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File ""C:\Users\你的使用者名稱\fix-wsl-network-startup.ps1""", 0, False

Set objShell = Nothing
```

---

## 5. Python 環境配置

### 5.1 為什麼需要 Python？

OpenClaw 的許多 Skills 依賴 Python，例如：
- `python-docx`：Word 文件處理
- `requests`：HTTP 請求
- `beautifulsoup4`：網頁解析

### 5.2 安裝 Python 3

```bash
# 更新套件列表
sudo apt update

# 安裝 Python 3 與 pip
sudo apt install python3-pip python-is-python3 -y

# 驗證安裝
python --version  # 應該顯示 Python 3.x.x
pip3 --version
```

### 5.3 處理 externally-managed-environment 問題

Ubuntu 24.04 預設啟用了 PEP 668，直接用 `pip install` 會報錯：

```
error: externally-managed-environment
× This environment is externally managed
```

#### 解決方案 1：優先使用 apt 安裝（推薦）

```bash
# 安裝常用 Python 套件（透過 apt，避免 pip 衝突）
sudo apt install -y \
  python3-requests \
  python3-bs4 \
  python3-html2text \
  python3-venv
```

#### 解決方案 2：配置 pip 允許全域安裝

```bash
# 建立 pip 設定檔
mkdir -p ~/.config/pip
cat > ~/.config/pip/pip.conf << 'EOF'
[global]
break-system-packages = true
EOF
```

**注意**：此設定允許 pip 覆蓋系統套件，可能導致依賴衝突。建議優先使用方案 1。

### 5.4 安裝 python-docx（用於 Word 文件處理）

```bash
# 使用 pip 安裝（需先執行解決方案 2）
pip3 install python-docx

# 驗證安裝
python -c "import docx; print(docx.__version__)"
```

---

## 6. Playwright 瀏覽器自動化

### 6.1 為什麼需要 Playwright？

如果你要使用自動化瀏覽器 Skills（例如：Google Maps 截圖），需要安裝 Playwright。

### 6.2 安裝 Playwright

```bash
# 安裝 Playwright（Node.js 版本）
npm install -g @playwright/test playwright

# 安裝 Chromium 瀏覽器（不需要 sudo）
PLAYWRIGHT_BROWSERS_PATH=~/.cache/ms-playwright npx playwright install chromium
```

### 6.3 安裝系統依賴（Ubuntu 24.04）

Chromium 需要許多系統函式庫：

```bash
# 以 root 權限安裝依賴
sudo apt install -y \
  libasound2t64 \
  libatk-bridge2.0-0t64 \
  libatk1.0-0t64 \
  libatspi2.0-0t64 \
  libcairo2 \
  libcups2t64 \
  libdbus-1-3 \
  libdrm2 \
  libgbm1 \
  libglib2.0-0t64 \
  libgtk-3-0t64 \
  libnspr4 \
  libnss3 \
  libpango-1.0-0 \
  libx11-6 \
  libxcb1 \
  libxcomposite1 \
  libxdamage1 \
  libxext6 \
  libxfixes3 \
  libxkbcommon0 \
  libxrandr2
```

**注意**：如果你使用 Ubuntu 22.04，套件名稱不同（沒有 `t64` 後綴）：

```bash
# Ubuntu 22.04 的依賴套件
sudo apt install -y \
  libasound2 \
  libatk-bridge2.0-0 \
  libatk1.0-0 \
  libatspi2.0-0 \
  libcairo2 \
  libcups2 \
  libdbus-1-3 \
  libdrm2 \
  libgbm1 \
  libglib2.0-0 \
  libgtk-3-0 \
  libnspr4 \
  libnss3 \
  libpango-1.0-0 \
  libx11-6 \
  libxcb1 \
  libxcomposite1 \
  libxdamage1 \
  libxext6 \
  libxfixes3 \
  libxkbcommon0 \
  libxrandr2
```

### 6.4 驗證 Playwright 安裝

```bash
# 測試啟動 Chromium（應該不報錯）
npx playwright open --browser chromium https://www.google.com

# 按 Ctrl+C 關閉
```

---

## 7. 中文字型安裝

### 7.1 為什麼需要中文字型？

如果你要用 Playwright 截圖包含中文的網頁（例如 Google Maps），**必須**安裝中文字型，否則會顯示為方框 `▯▯▯`。

### 7.2 安裝 Noto CJK 字型

```bash
# 安裝 Noto CJK 字型（支援中日韓文字）
sudo apt update
sudo apt install fonts-noto-cjk -y
```

### 7.3 驗證字型安裝

```bash
# 列出已安裝的 Noto CJK 字型
fc-list | grep -i noto | grep -i cjk

# 應該看到多個字型，例如：
# /usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc: Noto Sans CJK TC:style=Regular
# /usr/share/fonts/opentype/noto/NotoSerifCJK-Regular.ttc: Noto Serif CJK TC:style=Regular
```

---

## 8. OpenClaw 配置

### 8.1 配置本地模型（使用 llama.cpp）

如果你使用地端模型（llama.cpp），需要讓 WSL2 能訪問 Windows 上的 llama.cpp 服務。

#### Step 1：開放 Windows 防火牆

在 Windows PowerShell（**管理員權限**）中執行：

```powershell
netsh advfirewall firewall add rule name="llama.cpp for WSL2" dir=in action=allow protocol=TCP localport=8080
```

#### Step 2：啟動 llama.cpp 時綁定 0.0.0.0

在 Windows 上啟動 llama.cpp 時，**必須**加上 `--host 0.0.0.0`：

```powershell
# 範例（依你的實際路徑調整）
D:\llama.cpp\llama-server.exe `
  --host 0.0.0.0 `
  --port 8080 `
  -m "D:\models\glm-4.7-flash-Q4_K_M.gguf" `
  -c 8192 `
  -ngl 99
```

**重要**：如果沒有 `--host 0.0.0.0`，llama.cpp 只會監聽 `127.0.0.1`，WSL2 無法連線。

#### Step 3：在 WSL2 中配置 OpenClaw

```bash
# 自動偵測 Windows IP（WSL2 每次啟動 IP 可能改變）
WINDOWS_IP=$(ip route show | grep default | awk '{print $3}')
echo "Windows IP: $WINDOWS_IP"

# 配置 llama.cpp 提供者
openclaw config set models.providers.llamacpp.baseUrl "http://$WINDOWS_IP:8080/v1"

# 設定預設模型
openclaw config set agents.defaults.model.primary "llamacpp/glm-4.7-flash"
```

#### Step 4：驗證連線

```bash
# 測試 llama.cpp API
WINDOWS_IP=$(ip route show | grep default | awk '{print $3}')
curl -s "http://$WINDOWS_IP:8080/v1/models" | jq .

# 應該回傳 JSON 格式的模型列表，例如：
# {
#   "object": "list",
#   "data": [
#     {
#       "id": "glm-4.7-flash",
#       "object": "model",
#       ...
#     }
#   ]
# }
```

### 8.2 配置 Telegram/LINE（選擇性）

如果你要透過 Telegram 或 LINE 使用 OpenClaw：

```bash
# 啟動 Gateway（會生成配對 QR Code）
openclaw gateway

# 在 Telegram/LINE 掃描 QR Code 配對
# 配對成功後按 Ctrl+C 停止
```

### 8.3 配置 Workspace（選擇性）

建議將 workspace 設定在 WSL2 本地路徑，避免跨檔案系統的效能問題：

```bash
# 建立 workspace 目錄
mkdir -p ~/openclaw_workspace

# 配置 OpenClaw
openclaw config set agents.defaults.workspace "$HOME/openclaw_workspace"
```

---

## 9. 環境驗證

執行以下指令確認所有元件都正常：

```bash
# 1. 檢查 Node.js
node --version    # 應該顯示 v25.x.x
npm --version     # 應該顯示 10.x.x

# 2. 檢查 OpenClaw
openclaw --version

# 3. 檢查 Python
python --version  # 應該顯示 Python 3.x.x
pip3 list | grep -E "requests|docx"

# 4. 檢查 Playwright
npx playwright --version

# 5. 檢查網路（最關鍵！）
curl -s -o /dev/null -w "%{http_code}" https://www.google.com
# 應該輸出：200（在 10 秒內）

# 6. 檢查中文字型
fc-list | grep -i noto | grep -i cjk | wc -l
# 應該輸出大於 0 的數字

# 7. 檢查 llama.cpp 連線（如果有使用）
WINDOWS_IP=$(ip route show | grep default | awk '{print $3}')
curl -s "http://$WINDOWS_IP:8080/v1/models" | jq -r '.data[0].id'
# 應該顯示模型名稱，例如：glm-4.7-flash

# 8. 檢查 OpenClaw 設定
openclaw config get agents.defaults.model.primary
# 應該顯示你設定的模型，例如：llamacpp/glm-4.7-flash
```

**如果所有檢查都通過，恭喜！你的 WSL2 + OpenClaw 環境已經完美配置！**

---

## 10. 常見錯誤排查

### 錯誤 1：`npm: command not found`

**原因**：nvm 未正確載入到 shell 環境。

**解決方案**：

```bash
# 重新載入 shell 設定
source ~/.bashrc

# 確認 nvm 已載入
nvm --version

# 切換到 Node.js 25
nvm use 25
```

### 錯誤 2：`curl https://... 超時`

**原因**：IPv6 干擾或 APIPA 問題。

**解決方案**：

執行網路修復腳本（參見 [4.3 節](#43-統一解決方案停用-ipv6--重建網路)）。

### 錯誤 3：`sudo: a terminal is required to read the password`

**原因**：在背景執行需要 sudo 的指令，無法輸入密碼。

**解決方案**：

```bash
# 方案 1：預先以 root 安裝依賴
sudo apt install -y <套件名稱>

# 方案 2：手動在終端機執行指令（不在背景執行）
```

### 錯誤 4：Google Maps 截圖顯示方框 `▯▯▯`

**原因**：未安裝中文字型。

**解決方案**：

```bash
sudo apt install fonts-noto-cjk -y
```

### 錯誤 5：`error: externally-managed-environment`

**原因**：Ubuntu 24.04 預設禁止 pip 全域安裝。

**解決方案**：

參見 [5.3 節](#53-處理-externally-managed-environment-問題)。

### 錯誤 6：Playwright 報錯 `Failed to launch browser`

**原因**：缺少系統依賴。

**解決方案**：

```bash
# Ubuntu 24.04
sudo apt install -y libasound2t64 libatk-bridge2.0-0t64 ... (完整列表見 6.3 節)

# Ubuntu 22.04
sudo apt install -y libasound2 libatk-bridge2.0-0 ... (完整列表見 6.3 節)
```

### 錯誤 7：無法連線到 llama.cpp（`Connection refused`）

**可能原因與解決方案**：

#### 原因 1：llama.cpp 未綁定 0.0.0.0

```powershell
# 確認啟動指令包含 --host 0.0.0.0
llama-server.exe --host 0.0.0.0 --port 8080 ...
```

#### 原因 2：防火牆未開放

```powershell
# 在 Windows PowerShell（管理員）執行
netsh advfirewall firewall add rule name="llama.cpp for WSL2" dir=in action=allow protocol=TCP localport=8080
```

#### 原因 3：Windows IP 改變

```bash
# WSL2 每次啟動，Windows 的 IP 可能改變
# 重新偵測並更新設定
WINDOWS_IP=$(ip route show | grep default | awk '{print $3}')
openclaw config set models.providers.llamacpp.baseUrl "http://$WINDOWS_IP:8080/v1"
```

### 錯誤 8：OpenClaw Gateway 啟動失敗

**檢查步驟**：

```bash
# 1. 查看錯誤訊息
openclaw gateway

# 2. 檢查設定檔
openclaw config list

# 3. 清除無效設定
openclaw doctor --fix

# 4. 重新初始化
rm -rf ~/.openclaw
openclaw config list
```

---

## 附錄 A：完整一鍵安裝腳本

以下腳本整合了所有安裝步驟（除了 WSL2 安裝和網路修復）：

```bash
#!/bin/bash
# OpenClaw WSL2 一鍵安裝腳本

set -e  # 遇到錯誤立即停止

echo "=== OpenClaw WSL2 安裝腳本 ==="
echo ""

# 1. 安裝 nvm
echo "[1/7] 安裝 nvm..."
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc

# 2. 安裝 Node.js 25
echo "[2/7] 安裝 Node.js 25..."
nvm install 25
nvm use 25
nvm alias default 25

# 3. 安裝 OpenClaw
echo "[3/7] 安裝 OpenClaw..."
npm install -g openclaw@latest

# 4. 安裝 Python 環境
echo "[4/7] 安裝 Python 環境..."
sudo apt update
sudo apt install -y python3-pip python-is-python3 python3-requests python3-bs4 python3-html2text python3-venv

# 5. 安裝 Playwright
echo "[5/7] 安裝 Playwright..."
npm install -g @playwright/test playwright
PLAYWRIGHT_BROWSERS_PATH=~/.cache/ms-playwright npx playwright install chromium
sudo apt install -y libasound2t64 libatk-bridge2.0-0t64 libatk1.0-0t64 libatspi2.0-0t64 libcairo2 libcups2t64 libdbus-1-3 libdrm2 libgbm1 libglib2.0-0t64 libgtk-3-0t64 libnspr4 libnss3 libpango-1.0-0 libx11-6 libxcb1 libxcomposite1 libxdamage1 libxext6 libxfixes3 libxkbcommon0 libxrandr2

# 6. 安裝中文字型
echo "[6/7] 安裝中文字型..."
sudo apt install -y fonts-noto-cjk

# 7. 初始化 OpenClaw
echo "[7/7] 初始化 OpenClaw..."
openclaw config list

echo ""
echo "=== 安裝完成 ==="
echo "請執行以下指令驗證環境："
echo "  node --version"
echo "  openclaw --version"
echo "  curl -s -o /dev/null -w \"%{http_code}\" https://www.google.com"
```

**使用方式**：

```bash
# 儲存為 install.sh
nano install.sh
# 貼上腳本內容，按 Ctrl+X, Y, Enter 儲存

# 賦予執行權限
chmod +x install.sh

# 執行安裝
./install.sh
```

---

## 附錄 B：快速啟動腳本範例

建立 Windows 批次檔，一鍵啟動 llama.cpp + OpenClaw Gateway。

**檔案**：`C:\Users\你的使用者名稱\start-openclaw-glm4.7-flash.bat`

```batch
@echo off
title OpenClaw + GLM-4.7-Flash

echo === Starting llama.cpp + OpenClaw ===
echo.

REM 啟動 llama.cpp（背景執行）
echo [1/3] Starting llama.cpp (GLM-4.7-Flash)...
start "llama.cpp" /MIN D:\llama.cpp\llama-server.exe ^
  --host 0.0.0.0 ^
  --port 8080 ^
  -m "D:\models\glm-4.7-flash-Q4_K_M.gguf" ^
  -c 8192 ^
  -ngl 99

REM 等待 llama.cpp 啟動
timeout /t 5 /nobreak >nul

REM 偵測 Windows IP 並更新 OpenClaw 設定
echo [2/3] Configuring OpenClaw...
for /f "tokens=3" %%i in ('wsl -d Ubuntu -- bash -c "ip route show | grep default"') do set WINDOWS_IP=%%i
echo Windows IP: %WINDOWS_IP%

wsl -d Ubuntu -- bash -c "source ~/.nvm/nvm.sh && openclaw config set models.providers.llamacpp.baseUrl 'http://%WINDOWS_IP%:8080/v1'"
wsl -d Ubuntu -- bash -c "source ~/.nvm/nvm.sh && openclaw config set agents.defaults.model.primary 'llamacpp/glm-4.7-flash'"

REM 啟動 OpenClaw Gateway
echo [3/3] Starting OpenClaw Gateway...
wsl -d Ubuntu -- bash -c "source ~/.nvm/nvm.sh && openclaw gateway"
```

**使用方式**：

雙擊 `start-openclaw-glm4.7-flash.bat` 即可啟動。

---

## 附錄 C：參考資料

### 官方文件

- [WSL2 官方文件](https://learn.microsoft.com/zh-tw/windows/wsl/)
- [OpenClaw GitHub](https://github.com/openclaw/openclaw)
- [Playwright 文件](https://playwright.dev/)
- [llama.cpp GitHub](https://github.com/ggerganov/llama.cpp)

### 相關 Issues

- [WSL2 HTTPS Timeout Issue #6416](https://github.com/microsoft/WSL/issues/6416)
- [OpenClaw Windows Support Issue #5549](https://github.com/openclaw/openclaw/issues/5549)
- [OpenClaw Telegram fetch failed Issue #7553](https://github.com/openclaw/openclaw/issues/7553)

---

**文件版本**：v1.0
**最後更新**：2026-02-15
**適用 OpenClaw 版本**：2026.2.12+
**適用 WSL2 版本**：Ubuntu 22.04 / 24.04
