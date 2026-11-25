// =============================================
// Gökyüzü Takvimi – NASA Astronomy Picture of the Day
// =============================================
//
// Veri kaynağı: NASA Science APOD API
//   https://science.nasa.gov/wp-json/wp/v2/apod-basic/?page=1
// Her sayfa en yeniden eskiye doğru 25 günü döndürür, API anahtarı gerekmez.
// (Eski api.nasa.gov/planetary/apod adresi artık gerçek fotoğraf yerine
//  NASA logosu döndürdüğü için NASA'nın yeni adresi kullanılıyor.)
//
// Türkçe çeviri: Chrome'un tarayıcıya gömülü, cihaz içinde çalışan
// Translator özelliği kullanılır (ek bir web API'si ya da anahtar gerekmez).

// Sayfa açılırken adresteki # kısmı (ör. #yapboz). Gün gösterilince adres tarihe çevrildiği için baştan saklanır.
const INITIAL_HASH = location.hash;
const API_URL = "https://science.nasa.gov/wp-json/wp/v2/apod-basic/";
const PAGE_SIZE = 25;
const FIRST_DATE = "1995-06-16"; // APOD'un ilk fotoğrafı
const PAST_YEARS = 5; // "geçmiş yıllarda bu tarih" bölümünde kaç yıl gösterilecek
const PARALLEL = 8; // aynı anda en fazla kaç istek atılacak

const KEYS = {
  fav: "apodFavorites",
  lang: "apodLang",
  theme: "apodTheme",
  autoTr: "apodAutoTranslate",
  birthday: "apodBirthday",
};
const CACHE_ROOT = "apodCache:"; // bu önekle başlayan tüm eski önbellekler temizlenir
const CACHE_PREFIX = `${CACHE_ROOT}v2:`; // veri biçimi değişince sürüm artırılır
const FIRST_PAGE_TTL = 30 * 60 * 1000; // en yeni sayfa 30 dakika önbellekte kalır

// ---------- Dil metinleri ----------
const TEXTS = {
  tr: {
    skip: "İçeriğe geç",
    navToday: "Günün fotoğrafı",
    navCalendar: "Takvim",
    navBirthday: "Doğum günü",
    navArchive: "Arşiv",
    navFavorites: "Favoriler",
    themeDark: "Koyu temaya geç",
    themeLight: "Açık temaya geç",
    eyebrow: "NASA · Günün Astronomi Fotoğrafı",
    heroTitle: "Evreni her gün yeni bir fotoğrafla keşfedin",
    heroText:
      "NASA'nın 1995'ten bu yana her gün yayınladığı astronomi fotoğraflarını tarihe göre inceleyin, arşivde arayın ve beğendiklerinizi kaydedin.",
    prev: "Önceki gün",
    next: "Sonraki gün",
    pickDate: "Tarih seç",
    keyHintHtml: "Klavyeden <kbd>←</kbd> <kbd>→</kbd> tuşlarıyla günler arasında geçiş yapabilirsiniz.",
    latest: "En yeni",
    random: "Rastgele",
    fullscreen: "Tam ekran",
    noImage: "Bu gün için görsel bulunamadı. Ayrıntılar NASA sayfasında.",
    noImageShort: "Görsel yok",
    loading: "Yükleniyor…",
    errorPrefix: "Hata",
    serverError: "Sunucu hatası",
    badResponse: "Beklenmeyen bir cevap geldi.",
    noPhotos: "Hiç fotoğraf bulunamadı.",
    notFound: "Bu tarih için fotoğraf bulunamadı.",
    randomFailed: "Rastgele fotoğraf alınamadı.",
    saveFailed: "Favoriler bu tarayıcıda kaydedilemedi.",
    video: "Video",
    image: "Fotoğraf",
    credit: "Görsel",
    addFav: "Favorilere ekle",
    removeFav: "Favorilerde",
    favAdded: "Favorilere eklendi",
    favRemoved: "Favorilerden çıkarıldı",
    download: "İndir",
    downloading: "İndiriliyor…",
    downloaded: "İndirme başladı",
    share: "Paylaş",
    linkCopied: "Bağlantı kopyalandı",
    kindIllustration: "Çizim",
    kindSimulation: "Simülasyon",
    kindIllustrationHint: "Bu görsel bir fotoğraf değil; bilimsel bilgilere dayanarak hazırlanmış bir çizim.",
    kindSimulationHint: "Bu görsel bir fotoğraf değil; bir bilgisayar simülasyonu ya da görselleştirme.",
    detailKind: "Görsel türü",
    detailSource: "Kaynak",
    detailCenter: "NASA merkezi",
    detailKeywords: "Anahtar kelimeler",
    librarySource: "NASA Görsel ve Video Arşivi (images.nasa.gov)",
    linkCopiedLocal: "Bağlantı kopyalandı. Site yayına alınınca başkalarıyla da paylaşılabilir.",
    copyFailed: "Bağlantı kopyalanamadı",
    nasaPage: "NASA sayfası",
    detailType: "Tür",
    detailResolution: "Çözünürlük",
    detailAlt: "Görselde ne var",
    detailArchive: "Arşivdeki yeri",
    archiveDay: (n) => `${n.toLocaleString("tr-TR")}. gün`,
    trOriginal: "Açıklama NASA'nın orijinal İngilizce metnidir.",
    trTranslate: "Türkçeye çevir",
    trTranslating: "Çevriliyor…",
    trDownloading: (p) => `Çeviri modeli indiriliyor… %${p}`,
    trDone: "Chrome'un cihaz içi çevirisiyle Türkçeye çevrildi.",
    trShowOriginal: "Orijinalini göster",
    trShowTranslation: "Çeviriyi göster",
    trUnsupported: "Tarayıcınız otomatik çeviriyi desteklemiyor, orijinal İngilizce metin gösteriliyor.",
    trFailed: "Çeviri yapılamadı, orijinal metin gösteriliyor.",
    onThisDayTitle: "Geçmiş yıllarda bu tarih",
    onThisDayText: (d) => `Önceki ${PAST_YEARS} yılın ${d} fotoğrafları`,
    calendarTitle: "Arşiv takvimi",
    birthdayTitle: "Doğum günü fotoğrafların",
    birthdayText: "Her doğum gününde NASA hangi fotoğrafı yayınlamış?",
    birthdayLabel: "Doğum tarihin",
    birthdayButton: "Fotoğrafları göster",
    birthdayProgress: (done, total) => `${total} doğum günü taranıyor… ${done}/${total}`,
    birthdaySummary: (n, first) => `${first} yılından bu yana ${n} doğum günü fotoğrafı bulundu.`,
    birthdayNone: "Bu tarih için arşivde fotoğraf yok. APOD 16 Haziran 1995'te başladı.",
    birthdayAge: (age) => (age === 0 ? "Doğduğun gün" : `${age}. yaş günü`),
    archiveTitle: "Arşiv",
    archiveCount: (n) => `${n.toLocaleString("tr-TR")} gün yüklendi`,
    archiveFound: (m, n) => `${m} sonuç · ${n} gün tarandı`,
    archivePageInfo: (p, total, days) => `Sayfa ${p} / ${total} · ${days} gün`,
    pagePrev: "Önceki sayfa",
    pageNext: "Sonraki sayfa",
    goToPage: "Sayfa no",
    counter: (i, n) => `${i} / ${n}`,
    openInMain: "Ana sayfada göster",
    infoToggle: "Bilgileri göster / gizle",
    archiveEmpty: "Taranan günlerde eşleşen fotoğraf yok. Daha eski günlere bakmak için aşağıdaki butonu kullanın.",
    searchPlaceholder: "Başlık veya açıklamada ara (ör. Mars, galaxy, aurora)",
    filterAll: "Tümü",
    filterImage: "Fotoğraf",
    filterVideo: "Video",
    loadMore: "Daha eski günleri yükle",
    searchOlder: "Daha eski günlerde ara",
    archiveEnd: "Arşivin sonuna ulaşıldı",
    favTitle: "Favoriler",
    favCount: (n) => `${n} kayıt`,
    noFav: "Henüz favori eklemediniz. Beğendiğiniz fotoğrafta \"Favorilere ekle\" butonuna basın.",
    lbHint: "← → ile önceki / sonraki, tekerlek veya çift tıklama ile yakınlaştırma, Esc ile kapatma.",
    footerSource: "Veri kaynağı:",
    footerNote: "Fotoğraflar ve açıklamalar NASA'ya ve görsel sahiplerine aittir.",
    locale: "tr-TR",
  },
  en: {
    skip: "Skip to content",
    navToday: "Picture of the day",
    navCalendar: "Calendar",
    navBirthday: "Birthday",
    navArchive: "Archive",
    navFavorites: "Favorites",
    themeDark: "Switch to dark theme",
    themeLight: "Switch to light theme",
    eyebrow: "NASA · Astronomy Picture of the Day",
    heroTitle: "Explore the universe, one picture a day",
    heroText:
      "Browse the astronomy pictures NASA has published every day since 1995, search the archive and save your favorites.",
    prev: "Previous day",
    next: "Next day",
    pickDate: "Pick a date",
    keyHintHtml: "Use the <kbd>←</kbd> <kbd>→</kbd> keys to move between days.",
    latest: "Latest",
    random: "Random",
    fullscreen: "Fullscreen",
    noImage: "No picture is available for this day. See the NASA page for details.",
    noImageShort: "No picture",
    loading: "Loading…",
    errorPrefix: "Error",
    serverError: "Server error",
    badResponse: "Unexpected response received.",
    noPhotos: "No pictures found.",
    notFound: "No picture found for this date.",
    randomFailed: "Could not load a random picture.",
    saveFailed: "Favorites could not be saved in this browser.",
    video: "Video",
    image: "Image",
    credit: "Credit",
    addFav: "Add to favorites",
    removeFav: "In favorites",
    favAdded: "Added to favorites",
    favRemoved: "Removed from favorites",
    download: "Download",
    downloading: "Downloading…",
    downloaded: "Download started",
    share: "Share",
    linkCopied: "Link copied",
    kindIllustration: "Illustration",
    kindSimulation: "Simulation",
    kindIllustrationHint: "This is not a photograph; it is an illustration based on scientific data.",
    kindSimulationHint: "This is not a photograph; it is a computer simulation or visualization.",
    detailKind: "Image type",
    detailSource: "Source",
    detailCenter: "NASA center",
    detailKeywords: "Keywords",
    librarySource: "NASA Image and Video Library (images.nasa.gov)",
    linkCopiedLocal: "Link copied. It can be shared with others once the site is published.",
    copyFailed: "Could not copy the link",
    nasaPage: "NASA page",
    detailType: "Type",
    detailResolution: "Resolution",
    detailAlt: "In the picture",
    detailArchive: "Archive position",
    archiveDay: (n) => `Day ${n.toLocaleString("en-US")}`,
    trOriginal: "",
    trTranslate: "",
    trTranslating: "",
    trDownloading: () => "",
    trDone: "",
    trShowOriginal: "",
    trShowTranslation: "",
    trUnsupported: "",
    trFailed: "",
    onThisDayTitle: "On this day in past years",
    onThisDayText: (d) => `${d} pictures from the previous ${PAST_YEARS} years`,
    calendarTitle: "Archive calendar",
    birthdayTitle: "Your birthday pictures",
    birthdayText: "Which picture did NASA publish on each of your birthdays?",
    birthdayLabel: "Your date of birth",
    birthdayButton: "Show pictures",
    birthdayProgress: (done, total) => `Checking ${total} birthdays… ${done}/${total}`,
    birthdaySummary: (n, first) => `${n} birthday pictures found since ${first}.`,
    birthdayNone: "No pictures in the archive for this date. APOD started on June 16, 1995.",
    birthdayAge: (age) => (age === 0 ? "The day you were born" : `Age ${age}`),
    archiveTitle: "Archive",
    archiveCount: (n) => `${n.toLocaleString("en-US")} days loaded`,
    archiveFound: (m, n) => `${m} results · ${n} days searched`,
    archivePageInfo: (p, total, days) => `Page ${p} of ${total} · ${days} days`,
    pagePrev: "Previous page",
    pageNext: "Next page",
    goToPage: "Page no.",
    counter: (i, n) => `${i} / ${n}`,
    openInMain: "Show on main page",
    infoToggle: "Show / hide details",
    archiveEmpty: "No matching pictures in the days searched so far. Use the button below to search older days.",
    searchPlaceholder: "Search titles and descriptions (e.g. Mars, galaxy, aurora)",
    filterAll: "All",
    filterImage: "Images",
    filterVideo: "Videos",
    loadMore: "Load older days",
    searchOlder: "Search older days",
    archiveEnd: "You reached the end of the archive",
    favTitle: "Favorites",
    favCount: (n) => `${n} saved`,
    noFav: "You haven't saved any favorites yet. Press \"Add to favorites\" on a picture you like.",
    lbHint: "← → previous / next, wheel or double click to zoom, Esc to close.",
    footerSource: "Data source:",
    footerNote: "Pictures and descriptions belong to NASA and their respective owners.",
    locale: "en-US",
  },
};

