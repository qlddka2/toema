/* 오프라인 실행용 캐시. 배포할 때마다 VERSION을 올리세요. */
const VERSION = 'toema-1.0.0';
const FILES = ['./', 'index.html', 'config.js', 'manifest.json', 'js/data.js', 'js/core.js', 'js/art.js', 'js/rank.js', 'js/app.js',
  'img/daesung.png', 'img/uchi.png', 'img/dog.png', 'img/crow.png', 'img/boar.png', 'img/bear.png', 'icons/icon-192.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;   // Supabase 등 외부 요청은 건드리지 않음
  // 네트워크 우선, 실패하면 캐시 (업데이트가 바로 반영되도록)
  e.respondWith(fetch(e.request).then(r => { const cp = r.clone(); caches.open(VERSION).then(c => c.put(e.request, cp)); return r; }).catch(() => caches.match(e.request)));
});
