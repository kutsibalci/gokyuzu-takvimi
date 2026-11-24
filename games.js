// =============================================
// Gökyüzü Takvimi – oyunlar ve efektler
// Kaydırmalı yapboz, hafıza kartları, günlük seri, rozetler,
// hareketli yıldız arka planı ve kutlama konfetisi.
// script.js'teki yardımcıları kullanır: t, $, toast, fetchPage, getRandom,
// thumbUrl, openViewer, getFavorites, currentApod, latestDate...
// =============================================

const PROGRESS_KEY = "apodProgress";
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

// ---------- Metinler (script.js'teki TEXTS'e eklenir) ----------
Object.assign(TEXTS.tr, {
  navGames: "Oyunlar",
  gamesTitle: "Oyunlar",
  gamesText: "NASA fotoğraflarıyla yapboz çöz, hafızanı dene, rozet topla.",
  streakLabel: "günlük seri",
  streakBest: (n) => `En uzun seri: ${n} gün`,
  streakUp: (n) => `Günlük serin ${n} gün oldu!`,
  badgesTitle: "Rozetler",
  badgeCount: (a, b) => `${a} / ${b} açıldı`,
  badgeUnlocked: (name) => `Yeni rozet: ${name}`,
  badgeLocked: "Kilitli",
  gamePuzzle: "Yapboz",
  gameMemory: "Hafıza kartları",
  puzzleToday: "Üstteki fotoğraf",
  puzzleRandom: "Rastgele fotoğraf",
  modeSwap: "Yer değiştir",
  modeSlide: "Kaydır",
  puzzleHelpSwap:
    "Bir parçayı sürükleyip olması gereken yere bırak, iki parça yer değiştirir. İstersen önce bir parçaya, sonra diğerine tıklayarak da değiştirebilirsin. Doğru yere oturan parça kısaca parlar.",
  puzzleHelpSlide:
    "Klasik kaydırmalı yapboz: boşluğa kayabilen parçalar fareyle üzerine gelince parlar. Parçaya tıkla ya da boşluğa doğru sürükle; ok tuşları da çalışır. Aynı satırdaki uzak bir parçaya tıklarsan aradakiler birlikte kayar.",
  shuffle: "Karıştır",
  peek: "Orijinale bak",
  peekHide: "Gizle",
  openPhoto: "Fotoğrafı aç",
  moves: "hamle",
  pairsFound: "eşleşme",
  best: (text) => `En iyi: ${text}`,
  bestPuzzle: (moves, time) => `${moves} hamle · ${time}`,
  bestMemory: (moves) => `${moves} hamle`,
  newRecord: "Yeni rekor!",
  puzzleWin: (moves, time) => `Tebrikler! Yapbozu ${moves} hamlede, ${time} sürede çözdün.`,
  levelEasy: "Kolay · 12 kart",
  levelHard: "Zor · 16 kart",
  newGame: "Yeni oyun",
  memoryWin: (moves, time) =>
    `Tebrikler! Tüm eşleri ${moves} hamlede, ${time} sürede buldun. Kartlara tıklayıp fotoğrafları inceleyebilirsin.`,
  gameLoading: "Fotoğraflar yükleniyor…",
  gameLoadFailed: "Fotoğraflar yüklenemedi. İnternet bağlantını kontrol edip tekrar dene.",
  videoSwapped: "Üstteki gün bir video, bunun yerine rastgele bir fotoğraf seçildi.",
  tile: (n) => `Parça ${n}`,
  hiddenCard: "Kapalı kart",
  badges: {
    streak3: ["Düzenli gözlemci", "3 gün üst üste siteye gir"],
    streak7: ["Haftalık gözlemci", "7 gün üst üste siteye gir"],
    explorer: ["Kâşif", "25 farklı günün fotoğrafını aç"],
    traveler: ["Zaman yolcusu", "2000 yılından önceki bir fotoğrafı aç"],
    collector: ["Koleksiyoncu", "5 fotoğrafı favorilere ekle"],
    birthday: ["Doğum günü yıldızı", "Doğum günü fotoğraflarını bul"],
    puzzle: ["Yapbozcu", "Bir yapbozu çöz"],
    puzzle4: ["Usta yapbozcu", "4 × 4 yapbozu çöz"],
    memory: ["Hafıza", "Hafıza oyununu bitir"],
    sharp: ["Keskin hafıza", "Zor seviyeyi 22 hamle veya daha azında bitir"],
  },
});