// ---------- Uygulama durumu ----------
let lang = loadSetting(KEYS.lang, null) || (navigator.language?.startsWith("tr") ? "tr" : "en");
const t = (key) => TEXTS[lang][key];

let latestDate = null; // en yeni fotoğrafın tarihi
let currentApod = null; // ekranda gösterilen fotoğraf
let pastItems = []; // geçmiş yıllarda bu tarih
let pastToken = 0; // eski isteklerin sonucunu yok saymak için

const pageCache = new Map(); // sayfa no -> o sayfadaki fotoğraflar
const pendingPages = new Map(); // aynı sayfa iki kez istenmesin
const dateCache = new Map(); // tarih -> fotoğraf

const $ = (id) => document.getElementById(id);

// ---------- Ayarlar (tarayıcıda saklanır) ----------
function loadSetting(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : JSON.parse(value);
  } catch {
    return fallback;
  }
}

function saveSetting(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

// ---------- Küçük yardımcılar ----------
const pad = (n) => String(n).padStart(2, "0");

// Bir listeyi en fazla `limit` paralel istekle işler
async function mapLimit(list, limit, fn) {
  const results = new Array(list.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, list.length) }, async () => {
    while (next < list.length) {
      const index = next++;
      results[index] = await fn(list[index], index);
    }
  });
  await Promise.all(workers);
  return results;
}

let toastTimer = null;
function toast(message) {
  const el = $("toast");
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2600);
}

// Bir öğenin animasyonunu baştan oynatır
function replay(el, className) {
  el.classList.remove(className);
  void el.offsetWidth; // tarayıcıyı yeniden hesaplamaya zorla
  el.classList.add(className);
}

// Resim yüklenince yumuşakça görünür olsun
function fadeInImage(img) {
  const done = () => img.classList.add("loaded");
  if (img.complete && img.naturalWidth) done();
  else {
    img.addEventListener("load", done, { once: true });
    img.addEventListener("error", done, { once: true });
  }
}

// ---------- Dil ----------
function setLang(newLang) {
  lang = newLang;
  saveSetting(KEYS.lang, lang);
  applyTexts();
}

// Sayfadaki tüm sabit metinleri seçili dile göre yaz ve bölümleri yeniden çiz
function applyTexts() {
  document.documentElement.lang = lang;
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.dataset.i18n;
    if (key.endsWith("Html")) el.innerHTML = t(key); // sadece kendi sabit metinlerimiz
    else el.textContent = t(key);
  });
  // Sadece ikon olan butonların ekran okuyucu etiketi ve ipucu
  document.querySelectorAll("[data-i18n-label]").forEach((el) => {
    el.setAttribute("aria-label", t(el.dataset.i18nLabel));
    el.title = t(el.dataset.i18nLabel);
  });
  document.querySelectorAll(".lang-switch button").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.lang === lang);
    btn.setAttribute("aria-pressed", btn.dataset.lang === lang);
  });
  $("searchInput").placeholder = t("searchPlaceholder");
  updateThemeButton();

  if (currentApod) {
    renderApod(currentApod, 0, false);
    $("onThisDayText").textContent = t("onThisDayText")(formatDate(currentApod.date, { day: "numeric", month: "long" }));
  }
  renderCards($("onThisDay"), pastItems);
  if (latestDate) {
    renderCalendar(false);
    renderArchiveView(false);
  }
  renderBirthdayResults(false);
  renderFavorites();
  if (viewer.open && viewer.item) {
    renderViewerInfo(viewer.item);
    updateViewerNav();
  }
  if (typeof gamesApplyTexts === "function") gamesApplyTexts(); // games.js
}

// ---------- Tema ----------
function currentTheme() {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

function setTheme(theme) {
  const root = document.documentElement;
  root.classList.add("theme-anim");
  root.dataset.theme = theme;
  saveSetting(KEYS.theme, theme);
  updateThemeButton();
  setTimeout(() => root.classList.remove("theme-anim"), 450);
}

function updateThemeButton() {
  const light = currentTheme() === "light";
  const label = light ? t("themeDark") : t("themeLight");
  $("themeBtn").setAttribute("aria-label", label);
  $("themeBtn").title = label;
  document.querySelector('meta[name="theme-color"]').content = light ? "#f1eee8" : "#0b0d12";
}

// ---------- Önbellek (tarayıcıda) ----------
// Sayfa numaraları her gün bir kayar; bu yüzden anahtarda en yeni tarih de tutulur.
function cacheKey(page) {
  return page === 1 ? `${CACHE_PREFIX}p1` : `${CACHE_PREFIX}${latestDate}:${page}`;
}

function cacheRead(page) {
  try {
    const entry = JSON.parse(localStorage.getItem(cacheKey(page)));
    if (!entry) return null;
    if (page === 1 && Date.now() - entry.time > FIRST_PAGE_TTL) return null;
    return entry.items;
  } catch {
    return null;
  }
}

function cacheWrite(page, items) {
  const value = JSON.stringify({ time: Date.now(), items });
  try {
    localStorage.setItem(cacheKey(page), value);
  } catch {
    // Depolama dolduysa eski önbelleği temizleyip bir kez daha dene
    clearCache(true);
    try {
      localStorage.setItem(cacheKey(page), value);
    } catch {
      // önbelleğe yazılamasa da uygulama çalışmaya devam eder
    }
  }
}

// Eski günlere ait (artık kaymış) sayfaları siler
function clearCache(all = false) {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(CACHE_ROOT))
      .filter((k) => all || (k !== `${CACHE_PREFIX}p1` && !k.startsWith(`${CACHE_PREFIX}${latestDate}:`)))
      .forEach((k) => localStorage.removeItem(k));
  } catch {
    // depolamaya erişilemiyorsa yapılacak bir şey yok
  }
}

// ---------- API isteği ----------
function fetchPage(page) {
  if (pageCache.has(page)) return Promise.resolve(pageCache.get(page));
  if (pendingPages.has(page)) return pendingPages.get(page);

  const request = (async () => {
    let items = cacheRead(page);
    if (!items) {
      const res = await fetch(`${API_URL}?page=${page}`);
      if (!res.ok) throw new Error(`${t("serverError")} (${res.status})`);
      const data = await res.json();
      if (!Array.isArray(data)) throw new Error(t("badResponse"));
      items = data.map(normalize);
      if (page === 1 || latestDate) cacheWrite(page, items);
    }
    pageCache.set(page, items);
    items.forEach((item) => dateCache.set(item.date, item));
    return items;
  })();

  pendingPages.set(page, request);
  request.finally(() => pendingPages.delete(page)).catch(() => {});
  return request;
}

