const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(express.json());

const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;
const WEBSITE_URL = 'https://cfw2214.github.io/tw-fish-spot';
const fs = require('fs');
const PORT = process.env.PORT || 3000;

let spotsData = [];

async function loadSpotsData() {
  try {
    const response = await axios.get(`${WEBSITE_URL}/spots.json`);
    spotsData = response.data;
    console.log(`✅ 已載入 ${spotsData.length} 個釣點`);
  } catch (error) {
    console.error('❌ 無法從 GitHub Pages 載入釣點資料:', error.message);
    try {
      const spotsPath = './webhook-server/spots.json';
      if (fs.existsSync(spotsPath)) {
        spotsData = JSON.parse(fs.readFileSync(spotsPath, 'utf8'));
        console.log(`✅ 已從本地加載 ${spotsData.length} 個釣點`);
      }
    } catch (localError) {
      console.error('❌ 加載本地 spots.json 失敗:', localError.message);
    }
  }
}

function searchSpots(keyword) {
  if (!keyword) return [];
  const lowerKeyword = keyword.toLowerCase();
  return spotsData.filter(spot =>
    spot.name.toLowerCase().includes(lowerKeyword) ||
    spot.area.toLowerCase().includes(lowerKeyword) ||
    spot.type.toLowerCase().includes(lowerKeyword)
  ).slice(0, 5);
}

function generateFlexMessage(spot) {
  const weatherUrl = `${WEBSITE_URL}?lat=${spot.lat}&lng=${spot.lng}&spot=${encodeURIComponent(spot.name)}`;
  return {
    type: 'bubble',
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: spot.name,
          weight: 'bold',
          size: 'xl',
          color: '#1DB446'
        },
        {
          type: 'box',
          layout: 'baseline',
          margin: 'md',
          contents: [
            {
              type: 'text',
              text: '地區',
              color: '#aaaaaa',
              size: 'sm',
              flex: 1
            },
            {
              type: 'text',
              text: spot.area,
              wrap: true,
              color: '#666666',
              size: 'sm',
              flex: 5
            }
          ]
        },
        {
          type: 'box',
          layout: 'baseline',
          margin: 'md',
          contents: [
            {
              type: 'text',
              text: '類型',
              color: '#aaaaaa',
              size: 'sm',
              flex: 1
            },
            {
              type: 'text',
              text: spot.type,
              wrap: true,
              color: '#666666',
              size: 'sm',
              flex: 5
            }
          ]
        },
        {
          type: 'box',
          layout: 'baseline',
          margin: 'md',
          contents: [
            {
              type: 'text',
              text: '難度',
              color: '#aaaaaa',
              size: 'sm',
              flex: 1
            },
            {
              type: 'text',
              text: spot.difficulty || '普通',
              wrap: true,
              color: '#666666',
              size: 'sm',
              flex: 5
            }
          ]
        }
      ]
    },
    footer: {
      type: 'box',
      layout: 'vertical',
      spacing: 'sm',
      contents: [
        {
          type: 'button',
          style: 'link',
          height: 'sm',
          action: {
            type: 'uri',
            label: '🌤️ 天氣資訊',
            uri: weatherUrl
          }
        },
        {
          type: 'button',
          style: 'link',
          height: 'sm',
          action: {
            type: 'uri',
            label: '📍 查看地圖',
            uri: `https://www.google.com/maps?q=${spot.lat},${spot.lng}`
          }
        }
      ],
      flex: 0
    }
  };
}

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    spotsLoaded: spotsData.length,
    timestamp: new Date().toISOString()
  });
});

app.post('/webhook', (req, res) => {
  const body = req.body;
  res.status(200).json({ ok: true });

  body.events.forEach(async (event) => {
    if (event.type !== 'message' || event.message.type !== 'text') return;

    const userMessage = event.message.text;
    const replyToken = event.replyToken;

    try {
      const results = searchSpots(userMessage);
      let replyMessage;

      if (results.length === 0) {
        replyMessage = {
          type: 'text',
          text: `找不到「${userMessage}」相關的釣點...`
        };
      } else if (results.length === 1) {
        replyMessage = {
          type: 'flex',
          altText: results[0].name,
          contents: {
            type: 'carousel',
            contents: [generateFlexMessage(results[0])]
          }
        };
      } else {
        replyMessage = {
          type: 'flex',
          altText: `找到 ${results.length} 個釣點`,
          contents: {
            type: 'carousel',
            contents: results.map(spot => generateFlexMessage(spot))
          }
        };
      }

      await axios.post(
        'https://api.line.biz/v2/bot/message/reply',
        {
          replyToken,
          messages: [replyMessage]
        },
        {
          headers: {
            'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log(`✅ 已回覆: ${userMessage}`);
    } catch (error) {
      console.error('❌ 回覆失敗:', error.response?.data || error.message);
    }
  });
});

loadSpotsData();
setInterval(loadSpotsData, 60 * 60 * 1000);

app.listen(PORT, () => {
  console.log(`🚀 釣點天氣 Bot 服務器運行在 port ${PORT}`);
  console.log(`📡 Webhook URL: https://tw-fish-spot-production.up.railway.app/webhook`);
  console.log(`💚 健康檢查: http://localhost:${PORT}/health`);
});

process.on('SIGTERM', () => {
  console.log('📴 服務器關閉中...');
  process.exit(0);
});