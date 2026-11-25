// =============================================
// Gökyüzü Takvimi – service worker
// Siteyi uygulama gibi kurulabilir yapar ve çevrimdışıyken
// daha önce görülen sayfaları/fotoğrafları gösterebilir.
// Sadece site bir sunucudan (http/https) açıldığında çalışır.
// =============================================

const VERSION = "v6";
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
  // cache: "reload" -> dosyalar tarayıcının HTTP önbelleğinden değil, sunucudan alınır
  // (yoksa yeni sürüm yüklenince eski dosyalar önbelleğe girebiliyordu)
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL.map((url) => new Request(url, { cache: "reload" }))))
  );
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

  // Sitenin kendi dosyaları: önce sunucuya sor (güncelleme varsa hemen gelsin),
  // internet yoksa önbellekten ver
  if (url.origin === self.location.origin) {
    event.respondWith(siteFile(request));
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

async function siteFile(request) {
  const cache = await caches.open(SHELL_CACHE);
  try {
    // no-cache: dosya değişmediyse sunucu kısa bir "değişmedi" cevabı verir, hızlıdır
    const response = await fetch(request.url, { cache: "no-cache", credentials: "same-origin" });
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch (err) {
    const cached =
      (await cache.match(request, { ignoreSearch: true })) ||
      (request.mode === "navigate" ? await cache.match("index.html") : undefined);
    if (cached) return cached;
    throw err;
  }
}

async function trimCache(cache, maxEntries) {
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - maxEntries; i++) await cache.delete(keys[i]);
}