Object.assign(TEXTS.en, {
  navGames: "Games",
  gamesTitle: "Games",
  gamesText: "Solve puzzles with NASA photos, test your memory and collect badges.",
  streakLabel: "day streak",
  streakBest: (n) => `Longest streak: ${n} days`,
  streakUp: (n) => `Your streak is now ${n} days!`,
  badgesTitle: "Badges",
  badgeCount: (a, b) => `${a} / ${b} unlocked`,
  badgeUnlocked: (name) => `New badge: ${name}`,
  badgeLocked: "Locked",
  gamePuzzle: "Puzzle",
  gameMemory: "Memory cards",
  puzzleToday: "Featured photo",
  puzzleRandom: "Random photo",
  modeSwap: "Swap",
  modeSlide: "Slide",
  puzzleHelpSwap:
    "Drag a tile and drop it where it belongs; the two tiles swap places. You can also click one tile, then another. A tile that lands in its correct spot flashes briefly.",
  puzzleHelpSlide:
    "Classic sliding puzzle: tiles that can move light up when you hover them. Click a tile or drag it toward the gap; arrow keys work too. Clicking a tile further along the same row or column slides the whole group.",
  shuffle: "Shuffle",
  peek: "Peek at original",
  peekHide: "Hide",
  openPhoto: "Open photo",
  moves: "moves",
  pairsFound: "pairs",
  best: (text) => `Best: ${text}`,
  bestPuzzle: (moves, time) => `${moves} moves · ${time}`,
  bestMemory: (moves) => `${moves} moves`,
  newRecord: "New record!",
  puzzleWin: (moves, time) => `Well done! You solved it in ${moves} moves and ${time}.`,
  levelEasy: "Easy · 12 cards",
  levelHard: "Hard · 16 cards",
  newGame: "New game",
  memoryWin: (moves, time) =>
    `Well done! You found every pair in ${moves} moves and ${time}. Click a card to explore its photo.`,
  gameLoading: "Loading photos…",
  gameLoadFailed: "Couldn't load the photos. Check your connection and try again.",
  videoSwapped: "The featured day is a video, so a random photo was picked instead.",
  tile: (n) => `Tile ${n}`,
  hiddenCard: "Hidden card",
  badges: {
    streak3: ["Regular observer", "Visit 3 days in a row"],
    streak7: ["Weekly observer", "Visit 7 days in a row"],
    explorer: ["Explorer", "Open photos from 25 different days"],
    traveler: ["Time traveler", "Open a photo from before 2000"],
    collector: ["Collector", "Add 5 photos to favorites"],
    birthday: ["Birthday star", "Find your birthday photos"],
    puzzle: ["Puzzler", "Solve a puzzle"],
    puzzle4: ["Master puzzler", "Solve a 4 × 4 puzzle"],
    memory: ["Memory", "Finish the memory game"],
    sharp: ["Sharp memory", "Finish hard mode in 22 moves or fewer"],
  },
});

// Rozet simgeleri (sade çizgi ikonlar)
const BADGE_ICONS = {
  streak3: '<path d="M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2 1-3.5 2-4.5 0 2 1 3 2 3-1-3 0-5.5 1-8.5z"/>',
  streak7: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4M10 13h4l-2.5 5"/>',
  explorer: '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/>',
  traveler: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
  collector: '<path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/>',
  birthday: '<path d="M4 21h16M5 21v-8h14v8M5 16.5c2.3 1.2 3.4-1.2 5 0s3.4 1.2 5 0 2.7-1.2 4 0M12 13v-3"/><path d="M12 7.5c-1 0-1.5-.8-1.5-1.5S12 3.5 12 3.5s1.5 1.8 1.5 2.5-.5 1.5-1.5 1.5z"/>',
  puzzle: '<rect x="4" y="4" width="7" height="7" rx="1"/><rect x="13" y="4" width="7" height="7" rx="1"/><rect x="4" y="13" width="7" height="7" rx="1"/>',
  puzzle4: '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 9.3h16M4 14.6h16M9.3 4v16M14.6 4v16"/>',
  memory: '<rect x="3" y="6" width="10" height="14" rx="2"/><rect x="11" y="4" width="10" height="14" rx="2"/>',
  sharp: '<path d="M13 2 5 13.5h6L10 22l9-12h-6z"/>',
};
const BADGE_IDS = Object.keys(BADGE_ICONS);

// ---------- İlerleme kaydı (seri, rozetler, rekorlar) ----------
function loadProgress() {
  const p = loadSetting(PROGRESS_KEY, null) || {};
  return {
    last: typeof p.last === "string" ? p.last : null,
    streak: Number(p.streak) || 0,
    bestStreak: Number(p.bestStreak) || 0,
    viewed: Array.isArray(p.viewed) ? p.viewed.slice(0, 60) : [],
    badges: p.badges && typeof p.badges === "object" ? p.badges : {},
    puzzleBest: p.puzzleBest && typeof p.puzzleBest === "object" ? p.puzzleBest : {},
    memoryBest: p.memoryBest && typeof p.memoryBest === "object" ? p.memoryBest : {},
  };
}

const progress = loadProgress();
const saveProgress = () => saveSetting(PROGRESS_KEY, progress);

