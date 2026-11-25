// =============================================
// Gökyüzü Takvimi – NASA Görsel ve Video Arşivi
// İkinci veri kaynağı: images-api.nasa.gov (140.000+ görsel, API anahtarı gerekmez)
// Hubble, James Webb, Mars, Apollo, Uluslararası Uzay İstasyonu... aranabilir.
// Sonuçlar mevcut kartlarla gösterilir, tıklanınca detay penceresinde açılır.
// =============================================

const LIBRARY_API = "https://images-api.nasa.gov/search";
const LIBRARY_PAGE_SIZE = 24;

Object.assign(TEXTS.tr, {
  navLibrary: "Keşfet",
  libTitle: "NASA görsel arşivi",
  libText:
    "NASA'nın 140.000'den fazla görseli arasında ara: Hubble ve James Webb teleskopları, Mars gezginleri, Apollo görevleri, Uluslararası Uzay İstasyonu ve daha fazlası. Arşiv İngilizce; Türkçe yazdığın yaygın kelimeler otomatik çevrilir.",
  libPlaceholder: "Ara (ör. Satürn, kara delik, astronot)",
  libSearch: "Ara",
  libCount: (n, q) => `"${q}" için ${n.toLocaleString("tr-TR")} görsel`,
  libEmpty: (q) => `"${q}" için görsel bulunamadı. Başka bir kelime dene.`,
  libFailed: "NASA görsel arşivine ulaşılamadı. Biraz sonra tekrar dene.",
  libMore: "Daha fazla göster",
  libLoading: "Yükleniyor…",
  libChips: [
    ["Hubble", "hubble"],
    ["James Webb", "james webb telescope"],
    ["Mars", "mars rover"],
    ["Apollo 11", "apollo 11"],
    ["Uzay istasyonu", "international space station"],
    ["Satürn", "saturn cassini"],
    ["Jüpiter", "jupiter juno"],
    ["Bulutsular", "nebula"],
    ["Uzay yürüyüşü", "spacewalk"],
  ],
});

Object.assign(TEXTS.en, {
  navLibrary: "Explore",
  libTitle: "NASA image library",
  libText:
    "Search more than 140,000 NASA images: the Hubble and James Webb telescopes, Mars rovers, Apollo missions, the International Space Station and more.",
  libPlaceholder: "Search (e.g. Saturn, black hole, astronaut)",
  libSearch: "Search",
  libCount: (n, q) => `${n.toLocaleString("en-US")} images for "${q}"`,
  libEmpty: (q) => `No images found for "${q}". Try another word.`,
  libFailed: "Couldn't reach the NASA image library. Try again in a moment.",
  libMore: "Show more",
  libLoading: "Loading…",
  libChips: [
    ["Hubble", "hubble"],
    ["James Webb", "james webb telescope"],
    ["Mars", "mars rover"],
    ["Apollo 11", "apollo 11"],
    ["Space station", "international space station"],
    ["Saturn", "saturn cassini"],
    ["Jupiter", "jupiter juno"],
    ["Nebulae", "nebula"],
    ["Spacewalk", "spacewalk"],
  ],
});

// Arşiv İngilizce olduğu için sık kullanılan Türkçe kelimeleri çevir
const TR_TO_EN = {
  "kara delik": "black hole",
  "uzay istasyonu": "space station",
  "uzay yürüyüşü": "spacewalk",
  "güneş tutulması": "solar eclipse",
  "ay tutulması": "lunar eclipse",
  "kuyruklu yıldız": "comet",
  "samanyolu": "milky way",
  "astronot": "astronaut",
  "bulutsu": "nebula",
  "galaksi": "galaxy",
  "gökada": "galaxy",
  "gezegen": "planet",
  "yıldız": "star",
  "güneş": "sun",
  "dünya": "earth",
  "ay": "moon",
  "merkür": "mercury",
  "venüs": "venus",
  "jüpiter": "jupiter",
  "satürn": "saturn",
  "uranüs": "uranus",
  "neptün": "neptune",
  "plüton": "pluto",
  "roket": "rocket",
  "fırlatma": "launch",
  "uydu": "satellite",
  "teleskop": "telescope",
  "asteroit": "asteroid",
  "göktaşı": "meteorite",
  "kutup ışıkları": "aurora",
  "kasırga": "hurricane",
  "volkan": "volcano",
};

function translateQuery(q) {
  let out = ` ${q.toLocaleLowerCase("tr-TR").trim()} `;
  // önce uzun ifadeler (ör. "kara delik" "ay"dan önce)
  Object.keys(TR_TO_EN)
    .sort((a, b) => b.length - a.length)
    .forEach((tr) => {
      out = out.replace(new RegExp(`(\\s)${tr}(\\s)`, "g"), `$1${TR_TO_EN[tr]}$2`);
    });
  return out.replace(/\s(ve|ile)\s/g, " ").trim(); // bağlaçları at
}

const library = { query: "", label: "", page: 0, items: [], total: 0, busy: false, token: 0, started: false };

