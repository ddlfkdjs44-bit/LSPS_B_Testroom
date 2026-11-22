// schedule-share B동 서비스 워커
// 화면 파일만 캐시하고, Supabase 같은 서버 통신은 절대 캐시 안 함
const CACHE = 'schedule-share-B-v1';   // index.html 크게 바꾸면 v2, v3로 올리기
const SHELL = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // 다른 도메인(Supabase, CDN 등)이나 GET 아닌 요청은 그냥 통과
  if (url.origin !== location.origin || e.request.method !== 'GET') return;
  // 네트워크 우선 → 실패하면 캐시 (항상 최신 버전 유지)
  e.respondWith(
    fetch(e.request).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy));
      return res;
    }).catch(() => caches.match(e.request))
  );
});