// API'den gelen kaydı uygulamanın kullandığı sade biçime çevir
function normalize(raw) {
  const creditHtml = raw.copyright || raw.credit || "";
  const size = imageSize(raw.hdurl);
  const video = raw.media_type === "video" ? findVideo(raw.basic_html) : {};
  const alt = htmlToText(raw.alt);
  return {
    date: raw.date,
    title: htmlToText(raw.title),
    explanation: htmlToText(raw.explanation).replace(/^\s*(Explanation:\s*)+/i, ""),
    alt: /^see explanation/i.test(alt) ? "" : alt, // anlamsız "açıklamaya bakın" metnini gösterme
    credit: htmlToText(creditHtml),
    creditUrl: firstLink(creditHtml),
    mediaType: raw.media_type,
    image: fixImageUrl(raw.hdurl) || video.thumb || null, // videolarda videonun kapak resmi
    width: size.width,
    height: size.height,
    videoFile: video.file || null,
    videoEmbed: video.embed || null,
    page: raw.url || raw.permalink, // NASA'daki sayfası
  };
}

// Gerçek fotoğraf değil de çizim/simülasyon mu? APOD bunu genelde başlıkta ya da
// görsel sahibinde ("Illustration Credit", "Simulation") belirtir; açıklamada ise
// sadece net ifadelere bakılır ki gerçek fotoğraflar yanlışlıkla etiketlenmesin.
const KIND_RULES = [
  [
    "illustration",
    /\billustrat|\bartist'?s?\b.*\b(concept|impression)/i,
    /\b(artist'?s?|artistic)\s+(illustration|concept(ion)?|impression|rendering|depiction|drawing)\b|\b(this|the featured|featured|the above)\s+(\w+\s+)?illustration\b/i,
  ],
  ["simulation", /\bsimulat|\bvisualization\b/i, /\b(this|the featured|featured|the above)\s+(\w+\s+){0,2}(simulation|visualization)\b/i],
];

function mediaKind(item) {
  if (!item || item.library) return null;
  const head = `${item.title || ""} ${item.credit || ""}`;
  for (const [kind, headRule] of KIND_RULES) if (headRule.test(head)) return kind;
  for (const [kind, , textRule] of KIND_RULES) if (textRule.test(item.explanation || "")) return kind;
  return null;
}

function kindLabel(item) {
  const kind = mediaKind(item);
  if (!kind) return null;
  return kind === "illustration"
    ? { text: t("kindIllustration"), hint: t("kindIllustrationHint") }
    : { text: t("kindSimulation"), hint: t("kindSimulationHint") };
}

// HTML içeren metni güvenli şekilde düz yazıya çevir
function htmlToText(html) {
  const doc = new DOMParser().parseFromString(String(html || ""), "text/html");
  return doc.body.textContent.replace(/\s+/g, " ").trim();
}

// Metindeki ilk bağlantının adresini al (sadece http/https)
function firstLink(html) {
  const doc = new DOMParser().parseFromString(String(html || ""), "text/html");
  const href = doc.querySelector("a[href]")?.getAttribute("href") || "";
  return /^https?:\/\//i.test(href) ? href : null;
}

// Resim adresindeki w ve h değerlerinden çözünürlüğü oku
function imageSize(url) {
  try {
    const u = new URL(url);
    return { width: Number(u.searchParams.get("w")) || null, height: Number(u.searchParams.get("h")) || null };
  } catch {
    return {};
  }
}

// API bazen resim yerine NASA logosu ya da 48 piksellik küçük bir önizleme verir.
// Logoyu yok sayar, küçük önizlemeden de asıl resmin adresini çıkarır.
function fixImageUrl(url) {
  if (!url) return null;
  if (/news-thumbnail|nasa-logo/i.test(url)) return null;
  if (url.includes("/jcr:content/renditions/")) {
    return url.split("/jcr:content")[0].replace("/content/dam/science/", "/dynamicimage/assets/science/");
  }
  return url;
}

// Küçük kartlarda hızlı yüklenmesi için resmin küçük boyutlu adresini üret
function thumbUrl(url, width = 480) {
  try {
    const u = new URL(url);
    if (!u.searchParams.has("w") && !u.pathname.includes("/dynamicimage/")) return url;
    u.searchParams.set("w", String(width));
    u.searchParams.delete("h");
    return u.href;
  } catch {
    return url;
  }
}

// Video günlerinde oynatılabilir dosyayı veya gömülü oynatıcıyı bul
function findVideo(html) {
  const doc = new DOMParser().parseFromString(String(html || ""), "text/html");
  // "//www.youtube.com/..." gibi protokolsüz adreslerin başına https: ekle
  const withProtocol = (src) => (src && src.startsWith("//") ? `https:${src}` : src || "");
  const file = withProtocol(doc.querySelector("video source[src], video[src], source[src]")?.getAttribute("src"));
  const embed = withProtocol(doc.querySelector("iframe[src]")?.getAttribute("src"));
  const validEmbed = /^https:\/\/(www\.)?(youtube\.com|youtube-nocookie\.com|player\.vimeo\.com)\//i.test(embed);
  // YouTube videolarının kendi önizleme resmi kapak olarak kullanılır
  const youtubeId = validEmbed ? embed.match(/\/embed\/([\w-]{6,})/)?.[1] : null;
  return {
    file: /^https?:\/\//i.test(file) ? file : null,
    embed: validEmbed ? embed : null,
    thumb: youtubeId ? `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg` : null,
  };
}

// ---------- Tarih yardımcıları ----------
function addDays(dateStr, n) {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function isLeap(year) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

// Aynı gün ve ay, farklı yıl (29 Şubat artık yıl değilse 28 Şubat olur)
function sameDayInYear(dateStr, year) {
  const [, m, d] = dateStr.split("-");
  const day = m === "02" && d === "29" && !isLeap(year) ? "28" : d;
  return `${year}-${m}-${day}`;
}

function daysBetween(a, b) {
  return Math.round((new Date(b + "T00:00:00Z") - new Date(a + "T00:00:00Z")) / 86400000);
}

function formatDate(dateStr, options = { day: "numeric", month: "long", year: "numeric" }) {
  return new Date(dateStr + "T00:00:00Z").toLocaleDateString(t("locale"), { ...options, timeZone: "UTC" });
}

function isValidDate(str) {
  return /^\d{4}-\d{2}-\d{2}$/.test(str || "") && !Number.isNaN(new Date(str + "T00:00:00Z").getTime());
}

// ---------- Tarihe göre fotoğraf bulma ----------
// direction: -1 = o gün yoksa daha eski en yakın gün, +1 = daha yeni en yakın gün
async function getByDate(date, direction = -1) {
  if (dateCache.has(date)) return dateCache.get(date);

  // Her sayfa ~25 gün olduğu için tarihin hangi sayfada olduğunu tahmin et
  let page = Math.max(1, Math.floor(daysBetween(date, latestDate) / PAGE_SIZE) + 1);

  for (let i = 0; i < 8; i++) {
    const items = await fetchPage(page);
    if (dateCache.has(date)) return dateCache.get(date);
    if (items.length === 0) {
      if (page === 1) break;
      page--; // listenin sonunu geçtik
      continue;
    }
    const newest = items[0].date;
    const oldest = items[items.length - 1].date;
    if (date < oldest) page++; // aranan tarih daha eski sayfada
    else if (date > newest && page > 1) page--; // daha yeni sayfada
    else break; // bu aralıkta ama o gün yayın yok
  }

  // O gün yayın yoksa istenen yöndeki en yakın günü ver
  const all = [...dateCache.values()].sort((a, b) => a.date.localeCompare(b.date));
  if (direction < 0) {
    const older = all.filter((x) => x.date < date);
    if (older.length) return older[older.length - 1];
  } else {
    const newer = all.find((x) => x.date > date);
    if (newer) return newer;
  }
  throw new Error(t("notFound"));
}

// Sadece tam o günün fotoğrafı (yoksa null)
async function getExact(date) {
  try {
    const item = await getByDate(date);
    return item.date === date ? item : null;
  } catch {
    return null;
  }
}

// ---------- Rastgele fotoğraf ----------
async function getRandom() {
  const totalPages = Math.floor(daysBetween(FIRST_DATE, latestDate) / PAGE_SIZE);
  for (let i = 0; i < 3; i++) {
    const page = 1 + Math.floor(Math.random() * totalPages);
    const items = await fetchPage(page);
    if (items.length) return items[Math.floor(Math.random() * items.length)];
  }
  throw new Error(t("randomFailed"));
}

// ---------- Çeviri (Chrome'un cihaz içi çevirisi) ----------
const translations = new Map(); // tarih -> { title, explanation, alt }
let translator = null;
let showOriginal = false;
let autoTranslate = loadSetting(KEYS.autoTr, false);

async function translatorState() {
  if (!("Translator" in self)) return "unsupported";
  try {
    return await Translator.availability({ sourceLanguage: "en", targetLanguage: "tr" });
  } catch {
    return "unsupported";
  }
}

async function translateItem(item, onProgress) {
  if (translations.has(item.date)) return translations.get(item.date);
  if (!translator) {
    translator = await Translator.create({
      sourceLanguage: "en",
      targetLanguage: "tr",
      monitor(m) {
        m.addEventListener("downloadprogress", (e) => onProgress(Math.round(e.loaded * 100)));
      },
    });
  }
  const [title, explanation, alt] = await Promise.all([
    translator.translate(item.title),
    translator.translate(item.explanation),
    item.alt ? translator.translate(item.alt) : "",
  ]);
  const result = { title, explanation, alt };
  translations.set(item.date, result);
  return result;
}

// Ekranda gösterilecek metinler: Türkçe modda ve çeviri varsa çeviri
function displayText(item) {
  if (lang === "tr" && !showOriginal && !item.library && translations.has(item.date)) {
    return { ...item, ...translations.get(item.date), translated: true };
  }
  return { ...item, translated: false };
}

async function updateTranslationBar(item) {
  const bar = $("trBar");
  const status = $("trStatus");
  const btn = $("trBtn");

  if (lang !== "tr") {
    bar.classList.add("hidden");
    return;
  }
  bar.classList.remove("hidden");
  btn.classList.add("hidden");

  if (translations.has(item.date)) {
    status.textContent = showOriginal ? t("trOriginal") : t("trDone");
    btn.textContent = showOriginal ? t("trShowTranslation") : t("trShowOriginal");
    btn.onclick = () => {
      showOriginal = !showOriginal;
      renderApod(currentApod, 0, false);
    };
    btn.classList.remove("hidden");
    return;
  }

  const state = await translatorState();
  if (currentApod !== item) return; // bu arada başka güne geçildi

  if (state === "unsupported" || state === "unavailable") {
    status.textContent = t("trUnsupported");
    return;
  }

  status.textContent = t("trOriginal");
  btn.textContent = t("trTranslate");
  btn.onclick = () => runTranslation(item);
  btn.classList.remove("hidden");

  // Kullanıcı daha önce çeviriyi açtıysa ve model hazırsa otomatik çevir
  if (autoTranslate && state === "available") runTranslation(item);
}

async function runTranslation(item) {
  const status = $("trStatus");
  const btn = $("trBtn");
  autoTranslate = true;
  showOriginal = false;
  saveSetting(KEYS.autoTr, true);
  btn.classList.add("hidden");
  status.textContent = t("trTranslating");
  try {
    await translateItem(item, (p) => {
      if (currentApod === item) status.textContent = t("trDownloading")(p);
    });
    if (currentApod === item) renderApod(item, 0, false);
  } catch {
    if (currentApod === item) status.textContent = t("trFailed");
  }
}

// ---------- Durum mesajı ----------
function showStatus(message, isError = false) {
  const el = $("status");
  el.textContent = message;
  el.classList.toggle("error", isError);
  el.classList.remove("hidden");
}

function hideStatus() {
  $("status").classList.add("hidden");
}

// ---------- Tarih çubuğu ----------
function renderDateBar(date, animate) {
  $("dateWeekday").textContent = formatDate(date, { weekday: "long" });
  $("dateMain").textContent = formatDate(date);
  $("datePicker").value = date;
  if (animate) {
    replay($("dateMain"), "tick");
    replay($("dateWeekday"), "tick");
  }

  const prev = addDays(date, -1);
  const next = addDays(date, 1);
  $("prevDate").textContent = formatDate(prev, { day: "numeric", month: "short", year: "numeric" });
  $("nextDate").textContent = formatDate(next, { day: "numeric", month: "short", year: "numeric" });
  $("prevBtn").disabled = date <= FIRST_DATE;
  $("nextBtn").disabled = date >= latestDate;
  $("nextDate").classList.toggle("hidden", date >= latestDate);
}

// ---------- Ana fotoğrafı göster ----------
// dir: -1 önceki gün (soldan gelir), +1 sonraki gün (sağdan gelir), 0 yerinde
function renderApod(item, dir = 0, animate = true) {
  const changed = currentApod?.date !== item.date;
  if (changed) showOriginal = false;
  currentApod = item;
  if (typeof trackView === "function") trackView(item); // rozetler için (games.js)
  const view = displayText(item);
  const isVideo = item.mediaType === "video";
  const feature = $("apod");

  renderDateBar(item.date, changed && animate);
  $("apodDate").textContent = formatDate(item.date);
  $("apodTitle").textContent = view.title;
  $("apodTitle").lang = view.translated ? "tr" : "en";
  $("apodExplanation").textContent = view.explanation;
  $("apodExplanation").lang = view.translated ? "tr" : "en";
  $("apodExplanation").scrollTop = 0;

  const badge = $("apodType");
  badge.textContent = t("video");
  badge.classList.toggle("hidden", !isVideo);
  // Fotoğraf değil de çizim/simülasyonsa belirt
  const kind = kindLabel(item);
  const kindBadge = $("apodKind");
  kindBadge.textContent = kind?.text || "";
  kindBadge.title = kind?.hint || "";
  kindBadge.classList.toggle("hidden", !kind);

  // Görsel sahibi (bağlantılı)
  const credit = $("apodCredit");
  credit.innerHTML = "";
  if (item.credit) {
    credit.append(`${t("credit")}: `);
    if (item.creditUrl) {
      const a = document.createElement("a");
      a.href = item.creditUrl;
      a.target = "_blank";
      a.rel = "noopener";
      a.textContent = item.credit;
      credit.appendChild(a);
    } else {
      credit.append(item.credit);
    }
  }

  // Medya sadece gün değişince yeniden oluşturulur (video baştan başlamasın)
  if (changed || !$("media").firstChild) renderMedia(item);
  $("expandBtn").classList.toggle("hidden", !item.image && !item.videoFile && !item.videoEmbed);

  // Detaylar
  const rows = [[t("detailType"), isVideo ? t("video") : kind ? kind.text : t("image")]];
  if (kind) rows.push([t("detailKind"), kind.hint]);
  if (item.width && item.height) rows.push([t("detailResolution"), `${item.width} × ${item.height} px`]);
  if (view.alt) rows.push([t("detailAlt"), view.alt]);
  rows.push([t("detailArchive"), t("archiveDay")(daysBetween(FIRST_DATE, item.date) + 1)]);
  const details = $("details");
  details.innerHTML = "";
  rows.forEach(([label, value]) => {
    const dt = document.createElement("dt");
    dt.textContent = label;
    const dd = document.createElement("dd");
    dd.textContent = value;
    details.append(dt, dd);
  });

  $("nasaLink").href = item.page;
  updateFavButton(false);
  updateTranslationBar(item);
  feature.classList.remove("is-loading");

  // Gün değiştiyse içerik kayarak gelsin
  if (changed && animate) {
    feature.style.setProperty("--dx", `${dir * 28}px`);
    replay(feature, "swap");
  }

  // Adres çubuğunda tarih dursun (paylaşılabilir bağlantı)
  if (location.hash !== `#${item.date}`) {
    history.replaceState(null, "", `#${item.date}`);
  }
  document.title = `${view.title} · Gökyüzü Takvimi`;

  markCalendarSelection();
  if (viewer.open && !viewer.list) renderViewer(item, changed && animate ? dir : 0);
}

function renderMedia(item) {
  const media = $("media");
  media.innerHTML = "";
  const isVideo = item.mediaType === "video";

  if (isVideo && item.videoFile) {
    const video = document.createElement("video");
    video.src = item.videoFile;
    video.poster = item.image || "";
    video.controls = true;
    video.playsInline = true;
    media.appendChild(video);
  } else if (isVideo && item.videoEmbed) {
    const iframe = document.createElement("iframe");
    iframe.src = item.videoEmbed;
    iframe.title = item.title;
    iframe.allowFullscreen = true;
    media.appendChild(iframe);
  } else if (item.image) {
    const img = document.createElement("img");
    img.src = item.image;
    img.alt = item.alt || item.title;
    img.addEventListener("click", () => openViewer(item));
    media.appendChild(img);
    fadeInImage(img);
  } else {
    const empty = document.createElement("p");
    empty.className = "media-empty";
    empty.textContent = t("noImage");
    media.appendChild(empty);
  }
}

// Bir fotoğrafı bulup gösteren ortak fonksiyon
let showToken = 0;
async function show(finder, dir = 0) {
  const token = ++showToken;
  showStatus(t("loading"));
  try {
    const item = await finder();
    if (token !== showToken) return; // daha yeni bir istek geldi
    renderApod(item, dir);
    hideStatus();
    loadPastYears(item.date);
  } catch (err) {
    if (token === showToken) showStatus(`${t("errorPrefix")}: ${err.message}`, true);
  }
}

function scrollToFeature() {
  $("sec-feature").scrollIntoView({ behavior: "smooth", block: "start" });
}

// ---------- Geçmiş yıllarda bu tarih ----------
async function loadPastYears(date) {
  const token = ++pastToken;
  $("onThisDayText").textContent = t("onThisDayText")(formatDate(date, { day: "numeric", month: "long" }));

  const year = Number(date.slice(0, 4));
  const dates = [];
  for (let i = 1; i <= PAST_YEARS; i++) {
    const d = sameDayInYear(date, year - i);
    if (d >= FIRST_DATE) dates.push(d);
  }
  if (!dates.length) {
    pastItems = [];
    renderCards($("onThisDay"), []);
    return;
  }

  renderSkeletonCards($("onThisDay"), dates.length);
  const results = await mapLimit(dates, PARALLEL, getExact);
  if (token !== pastToken) return; // kullanıcı bu arada başka güne geçti

  pastItems = results.filter(Boolean);
  renderCards($("onThisDay"), pastItems);
}

// ---------- Küçük kartlar ----------
function createCard(item, { index = 0, sub = null, context = null } = {}) {
  const view = displayText(item);
  const card = document.createElement("button");
  card.type = "button";
  card.className = "card";
  card.style.setProperty("--i", Math.min(index, 14));

  const mediaBox = document.createElement("div");
  mediaBox.className = "card-media";
  if (item.image) {
    const img = document.createElement("img");
    img.src = item.thumb || thumbUrl(item.image);
    img.alt = item.alt || item.title;
    img.loading = "lazy";
    img.decoding = "async";
    mediaBox.appendChild(img);
    fadeInImage(img);
  } else {
    const empty = document.createElement("span");
    empty.className = "card-empty";
    empty.textContent = t("noImageShort");
    mediaBox.appendChild(empty);
  }
  const badges = [];
  if (item.mediaType === "video") badges.push({ text: t("video") });
  const kind = kindLabel(item);
  if (kind) badges.push({ text: kind.text, hint: kind.hint, kind: true });
  if (badges.length) {
    const wrap = document.createElement("span");
    wrap.className = "card-badges";
    badges.forEach((b) => {
      const badge = document.createElement("span");
      badge.className = `card-badge${b.kind ? " kind" : ""}`;
      badge.textContent = b.text;
      if (b.hint) badge.title = b.hint;
      wrap.appendChild(badge);
    });
    mediaBox.appendChild(wrap);
  }
  card.appendChild(mediaBox);

  const text = document.createElement("div");
  text.className = "card-text";
  const title = document.createElement("span");
  title.className = "card-title";
  title.textContent = view.title;
  const date = document.createElement("span");
  date.className = "card-date";
  date.textContent = formatDate(item.date);
  text.append(title, date);
  if (sub) {
    const subEl = document.createElement("span");
    subEl.className = "card-sub";
    subEl.textContent = sub;
    text.appendChild(subEl);
  }
  card.appendChild(text);

  // Karta tıklayınca detay penceresi açılır; oklar bu listede ilerler
  card.addEventListener("click", () => openViewer(item, context));
  return card;
}

function renderCards(container, items, subFn = null, edge = null) {
  container.innerHTML = "";
  const context = { items, edge };
  items.forEach((item, i) => container.appendChild(createCard(item, { index: i, sub: subFn?.(item), context })));
}

function renderSkeletonCards(container, count) {
  container.innerHTML = "";
  for (let i = 0; i < count; i++) container.appendChild(skeletonCard(i));
}

function skeletonCard(index) {
  const card = document.createElement("div");
  card.className = "card skeleton-card";
  card.style.setProperty("--i", index);
  card.innerHTML =
    '<div class="card-media"></div><div class="card-text"><div class="skeleton-line"></div><div class="skeleton-line short"></div></div>';
  return card;
}

// ---------- Arşiv takvimi ----------
let calYear = null;
let calMonth = null; // 0-11
let calToken = 0;
let calItems = new Map(); // gösterilen aydaki tarih -> fotoğraf

function monthIndex(year, month) {
  return year * 12 + month;
}

function setCalendarMonth(year, month) {
  const min = monthIndex(1995, 5);
  const max = monthIndex(Number(latestDate.slice(0, 4)), Number(latestDate.slice(5, 7)) - 1);
  const target = Math.min(max, Math.max(min, monthIndex(year, month)));
  calYear = Math.floor(target / 12);
  calMonth = target % 12;
  renderCalendar(true);
}

async function renderCalendar(load = true) {
  if (calYear === null) return;
  const token = load ? ++calToken : calToken;
  const locale = t("locale");
  const first = new Date(Date.UTC(calYear, calMonth, 1));

  $("calLabel").textContent = first.toLocaleDateString(locale, { month: "long", year: "numeric", timeZone: "UTC" });
  $("calPicker").value = `${calYear}-${pad(calMonth + 1)}`;
  $("calPicker").min = "1995-06";
  $("calPicker").max = latestDate.slice(0, 7);
  $("calPrev").disabled = monthIndex(calYear, calMonth) <= monthIndex(1995, 5);
  $("calNext").disabled = `${calYear}-${pad(calMonth + 1)}` >= latestDate.slice(0, 7);

  // Haftanın günleri (pazartesiden başlar)
  const weekdays = $("calWeekdays");
  weekdays.innerHTML = "";
  for (let i = 0; i < 7; i++) {
    const span = document.createElement("span");
    span.textContent = new Date(Date.UTC(2024, 0, 1 + i)).toLocaleDateString(locale, { weekday: "short", timeZone: "UTC" });
    weekdays.appendChild(span);
  }

  const daysInMonth = new Date(Date.UTC(calYear, calMonth + 1, 0)).getUTCDate();
  const offset = (first.getUTCDay() + 6) % 7;
  const dates = Array.from({ length: daysInMonth }, (_, i) => `${calYear}-${pad(calMonth + 1)}-${pad(i + 1)}`);
  const valid = dates.filter((d) => d >= FIRST_DATE && d <= latestDate);

  if (load) {
    calItems = new Map();
    drawCalendarGrid(offset, dates, true);
    const results = await mapLimit(valid, PARALLEL, getExact);
    if (token !== calToken) return; // bu arada başka aya geçildi
    results.forEach((item) => item && calItems.set(item.date, item));
  }
  drawCalendarGrid(offset, dates, false);
}

function drawCalendarGrid(offset, dates, loading) {
  const grid = $("calGrid");
  grid.innerHTML = "";
  for (let i = 0; i < offset; i++) {
    const blank = document.createElement("span");
    blank.className = "cal-day blank";
    grid.appendChild(blank);
  }
  dates.forEach((date, i) => {
    const item = calItems.get(date);
    const cell = document.createElement("button");
    cell.type = "button";
    cell.className = "cal-day";
    cell.dataset.date = date;
    cell.style.setProperty("--i", i);

    const num = document.createElement("span");
    num.className = "cal-num";
    num.textContent = Number(date.slice(8));

    if (loading && date >= FIRST_DATE && date <= latestDate) {
      cell.classList.add("skeleton");
      cell.disabled = true;
    } else if (item) {
      cell.title = `${formatDate(date)} · ${displayText(item).title}`;
      if (item.image) {
        const img = document.createElement("img");
        img.src = thumbUrl(item.image, 240);
        img.alt = "";
        img.loading = "lazy";
        cell.appendChild(img);
        fadeInImage(img);
      }
      if (item.mediaType === "video") {
        const v = document.createElement("span");
        v.className = "cal-video";
        cell.appendChild(v);
      }
      // Takvimden açılan pencerede oklar o aydaki günlerde ilerler
      cell.addEventListener("click", () => {
        const monthItems = [...calItems.values()].sort((a, b) => a.date.localeCompare(b.date));
        openViewer(item, { items: monthItems });
      });
    } else {
      cell.disabled = true;
    }
    cell.appendChild(num);
    grid.appendChild(cell);
  });
  markCalendarSelection();
}

function markCalendarSelection() {
  document.querySelectorAll(".cal-day.selected").forEach((el) => el.classList.remove("selected"));
  if (!currentApod) return;
  document.querySelector(`.cal-day[data-date="${currentApod.date}"]`)?.classList.add("selected");
}

// ---------- Doğum günü fotoğrafları ----------
let birthdayToken = 0;
let birthdayItems = [];
let birthDate = null;

async function loadBirthday(dateStr) {
  if (!isValidDate(dateStr)) return;
  const token = ++birthdayToken;
  birthDate = dateStr;
  saveSetting(KEYS.birthday, dateStr);

  const birthYear = Number(dateStr.slice(0, 4));
  const lastYear = Number(latestDate.slice(0, 4));
  const dates = [];
  for (let y = Math.max(birthYear, 1995); y <= lastYear; y++) {
    const d = sameDayInYear(dateStr, y);
    if (d >= FIRST_DATE && d <= latestDate) dates.push(d);
  }

  birthdayItems = [];
  $("birthdaySummary").textContent = "";
  if (!dates.length) {
    $("birthdayGrid").innerHTML = "";
    $("birthdaySummary").textContent = t("birthdayNone");
    return;
  }

  const progress = $("birthdayProgress");
  const bar = $("birthdayBar");
  const text = $("birthdayProgressText");
  progress.classList.remove("hidden");
  bar.style.width = "0%";
  text.textContent = t("birthdayProgress")(0, dates.length);
  renderSkeletonCards($("birthdayGrid"), Math.min(dates.length, 10));

  let done = 0;
  const results = await mapLimit(dates, PARALLEL, async (d) => {
    const item = await getExact(d);
    done++;
    if (token === birthdayToken) {
      const percent = Math.round((done / dates.length) * 100);
      bar.style.width = `${percent}%`;
      progress.setAttribute("aria-valuenow", percent);
      text.textContent = t("birthdayProgress")(done, dates.length);
    }
    return item;
  });
  if (token !== birthdayToken) return;

  birthdayItems = results.filter(Boolean);
  if (birthdayItems.length && typeof unlockBadge === "function") unlockBadge("birthday");
  setTimeout(() => progress.classList.add("hidden"), 400);
  renderBirthdayResults(true);
}

function renderBirthdayResults(withSummary = true) {
  if (!birthDate) return;
  const birthYear = Number(birthDate.slice(0, 4));
  if (birthdayItems.length) {
    $("birthdaySummary").textContent = t("birthdaySummary")(birthdayItems.length, birthdayItems[0].date.slice(0, 4));
  } else if (withSummary && $("birthdaySummary").textContent) {
    $("birthdaySummary").textContent = t("birthdayNone");
  }
  renderCards($("birthdayGrid"), birthdayItems, (item) => t("birthdayAge")(Number(item.date.slice(0, 4)) - birthYear));
}

// ---------- Arşiv: arama, filtre, sayfalama ----------
const ARCHIVE_PER_PAGE = 20; // bir arşiv sayfasında kaç fotoğraf gösterilir (4 ve 5 sütuna tam bölünür)
let archivePageNo = 1; // ekrandaki arşiv sayfası
let archivePageItems = []; // ekrandaki arşiv sayfasının fotoğrafları
let archiveQuery = "";
let archiveFilter = "all";
let archiveBusy = false;
let archiveToken = 0;
// Arama/filtre için taranan günler (en yeniden eskiye, sırayla)
let scanItems = [];
let scanPage = 0;
let scanDone = false;

function normalizeText(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/ı/g, "i")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

function matchesArchive(item) {
  if (archiveFilter !== "all" && item.mediaType !== archiveFilter) return false;
  if (!archiveQuery) return true;
  const tr = translations.get(item.date);
  const haystack = normalizeText([item.title, item.explanation, item.alt, tr?.title, tr?.explanation].join(" "));
  return normalizeText(archiveQuery)
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => haystack.includes(word));
}

function isFiltering() {
  return Boolean(archiveQuery) || archiveFilter !== "all";
}

function archiveDayCount() {
  return daysBetween(FIRST_DATE, latestDate) + 1;
}

// Filtre yokken toplam sayfa sayısı arşivin gün sayısından hesaplanır
function archiveTotalPages() {
  if (!isFiltering()) return Math.max(1, Math.ceil(archiveDayCount() / ARCHIVE_PER_PAGE));
  return Math.max(1, Math.ceil(scanItems.filter(matchesArchive).length / ARCHIVE_PER_PAGE));
}

// Aramada daha eski günler henüz taranmadıysa sonraki sayfalar olabilir
function archiveMayHaveMore() {
  return isFiltering() && !scanDone;
}

// Filtre yokken: arşivdeki sıra numarasına göre fotoğrafları getir (en yeni = 0)
async function itemsByIndex(start, end) {
  const firstPage = Math.floor(start / PAGE_SIZE) + 1;
  const lastPage = Math.floor((end - 1) / PAGE_SIZE) + 1;
  const pages = [];
  for (let p = firstPage; p <= lastPage; p++) pages.push(p);
  const results = await Promise.all(pages.map(fetchPage));
  const offset = (firstPage - 1) * PAGE_SIZE;
  return results.flat().slice(start - offset, end - offset);
}

// Arama/filtre varken: istenen kadar sonuç bulunana kadar eski günleri tara
async function scanUntil(neededMatches) {
  let dry = 0; // arka arkaya sonuç çıkmayan API sayfası sayısı
  while (!scanDone && dry < 6 && scanItems.filter(matchesArchive).length < neededMatches) {
    const items = await fetchPage(scanPage + 1);
    scanPage++;
    if (!items.length) {
      scanDone = true;
      break;
    }
    scanItems.push(...items);
    dry = items.some(matchesArchive) ? 0 : dry + 1;
  }
}

async function goArchivePage(page, scroll = true) {
  const token = ++archiveToken;
  archivePageNo = Math.max(1, page);
  archiveBusy = true;
  renderSkeletonCards($("archiveGrid"), ARCHIVE_PER_PAGE);
  renderPager();
  if (scroll) $("sec-archive").scrollIntoView({ behavior: "smooth", block: "start" });

  try {
    let items;
    if (!isFiltering()) {
      archivePageNo = Math.min(archivePageNo, archiveTotalPages());
      const start = (archivePageNo - 1) * ARCHIVE_PER_PAGE;
      items = await itemsByIndex(start, start + ARCHIVE_PER_PAGE);
    } else {
      await scanUntil(archivePageNo * ARCHIVE_PER_PAGE);
      archivePageNo = Math.min(archivePageNo, archiveTotalPages());
      const matched = scanItems.filter(matchesArchive);
      items = matched.slice((archivePageNo - 1) * ARCHIVE_PER_PAGE, archivePageNo * ARCHIVE_PER_PAGE);
    }
    if (token !== archiveToken) return;
    archivePageItems = items;
  } catch (err) {
    if (token === archiveToken) toast(`${t("errorPrefix")}: ${err.message}`);
  } finally {
    if (token === archiveToken) {
      archiveBusy = false;
      renderArchiveView(true);
    }
  }
}

function renderArchiveView(animate = true) {
  const grid = $("archiveGrid");
  renderCards(grid, archivePageItems, null, archiveContextEdge);
  if (!animate) grid.querySelectorAll(".card").forEach((c) => (c.style.animation = "none"));

  // Bilgi satırı
  const days = archiveDayCount().toLocaleString(t("locale"));
  $("archiveCount").textContent = isFiltering()
    ? t("archiveFound")(scanItems.filter(matchesArchive).length, scanItems.length.toLocaleString(t("locale")))
    : t("archivePageInfo")(archivePageNo, archiveTotalPages().toLocaleString(t("locale")), days);

  // Boş sonuç ve "daha eski günlerde ara"
  const empty = !archiveBusy && archivePageItems.length === 0;
  $("archiveEmpty").textContent = t("archiveEmpty");
  $("archiveEmpty").classList.toggle("hidden", !empty);
  const more = $("moreBtn");
  more.textContent = t("searchOlder");
  more.classList.toggle("hidden", !(isFiltering() && !scanDone && (empty || archivePageNo >= archiveTotalPages())));
  more.disabled = archiveBusy;
  renderPager();
}

// Sayfa numaraları: 1 … 4 5 [6] 7 8 … 958
function renderPager() {
  const pager = $("pager");
  pager.innerHTML = "";
  if (!latestDate) return;
  const total = archiveTotalPages();
  const current = archivePageNo;
  const more = archiveMayHaveMore();

  const makeBtn = (label, page, { active = false, disabled = false, aria = "" } = {}) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "page-btn" + (active ? " active" : "");
    btn.textContent = label;
    btn.disabled = disabled || archiveBusy;
    if (aria) btn.setAttribute("aria-label", aria);
    if (active) btn.setAttribute("aria-current", "page");
    btn.addEventListener("click", () => goArchivePage(page));
    return btn;
  };
  const gap = () => {
    const span = document.createElement("span");
    span.className = "page-gap";
    span.textContent = "…";
    return span;
  };

  pager.appendChild(makeBtn("‹", current - 1, { disabled: current <= 1, aria: t("pagePrev") }));
  const pages = new Set([1, total, current - 2, current - 1, current, current + 1, current + 2]);
  let last = 0;
  [...pages]
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b)
    .forEach((p) => {
      if (p - last > 1) pager.appendChild(gap());
      pager.appendChild(makeBtn(p.toLocaleString(t("locale")), p, { active: p === current }));
      last = p;
    });
  if (more) pager.appendChild(gap());
  pager.appendChild(makeBtn("›", current + 1, { disabled: current >= total && !more, aria: t("pageNext") }));

  // Sayfaya git (çok sayfa varsa)
  if (total > 7) {
    const form = document.createElement("form");
    form.className = "page-jump";
    const input = document.createElement("input");
    input.type = "number";
    input.min = 1;
    input.max = total;
    input.className = "input";
    input.placeholder = t("goToPage");
    input.setAttribute("aria-label", t("goToPage"));
    form.appendChild(input);
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const n = Number(input.value);
      if (n >= 1) goArchivePage(Math.min(n, total));
    });
    pager.appendChild(form);
  }
}

