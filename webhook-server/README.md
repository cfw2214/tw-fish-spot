# 🎣 台灣釣點 LINE Bot Webhook 伺服器

LINE Bot Webhook 伺服器，協助用戶查詢台灣釣點信息。

## ✨ 功能

- 🔍 **智能搜尋** - 按釣點名稱、區域或類型搜尋
- 📍 **詳細信息** - 顯示釣點區域、類型、備註
- 🌤️ **天氣查詢** - 一鍵跳轉到釣點天氣頁面
- 🎯 **多結果展示** - Flex Message Carousel 支援最多 5 個結果

## 🚀 快速開始

### 安裝依賴
```bash
npm install
```

### 建立 .env
```bash
cp .env.example .env
# 編輯 .env，新增你的 Channel Access Token
```

### 啟動伺服器
```bash
npm start
```

## 📡 部署

詳見 DEPLOY_RENDER.md

## 📚 文檔

- DEPLOY_RENDER.md - Render 部署指南
- QUICK_START.md - 5 分鐘快速版
- GITHUB_SETUP.md - Git 推送指南

## 🔐 安全性

✅ Token 存儲於環境變數
✅ .env 被 .gitignore 忽略
✅ 絕不在日誌中顯示真實 Token
