/* 오프라인 실행용 캐시. 배포할 때마다 VERSION을 올리세요. */
const VERSION = 'toema-2.4.0';
const FILES = ['./', 'index.html', 'config.js', 'manifest.json', 'js/data.js', 'js/core.js', 'js/art.js', 'js/audio.js', 'js/rank.js', 'js/app.js', 'js/i18n.js', 'js/i18n_dict.js',
  'img/baekho.png', 'img/bari.png', 'img/bat.png', 'img/bear.png', 'img/boar.png', 'img/buffalo.png', 'img/bulga.png', 'img/cheongryong.png', 'img/crow.png', 'img/daesung.png', 'img/dog.png', 'img/fox.png', 'img/gangrim.png', 'img/gildong.png', 'img/haetae.png', 'img/hwaseo.png', 'img/hyeonmu.png', 'img/icon_armor.png', 'img/icon_aura.png', 'img/icon_beads.png', 'img/icon_bell.png', 'img/icon_fan.png', 'img/icon_haste.png', 'img/icon_knives.png', 'img/icon_luck.png', 'img/icon_magnet.png', 'img/icon_might.png', 'img/icon_quake.png', 'img/icon_regen.png', 'img/icon_soulfire.png', 'img/icon_staff.png', 'img/icon_swift.png', 'img/icon_talisman.png', 'img/icon_thunder.png', 'img/icon_vigor.png', 'img/imugi.png', 'img/jujak.png', 'img/seolmun.png', 'img/snake.png', 'img/tiger.png', 'img/uchi.png', 'img/jungyeong.png', 'img/jacheongbi.png', 'img/wolf.png', 'img/item_chest.png', 'img/item_coin.png', 'img/item_bag.png', 'img/item_heal.png', 'img/item_magnet.png', 'img/ground_grass.png', 'img/ground_swamp.png', 'img/ground_snow.png', 'img/ground_ash.png', 'img/ground_sea.png', 'img/ground_night.png', 'img/imugi_head.png', 'img/imugi_roar.png', 'img/imugi_segA.png', 'img/imugi_segB.png', 'img/imugi_tail.png', 'img/cy_head.png', 'img/cy_roar.png', 'img/cy_segA.png', 'img/cy_segB.png', 'img/cy_tail.png', 'icons/icon-192.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;   // Supabase 등 외부 요청은 건드리지 않음
  // 네트워크 우선, 실패하면 캐시 (업데이트가 바로 반영되도록)
  e.respondWith(fetch(e.request).then(r => { const cp = r.clone(); caches.open(VERSION).then(c => c.put(e.request, cp)); return r; }).catch(() => caches.match(e.request)));
});