// Görüntüleyicide sayfanın sonuna gelince arşivin bir sonraki sayfasına geç
async function archiveContextEdge(dir) {
  const target = archivePageNo + dir;
  if (target < 1) return null;
  if (target > archiveTotalPages() && !archiveMayHaveMore()) return null;
  await goArchivePage(target, false);
  return archivePageItems.length ? archivePageItems : null;
}

let searchTimer = null;
function onSearchInput(e) {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    archiveQuery = e.target.value.trim();
    goArchivePage(1, false);
  }, 250);
}

function updateChips() {
  document.querySelectorAll(".chip[data-filter]").forEach((chip) => {
    chip.classList.toggle("active", chip.dataset.filter === archiveFilter);
    chip.setAttribute("aria-pressed", chip.dataset.filter === archiveFilter);
  });
}

function setArchiveFilter(filter) {
  archiveFilter = filter;
  updateChips();
  goArchivePage(1, false);
}

// ---------- Favoriler ----------
function getFavorites() {
  const favs = loadSetting(KEYS.fav, []);
  return Array.isArray(favs) ? favs : [];
}

function isFavorite(date) {
  return getFavorites().some((f) => f.date === date);
}

function toggleFavorite(item = currentApod) {
  if (!item) return;
  let favs = getFavorites();
  const wasFav = isFavorite(item.date);
  if (wasFav) {
    favs = favs.filter((f) => f.date !== item.date);
  } else {
    favs.unshift(item); // tüm bilgiyi sakla, tekrar istek gerekmesin
  }
  if (!saveSetting(KEYS.fav, favs)) {
    toast(t("saveFailed"));
    return;
  }
  toast(wasFav ? t("favRemoved") : t("favAdded"));
  if (typeof checkBadges === "function") checkBadges();
  updateFavButton(true);
  if (viewer.open) updateViewerFav(true);
  renderFavorites();
}

