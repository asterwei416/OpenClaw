# Google Workspace CLI 部署與設定指南 (Zeabur 環境)

本指南說明如何在 Zeabur 平台上成功部署與執行 `@openclaw/google-workspace` 擴充套件。我們已在 OpenClaw 的 Dockerfile 中配置了必要的環境，並且設定 `gws` (Google Workspace CLI) 使用獨立的授權目錄 `/home/node/.openclaw/gws_auth`。

## 1. Zeabur Volume 設定 (必要步驟)

由於 Zeabur 是無狀態容器環境 (Stateless Container)，若未指定持久化空間，每次部署 或 伺服器重啟時，`gws` 所紀錄的 OAuth Token 都會遺失，導致需要重新登入。

1. 到 Zeabur 儀表板選擇您的 `OpenClaw` 服務。
2. 進入「**Volumes (儲存空間)**」分頁。
3. 點選「Add Volume (新增儲存空間)」。
4. 將掛載路徑 (Mount Path) 設為：`/home/node/.openclaw`
5. 儲存並重啟服務 (Restart Service)。

> 💡 **為何是這個路徑？**
> 這會同步持久化 OpenClaw Agent 本身的狀態，同時我們已在 `Dockerfile` 中指定 `ENV GOOGLE_WORKSPACE_CLI_CONFIG_DIR=/home/node/.openclaw/gws_auth`，讓 Google Workspace CLI 放設定檔在這裡。注意，OpenClaw 是以 `node` 使用者運行，因此只有 `/home/node` 下具備存取權限。

## 2. 第一次登入驗證 (OAuth Login)

第一次讓 OpenClaw Agent 自動幫您寄發信件或查詢資料時，它可能會回報類似以下錯誤：
`Google Workspace Auth Error. Please ensure you have authenticated via 'gws auth login'`

您有兩種方式進行初始登入：

### 方式 A：透過 Zeabur Web Console 直接登入 (最簡單)
1. 在 Zeabur 儀表板開啟 OpenClaw 服務的 `Console (終端機)`。
2. 由於 Terminal 進入預設為 `root`，為了避免權限錯誤，請先切換使用者：`su node`
3. 接著輸入：`gws auth login`。
4. 它會輸出一段 Google OAuth 驗證連結。複製該連結並貼到您的瀏覽器中開啟。
5. 選擇要授權的 Google 帳號，並同意所有權限。
6. 瀏覽器最後會顯示「授權成功」，此時回到終端機即可看見 Token 已產出並儲存。

### 方式 B：將本機的 Token 複製到 Zeabur (離線登入)
如果您不方便用 Web Console 產生驗證碼：
1. 在您本機直接執行：`npx @googleworkspace/cli auth login`
2. 登入成功後，找出您本機家目錄下的設定檔（例如 MacOS 在 `~/.config/gws/token.json` 類似的位置）。
3. 將該設定檔的內容複製，透過 Zeabur Variable 的方式（暫不推薦），或透過 `gws auth login --headless` 搭配其他遠端方法處理。建議優先使用 **方式 A**。

## 3. 測試它是否生效

在 OpenClaw 聊天介面 (Telegram / WhatsApp / Discord) 呼叫您的 Agent：
```
請用 Google Workspace CLI 幫我看一下目前 Gmail 收件匣有幾封最新信件？
```
或是：
```
請用 Gmail 幫我寄一封「晚點開會」的信件給 xxx@gmail.com。
```

Agent 將會自動呼叫對應的 Tool 執行任務，若成功，代表您的 Token 持久化掛載已完成。
