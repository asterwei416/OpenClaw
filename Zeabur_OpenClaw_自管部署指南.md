# OpenClaw 雲端自管總機 (GitHub + Zeabur) 部署與持續整合指南 (Discord 版)

本指南專為希望打造 24/7 永不斷線的 **OpenClaw 雲端助理**開發者所設計。我們透過 **GitOps 架構**（本地撰寫腳本 -> 推至 GitHub -> Zeabur 自動部署），讓你擁有 100% 的擴充自由度，並成功將 AI 總機串接至 **Discord 伺服器**。

本文件非常適合交給 AI 助理（如 Google Antigravity、GitHub Copilot）閱讀，以協助你快速建置環境與排除障礙。

---

## 為什麼採用「自建 Repo」而非「一鍵安裝 Template」？

- **擴充自由度**：可自行修改 `package.json` 安裝 NPM 套件，或修改 `Dockerfile` 增添系統級工具（如爬蟲所需的字型）。
- **版本控制與除錯**：環境配置皆有 Git 紀錄，本地測試無誤後再 Merge 上雲端，確保生產環境的穩定。
- **私有配置隨身帶**：自訂的外掛邏輯、特殊爬蟲腳本都能存在私有 Repo 中跟著自動上線。

---

## 階段 0：在本地安裝 OpenClaw 核心 (首次建置必做)

在開始任何部署流程之前，你的本機電腦必須先安裝好 OpenClaw 基礎環境：

1. **準備底層環境**：請確保你的電腦已安裝 **Node.js** (建議 v22 以上版本) 與 **Git**。
2. **全域安裝 OpenClaw**：
   在終端機 (PowerShell 或命令提示字元) 中執行以下指令，將 OpenClaw 安裝到你的電腦中：
   ```bash
   npm install -g openclaw
   ```
3. **初始化專案資料夾 (Workspace)**：
   建立一個空的專案資料夾（例如命名為 `openclaw-bot`），進入該資料夾後執行初始化：
   ```bash
   openclaw workspace init
   ```
   _執行完畢後，這個資料夾就會自動產生完整的系統架構（包含 `package.json`、`Dockerfile`、`/src` 與 `/skills` 目錄等），這就是你專屬的小龍蝦大腦。_

---

## 階段 1：本地工作區準備 (Local Workspace)

在將程式碼推上雲端前，請確保本地專案結構完整：

1. **確認核心檔案存在**：
   確保你的 OpenClaw 專案根目錄擁有 `package.json`, `Dockerfile`, 與 `src` 目錄。
2. **清理本地雜訊（.gitignore 與 .dockerignore）**：
   專案中若有自行撰寫的測試腳本或輔助指令檔 `.bat`，並不會影響 Zeabur 部署，因 Zeabur 會依循 `Dockerfile` 進行建置。
   > 💡 建議將含有機密資訊（如 API Keys）的本地測試檔（例如 `.env` 或 `client_secret.json`）加入 `.gitignore` 與 `.dockerignore` 避免推播至雲端。

---

## 階段 2：初始化 Discord Bot 與取得 Token

要讓 OpenClaw 連接 Discord，你必須先為它安裝專屬技能，並到 Discord 開發者平台建立一隻機器人。