function updateFavButton(animate) {
  const fav = Boolean(currentApod && isFavorite(currentApod.date));
  const btn = $("favBtn");
  $("favLabel").textContent = fav ? t("removeFav") : t("addFav");
  btn.classList.toggle("saved", fav);
  if (!animate) btn.querySelector("svg").style.animation = "none";
  else btn.querySelector("svg").style.animation = "";
}

function renderFavorites() {
  const favs = getFavorites();
  renderCards($("favorites"), favs);
  $("noFav").classList.toggle("hidden", favs.length > 0);
  $("favCount").textContent = favs.length ? t("favCount")(favs.length) : "";
}

// ---------- İndirme ve paylaşma ----------
async function downloadItem(item) {
  if (!item) return;
  const url = item.mediaType === "video" && item.videoFile ? item.videoFile : item.image;
  if (!url) return;
  toast(t("downloading"));
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(res.status);
    const blob = await res.blob();
    const ext = (blob.type.split("/")[1] || "jpg").replace("jpeg", "jpg").split(";")[0];
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = item.library ? `nasa-${item.nasaId}.${ext}` : `apod-${item.date}.${ext}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 10000);
    toast(t("downloaded"));
  } catch {
    // Tarayıcı doğrudan indirmeye izin vermezse yeni sekmede aç
    window.open(url, "_blank", "noopener");
  }
}

function shareUrl(date) {
  return `${location.href.split("#")[0]}#${date}`;
}

