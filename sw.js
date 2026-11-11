// Moje úklidy – offline režim. Při změně souborů zvyš číslo verze.
const CACHE = 'uklidy-v14';
const FILES = [
  './',
  './index.html',
  './lib/qrcode.js',
  './lib/html2canvas.min.js',
  './lib/jspdf.umd.min.js',
  './manifest.json',
  './avatar.jpg',
  './fonts/manrope-latin-wght-normal.woff2',
  './fonts/manrope-latin-ext-wght-normal.woff2',
  './icons/icon-192.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', e => {
  // cache: 'reload' = vždy čerstvě ze serveru, ne z HTTP mezipaměti prohlížeče
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(FILES.map(f => new Request(f, {cache: 'reload'}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;

  // Stránka: nejdřív internet (ať jsou vidět nové verze), bez signálu z paměti
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req, {cache: 'no-store'})
        .then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put('./index.html', copy)); return res; })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Ostatní soubory: z paměti, na pozadí aktualizovat
  e.respondWith(
    caches.match(req).then(hit => {
      const net = fetch(req).then(res => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
        return res;
      }).catch(() => hit);
      return hit || net;
    })
  );
});
