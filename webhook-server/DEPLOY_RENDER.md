# 🚀 Render 部署指南

## 前置準備

- GitHub 帳號
- Render 帳號（免費）
- LINE Bot Channel Access Token

## 部署步驟

### 1. 登入 Render
訪問 [render.com](https://render.com)，用 GitHub 帳號登入。

### 2. 建立 Web Service
- Dashboard → New +  → Web Service
- Connect a repository → 選擇 tw-fish-spot
- 填入設定：
  - Name: tw-fish-spot-webhook
  - Root Directory: webhook-server
  - Build Command: npm install
  - Start Command: npm start

### 3. 設定環境變數
- Environment → 新增：
  - LINE_CHANNEL_ACCESS_TOKEN = 你的 Token

### 4. 部署
- 點擊 Create Web Service
- 等待 2-3 分鐘

### 5. 更新 LINE Bot
- 複製 Render 的 URL（如 https://tw-fish-spot-webhook.onrender.com）
- LINE Developers Console → Messaging API → Webhook Settings
- 貼入：https://tw-fish-spot-webhook.onrender.com/webhook
- 點擊 Verify

## 完成！

在 LINE 傳送 `野柳港` 測試。

詳細文檔見 README.md