async function shareCurrent() {
  if (!currentApod) return;
  const url = shareUrl(currentApod.date);
  const isLocal = location.protocol === "file:";

  // Telefonlarda sistemin paylaş menüsünü aç
  if (!isLocal && navigator.share && matchMedia("(pointer: coarse)").matches) {
    try {
      await navigator.share({ title: currentApod.title, url });
      return;
    } catch (err) {
      if (err.name === "AbortError") return;
    }
  }
  try {
    await navigator.clipboard.writeText(url);
    toast(isLocal ? t("linkCopiedLocal") : t("linkCopied"));
  } catch {
    toast(t("copyFailed"));
  }
}

function dateFromHash() {
  const date = decodeURIComponent(location.hash.slice(1));
  return isValidDate(date) ? date : null;
}

// ---------- Detay penceresi (tam ekran görüntüleyici) ----------
// Bir karta tıklayınca açılır. Oklar, kartın geldiği listede (arşiv sayfası,
// takvimdeki ay, doğum günleri...) ilerler; ana fotoğraftan açılınca gün gün ilerler.
const viewer = {
  open: false,
  item: null,
  list: null, // gezilen liste (yoksa gün gün)
  index: 0,
  edge: null, // listenin sonuna gelince yeni liste getiren fonksiyon (arşiv sayfaları)
  scale: 1,
  x: 0,
  y: 0,
  drag: null,
  lastFocus: null,
  busy: false,
};

