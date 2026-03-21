const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(express.json());

const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;
const WEBSITE_URL = 'https://cfw2214.github.io/tw-fish-spot';

const fs = require('fs');

const PORT = process.env.PORT || 3000;
// 加載釣點數據
let spotsData = [];
try {
    const spotsPath = './webhook-server/spots.json';
    if (fs.existsSync(spotsPath)) {
          spotsData = JSON.parse(fs.readFileSync(spotsPath, 'utf8'));
          console.log(`✅ 已加載 ${spotsData.length} 個釣點`);
    } else {
          console.warn('⚠️  spots.json 文件未找到');
    }
} catch (error) {
    console.error('❌ 加載 spots.json 失敗:', error.message);
}

app.use(express.json());

// 健康檢查端點
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// LINE Webhook 端點
app.post('/webhook', (req, res) => {
    console.log('📩 收到 webhook 請求');

    // 立即返回 200，告訴 LINE 已收到
    res.status(200).json({ message: 'ok' });

    // 在後台處理事件
    try {
          const events = req.body.events || [];
          console.log(`⏳ 處理 ${events.length} 個事件`);

          events.forEach((event) => {
                  if (event.type === 'message' && event.message.type === 'text') {
                            console.log(`📝 用戶訊息: ${event.message.text}`);
                            handleUserMessage(event.replyToken, event.message.text);
                  }
          });
    } catch (error) {
          console.error('❌ 處理 webhook 事件出錯:', error);
    }
});

// 處理用戶訊息
function handleUserMessage(replyToken, userMessage) {
    try {
          let responseText = '';

          // 搜尋釣點
          const spot = spotsData.find(s => 
                  s.name.toLowerCase().includes(userMessage.toLowerCase()) ||
                  s.area.toLowerCase().includes(userMessage.toLowerCase())
                );

          if (spot) {
                  responseText = `🎣 ${spot.name}\n`;
                  responseText += `📍 ${spot.area}\n`;
                  responseText += `🌡️ ${spot.weather || '天氣資訊未更新'}\n`;
                  responseText += `💧 水溫: ${spot.temperature || '未知'}°C\n`;
                  responseText += `🌊 浪高: ${spot.waveHeight || '未知'}米`;
          } else {
                  responseText = '找不到該釣點。請試試其他名稱，例如：\n' +
                            '• 基隆\n' +
                            '• 宜蘭\n' +
                            '• 台中\n' +
                            '• 高雄';
          }

          replyToUser(replyToken, responseText);
    } catch (error) {
          console.error('❌ 處理用戶訊息出錯:', error);
          replyToUser(replyToken, '❌ 處理訊息時出錯，請稍後再試');
    }
}

// 回覆用戶
async function replyToUser(replyToken, responseText) {
    try {
          if (!LINE_CHANNEL_ACCESS_TOKEN) {
                  console.error('❌ 錯誤: LINE_CHANNEL_ACCESS_TOKEN 未設定');
                  return;
          }

          const response = await axios.post(
                  'https://api.line.biz/v2/bot/message/reply',
            {
                      replyToken: replyToken,
                      messages: [
                        {
                                      type: 'text',
                                      text: responseText
                        }
                                ]
            },
            {
                      headers: {
                                  'Content-Type': 'application/json',
                                  'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`
                      }
            }
                );

          console.log('✅ 回覆成功:', response.status);
    } catch (error) {
          console.error('❌ 回覆失敗:', error.response?.status, error.response?.data || error.message);
    }
}

// 啟動服務器
app.listen(PORT, () => {
    console.log(`🚀 釣點天氣 Bot 服務器運行在 port ${PORT}`);
    console.log(`📡 Webhook URL: https://tw-fish-spot-production.up.railway.app/webhook`);
    console.log(`💾 已加載 ${spotsData.length} 個釣點`);
});

// 優雅關閉
process.on('SIGTERM', () => {
    console.log('📴 服務器關閉中...');
    process.exit(0);
});
let spotsData = [];

async function loadSpotsData() {
  try {
    const response = await axios.get(`${WEBSITE_URL}/spots.json`);
    spotsData = response.data;
    console.log(`✅ 已載入 ${spotsData.length} 個釣點`);
  } catch (error) {
    console.error('❌ 無法載入釣點資料:', error.message);
    spotsData = [];
  }
}

loadSpotsData();
setInterval(loadSpotsData, 60 * 60 * 1000);

function searchSpots(keyword) {
  if (!keyword) return [];
  const lowerKeyword = keyword.toLowerCase();
  return spotsData.filter(spot =>
    spot.name.includes(keyword) ||
    spot.area.includes(keyword) ||
    spot.type.includes(keyword) ||
    spot.note.includes(keyword)
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
          size: 'lg',
          color: '#1DB446'
        },
        {
          type: 'box',
          layout: 'baseline',
          margin: 'md',
          contents: [
            {
              type: 'text',
              text: '📍 區域',
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
              text: '🎣 類型',
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
        ...(spot.note ? [{
          type: 'box',
          layout: 'baseline',
          margin: 'md',
          contents: [
            {
              type: 'text',
              text: '📝 備註',
              color: '#aaaaaa',
              size: 'sm',
              flex: 1
            },
            {
              type: 'text',
              text: spot.note,
              wrap: true,
              color: '#666666',
              size: 'sm',
              flex: 5
            }
          ]
        }] : []),
        {
          type: 'box',
          layout: 'vertical',
          margin: 'lg',
          spacing: 'sm',
          contents: [
            {
              type: 'button',
              style: 'link',
              height: 'sm',
              action: {
                type: 'uri',
                label: '🌤️ 查詢天氣詳情',
                uri: weatherUrl
              }
            },
            {
              type: 'button',
              style: 'link',
              height: 'sm',
              action: {
                type: 'uri',
                label: '📋 推薦其他釣點',
                uri: WEBSITE_URL
              }
            }
          ]
        }
      ]
    }
  };
}

app.post('/webhook', (req, res) => {
  const body = req.body;

  if (!body.events || !Array.isArray(body.events)) {
    return res.status(400).json({ error: 'Invalid request' });
  }

  body.events.forEach(async (event) => {
    if (event.type !== 'message' || event.message.type !== 'text') {
      return;
    }

    const userMessage = event.message.text;
    const replyToken = event.replyToken;

    try {
      const results = searchSpots(userMessage);

      let replyMessage;

      if (results.length === 0) {
        replyMessage = {
          type: 'text',
          text: `找不到「${userMessage}」相關的釣點。\n\n💡 試試看：\n• 輸入釣點名稱（如：野柳港）\n• 輸入區域名稱（如：金山萬里）\n• 輸入釣點類型（如：野場）\n\n📍 造訪官網查看完整釣點列表：${WEBSITE_URL}`
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
          replyToken: replyToken,
          messages: [replyMessage]
        },
        {
          headers: {
            Authorization: `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log(`✅ 已回覆: ${userMessage}`);
    } catch (error) {
      console.error('❌ 回覆失敗:', error.response?.data || error.message);
    }
  });

  res.status(200).json({ ok: true });
});

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    spotsLoaded: spotsData.length,
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Webhook 伺服器運行於 http://localhost:${PORT}`);
  console.log(`📡 Webhook 端點: http://localhost:${PORT}/webhook`);
  console.log(`💚 健康檢查: http://localhost:${PORT}/health`);
});
