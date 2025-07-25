# iKDx - Tauri + Vue 3

這是一個使用 Tauri + Vue 3 建立的桌面應用程式，同時支援自動部署到 GitHub Pages。

## 功能特色

-   🚀 使用 Tauri 2.0 建立跨平台桌面應用程式
-   🎨 使用 Vue 3 與 Composition API
-   ⚡ 使用 Vite 快速建置
-   🔄 自動部署到 GitHub Pages

## 開發環境設定

### 建議的 IDE 設定

-   [VS Code](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

### 安裝依賴

```bash
npm install
```

### 開發模式

```bash
# 啟動 Tauri 桌面應用程式
npm run tauri dev

# 或只啟動網頁版本
npm run dev
```

### 建置

```bash
# 建置 Tauri 桌面應用程式
npm run tauri build

# 建置網頁版本
npm run build
```

## GitHub Pages 自動部署

本專案已設定 GitHub Actions，當你推送程式碼到 `main` 分支時，會自動：

1. 安裝依賴
2. 建置網頁版本
3. 部署到 GitHub Pages

### 設定步驟

1. 確保你的 GitHub 倉庫已啟用 GitHub Pages
2. 在倉庫設定中，將 Pages 來源設定為 "GitHub Actions"
3. 推送程式碼到 `main` 分支即可觸發自動部署

### 查看網頁版本

部署完成後，你可以在以下網址查看網頁版本：
`https://17Kobe.github.io/iKDx/`

## 專案結構

```
├── src/                    # Vue 3 前端程式碼
├── src-tauri/             # Tauri 後端程式碼 (Rust)
├── public/                # 靜態資源
├── .github/workflows/     # GitHub Actions 設定
└── dist/                  # 建置輸出目錄
```