function localDate(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function formatTime(ms) {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${pad(s % 60)}`;
}

// Arka arkaya birden fazla bildirim gelirse sırayla göster
let toastQueueAt = 0;
function queueToast(message, delay = 600) {
  const now = Date.now();
  const at = Math.max(now + delay, toastQueueAt);
  toastQueueAt = at + 2400;
  setTimeout(() => toast(message), at - now);
}

// Günlük seri: dün de girildiyse artar, bir gün atlanırsa 1'den başlar
function updateStreak() {
  const today = localDate();
  if (progress.last === today) return;
  const grew = progress.last === localDate(-1);
  progress.streak = grew ? progress.streak + 1 : 1;
  progress.last = today;
  progress.bestStreak = Math.max(progress.bestStreak, progress.streak);
  saveProgress();
  if (grew) queueToast(t("streakUp")(progress.streak), 1500);
}

function unlockBadge(id) {
  if (!BADGE_ICONS[id] || progress.badges[id]) return;
  progress.badges[id] = Date.now();
  saveProgress();
  renderBadges(id);
  queueToast(t("badgeUnlocked")(t("badges")[id][0]));
  confetti({ count: 90, y: innerHeight * 0.25 });
}

function checkBadges() {
  if (progress.streak >= 3) unlockBadge("streak3");
  if (progress.streak >= 7) unlockBadge("streak7");
  if (progress.viewed.length >= 25) unlockBadge("explorer");
  if (progress.viewed.some((d) => d < "2000-01-01")) unlockBadge("traveler");
  if (getFavorites().length >= 5) unlockBadge("collector");
}

// Açılan her farklı günü say (rozetler için)
function trackView(item) {
  if (!item?.date || progress.viewed.includes(item.date)) return;
  progress.viewed.unshift(item.date);
  progress.viewed = progress.viewed.slice(0, 60);
  saveProgress();
  checkBadges();
}

function renderStreak() {
  $("streakNum").textContent = progress.streak;
  $("streakBest").textContent = t("streakBest")(progress.bestStreak);
}

function renderBadges(newId = null) {
  const names = t("badges");
  const box = $("badges");
  box.innerHTML = "";
  BADGE_IDS.forEach((id, i) => {
    const unlocked = Boolean(progress.badges[id]);
    const el = document.createElement("div");
    el.className = `award${unlocked ? " unlocked" : ""}${id === newId ? " just" : ""}`;
    el.style.setProperty("--i", i);
    el.tabIndex = 0;
    el.innerHTML = `<span class="award-icon"><svg viewBox="0 0 24 24" aria-hidden="true">${BADGE_ICONS[id]}</svg></span><span class="award-text"><b></b><small></small></span>`;
    el.querySelector("b").textContent = names[id][0];
    el.querySelector("small").textContent = names[id][1];
    el.title = `${names[id][0]}: ${names[id][1]}${unlocked ? "" : ` (${t("badgeLocked")})`}`;
    box.appendChild(el);
  });
  const count = BADGE_IDS.filter((id) => progress.badges[id]).length;
  $("badgeCount").textContent = t("badgeCount")(count, BADGE_IDS.length);
}

// ---------- Konfeti ----------
let confettiParts = [];
let confettiRaf = null;
let confettiCanvas = null;
const CONFETTI_COLORS = ["#4c7dff", "#f5b83d", "#ef5b5b", "#2fbf71", "#9b6bff", "#22b8cf"];

function confetti({ x = innerWidth / 2, y = innerHeight / 3, count = 140 } = {}) {
  if (reduceMotion) return;
  if (!confettiCanvas) {
    confettiCanvas = document.createElement("canvas");
    confettiCanvas.className = "confetti-canvas";
    confettiCanvas.setAttribute("aria-hidden", "true");
    document.body.appendChild(confettiCanvas);
  }
  const dpr = Math.min(devicePixelRatio || 1, 2);
  confettiCanvas.width = innerWidth * dpr;
  confettiCanvas.height = innerHeight * dpr;
  confettiCanvas.getContext("2d").setTransform(dpr, 0, 0, dpr, 0, 0);

  for (let i = 0; i < count; i++) {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.9;
    const speed = 7 + Math.random() * 9;
    confettiParts.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      w: 6 + Math.random() * 5,
      h: 3 + Math.random() * 4,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.3,
      flip: Math.random() * Math.PI,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      life: 0,
      ttl: 110 + Math.random() * 70,
    });
  }
  if (!confettiRaf) confettiRaf = requestAnimationFrame(drawConfetti);
}

function drawConfetti() {
  const ctx = confettiCanvas.getContext("2d");
  ctx.clearRect(0, 0, innerWidth, innerHeight);
  confettiParts = confettiParts.filter((p) => p.life < p.ttl && p.y < innerHeight + 30);
  for (const p of confettiParts) {
    p.life++;
    p.vy += 0.28;
    p.vx *= 0.985;
    p.vy *= 0.985;
    p.x += p.vx;
    p.y += p.vy;
    p.rot += p.vr;
    p.flip += 0.15;
    ctx.save();
    ctx.globalAlpha = Math.min(1, (p.ttl - p.life) / 30);
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.scale(1, Math.cos(p.flip)); // dönerken ince-kalın görünsün
    ctx.fillStyle = p.color;
    ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
    ctx.restore();
  }
  if (confettiParts.length) {
    confettiRaf = requestAnimationFrame(drawConfetti);
  } else {
    confettiRaf = null;
    ctx.clearRect(0, 0, innerWidth, innerHeight);
  }
}

function confettiFrom(el) {
  const r = el.getBoundingClientRect();
  confetti({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
}

// ---------- Hareketli yıldız arka planı (koyu temada) ----------
function setupStarfield() {
  const canvas = $("starfield");
  const ctx = canvas.getContext("2d");
  let w = 0;
  let h = 0;
  let stars = [];
  let shooting = null;
  let nextShoot = performance.now() + 3000 + Math.random() * 5000;
  let mouseX = 0;
  let mouseY = 0;
  let camX = 0;
  let camY = 0;
  let raf = null;

  function resize() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    w = innerWidth;
    h = innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.round(Math.min(280, (w * h) / 6000));
    stars = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.1 + 0.3,
      depth: Math.random() * 0.8 + 0.2, // yakın yıldızlar daha çok kayar
      alpha: Math.random() * 0.55 + 0.25,
      phase: Math.random() * Math.PI * 2,
      speed: 0.5 + Math.random() * 1.5,
      tint: Math.random() < 0.18 ? "200,215,255" : Math.random() < 0.08 ? "255,226,190" : "255,255,255",
    }));
    if (!raf) draw(performance.now(), true);
  }

  function active() {
    return currentTheme() === "dark" && !document.hidden;
  }

  function draw(now, once = false) {
    ctx.clearRect(0, 0, w, h);
    camX += (mouseX - camX) * 0.04;
    camY += (mouseY - camY) * 0.04;
    const scroll = window.scrollY;

    for (const s of stars) {
      const x = (((s.x + camX * s.depth * 22) % w) + w) % w;
      const y = (((s.y + camY * s.depth * 22 - scroll * s.depth * 0.06) % h) + h) % h;
      const twinkle = reduceMotion ? 1 : 0.6 + 0.4 * Math.sin(s.phase + now * 0.001 * s.speed);
      ctx.fillStyle = `rgba(${s.tint},${s.alpha * twinkle})`;
      if (s.r < 0.8) {
        ctx.fillRect(x, y, s.r * 1.6, s.r * 1.6);
      } else {
        ctx.beginPath();
        ctx.arc(x, y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Ara sıra bir kayan yıldız
    if (!reduceMotion) {
      if (!shooting && now > nextShoot) {
        shooting = {
          x: w * (0.3 + Math.random() * 0.7),
          y: h * Math.random() * 0.4,
          vx: -(7 + Math.random() * 4),
          vy: 3 + Math.random() * 2,
          life: 0,
          ttl: 55 + Math.random() * 25,
        };
      }
      if (shooting) {
        const s = shooting;
        s.life++;
        s.x += s.vx;
        s.y += s.vy;
        const fade = Math.sin((s.life / s.ttl) * Math.PI);
        const grad = ctx.createLinearGradient(s.x, s.y, s.x - s.vx * 12, s.y - s.vy * 12);
        grad.addColorStop(0, `rgba(255,255,255,${0.9 * fade})`);
        grad.addColorStop(1, "rgba(255,255,255,0)");
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x - s.vx * 12, s.y - s.vy * 12);
        ctx.stroke();
        if (s.life >= s.ttl) {
          shooting = null;
          nextShoot = now + 5000 + Math.random() * 9000;
        }
      }
    }

    if (!once && !reduceMotion && active()) raf = requestAnimationFrame(draw);
    else raf = null;
  }

  function start() {
    if (!raf && active() && !reduceMotion) raf = requestAnimationFrame(draw);
    else if (reduceMotion) draw(performance.now(), true);
  }

  window.addEventListener("resize", resize);
  window.addEventListener(
    "mousemove",
    (e) => {
      mouseX = (e.clientX / w - 0.5) * 2;
      mouseY = (e.clientY / h - 0.5) * 2;
    },
    { passive: true }
  );
  if (reduceMotion) window.addEventListener("scroll", () => draw(performance.now(), true), { passive: true });
  document.addEventListener("visibilitychange", start);
  // Tema değişince başlat / durdur
  new MutationObserver(start).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  resize();
  start();
}

// ---------- Ortak: rastgele fotoğraf bulma ----------
// latestDate script.js'te ilk istek bitince dolar; oyun ondan önce açılırsa bekle
async function waitForData() {
  for (let i = 0; i < 100 && !latestDate; i++) await new Promise((r) => setTimeout(r, 150));
  if (!latestDate) throw new Error(t("gameLoadFailed"));
}

async function randomImageItem() {
  await waitForData();
  for (let i = 0; i < 6; i++) {
    const item = await getRandom();
    if (item?.image && item.mediaType === "image") return item;
  }
  throw new Error(t("gameLoadFailed"));
}

function preloadImage(src, timeout = 9000) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const timer = setTimeout(() => reject(new Error("timeout")), timeout);
    img.onload = () => {
      clearTimeout(timer);
      resolve(img);
    };
    img.onerror = () => {
      clearTimeout(timer);
      reject(new Error("load"));
    };
    img.src = src;
  });
}

// ---------- Kaydırmalı yapboz ----------
const puzzle = {
  mode: loadSetting("apodPuzzleMode", "swap") === "slide" ? "slide" : "swap", // swap: yer değiştir, slide: kaydır
  selected: null, // yer değiştir modunda seçilen parça
  n: 4,
  item: null,
  src: "",
  tiles: [], // tiles[konum] = parça no (n*n-1 boşluk)
  els: [],
  moves: 0,
  start: 0,
  timer: null,
  solved: false,
  peek: false,
  token: 0,
  win: null,
};

async function loadPuzzle(source = "today") {
  const token = ++puzzle.token;
  const board = $("puzzleBoard");
  board.classList.add("loading");
  board.innerHTML = `<div class="game-loading">${t("gameLoading")}</div>`;
  $("puzzleWin").classList.add("hidden");
  try {
    let item = null;
    if (source === "today") {
      await waitForData();
      item = currentApod;
      if (!item?.image || item.mediaType !== "image") {
        if (item) queueToast(t("videoSwapped"), 0);
        item = null;
      }
    } else if (source && typeof source === "object") {
      item = source;
    }
    if (!item) item = await randomImageItem();
    const src = thumbUrl(item.image, 1000);
    const img = await preloadImage(src);
    if (token !== puzzle.token) return;
    puzzle.item = item;
    puzzle.src = src;
    const ratio = Math.min(1.8, Math.max(0.6, img.naturalWidth / img.naturalHeight || 1));
    board.style.setProperty("--ar", ratio.toFixed(4));
    buildPuzzle();
  } catch {
    if (token !== puzzle.token) return;
    board.innerHTML = `<div class="game-loading">${t("gameLoadFailed")}</div>`;
  } finally {
    if (token === puzzle.token) board.classList.remove("loading");
  }
}

function buildPuzzle() {
  const { n } = puzzle;
  const board = $("puzzleBoard");
  board.innerHTML = "";
  board.classList.remove("solved", "peek", "mode-swap", "mode-slide");
  board.classList.add(`mode-${puzzle.mode}`);
  board.style.setProperty("--n", n);
  puzzle.selected = null;
  puzzle.peek = false;
  updatePeekButton();
  $("puzzleTitle").textContent = displayText(puzzle.item).title;
  $("puzzleTitle").lang = displayText(puzzle.item).translated ? "tr" : "en";

  const peek = document.createElement("div");
  peek.className = "puzzle-peek";
  peek.style.backgroundImage = `url("${puzzle.src}")`;
  board.appendChild(peek);

  puzzle.els = [];
  for (let id = 0; id < n * n; id++) {
    const tile = document.createElement("button");
    tile.type = "button";
    tile.className = `tile${puzzle.mode === "slide" && id === n * n - 1 ? " blank" : ""}`;
    tile.tabIndex = -1;
    tile.setAttribute("aria-label", t("tile")(id + 1));
    const row = Math.floor(id / n);
    const col = id % n;
    tile.style.backgroundImage = `url("${puzzle.src}")`;
    tile.style.backgroundPosition = `${(col / (n - 1)) * 100}% ${(row / (n - 1)) * 100}%`;
    board.appendChild(tile);
    puzzle.els.push(tile);
  }
  puzzle.tiles = Array.from({ length: n * n }, (_, i) => i);
  layoutTiles(true);
  // Önce bütün resmi göster, sonra karıştır
  setTimeout(shufflePuzzle, reduceMotion ? 0 : 550);
}

function layoutTiles(instant = false) {
  const { n, tiles, els } = puzzle;
  tiles.forEach((id, pos) => {
    const el = els[id];
    if (instant) el.style.transition = "none";
    el.style.transform = `translate(${(pos % n) * 100}%, ${Math.floor(pos / n) * 100}%)`;
    if (instant) {
      void el.offsetWidth;
      el.style.transition = "";
    }
  });
  markMovable();
}

// Kaydır modunda boşlukla aynı satır/sütundaki parçalar hareket edebilir
function markMovable() {
  const { n, tiles, els } = puzzle;
  const b = puzzle.mode === "slide" ? blankPos() : -1;
  tiles.forEach((id, pos) => {
    const movable =
      b >= 0 && !puzzle.solved && pos !== b && (pos % n === b % n || Math.floor(pos / n) === Math.floor(b / n));
    els[id].classList.toggle("movable", movable);
  });
}

function blankPos() {
  return puzzle.tiles.indexOf(puzzle.n * puzzle.n - 1);
}

function shufflePuzzle() {
  if (!puzzle.els.length) return;
  const { n } = puzzle;
  stopPuzzleTimer();
  puzzle.moves = 0;
  puzzle.start = 0;
  puzzle.solved = false;
  puzzle.win = null;
  $("puzzleBoard").classList.remove("solved");
  $("puzzleWin").classList.add("hidden");
  setSelected(null);
  if (puzzle.mode === "swap") {
    // Yer değiştir: parçalar tamamen rastgele dağılır (her dizilim çözülebilir)
    do {
      for (let i = puzzle.tiles.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [puzzle.tiles[i], puzzle.tiles[j]] = [puzzle.tiles[j], puzzle.tiles[i]];
      }
    } while (puzzle.tiles.filter((id, pos) => id === pos).length > 1);
    layoutTiles();
    updatePuzzleStats();
    return;
  }
  // Çözülmüş hâlden rastgele geçerli hamlelerle karıştır (her zaman çözülebilir)
  let prev = -1;
  const steps = n === 3 ? 60 : 160;
  do {
    for (let i = 0; i < steps; i++) {
      const b = blankPos();
      const options = [b - n, b + n, b % n ? b - 1 : -1, b % n < n - 1 ? b + 1 : -1].filter(
        (p) => p >= 0 && p < n * n && p !== prev
      );
      const p = options[Math.floor(Math.random() * options.length)];
      [puzzle.tiles[b], puzzle.tiles[p]] = [puzzle.tiles[p], puzzle.tiles[b]];
      prev = b;
    }
  } while (isSolved());
  layoutTiles();
  updatePuzzleStats();
}

function isSolved() {
  return puzzle.tiles.every((id, pos) => id === pos);
}

function movePos(pos) {
  const { n } = puzzle;
  if (pos < 0 || pos >= n * n || puzzle.solved) return false;
  let b = blankPos();
  const sameRow = Math.floor(pos / n) === Math.floor(b / n);
  const sameCol = pos % n === b % n;
  if (pos === b || (!sameRow && !sameCol)) {
    replay(puzzle.els[puzzle.tiles[pos]], "nudge");
    return false;
  }
  const step = sameRow ? Math.sign(pos - b) : Math.sign(pos - b) * n;
  while (b !== pos) {
    const next = b + step;
    [puzzle.tiles[b], puzzle.tiles[next]] = [puzzle.tiles[next], puzzle.tiles[b]];
    b = next;
    puzzle.moves++;
  }
  if (!puzzle.start) startPuzzleTimer();
  layoutTiles();
  updatePuzzleStats();
  if (isSolved()) setTimeout(puzzleSolved, 200);
  return true;
}

// ---- Yer değiştir modu ----
function setSelected(id) {
  if (puzzle.selected !== null) puzzle.els[puzzle.selected]?.classList.remove("selected");
  puzzle.selected = id;
  if (id !== null) puzzle.els[id].classList.add("selected");
}

function swapTiles(a, b) {
  if (a === b || a < 0 || b < 0) {
    layoutTiles();
    return;
  }
  [puzzle.tiles[a], puzzle.tiles[b]] = [puzzle.tiles[b], puzzle.tiles[a]];
  puzzle.moves++;
  if (!puzzle.start) startPuzzleTimer();
  layoutTiles();
  updatePuzzleStats();
  // Doğru yerine oturan parça kısaca parlasın
  [a, b].forEach((pos) => {
    if (puzzle.tiles[pos] === pos) setTimeout(() => replay(puzzle.els[pos], "snap"), 180);
  });
  if (isSolved()) setTimeout(puzzleSolved, 260);
}

// Fare/parmak konumundan tahtadaki kareyi bul
function boardCell(e) {
  const r = $("puzzleBoard").getBoundingClientRect();
  const n = puzzle.n;
  const col = Math.min(n - 1, Math.max(0, Math.floor(((e.clientX - r.left) / r.width) * n)));
  const row = Math.min(n - 1, Math.max(0, Math.floor(((e.clientY - r.top) / r.height) * n)));
  return row * n + col;
}

let drag = null;
let dropTarget = null;

function setDropTarget(pos) {
  const el = pos === null ? null : puzzle.els[puzzle.tiles[pos]];
  if (dropTarget === el) return;
  dropTarget?.classList.remove("target");
  dropTarget = el && !el.classList.contains("dragging") ? el : null;
  dropTarget?.classList.add("target");
}

function onBoardDown(e) {
  if (e.button !== 0 || puzzle.solved || !puzzle.els.length || drag) return;
  const tile = e.target.closest(".tile");
  const board = $("puzzleBoard");
  board.focus({ preventScroll: true });
  e.preventDefault();
  // Parçayı konumdan bul: animasyon sürerken bile doğru parça tutulur
  const id = tile || e.target === board ? puzzle.tiles[boardCell(e)] : -1;
  drag = { x: e.clientX, y: e.clientY, id, moved: false, pointer: e.pointerId };
  try {
    board.setPointerCapture(e.pointerId);
  } catch {}
}

function onBoardMove(e) {
  if (!drag || e.pointerId !== drag.pointer) return;
  const dx = e.clientX - drag.x;
  const dy = e.clientY - drag.y;
  if (!drag.moved && Math.hypot(dx, dy) > 6) drag.moved = true;
  if (puzzle.mode !== "swap" || !drag.moved || drag.id < 0) return;
  const { n } = puzzle;
  const pos = puzzle.tiles.indexOf(drag.id);
  const el = puzzle.els[drag.id];
  el.classList.add("dragging");
  el.style.transform = `translate(calc(${(pos % n) * 100}% + ${dx}px), calc(${Math.floor(pos / n) * 100}% + ${dy}px))`;
  setDropTarget(boardCell(e));
}

function onBoardUp(e) {
  if (!drag || e.pointerId !== drag.pointer) return;
  const d = drag;
  drag = null;
  const dx = e.clientX - d.x;
  const dy = e.clientY - d.y;
  setDropTarget(null);

  if (puzzle.mode === "swap") {
    if (d.id < 0) return;
    puzzle.els[d.id].classList.remove("dragging");
    const from = puzzle.tiles.indexOf(d.id);
    if (d.moved) {
      setSelected(null);
      swapTiles(from, boardCell(e));
    } else if (puzzle.selected === null) {
      setSelected(d.id);
    } else if (puzzle.selected === d.id) {
      setSelected(null);
    } else {
      const other = puzzle.tiles.indexOf(puzzle.selected);
      setSelected(null);
      swapTiles(other, from);
    }
    return;
  }

  // Kaydır modu: tıklama ya da boşluğa doğru sürükleme
  const { n } = puzzle;
  if (d.id >= 0) {
    const pos = puzzle.tiles.indexOf(d.id);
    const b = blankPos();
    const towardGap =
      !d.moved ||
      (Math.abs(dx) > Math.abs(dy)
        ? Math.floor(pos / n) === Math.floor(b / n) && Math.sign(dx) === Math.sign((b % n) - (pos % n))
        : pos % n === b % n && Math.sign(dy) === Math.sign(Math.floor(b / n) - Math.floor(pos / n)));
    if (towardGap && movePos(pos)) return;
  }
  // Tahtanın herhangi bir yerinde kaydırma hareketi: ok tuşu gibi davranır
  if (d.moved && Math.hypot(dx, dy) > 24) {
    slideByKey(Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? "ArrowLeft" : "ArrowRight") : dy < 0 ? "ArrowUp" : "ArrowDown");
  }
}

function onBoardCancel() {
  if (!drag) return;
  if (drag.id >= 0) puzzle.els[drag.id]?.classList.remove("dragging");
  drag = null;
  setDropTarget(null);
  layoutTiles();
}

// Ok tuşu: boşluğun o yöndeki komşusu boşluğa kayar
function slideByKey(key) {
  const { n } = puzzle;
  const b = blankPos();
  const target = {
    ArrowLeft: b % n < n - 1 ? b + 1 : -1,
    ArrowRight: b % n ? b - 1 : -1,
    ArrowUp: b + n,
    ArrowDown: b - n,
  }[key];
  if (target === undefined) return false;
  if (target >= 0 && target < n * n) movePos(target);
  return true;
}

function setPuzzleMode(mode) {
  if (mode === puzzle.mode) return;
  puzzle.mode = mode;
  saveSetting("apodPuzzleMode", mode);
  updateModeUi();
  if (puzzle.item) buildPuzzle();
  renderPuzzleBest();
}

function updateModeUi() {
  document.querySelectorAll("[data-mode]").forEach((c) => {
    c.classList.toggle("active", c.dataset.mode === puzzle.mode);
    c.setAttribute("aria-pressed", c.dataset.mode === puzzle.mode);
  });
  $("puzzleHelp").textContent = t(puzzle.mode === "swap" ? "puzzleHelpSwap" : "puzzleHelpSlide");
}

function startPuzzleTimer() {
  puzzle.start = Date.now();
  puzzle.timer = setInterval(updatePuzzleStats, 1000);
}

function stopPuzzleTimer() {
  clearInterval(puzzle.timer);
  puzzle.timer = null;
}

function puzzleElapsed() {
  return puzzle.start ? Date.now() - puzzle.start : 0;
}

function updatePuzzleStats() {
  if (puzzle.solved) return;
  $("puzzleMoves").textContent = puzzle.moves;
  $("puzzleTime").textContent = formatTime(puzzleElapsed());
  renderPuzzleBest();
}

// Kaydır modunun eski rekorları sadece boyutla kayıtlı, yer değiştir modu "s" önekiyle
const puzzleBestKey = () => (puzzle.mode === "swap" ? `s${puzzle.n}` : String(puzzle.n));

function renderPuzzleBest() {
  const best = progress.puzzleBest[puzzleBestKey()];
  $("puzzleBest").textContent = best ? t("best")(t("bestPuzzle")(best.moves, formatTime(best.time))) : "";
}

function puzzleSolved() {
  const time = puzzleElapsed();
  stopPuzzleTimer();
  puzzle.solved = true;
  $("puzzleTime").textContent = formatTime(time);
  const board = $("puzzleBoard");
  board.classList.add("solved");
  setSelected(null);
  markMovable();

  const best = progress.puzzleBest[puzzleBestKey()];
  const record = !best || puzzle.moves < best.moves || (puzzle.moves === best.moves && time < best.time);
  if (record) {
    progress.puzzleBest[puzzleBestKey()] = { moves: puzzle.moves, time };
    saveProgress();
  }
  puzzle.win = { moves: puzzle.moves, time, record };
  renderPuzzleWin();
  renderPuzzleBest();
  confettiFrom(board);
  unlockBadge("puzzle");
  if (puzzle.n === 4) unlockBadge("puzzle4");
}

function renderPuzzleWin() {
  const box = $("puzzleWin");
  if (!puzzle.win) return box.classList.add("hidden");
  const { moves, time, record } = puzzle.win;
  box.textContent = `${t("puzzleWin")(moves, formatTime(time))}${record ? ` ${t("newRecord")}` : ""}`;
  box.classList.remove("hidden");
  replay(box, "pop");
}

function updatePeekButton() {
  $("puzzlePeek").textContent = puzzle.peek ? t("peekHide") : t("peek");
  $("puzzlePeek").setAttribute("aria-pressed", puzzle.peek);
}

function setPuzzleSize(n) {
  if (n === puzzle.n) return;
  puzzle.n = n;
  document.querySelectorAll("[data-size]").forEach((c) => c.classList.toggle("active", Number(c.dataset.size) === n));
  if (puzzle.item) buildPuzzle();
  renderPuzzleBest();
}

function setupPuzzle() {
  document.querySelectorAll("[data-size]").forEach((chip) => {
    chip.addEventListener("click", () => setPuzzleSize(Number(chip.dataset.size)));
  });
  $("puzzleShuffle").addEventListener("click", shufflePuzzle);
  $("puzzleToday").addEventListener("click", () => loadPuzzle("today"));
  $("puzzleRandom").addEventListener("click", () => loadPuzzle("random"));
  $("puzzleOpen").addEventListener("click", () => puzzle.item && openViewer(puzzle.item));
  $("puzzlePeek").addEventListener("click", () => {
    puzzle.peek = !puzzle.peek;
    $("puzzleBoard").classList.toggle("peek", puzzle.peek);
    updatePeekButton();
  });
  document.querySelectorAll("[data-mode]").forEach((chip) => {
    chip.addEventListener("click", () => setPuzzleMode(chip.dataset.mode));
  });
  const board = $("puzzleBoard");
  board.addEventListener("pointerdown", onBoardDown);
  board.addEventListener("pointermove", onBoardMove);
  board.addEventListener("pointerup", onBoardUp);
  board.addEventListener("pointercancel", onBoardCancel);
  board.addEventListener("lostpointercapture", (e) => drag && e.pointerId === drag.pointer && onBoardCancel());
  // Klavye (kaydır modu): ok tuşları
  board.addEventListener("keydown", (e) => {
    if (puzzle.mode !== "slide" || puzzle.solved || !puzzle.els.length) return;
    if (slideByKey(e.key)) e.preventDefault(); // sayfadaki gün değiştirme kısayolu çalışmasın
  });
}

// ---------- Hafıza kartları ----------
const memory = {
  pairs: 6,
  items: [],
  cards: [],
  first: null,
  lock: false,
  moves: 0,
  found: 0,
  start: 0,
  timer: null,
  done: false,
  token: 0,
  win: null,
};

async function collectMemoryItems(count) {
  await waitForData();
  const totalPages = Math.max(1, Math.floor(daysBetween(FIRST_DATE, latestDate) / PAGE_SIZE));
  const picked = new Map();
  for (let tries = 0; tries < 6 && picked.size < count + 3; tries++) {
    const page = 1 + Math.floor(Math.random() * totalPages);
    const items = (await fetchPage(page)).filter((i) => i.image && i.mediaType === "image");
    items.sort(() => Math.random() - 0.5);
    for (const item of items) {
      if (picked.size >= count + 3) break;
      picked.set(item.date, item);
    }
  }
  // Resimleri önceden yükle; yüklenemeyenleri ele
  const loaded = await Promise.all(
    [...picked.values()].map((item) =>
      preloadImage(thumbUrl(item.image, 360)).then(
        () => item,
        () => null
      )
    )
  );
  const ok = loaded.filter(Boolean).slice(0, count);
  if (ok.length < count) throw new Error(t("gameLoadFailed"));
  return ok;
}

async function newMemoryGame() {
  const token = ++memory.token;
  const grid = $("memoryGrid");
  clearInterval(memory.timer);
  Object.assign(memory, { cards: [], first: null, lock: false, moves: 0, found: 0, start: 0, timer: null, done: false, win: null });
  grid.style.setProperty("--cols", memory.pairs === 6 ? 6 : 8);
  grid.classList.add("loading");
  grid.innerHTML = Array.from({ length: memory.pairs * 2 }, (_, i) => `<div class="mem-card skeleton" style="--i:${i}"></div>`).join("");
  $("memoryWin").classList.add("hidden");
  updateMemoryStats();

  try {
    const items = await collectMemoryItems(memory.pairs);
    if (token !== memory.token) return;
    memory.items = items;
    const deck = [...items, ...items].map((item) => ({ item, el: null, matched: false, open: false }));
    // Fisher–Yates ile karıştır
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    grid.innerHTML = "";
    deck.forEach((card, i) => {
      const el = document.createElement("button");
      el.type = "button";
      el.className = "mem-card";
      el.style.setProperty("--i", i);
      el.setAttribute("aria-label", t("hiddenCard"));
      el.innerHTML = '<span class="mem-inner"><span class="mem-face mem-front"></span><span class="mem-face mem-back"><img alt=""></span></span>';
      const img = el.querySelector("img");
      img.src = thumbUrl(card.item.image, 360);
      img.draggable = false;
      el.addEventListener("click", () => flipCard(card));
      card.el = el;
      grid.appendChild(el);
    });
    memory.cards = deck;
  } catch {
    if (token !== memory.token) return;
    grid.innerHTML = `<div class="game-loading">${t("gameLoadFailed")}</div>`;
  } finally {
    if (token === memory.token) grid.classList.remove("loading");
  }
}

function setCardOpen(card, open) {
  card.open = open;
  card.el.classList.toggle("open", open);
  card.el.setAttribute("aria-label", open ? displayText(card.item).title : t("hiddenCard"));
}

function flipCard(card) {
  // Oyun bitince kartlar fotoğrafı açar
  if (memory.done) {
    openViewer(card.item, { items: memory.items });
    return;
  }
  if (memory.lock || card.open || card.matched) return;
  if (!memory.start) {
    memory.start = Date.now();
    memory.timer = setInterval(updateMemoryStats, 1000);
  }
  setCardOpen(card, true);

  if (!memory.first) {
    memory.first = card;
    return;
  }
  const first = memory.first;
  memory.first = null;
  memory.moves++;

  if (first.item.date === card.item.date) {
    first.matched = card.matched = true;
    setTimeout(() => {
      first.el.classList.add("matched");
      card.el.classList.add("matched");
    }, 350);
    memory.found++;
    if (memory.found === memory.pairs) setTimeout(memoryWon, 650);
  } else {
    memory.lock = true;
    setTimeout(() => {
      first.el.classList.add("miss");
      card.el.classList.add("miss");
    }, 400);
    setTimeout(() => {
      [first, card].forEach((c) => {
        c.el.classList.remove("miss");
        setCardOpen(c, false);
      });
      memory.lock = false;
    }, 1000);
  }
  updateMemoryStats();
}

function memoryElapsed() {
  return memory.start ? Date.now() - memory.start : 0;
}

function updateMemoryStats() {
  if (memory.done) return;
  $("memoryMoves").textContent = memory.moves;
  $("memoryPairs").textContent = `${memory.found}/${memory.pairs}`;
  $("memoryTime").textContent = formatTime(memoryElapsed());
  renderMemoryBest();
}

function renderMemoryBest() {
  const best = progress.memoryBest[memory.pairs];
  $("memoryBest").textContent = best ? t("best")(t("bestMemory")(best)) : "";
}

function memoryWon() {
  const time = memoryElapsed();
  updateMemoryStats();
  clearInterval(memory.timer);
  memory.done = true;
  $("memoryGrid").classList.add("won");
  memory.cards.forEach((c) => (c.el.title = displayText(c.item).title));

  const best = progress.memoryBest[memory.pairs];
  const record = !best || memory.moves < best;
  if (record) {
    progress.memoryBest[memory.pairs] = memory.moves;
    saveProgress();
  }
  memory.win = { moves: memory.moves, time, record };
  renderMemoryWin();
  renderMemoryBest();
  confettiFrom($("memoryGrid"));
  unlockBadge("memory");
  if (memory.pairs === 8 && memory.moves <= 22) unlockBadge("sharp");
}

function renderMemoryWin() {
  const box = $("memoryWin");
  if (!memory.win) return box.classList.add("hidden");
  const { moves, time, record } = memory.win;
  box.textContent = `${t("memoryWin")(moves, formatTime(time))}${record ? ` ${t("newRecord")}` : ""}`;
  box.classList.remove("hidden");
  replay(box, "pop");
}

function setupMemory() {
  document.querySelectorAll("[data-pairs]").forEach((chip) => {
    chip.addEventListener("click", () => {
      memory.pairs = Number(chip.dataset.pairs);
      document.querySelectorAll("[data-pairs]").forEach((c) => c.classList.toggle("active", c === chip));
      $("memoryGrid").classList.remove("won");
      newMemoryGame();
    });
  });
  $("memoryNew").addEventListener("click", () => {
    $("memoryGrid").classList.remove("won");
    newMemoryGame();
  });
}

// ---------- Sekmeler ve başlangıç ----------
const started = { puzzle: false, memory: false };

function showGame(name) {
  document.querySelectorAll("[data-game]").forEach((tab) => {
    const on = tab.dataset.game === name;
    tab.classList.toggle("active", on);
    tab.setAttribute("aria-selected", on);
  });
  $("puzzleGame").classList.toggle("hidden", name !== "puzzle");
  $("memoryGame").classList.toggle("hidden", name !== "memory");
  replay($(name === "puzzle" ? "puzzleGame" : "memoryGame"), "game-in");
  startGame(name);
}

function startGame(name) {
  if (started[name]) return;
  started[name] = true;
  if (name === "puzzle") loadPuzzle("today");
  else newMemoryGame();
}

// Dil değişince oyun bölümündeki metinleri yenile (script.js'teki applyTexts çağırır)
function gamesApplyTexts() {
  document.querySelectorAll("#sec-games [data-i18n], .topnav [data-i18n]").forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });
  renderStreak();
  renderBadges();
  renderPuzzleBest();
  renderMemoryBest();
  updatePeekButton();
  updateModeUi();
  if (puzzle.item) $("puzzleTitle").textContent = displayText(puzzle.item).title;
  if (puzzle.win) renderPuzzleWin();
  if (memory.win) renderMemoryWin();
  puzzle.els.forEach((el, id) => el.setAttribute("aria-label", t("tile")(id + 1)));
  memory.cards.forEach((c) => setCardOpen(c, c.open));
}

function setupGames() {
  setupPuzzle();
  setupMemory();
  document.querySelectorAll("[data-game]").forEach((tab) => {
    tab.addEventListener("click", () => showGame(tab.dataset.game));
  });

  updateStreak();
  gamesApplyTexts();
  checkBadges();

  // Oyun, bölüm ekrana gelince yüklensin (açılışta boşuna resim indirilmesin)
  const section = $("sec-games");
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          observer.disconnect();
          startGame("puzzle");
        }
      },
      { rootMargin: "200px 0px" }
    );
    observer.observe(section);
  } else {
    startGame("puzzle");
  }

  setupStarfield();
}

setupGames();
