// 北台灣海釣點神器 - Service Worker v1.0
// 最精簡版：只讓 Chrome 認得這是可安裝的 PWA，不做任何 cache

self.addEventListener('install', e => {
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(self.clients.claim());
});

// fetch 事件：直接走網路，不做 cache（因為天氣 API 需要即時資料）
self.addEventListener('fetch', e => {
  e.respondWith(fetch(e.request));
});
