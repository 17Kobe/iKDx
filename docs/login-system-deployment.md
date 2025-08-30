# 登入系統部署指南

## 📋 概述

本系統使用 Google 和 Facebook OAuth 登入，後端採用 Cloudflare Workers serverless 架構。

## 🔧 前端設定

### 1. 安裝依賴

```bash
npm install @iconify/vue
```

### 2. 環境變數設定

複製 `.env.example` 為 `.env` 並填入相關設定：

```env
VITE_API_BASE_URL=https://your-worker.your-subdomain.workers.dev
VITE_GOOGLE_CLIENT_ID=your-google-client-id
VITE_FACEBOOK_APP_ID=your-facebook-app-id
```

### 3. Google OAuth 設定

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 建立新專案或選擇現有專案
3. 啟用 Google+ API
4. 在「憑證」頁面建立 OAuth 2.0 用戶端 ID
5. 設定授權的 JavaScript 來源和重新導向 URI

### 4. Facebook OAuth 設定

1. 前往 [Facebook for Developers](https://developers.facebook.com/)
2. 建立新應用程式
3. 新增 Facebook 登入產品
4. 設定有效的 OAuth 重新導向 URI

## ☁️ Cloudflare Workers 後端部署

### 1. 安裝 Wrangler CLI

```bash
npm install -g wrangler
```

### 2. 登入 Cloudflare

```bash
wrangler auth login
```

### 3. 安裝後端依賴

```bash
cd cloudflare-worker
npm install
```

### 4. 建立 D1 資料庫

```bash
# 建立生產環境資料庫
wrangler d1 create ikdx-auth-db

# 建立測試環境資料庫
wrangler d1 create ikdx-auth-db-staging
```

### 5. 更新 wrangler.toml

將建立的資料庫 ID 填入 `wrangler.toml` 檔案：

```toml
[[env.production.d1_databases]]
binding = "DB"
database_name = "ikdx-auth-db"
database_id = "your-d1-database-id"
```

### 6. 初始化資料庫 Schema

```bash
# 生產環境
wrangler d1 execute ikdx-auth-db --file=./schema.sql --env=production

# 測試環境
wrangler d1 execute ikdx-auth-db-staging --file=./schema.sql --env=staging
```

### 7. 設定環境變數

```bash
# 設定 JWT 密鑰
wrangler secret put JWT_SECRET --env=production

# 設定 Google Client ID
wrangler secret put GOOGLE_CLIENT_ID --env=production

# 設定 Facebook App ID
wrangler secret put FACEBOOK_APP_ID --env=production
```

### 8. 部署 Worker

```bash
# 部署到測試環境
wrangler deploy --env=staging

# 部署到生產環境
wrangler deploy --env=production
```

## 🗄️ 資料庫結構

### users 表
- `id`: 用戶 ID (主鍵)
- `email`: 用戶 email
- `name`: 用戶名稱
- `avatar`: 頭像 URL
- `provider`: OAuth 提供商 (google/facebook)
- `provider_id`: OAuth 提供商用戶 ID
- `created_at`: 建立時間
- `last_login_at`: 最後登入時間

### user_settings 表
- 用戶設定資料

### user_stocks 表
- 用戶關注的股票

### user_portfolios 表
- 用戶投資組合

### user_transactions 表
- 用戶交易記錄

## 🔒 安全性考量

1. **JWT Token 安全**
   - 使用強密鑰
   - 設定適當的過期時間
   - 定期輪換密鑰

2. **OAuth Token 驗證**
   - 驗證 Google/Facebook token 的有效性
   - 檢查 token 的 audience 和 issuer

3. **CORS 設定**
   - 限制允許的來源域名
   - 正確設定 CORS headers

4. **資料驗證**
   - 驗證所有輸入資料
   - 防止 SQL 注入攻擊

## 🚀 API 端點

### 認證相關
- `POST /auth/google` - Google OAuth 登入
- `POST /auth/facebook` - Facebook OAuth 登入
- `GET /auth/verify` - 驗證 JWT token
- `POST /auth/refresh` - 刷新 token
- `POST /auth/logout` - 登出

### 用戶相關
- `GET /user/profile` - 取得用戶資料
- `PUT /user/profile` - 更新用戶資料
- `DELETE /user/account` - 刪除帳號
- `GET /user/stats` - 取得用戶統計

## 🛠️ 開發工具

### 本地開發

```bash
# 啟動 Cloudflare Workers 本地開發
cd cloudflare-worker
npm run dev
```

### 監控 Logs

```bash
# 即時查看 Worker logs
wrangler tail --env=production
```

### 資料庫管理

```bash
# 查詢資料庫
wrangler d1 execute ikdx-auth-db --command="SELECT * FROM users" --env=production

# 執行 SQL 檔案
wrangler d1 execute ikdx-auth-db --file=./migration.sql --env=production
```

## 📝 注意事項

1. **環境隔離**: 確保測試和生產環境使用不同的資料庫和密鑰
2. **備份**: 定期備份 D1 資料庫資料
3. **監控**: 設定適當的錯誤監控和告警
4. **限流**: 考慮加入 API 限流機制
5. **快取**: 適當使用 KV 存儲進行資料快取

## 🔧 故障排除

### 常見問題

1. **CORS 錯誤**: 檢查 `corsHeaders` 設定
2. **Token 無效**: 確認 JWT 密鑰和過期時間設定
3. **OAuth 失敗**: 驗證 Google/Facebook 應用程式設定
4. **資料庫連接**: 確認 D1 資料庫 binding 設定

### Debug 技巧

1. 使用 `wrangler tail` 查看即時 logs
2. 在 Worker 中加入 `console.log` 除錯
3. 使用 Cloudflare Dashboard 監控 Worker 執行狀況
4. 檢查 D1 資料庫的 SQL 執行記錄
