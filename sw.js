const CACHE_NAME = 'salon-receipt-v4';
const ASSETS = [
  './index.html',
  './manifest.json',
  './icon-192.svg',
  './icon-512.svg',
];

// インストール：即座にアクティブ化
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  // 待機せず即座にアクティブ化
  self.skipWaiting();
});

// アクティブ化：古いキャッシュを全て削除して即座に制御
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => {
        console.log('Deleting old cache:', k);
        return caches.delete(k);
      }))
    ).then(() => self.clients.claim()) // 全クライアントを即座に制御
  );
});

// フェッチ：ネットワーク優先（オフライン時のみキャッシュ）
self.addEventListener('fetch', event => {
  // GETリクエストのみ処理
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // 正常レスポンスはキャッシュを更新
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        // オフライン時はキャッシュから返す
        return caches.match(event.request)
          .then(cached => cached || caches.match('./index.html'));
      })
  );
});
