// QuotaFlo AI — offline service worker
// Caches the app shell so it opens and works with no signal.
const CACHE = 'quotaflo-v5';
const SHELL = ['./', './index.html', './manifest.json',
  './icon-192.png', './icon-512.png', './icon-maskable-512.png',
  './apple-touch-icon.png', './icon.svg'];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).catch(()=>{}));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Never cache API/AI calls or live data services — these need the network.
  // When offline they'll simply fail and the app handles that gracefully.
  const liveHosts = ['onrender.com','api.anthropic.com','open-meteo.com','rainviewer.com','bigdatacloud.net','supabase.co','stripe.com'];
  if (liveHosts.some(h => url.hostname.includes(h))) {
    return; // let it hit the network normally
  }

  // App shell + assets: cache-first, fall back to network, update cache.
  e.respondWith(
    caches.match(req).then(cached => {
      const fetchPromise = fetch(req).then(res => {
        if (res && res.status === 200 && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy)).catch(()=>{});
        }
        return res;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
