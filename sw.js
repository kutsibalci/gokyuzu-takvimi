// =============================================
// Gökyüzü Takvimi – service worker
// Siteyi uygulama gibi kurulabilir yapar ve çevrimdışıyken
// daha önce görülen sayfaları/fotoğrafları gösterebilir.
// Sadece site bir sunucudan (http/https) açıldığında çalışır.
// =============================================

const VERSION = "v5";
const SHELL_CACHE = `apod-shell-${VERSION}`;
const DATA_CACHE = `apod-data-${VERSION}`;
const IMAGE_CACHE = `apod-images-${VERSION}`;
const MAX_IMAGES = 150;

const SHELL = [
  "./",
  "index.html",
  "style.css",
  "script.js",
  "games.js",
  "card.js",
  "library.js",
  "manifest.webmanifest",
  "icons/icon-32.png",
  "icons/icon-192.png",
  "icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  const keep = [SHELL_CACHE, DATA_CACHE, IMAGE_CACHE];
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !keep.includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  // API: önce internet, yoksa önbellek
  if (url.hostname === "science.nasa.gov" && url.pathname.includes("/apod-basic")) {
    event.respondWith(networkFirst(request, DATA_CACHE));
    return;
  }

  // NASA görselleri: önce önbellek
  if (url.hostname === "assets.science.nasa.gov") {
    event.respondWith(cacheFirst(request, IMAGE_CACHE, MAX_IMAGES));
    return;
  }

  // Sitenin kendi dosyaları: önbellekten hemen ver, arkada güncelle
  if (url.origin === self.location.origin) {
    event.respondWith(staleWhileRevalidate(request, SHELL_CACHE));
  }
});

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch (err) {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw err;
  }
}

async function cacheFirst(request, cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok || response.type === "opaque") {
    await cache.put(request, response.clone());
    trimCache(cache, maxEntries);
  }
  return response;
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => cached);
  return cached || network;
}

async function trimCache(cache, maxEntries) {
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - maxEntries; i++) await cache.delete(keys[i]);
}