> 🔗 **官方教學參考**：若需更完整的官方設定說明，請參閱 [OpenClaw Discord 官方教學文件](https://docs.openclaw.ai/channels/discord)。

**A. 在本地專案中安裝 Discord 技能**
首先，在你的電腦終端機目錄下執行以下指令，安裝通訊技能：

```bash
openclaw skill install discord
```

_安裝完成後，務必將變更 `git add .` 並 commit。_

**B. 建立 Discord 機器人帳號**

1. **前往開發者入口**：登入 [Discord Developer Portal](https://discord.com/developers/applications)。
2. **建立應用程式 (Application)**：
   - 點擊右上角 `New Application`。
   - 輸入你的 Bot 名稱（例如：`OpenClaw Assistant`）並接受條款。
3. **設定 Bot 屬性**：
   - 在左側選單進入 **Bot** 頁籤。
   - （可選）為你的機器人設定大頭貼與自我介紹。
   - 點擊 `Reset Token` 以獲取一組全新的 Token。**請務必妥善保管這組 Token，稍後會用到。**
4. **開啟 Privileged Gateway Intents (重要！)**：
   在同一個 Bot 頁面往下滑，找到 **Privileged Gateway Intents** 區塊，**將以下三個開關全部打開**（否則 OpenClaw 無法讀取訊息與成員資料）：
   - `Presence Intent`
   - `Server Members Intent`
   - `Message Content Intent`
5. **邀請 Bot 加入你的伺服器**：
   - 進入左側選單的 **OAuth2 -> URL Generator**。
   - **Scopes** 勾選 `bot`。
   - **Bot Permissions** 勾選 `Administrator` (管理員權限，或依據需求勾選必要權限如 Read/Send Messages)。
   - 複製頁面下方生成的 URL，貼到瀏覽器，並選擇你要讓機器人加入的 Discord 伺服器進行授權。

---

## 階段 3：GitHub 程式碼倉庫推播 (Push to GitHub)

1. **登入 GitHub** 並建立一個新的 **Private** (私有) Repository。
2. **從本地推上 GitHub**：
   打開你電腦裡 OpenClaw 資料夾的終端機，依次執行以下指令：
   ```bash
   git init
   git add .
   git commit -m "Initial commit for Zeabur deployment"
   # 將下面這行的 URL 替換為你的 GitHub repo 網址
   git remote add origin https://github.com/你的帳號/你的Repo名稱.git
   git branch -M main
   git push -u origin main
   ```

---

## 階段 4：在 Zeabur 進行部署 (Deploy on Zeabur)

1. **登入 Zeabur 控制台**：前往 [Zeabur](https://dash.zeabur.com/) 並建立新專案。
2. **新增服務 (Service)**：
   - 點擊 `Create Service` (新增服務)。
   - **建議選擇**：點擊 **Git** (從原始碼部署)。這種服務模式能讓 Zeabur 直接與你的 GitHub 連動，實現未來的自動更新 (CI/CD)。
   - 首次使用會需要點擊 `Configure GitHub`，授權 Zeabur 存取你的 GitHub 帳號。
   - 在清單中搜尋並選擇你剛剛推播的 `openclaw-zeabur-bot` (或你的 Repo 名稱)。
   - 選擇 `main` 分支，點擊 `Deploy`。
3. **建置過程**：Zeabur 會自動掃描原始碼，當它看到 `Dockerfile` 時，會自動判斷這是一個 **Docker/Container 服務**。接著它會開始無伺服器編譯與安裝 Node.js 環境（約需 5~10 分鐘，請耐心等待狀態轉為 `Running`）。

---

## 階段 4.5：雲端終端機互動與模型配置 (Terminal & Setup)

佈署完成後，若機器人已顯示「Running」，你可能需要透過 Zeabur 提供的手動終端機來進行最後的微調（例如切換模型或檢查狀態）。

1. **進入雲端終端機**：
   - 點擊服務左側選單的 **Terminal** (終端機) 頁籤。
   - 看到提示字元後即可開始輸入指令。
2. **自我診斷 (OpenClaw Doctor)**：
   - 輸入 `openclaw doctor` 可檢查當前伺服器環境的套件安裝狀況與設定檔是否正確。
3. **設定預設模型 (Model Setup)**：
   - 雖然這也可以透過 `mcporter.json` 手動修改，但你也透過終端機進行互動式設定：
     ```bash
     openclaw model set
     ```
   - 遵循提示選擇你要使用的 LLM 服務商（OpenAI, Anthropic 等）與特定的模型名稱。
4. **確認持久化路徑**：
   - 在終端機輸入 `openclaw config path` 確保路徑指向 `/root/.openclaw`。這樣你剛才掛載的 Volume 才會生效，模型設定才不會在重啟後消失。

---

## 階段 5：環境變數配置 (Environment Variables)

佈署完成後，千萬不可把密碼寫死在 Code 裡，我們必須透過 Zeabur 控制台安全地注入 Tokens。

1. 進入你在 Zeabur 剛建好的服務，切換到 **Variables** (變數) 面板。
2. 在這裡新增 OpenClaw 啟動所需的所有環境變數，包含剛剛拿到的 Discord Token：
   - `DISCORD_BOT_TOKEN` = `你剛剛在階段2取得的長串Discord金鑰`
   - `OPENAI_API_KEY` = `sk-xxxxxxxxxxxxxxxxx` (若使用 OpenAI 作為大腦)
   - `PORT` = `8080` (Zeabur 通常會自動分配這組變數供 Docker 監聽)

   > 💡 **其他常見社交通訊技能配置**：
   > 若你有安裝其他平台的通訊外掛 (依據你本地 `skills/` 的安裝狀況)，請一併補上：
   >
   > - **Telegram**: `TELEGRAM_BOT_TOKEN`
   > - **LINE**: `LINE_CHANNEL_ACCESS_TOKEN` 與 `LINE_CHANNEL_SECRET`
   > - **Slack**: `SLACK_BOT_TOKEN` 與 `SLACK_APP_TOKEN`
   > - **WhatsApp (wacli)**: 通常藉由掃描 QR Code 或注入 Session Data 進行驗證。

3. 儲存設定後，系統將提示重新部署 (Redeploy)，點擊確定以套用新引數。

> **驗證連接**：重新部署完成後，打開你的 Discord 伺服器，若機器人狀態顯示為「線上」，即代表雲端聯機大成功！

---

## 階段 6：安裝進階擴充技能 (以 Python, Playwright 與 Google Calendar 為例)

預設的 OpenClaw 具備基礎對話能力。當你想擴充像是「Google Calendar 排程」、「Python 爬蟲」或「Playwright 網頁自動化截圖」時，你必須告訴 Zeabur 的 Linux 環境去準備這些底層工具。

**在 GitOps 架構下，進階技能的標準擴充流程如下：**

### 6.1 在本地安裝技能與測試

首先，在電腦的 OpenClaw 專案目錄下執行技能安裝指令（例如日曆與瀏覽器自動化）：

```bash
openclaw skill install gcalcli-calendar
openclaw skill install browser-tools
```

_這會在工作區中更新設定檔與相應的 `/skills` 目錄，請務必將相關變更 `git add .` 並 commit。_

### 6.2 取得 Google Calendar API 憑證 (重要！請嚴格遵守類型)

要串接 Google 日曆，必須先到 Google 雲端平台申請金鑰。請注意，為了支援雲端無介面授權，**我們必須選擇 Web 類型**：

1. **建立專案**：登入 [Google Cloud Console](https://console.cloud.google.com/) 並建立一個新專案。
2. **啟用日曆 API**：進入左側選單的「**API 和服務**」>「**資料庫**」，搜尋「**Google Calendar API**」並點擊啟用。
3. **設定 OAuth 同意畫面**：
   - 進入「**OAuth 同意畫面**」，User Type 選擇「外部」，點擊建立。
   - 填寫「應用程式名稱」與「支援 Email」。
   - **【最重要：環境白名單】**：在「測試使用者 (Test users)」頁面，點擊 `Add Users`，手動加入你的 Google 帳號。
   - **【永久化關鍵：Publish App】**：**務必點擊「發布應用程式」按鈕**，將狀態從「測試環境」轉為「正式發布」。若未執行此步，你的 Token 七天後就會失效。
4. **建立 Web 類型憑證**：
   - 進入「**憑證 (Credentials)**」>「**建立憑證**」>「**OAuth 用戶端 ID**」。
   - **應用程式類型**：務必選擇 **「網頁應用程式 (Web application)」**。
   - **已授權的重新導向 URI**：點擊 `+新增 URI`，貼上 `https://developers.google.com/oauthplayground`
   - 點擊建立，並記下產生的 **Client ID** 與 **Client Secret**。

### 6.2.1 使用 OAuth Playground 獲取長效 Token

因為 Zeabur 是遠端 Linux，我們不透過本機 Python，而是直接使用 Google 官方工具拿取權杖：

1. 前往 [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)。
2. 點擊右上角 **齒輪 (Settings)**：
   - 勾選 `Use your own OAuth credentials`。
   - 填入你剛才拿到的 **Client ID** 與 **Client Secret**。
3. **Step 1 (授權)**：左側找到 **Calendar API v3**，勾選 `.../auth/calendar`，點擊藍色 **Authorize APIs** 並在彈出視窗點選允許。
4. **Step 2 (交換)**：點擊藍色按鈕 **Exchange authorization code for tokens**。
5. **拿取結果**：複製下方出現的 **`Refresh token`**。這串字元就是小龍蝦在雲端的「永久通行證」。

> ⚠️ **嚴重警告**：`credentials.json` 與剛生出來的 `oauth` 通行證絕對不可 commit 上傳到 GitHub！請緊接著進行配置與安全注入處理。

### 6.3 配置雲端系統環境 (修訂 Dockerfile)

這是雲端部署最核心的差異！在舊版 WSL2 指南中，你需要手動敲一堆 `sudo apt install`。但在 Zeabur，你需要**把它們寫進 `Dockerfile` 裡**，讓系統自動幫你建置。

**A. 處理 Python 與一般系統套件 (如 gcalcli, requests)**
請打開專案根目錄的 `Dockerfile`，找到大約第 11 行的 `ARG OPENCLAW_DOCKER_APT_PACKAGES=""`，將你需要的工具加進去：

```dockerfile
# 加上 Python3, pip, 中文字型 (截圖需要), 與 gcalcli
ARG OPENCLAW_DOCKER_APT_PACKAGES="python3-pip python-is-python3 python3-requests python3-bs4 fonts-noto-cjk gcalcli"
```

**B. 處理 Playwright 瀏覽器自動化**
Playwright 需要非常龐大的系統依賴（如 `libnss3`, `libatk1.0` 等）與 Chromium 瀏覽器本體。如果你有使用截圖技能，你需要在 `Dockerfile` 接近結尾（啟動服務前）的區塊，補上 Playwright 容器安裝指令：

```dockerfile
RUN npx playwright install --with-deps chromium
```

### 6.4 安全注入憑證金鑰 (Zeabur Variables)

為了符合 GitHub 的安全規範，我們**嚴禁**將金鑰明文寫在 `mcporter.json` 或 `credentials.json` 中並推至 GitHub。自 2026/03 版本起，OpenClaw 採用「環境變數優先」機制。

**A. 取得轉換值**
你只需要準備好這三組值：

1. **Client ID**: 來自你的 `credentials.json`。
2. **Client Secret**: 來自你的 `credentials.json`。
3. **Refresh Token**: 這是你透過本機 `gcalcli` 授權後解出的長效權杖。

**B. 在 Zeabur 後台設定 (Variables)**
進入你的服務 -> **Variables**，新增以下三組變數（MCP Server 會自動讀取它們）：

| 變數名稱               | 範例值                                   |
| ---------------------- | ---------------------------------------- |
| `GOOGLE_CLIENT_ID`     | `762797721...apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | `GOCSPX-lF0cajzUc...`                    |
| `GOOGLE_REFRESH_TOKEN` | `1//0ehfEZyrYvoLy...`                    |

**C. 修改 mcporter.json (選擇性)**
確保專案中 `config/mcporter.json` 的 `google-workspace` 區塊是保持「清空金鑰」狀態的。這樣它啟動時，會自動去抓你剛才在 Zeabur 設定的環境變數，安全又方便！

> 💡 **核心精神**：你擁有這一套系統的絕對主控權。任何敏感金鑰一律不進 Git，而是透過 Zeabur 的環境變數 (Environment Variables) 進行動態注入，這也是企業級專案的標準做法。

### 6.5 ⚠️ 嚴重警告：哪些本地技能「不該」放上雲端？

你的工作區 (`skills/` 目錄) 中可能安裝了超過 50 種各式各樣的技能（如 `apple-notes`, `imsg`, `things-mac`, `bluebubbles`, `camsnap` 等）。
請在推播上 Zeabur 前，**務必理解雲端架構的限制**：

Zeabur 是一台 **純文字介面的 Linux 伺服器** (Debian/Ubuntu)。它「沒有」蘋果系統、也「沒有」攝影機。
如果你將以下類型的技能打包上傳，OpenClaw 將無法執行它們，甚至可能導致容器崩潰：

1. **MacOS 專屬技能**：如 `apple-notes` (備忘錄)、`apple-reminders`、`imsg` (iMessage)、`things-mac`。Linux 上沒有 AppleScript，這些絕對無法運作。
2. **硬體依賴技能**：如 `camsnap` (需要實體攝影機)、`sonoscli` (需要與你在同一個家庭 Wi-Fi 網域的音響)。

**解決方案：**
請運用 `.dockerignore` 檔案，將這些不相容的技能資料夾排除，不要讓它們跟著上雲端：

```text
# 寫入專案根目錄的 .dockerignore
skills/apple-notes
skills/apple-reminders
skills/imsg
skills/things-mac
skills/camsnap
```

這樣能確保你的雲端總機輕量、純粹且不會因為呼叫錯作業系統的 API 而當機。

---

## 階段 7：持久化儲存與記憶保留 (Volumes) [強烈推薦]

雲端容器每次發布新版本或重啟時，預設會清空所有內部產生的資料。為了讓 OpenClaw 記住過往配置與記憶，強烈建議掛載 Volume。

1. 在 Zeabur 服務控制台中，切換至 **Volumes** 頁籤。
2. 點擊掛載磁碟 (Create Volume)。
3. 把掛載路徑 (Mount Path) 設定為：`/root/.openclaw`（這是 OpenClaw 預設存放設定、對話紀錄與記憶的系統核心路徑）。
4. 儲存並重新部署。自此 OpenClaw 的所有狀態檔案都將永久保存在雲端獨立空間中，不會因為服務重啟而遺失。

---

## 階段 8：未來如何無痛升級與擴充 (CI/CD)

當架構完成後，你的後續開發流程將極度優雅：

1. **本地研發**：在本地電腦開發新的自訂腳本、或是使用 `npm install` 安裝新的技能套件。
2. **一鍵上雲**：確認本地開發完畢後，執行 Git 推播：
   ```bash
   git add .
   git commit -m "feat: 增加 Discord 自訂指令支援"
   git push
   ```
3. **自動化佈署**：Zeabur 監聽至 GitHub 的 `main` 分支更新後，便會自動拉取最新程式碼，進行編譯、更替版本，全程無需手動介入。