function openViewer(item, context = null) {
  if (!item) return;
  const el = $("lightbox");
  viewer.list = context?.items || null;
  viewer.edge = context?.edge || null;
  // Aynı tarihli farklı öğeler olabilir (NASA görsel arşivi), önce nesnenin kendisini ara
  const exact = viewer.list ? viewer.list.indexOf(item) : -1;
  viewer.index = viewer.list ? Math.max(0, exact >= 0 ? exact : viewer.list.findIndex((x) => x.date === item.date)) : 0;
  if (!viewer.open) {
    viewer.open = true;
    viewer.lastFocus = document.activeElement;
    el.hidden = false;
    document.body.classList.add("no-scroll");
    requestAnimationFrame(() => el.classList.add("open"));
  }
  renderViewer(item, 0);
  $("lbClose").focus();
}

function closeViewer() {
  if (!viewer.open) return;
  const el = $("lightbox");
  viewer.open = false;
  el.classList.remove("open");
  document.body.classList.remove("no-scroll");
  setTimeout(() => {
    if (!viewer.open) {
      el.hidden = true;
      $("lbStage").innerHTML = "";
    }
  }, 300);
  viewer.lastFocus?.focus?.();
}

// dir: -1 önceki, +1 sonraki
async function viewerStep(dir) {
  if (!viewer.open || viewer.busy) return;

  // Ana fotoğraftan açıldıysa gün gün ilerle (ana sayfa da birlikte değişir)
  if (!viewer.list) {
    if (dir < 0) goPrev();
    else goNext();
    return;
  }

  const next = viewer.index + dir;
  if (next >= 0 && next < viewer.list.length) {
    viewer.index = next;
    renderViewer(viewer.list[next], dir);
    return;
  }

  // Listenin sonu: arşivde bir sonraki/önceki sayfaya geç
  if (viewer.edge) {
    viewer.busy = true;
    $("lbCounter").textContent = t("loading");
    try {
      const items = await viewer.edge(dir);
      if (items && items.length && viewer.open) {
        viewer.list = items;
        viewer.index = dir > 0 ? 0 : items.length - 1;
        renderViewer(items[viewer.index], dir);
      }
    } finally {
      viewer.busy = false;
      updateViewerNav();
    }
  }
}

function updateViewerNav() {
  const item = viewer.item;
  if (!item) return;
  let prevOff;
  let nextOff;
  if (!viewer.list) {
    prevOff = item.date <= FIRST_DATE;
    nextOff = item.date >= latestDate;
    $("lbCounter").textContent = "";
  } else {
    prevOff = viewer.index <= 0 && !viewer.edge;
    nextOff = viewer.index >= viewer.list.length - 1 && !viewer.edge;
    if (viewer.edge && viewer.index <= 0 && archivePageNo <= 1) prevOff = true;
    $("lbCounter").textContent = t("counter")(viewer.index + 1, viewer.list.length);
  }
  $("lbPrev").disabled = prevOff;
  $("lbNext").disabled = nextOff;
}

function renderViewer(item, dir = 0) {
  viewer.item = item;
  if (typeof trackView === "function") trackView(item);
  const view = displayText(item);

  $("lbDate").textContent = formatDate(item.date);
  $("lbTitle").textContent = view.title;

  // Medya
  const stage = $("lbStage");
  stage.innerHTML = "";
  if (item.mediaType === "video" && item.videoFile) {
    const video = document.createElement("video");
    video.src = item.videoFile;
    video.poster = item.image || "";
    video.controls = true;
    video.autoplay = true;
    video.playsInline = true;
    stage.appendChild(video);
  } else if (item.mediaType === "video" && item.videoEmbed) {
    const iframe = document.createElement("iframe");
    iframe.src = item.videoEmbed;
    iframe.title = item.title;
    iframe.allowFullscreen = true;
    stage.appendChild(iframe);
  } else if (item.image) {
    const img = document.createElement("img");
    img.src = item.image;
    img.alt = item.alt || item.title;
    img.draggable = false;
    stage.appendChild(img);
    fadeInImage(img);
  } else {
    const empty = document.createElement("p");
    empty.className = "media-empty";
    empty.textContent = t("noImage");
    stage.appendChild(empty);
  }
  resetZoom();

  renderViewerInfo(item);
  updateViewerNav();

  // Geçiş animasyonu (yönüne göre kayarak gelir)
  if (dir) {
    const body = $("lbBody");
    body.style.setProperty("--dx", `${dir * 40}px`);
    replay(body, "swap");
  }

  // Türkçe modda çeviri daha önce açıldıysa burada da otomatik çevir
  if (lang === "tr" && autoTranslate && !item.library && !translations.has(item.date)) {
    translatorState().then((state) => {
      if (state !== "available") return;
      translateItem(item, () => {})
        .then(() => {
          if (viewer.open && viewer.item === item) {
            renderViewerInfo(item);
            $("lbTitle").textContent = displayText(item).title;
          }
        })
        .catch(() => {});
    });
  }
}

function renderViewerInfo(item) {
  const view = displayText(item);
  const isVideo = item.mediaType === "video";

  const kind = kindLabel(item);
  $("lbMeta").textContent = `${formatDate(item.date, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}${isVideo ? ` · ${t("video")}` : ""}${kind ? ` · ${kind.text}` : ""}`;
  $("lbMeta").title = kind?.hint || "";
  $("lbInfoTitle").textContent = view.title;

  const credit = $("lbCredit");
  credit.innerHTML = "";
  if (item.credit) {
    credit.append(`${t("credit")}: `);
    if (item.creditUrl) {
      const a = document.createElement("a");
      a.href = item.creditUrl;
      a.target = "_blank";
      a.rel = "noopener";
      a.textContent = item.credit;
      credit.appendChild(a);
    } else {
      credit.append(item.credit);
    }
  }

  $("lbText").textContent = view.explanation;
  $("lbText").lang = view.translated ? "tr" : "en";
  $("lbInfo").scrollTop = 0;

  const rows = [];
  if (item.width && item.height) rows.push([t("detailResolution"), `${item.width} × ${item.height} px`]);
  if (view.alt) rows.push([t("detailAlt"), view.alt]);
  if (kind) rows.push([t("detailKind"), kind.hint]);
  if (item.library) {
    rows.push([t("detailSource"), t("librarySource")]);
    if (item.center) rows.push([t("detailCenter"), item.center]);
    if (item.keywords?.length) rows.push([t("detailKeywords"), item.keywords.slice(0, 8).join(", ")]);
  } else {
    rows.push([t("detailArchive"), t("archiveDay")(daysBetween(FIRST_DATE, item.date) + 1)]);
  }
  const details = $("lbDetails");
  details.innerHTML = "";
  rows.forEach(([label, value]) => {
    const dt = document.createElement("dt");
    dt.textContent = label;
    const dd = document.createElement("dd");
    dd.textContent = value;
    details.append(dt, dd);
  });

  $("lbNasa").href = item.page;
  // Favoriler ve "ana sayfada aç" sadece günün fotoğrafları için
  $("lbFav").classList.toggle("hidden", Boolean(item.library));
  $("lbOpenMain").classList.toggle("hidden", Boolean(item.library));
  updateViewerFav(false);
}

function updateViewerFav(animate) {
  if (!viewer.item) return;
  const fav = isFavorite(viewer.item.date);
  const btn = $("lbFav");
  $("lbFavLabel").textContent = fav ? t("removeFav") : t("addFav");
  btn.classList.toggle("saved", fav);
  btn.querySelector("svg").style.animation = animate ? "" : "none";
}

function lightboxImage() {
  return $("lbStage").querySelector("img");
}

function applyZoom() {
  const img = lightboxImage();
  if (img) img.style.transform = `translate(${viewer.x}px, ${viewer.y}px) scale(${viewer.scale})`;
  $("lbStage").classList.toggle("zoomed", viewer.scale > 1);
  $("lbZoomLevel").textContent = `${Math.round(viewer.scale * 100)}%`;
  $("lbZoomOut").disabled = viewer.scale <= 1;
  $("lbZoomIn").disabled = viewer.scale >= 6 || !img;
}