// Arşivdeki bir sonucu sitenin kendi fotoğraf biçimine çevir
function normalizeLibrary(raw) {
  const data = raw.data?.[0];
  if (!data || data.media_type !== "image") return null;
  const links = raw.links || [];
  const pick = (name) => links.find((l) => l.href?.includes(`~${name}.`))?.href;
  const thumb = pick("thumb") || pick("small") || links[0]?.href;
  const image = pick("large") || pick("medium") || pick("small") || thumb;
  if (!image) return null;
  return {
    library: true,
    nasaId: data.nasa_id,
    date: (data.date_created || "").slice(0, 10),
    title: htmlToText(data.title),
    explanation: htmlToText(data.description || data.description_508 || ""),
    alt: "",
    credit: htmlToText(data.photographer || data.secondary_creator || data.center || "NASA"),
    creditUrl: null,
    center: data.center || "",
    keywords: Array.isArray(data.keywords) ? data.keywords : [],
    mediaType: "image",
    image,
    thumb,
    width: null,
    height: null,
    videoFile: null,
    videoEmbed: null,
    page: `https://images.nasa.gov/details/${encodeURIComponent(data.nasa_id)}`,
  };
}

async function searchLibrary(query, label = query, more = false) {
  const q = query.trim();
  if (!q) return;
  const token = more ? library.token : ++library.token;
  const grid = $("libGrid");
  const moreBtn = $("libMore");
  if (!more) {
    Object.assign(library, { query: q, label, page: 0, items: [], total: 0 });
    renderSkeletonCards(grid, 8);
    $("libEmpty").classList.add("hidden");
    $("libCount").textContent = "";
    moreBtn.classList.add("hidden");
    updateLibChips();
  }
  library.busy = true;
  moreBtn.disabled = true;
  moreBtn.textContent = t("libLoading");

  try {
    const params = new URLSearchParams({
      q: translateQuery(q),
      media_type: "image",
      page: String(library.page + 1),
      page_size: String(LIBRARY_PAGE_SIZE),
    });
    const res = await fetch(`${LIBRARY_API}?${params}`);
    if (!res.ok) throw new Error(res.status);
    const json = await res.json();
    if (token !== library.token) return;
    const found = (json.collection?.items || []).map(normalizeLibrary).filter(Boolean);
    library.page++;
    library.total = json.collection?.metadata?.total_hits || 0;
    library.items.push(...found);
    library.hasNext = (json.collection?.links || []).some((l) => l.rel === "next");

    if (more) {
      // Aynı listeyi paylaşırlar: detay penceresinde yeni gelenlere de oklarla geçilir
      const context = { items: library.items };
      found.forEach((item, i) => grid.appendChild(createCard(item, { index: i, context, sub: item.center || null })));
    } else {
      renderCards(grid, library.items, (item) => item.center || null);
    }
    $("libCount").textContent = library.items.length ? t("libCount")(library.total, library.label) : "";
    const empty = !library.items.length;
    $("libEmpty").textContent = empty ? t("libEmpty")(library.label) : "";
    $("libEmpty").classList.toggle("hidden", !empty);
    moreBtn.classList.toggle("hidden", !library.hasNext);
  } catch {
    if (token !== library.token) return;
    if (!more) grid.innerHTML = "";
    $("libEmpty").textContent = t("libFailed");
    $("libEmpty").classList.remove("hidden");
  } finally {
    if (token === library.token) {
      library.busy = false;
      moreBtn.disabled = false;
      moreBtn.textContent = t("libMore");
    }
  }
}

function renderLibChips() {
  const box = $("libChips");
  box.innerHTML = "";
  t("libChips").forEach(([label, query]) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "chip";
    chip.textContent = label;
    chip.dataset.query = query;
    chip.addEventListener("click", () => {
      $("libInput").value = "";
      searchLibrary(query, label);
    });
    box.appendChild(chip);
  });
  updateLibChips();
}

function updateLibChips() {
  document.querySelectorAll("#libChips .chip").forEach((chip) => {
    chip.classList.toggle("active", chip.dataset.query === library.query);
  });
}

function libraryApplyTexts() {
  document.querySelectorAll("#sec-library [data-i18n], .topnav [data-i18n=navLibrary]").forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });
  $("libInput").placeholder = t("libPlaceholder");
  $("libSearchBtn").setAttribute("aria-label", t("libSearch"));
  renderLibChips();
  if (library.items.length) $("libCount").textContent = t("libCount")(library.total, library.label);
  if (!$("libMore").disabled) $("libMore").textContent = t("libMore");
  if (!$("libEmpty").classList.contains("hidden") && library.query && !library.items.length) {
    $("libEmpty").textContent = t("libEmpty")(library.label);
  }
}

function setupLibrary() {
  $("libForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const q = $("libInput").value.trim();
    if (q) searchLibrary(q, q);
  });
  $("libMore").addEventListener("click", () => {
    if (!library.busy) searchLibrary(library.query, library.label, true);
  });
  libraryApplyTexts();

  // Bölüm ekrana gelince Hubble görselleriyle başla (açılışta boşuna istek atılmasın)
  const start = () => {
    if (library.started) return;
    library.started = true;
    const [label, query] = t("libChips")[0];
    searchLibrary(query, label);
  };
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          observer.disconnect();
          start();
        }
      },
      { rootMargin: "300px 0px" }
    );
    observer.observe($("sec-library"));
  } else {
    start();
  }
}

setupLibrary();