// Belirtilen noktaya doğru yakınlaştır (fare imlecinin altı sabit kalır)
function zoomTo(scale, clientX, clientY) {
  if (!lightboxImage()) return;
  const stage = $("lbStage");
  const rect = stage.getBoundingClientRect();
  const cx = (clientX ?? rect.left + rect.width / 2) - rect.left - rect.width / 2;
  const cy = (clientY ?? rect.top + rect.height / 2) - rect.top - rect.height / 2;
  const newScale = Math.min(6, Math.max(1, scale));
  const ratio = newScale / viewer.scale;
  viewer.x = cx - (cx - viewer.x) * ratio;
  viewer.y = cy - (cy - viewer.y) * ratio;
  viewer.scale = newScale;
  if (newScale === 1) {
    viewer.x = 0;
    viewer.y = 0;
  }
  applyZoom();
}

function resetZoom() {
  viewer.scale = 1;
  viewer.x = 0;
  viewer.y = 0;
  applyZoom();
}

function setupViewer() {
  const stage = $("lbStage");

  stage.addEventListener(
    "wheel",
    (e) => {
      if (!lightboxImage()) return;
      e.preventDefault();
      zoomTo(viewer.scale * (e.deltaY < 0 ? 1.2 : 1 / 1.2), e.clientX, e.clientY);
    },
    { passive: false }
  );

  stage.addEventListener("dblclick", (e) => {
    if (!lightboxImage()) return;
    if (viewer.scale > 1) resetZoom();
    else zoomTo(2.5, e.clientX, e.clientY);
  });

  // Sürükleyerek gezinme
  stage.addEventListener("pointerdown", (e) => {
    if (viewer.scale <= 1 || !lightboxImage()) return;
    viewer.drag = { id: e.pointerId, x: e.clientX, y: e.clientY };
    stage.setPointerCapture(e.pointerId);
    stage.classList.add("dragging");
  });
  stage.addEventListener("pointermove", (e) => {
    const drag = viewer.drag;
    if (!drag || drag.id !== e.pointerId) return;
    viewer.x += e.clientX - drag.x;
    viewer.y += e.clientY - drag.y;
    drag.x = e.clientX;
    drag.y = e.clientY;
    applyZoom();
  });
  const endDrag = () => {
    viewer.drag = null;
    stage.classList.remove("dragging");
  };
  stage.addEventListener("pointerup", endDrag);
  stage.addEventListener("pointercancel", endDrag);

  // Resmin dışındaki boş alana tıklayınca kapat
  stage.addEventListener("click", (e) => {
    if (e.target === stage && viewer.scale === 1) closeViewer();
  });

  $("lbClose").addEventListener("click", closeViewer);
  $("lbZoomIn").addEventListener("click", () => zoomTo(viewer.scale * 1.5));
  $("lbZoomOut").addEventListener("click", () => zoomTo(viewer.scale / 1.5));
  $("lbReset").addEventListener("click", resetZoom);
  $("lbInfoBtn").addEventListener("click", () => {
    const hidden = $("lightbox").classList.toggle("info-off");
    $("lbInfoBtn").setAttribute("aria-pressed", String(!hidden));
  });
  $("lbPrev").addEventListener("click", () => viewerStep(-1));
  $("lbNext").addEventListener("click", () => viewerStep(1));
  $("lbFav").addEventListener("click", () => toggleFavorite(viewer.item));
  $("lbDownload").addEventListener("click", () => downloadItem(viewer.item));
  $("lbOpenMain").addEventListener("click", () => {
    const item = viewer.item;
    closeViewer();
    const dir = currentApod ? Math.sign(item.date.localeCompare(currentApod.date)) : 0;
    show(async () => item, dir);
    scrollToFeature();
  });
}

// ---------- Bölümler kaydırınca belirsin ----------
function setupReveal() {
  const sections = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window)) {
    sections.forEach((s) => s.classList.add("visible"));
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { rootMargin: "0px 0px -60px 0px" }
  );
  sections.forEach((s) => observer.observe(s));
}

// ---------- Gezinme ----------
function goPrev() {
  if (currentApod && currentApod.date > FIRST_DATE) {
    show(() => getByDate(addDays(currentApod.date, -1), -1), -1);
  }
}

function goNext() {
  if (currentApod && currentApod.date < latestDate) {
    show(() => getByDate(addDays(currentApod.date, 1), +1), +1);
  }
}

function setupEvents() {
  $("prevBtn").addEventListener("click", goPrev);
  $("nextBtn").addEventListener("click", goNext);
  $("todayBtn").addEventListener("click", () => show(() => getByDate(latestDate), 1));
  $("randomBtn").addEventListener("click", () => show(getRandom, 0));
  $("favBtn").addEventListener("click", () => toggleFavorite());
  $("downloadBtn").addEventListener("click", () => downloadItem(currentApod));
  $("shareBtn").addEventListener("click", shareCurrent);
  $("expandBtn").addEventListener("click", () => openViewer(currentApod));
  $("themeBtn").addEventListener("click", () => setTheme(currentTheme() === "light" ? "dark" : "light"));
  $("brandLink").addEventListener("click", (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  // Ortadaki tarihe tıklayınca takvimi aç
  $("dateBtn").addEventListener("click", () => {
    const picker = $("datePicker");
    try {
      picker.showPicker();
    } catch {
      picker.click();
    }
  });
  $("datePicker").addEventListener("change", (e) => {
    const date = e.target.value;
    if (isValidDate(date)) show(() => getByDate(date, -1), Math.sign(date.localeCompare(currentApod?.date || date)));
  });

  // Üst menü: bölüme kaydır
  document.querySelectorAll(".topnav button").forEach((btn) => {
    btn.addEventListener("click", () => $(btn.dataset.target).scrollIntoView({ behavior: "smooth", block: "start" }));
  });

  document.querySelectorAll(".lang-switch button").forEach((btn) => {
    btn.addEventListener("click", () => setLang(btn.dataset.lang));
  });

  // Takvim
  $("calPrev").addEventListener("click", () => setCalendarMonth(calYear, calMonth - 1));
  $("calNext").addEventListener("click", () => setCalendarMonth(calYear, calMonth + 1));
  $("calPicker").addEventListener("change", (e) => {
    const [y, m] = e.target.value.split("-").map(Number);
    if (y && m) setCalendarMonth(y, m - 1);
  });

  // Doğum günü
  $("birthdayForm").addEventListener("submit", (e) => {
    e.preventDefault();
    loadBirthday($("birthdayInput").value);
  });

  // Arşiv
  $("searchInput").addEventListener("input", onSearchInput);
  document.querySelectorAll(".chip[data-filter]").forEach((chip) => {
    chip.addEventListener("click", () => setArchiveFilter(chip.dataset.filter));
  });
  $("moreBtn").addEventListener("click", () => {
    const full = archivePageItems.length >= ARCHIVE_PER_PAGE;
    goArchivePage(full ? archivePageNo + 1 : archivePageNo, false);
  });

  // Paylaşılan bağlantı: adres çubuğundaki tarih değişirse o güne git
  window.addEventListener("hashchange", () => {
    const date = dateFromHash();
    if (date && latestDate && date !== currentApod?.date) {
      show(() => getByDate(date, -1), Math.sign(date.localeCompare(currentApod?.date || date)));
    }
  });

  // Klavye kısayolları
  document.addEventListener("keydown", (e) => {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return; // oyunlar okları kendisi kullanır
    if (viewer.open) {
      if (e.key === "Escape") closeViewer();
      else if (e.key === "ArrowLeft") viewerStep(-1);
      else if (e.key === "ArrowRight") viewerStep(1);
      else if (e.key === "+" || e.key === "=") zoomTo(viewer.scale * 1.5);
      else if (e.key === "-") zoomTo(viewer.scale / 1.5);
      else if (e.key === "0") resetZoom();
      return;
    }
    if (e.target.closest("input, textarea, select")) return;
    if (e.key === "ArrowLeft") goPrev();
    if (e.key === "ArrowRight") goNext();
  });

  setupViewer();
}

// ---------- Uygulama olarak yükleme (PWA) ----------
// Service worker sadece site bir sunucudan (http/https) açılınca çalışır.
function registerServiceWorker() {
  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
  }
}

// ---------- Başlangıç ----------
async function init() {
  setupEvents();
  setupReveal();
  applyTexts();
  updateChips();
  $("datePicker").min = FIRST_DATE;
  $("birthdayInput").max = new Date().toISOString().slice(0, 10);
  renderSkeletonCards($("onThisDay"), PAST_YEARS);
  renderSkeletonCards($("archiveGrid"), ARCHIVE_PER_PAGE);

  try {
    const items = await fetchPage(1); // en yeni 25 gün
    if (!items.length) throw new Error(t("noPhotos"));
    latestDate = items[0].date;
    clearCache(); // eski günlere ait önbelleği temizle
    $("datePicker").max = latestDate;

    // Bağlantıda tarih varsa o günü, yoksa en yeni günü göster
    const hashDate = dateFromHash();
    if (hashDate && hashDate !== latestDate) {
      await show(() => getByDate(hashDate, -1), 0);
      if (!currentApod) renderApod(items[0], 0);
    } else {
      renderApod(items[0], 0);
      loadPastYears(items[0].date);
    }

    // Arşiv ilk sayfayla başlar; arama için ilk sayfa zaten taranmış sayılır
    scanItems = [...items];
    scanPage = 1;
    goArchivePage(1, false);

    // Takvim gösterilen fotoğrafın ayıyla açılır
    const shown = currentApod.date;
    setCalendarMonth(Number(shown.slice(0, 4)), Number(shown.slice(5, 7)) - 1);

    // Daha önce girilen doğum günü varsa tekrar göster
    const savedBirthday = loadSetting(KEYS.birthday, null);
    if (isValidDate(savedBirthday)) {
      $("birthdayInput").value = savedBirthday;
      loadBirthday(savedBirthday);
    }
  } catch (err) {
    showStatus(`${t("errorPrefix")}: ${err.message}`, true);
    $("apod").classList.add("hidden");
  }
}

registerServiceWorker();
init();
