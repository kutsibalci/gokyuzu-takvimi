// =============================================
// Gökyüzü Takvimi – doğum günü kartı
// Doğum günü fotoğraflarından birini paylaşılabilir bir kart resmine
// (1080×1350, sosyal medyaya uygun dikey boyut) dönüştürür.
// script.js'teki birthdayItems, birthDate, formatDate, thumbUrl, toast... kullanılır.
// =============================================

const SITE_URL = "https://kutsibalci.github.io/gokyuzu-takvimi/";

Object.assign(TEXTS.tr, {
  cardButton: "Doğum günü kartımı oluştur",
  cardTitle: "Doğum günü kartın",
  cardHelp: "Oklarla doğum günlerinden birini seç, kartı indir ya da paylaş.",
  cardDownload: "Kartı indir",
  cardShare: "Paylaş",
  cardEyebrowBorn: "Doğduğum gün NASA'nın fotoğrafı",
  cardEyebrowYear: (year) => `${year} doğum günümde NASA'nın fotoğrafı`,
  cardPick: (year, label, i, n) => `${year} · ${label} · ${i}/${n}`,
  cardFooter: "Seninkini bul:",
  cardCredit: (c) => `Görsel: ${c}`,
  cardShareText: (url) => `Doğduğum gün NASA uzaydan bu fotoğrafı paylaşmış. Seninki hangisi? ${url}`,
  cardShareTextYear: (year, url) => `${year} doğum günümde NASA uzaydan bu fotoğrafı paylaşmış. Seninki hangisi? ${url}`,
  cardDownloaded: "Kart indirildi",
  cardSharedFallback: "Kart indirildi, paylaşım metni kopyalandı",
  cardFailed: "Kart oluşturulamadı. Başka bir fotoğraf seçmeyi dene.",
  cardNoImage: "Görsel yok",
  close: "Kapat",
});

Object.assign(TEXTS.en, {
  cardButton: "Create my birthday card",
  cardTitle: "Your birthday card",
  cardHelp: "Use the arrows to pick one of your birthdays, then download or share the card.",
  cardDownload: "Download card",
  cardShare: "Share",
  cardEyebrowBorn: "NASA's photo on the day I was born",
  cardEyebrowYear: (year) => `NASA's photo on my birthday in ${year}`,
  cardPick: (year, label, i, n) => `${year} · ${label} · ${i}/${n}`,
  cardFooter: "Find yours:",
  cardCredit: (c) => `Image: ${c}`,
  cardShareText: (url) => `On the day I was born, NASA shared this photo from space. Which one is yours? ${url}`,
  cardShareTextYear: (year, url) => `On my birthday in ${year}, NASA shared this photo from space. Which one is yours? ${url}`,
  cardDownloaded: "Card downloaded",
  cardSharedFallback: "Card downloaded and share text copied",
  cardFailed: "Couldn't create the card. Try picking another photo.",
  cardNoImage: "No image",
  close: "Close",
});

// Site bir sunucudan açıldıysa kendi adresi, dosyadan açıldıysa yayındaki adres
function siteUrl() {
  if (location.protocol.startsWith("http")) {
    return location.origin + location.pathname.replace(/index\.html$/, "");
  }
  return SITE_URL;
}

const shortUrl = () => siteUrl().replace(/^https?:\/\//, "").replace(/\/$/, "");

const card = { open: false, index: 0, img: null, token: 0, lastFocus: null };

// Doğduğu yılın fotoğrafı varsa o, yoksa en son doğum günü seçilir
function defaultCardIndex() {
  const born = birthdayItems.findIndex((item) => item.date === birthDate);
  return born >= 0 ? born : birthdayItems.length - 1;
}

function openCard() {
  if (!birthdayItems.length) return;
  card.open = true;
  card.index = defaultCardIndex();
  card.lastFocus = document.activeElement;
  const modal = $("cardModal");
  modal.hidden = false;
  document.body.classList.add("no-scroll");
  requestAnimationFrame(() => modal.classList.add("open"));
  $("cardClose").focus();
  loadCardImage();
}

function closeCard() {
  if (!card.open) return;
  card.open = false;
  card.token++;
  const modal = $("cardModal");
  modal.classList.remove("open");
  document.body.classList.remove("no-scroll");
  setTimeout(() => {
    if (!card.open) modal.hidden = true;
  }, 250);
  card.lastFocus?.focus?.();
}

function stepCard(dir) {
  const n = birthdayItems.length;
  if (n < 2) return;
  card.index = (card.index + dir + n) % n;
  loadCardImage();
}

function cardLabel(item) {
  return item.date === birthDate ? t("birthdayAge")(0) : t("birthdayAge")(Number(item.date.slice(0, 4)) - Number(birthDate.slice(0, 4)));
}

async function loadCardImage() {
  const token = ++card.token;
  const item = birthdayItems[card.index];
  const n = birthdayItems.length;
  $("cardPickLabel").textContent = t("cardPick")(item.date.slice(0, 4), cardLabel(item), card.index + 1, n);
  $("cardPrev").disabled = $("cardNext").disabled = n < 2;
  $("cardPreview").classList.add("loading");
  card.img = null;
  drawCard(item, null); // resim gelene kadar yazılar görünsün

  if (item.image) {
    try {
      const img = await new Promise((resolve, reject) => {
        const im = new Image();
        im.crossOrigin = "anonymous"; // kartın indirilebilmesi için gerekli
        im.onload = () => resolve(im);
        im.onerror = reject;
        im.src = thumbUrl(item.image, 1200);
      });
      if (token !== card.token) return;
      card.img = img;
    } catch {
      // resim gelmezse kart degrade arka planla çizilir
    }
  }
  if (token !== card.token) return;
  await document.fonts?.ready;
  drawCard(item, card.img);
  $("cardPreview").classList.remove("loading");
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Metni verilen genişliğe sığacak satırlara böl (en fazla maxLines, fazlası …)
function wrapText(ctx, text, maxWidth, maxLines) {
  const words = text.split(/\s+/);
  const lines = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width <= maxWidth || !line) {
      line = test;
    } else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) {
    lines.length = maxLines;
    let last = lines[maxLines - 1];
    while (ctx.measureText(`${last}…`).width > maxWidth && last.includes(" ")) last = last.slice(0, last.lastIndexOf(" "));
    lines[maxLines - 1] = `${last}…`;
  }
  return lines;
}

function drawCard(item, img) {
  const canvas = $("cardCanvas");
  const ctx = canvas.getContext("2d");
  const W = canvas.width;
  const H = canvas.height;
  const font = getComputedStyle(document.body).fontFamily;
  const pad = 64;

  // Arka plan: gece mavisi + sabit yıldızlar
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#0d1120");
  bg.addColorStop(1, "#07080d");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  let seed = 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 160; i++) {
    ctx.fillStyle = `rgba(255,255,255,${0.15 + rand() * 0.55})`;
    const r = rand() * 1.8 + 0.4;
    ctx.fillRect(rand() * W, rand() * H, r, r);
  }

  // Fotoğraf (kutuyu dolduracak şekilde kırpılır)
  const px = pad;
  const py = pad;
  const pw = W - pad * 2;
  const ph = 820;
  ctx.save();
  roundRect(ctx, px, py, pw, ph, 36);
  ctx.clip();
  if (img) {
    const scale = Math.max(pw / img.naturalWidth, ph / img.naturalHeight);
    const dw = img.naturalWidth * scale;
    const dh = img.naturalHeight * scale;
    ctx.drawImage(img, px + (pw - dw) / 2, py + (ph - dh) / 2, dw, dh);
  } else {
    const g = ctx.createRadialGradient(px + pw * 0.6, py + ph * 0.4, 20, px + pw / 2, py + ph / 2, pw * 0.8);
    g.addColorStop(0, "#3a4f9e");
    g.addColorStop(0.5, "#1b2244");
    g.addColorStop(1, "#0d1120");
    ctx.fillStyle = g;
    ctx.fillRect(px, py, pw, ph);
    if (!item.image) {
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.font = `500 34px ${font}`;
      ctx.textAlign = "center";
      ctx.fillText(t("cardNoImage"), px + pw / 2, py + ph / 2);
      ctx.textAlign = "left";
    }
  }
  ctx.restore();
  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.lineWidth = 2;
  roundRect(ctx, px, py, pw, ph, 36);
  ctx.stroke();

  // Yazılar
  let y = py + ph + 76;
  const eyebrow = item.date === birthDate ? t("cardEyebrowBorn") : t("cardEyebrowYear")(item.date.slice(0, 4));
  ctx.fillStyle = "#8fb0ff";
  ctx.font = `600 32px ${font}`;
  ctx.fillText(eyebrow, pad, y);

  y += 70;
  ctx.fillStyle = "#ffffff";
  ctx.font = `700 60px ${font}`;
  const titleLines = wrapText(ctx, item.title, W - pad * 2, 2);
  titleLines.forEach((line, i) => ctx.fillText(line, pad, y + i * 72));
  y += (titleLines.length - 1) * 72 + 58;

  ctx.fillStyle = "rgba(220,226,240,0.75)";
  ctx.font = `500 30px ${font}`;
  let meta = formatDate(item.date);
  const kind = kindLabel(item);
  if (kind) meta += `  ·  ${kind.text}`; // çizim/simülasyonsa kartta da belirt
  if (item.credit) {
    const credit = t("cardCredit")(item.credit);
    meta = wrapText(ctx, `${meta}  ·  ${credit}`, W - pad * 2, 1)[0];
  }
  ctx.fillText(meta, pad, y);

  // Alt bilgi: site adı ve adresi
  const fy = H - 64;
  ctx.fillStyle = "#4c7dff";
  ctx.beginPath();
  ctx.arc(pad + 13, fy - 11, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = `700 32px ${font}`;
  ctx.fillText("Gökyüzü Takvimi", pad + 40, fy);
  ctx.textAlign = "right";
  ctx.fillStyle = "rgba(220,226,240,0.7)";
  ctx.font = `500 26px ${font}`;
  ctx.fillText(`${t("cardFooter")} ${shortUrl()}`, W - pad, fy);
  ctx.textAlign = "left";
}

function cardBlob() {
  return new Promise((resolve, reject) => {
    try {
      $("cardCanvas").toBlob((blob) => (blob ? resolve(blob) : reject(new Error("blob"))), "image/png");
    } catch (e) {
      reject(e);
    }
  });
}

function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

const cardFileName = () => `gokyuzu-takvimi-${birthdayItems[card.index].date}.png`;

async function downloadCard() {
  try {
    downloadBlob(await cardBlob(), cardFileName());
    toast(t("cardDownloaded"));
  } catch {
    toast(t("cardFailed"));
  }
}

// Telefonda paylaşım menüsü açılır; bilgisayarda kart indirilir ve metin kopyalanır
async function shareCard() {
  let blob;
  try {
    blob = await cardBlob();
  } catch {
    toast(t("cardFailed"));
    return;
  }
  const item = birthdayItems[card.index];
  const text = item.date === birthDate ? t("cardShareText")(siteUrl()) : t("cardShareTextYear")(item.date.slice(0, 4), siteUrl());
  const file = new File([blob], cardFileName(), { type: "image/png" });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], text });
      return;
    } catch (e) {
      if (e?.name === "AbortError") return;
    }
  }
  downloadBlob(blob, cardFileName());
  try {
    await navigator.clipboard.writeText(text);
    toast(t("cardSharedFallback"));
  } catch {
    toast(t("cardDownloaded"));
  }
}

// Doğum günü sonuçları gelince kart butonunu göster (script.js'teki çizimden sonra)
function updateCardButton() {
  $("birthdayActions").classList.toggle("hidden", !birthdayItems.length);
}

function setupCard() {
  $("cardBtn").addEventListener("click", openCard);
  $("cardClose").addEventListener("click", closeCard);
  $("cardPrev").addEventListener("click", () => stepCard(-1));
  $("cardNext").addEventListener("click", () => stepCard(1));
  $("cardDownload").addEventListener("click", downloadCard);
  $("cardShare").addEventListener("click", shareCard);
  const modal = $("cardModal");
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeCard(); // karanlık alana tıklayınca kapan
  });
  modal.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeCard();
    else if (e.key === "ArrowLeft") stepCard(-1);
    else if (e.key === "ArrowRight") stepCard(1);
    else return;
    e.preventDefault(); // sayfadaki gün değiştirme kısayolu çalışmasın
  });
  // Odak pencerenin içinde kalsın
  modal.addEventListener("focusout", (e) => {
    if (card.open && !modal.contains(e.relatedTarget)) setTimeout(() => card.open && $("cardClose").focus(), 0);
  });
  // birthdayGrid her yeniden çizildiğinde butonu güncelle
  new MutationObserver(updateCardButton).observe($("birthdayGrid"), { childList: true });
  updateCardButton();
}

// Dil değişince kart metinleri yenilensin (gamesApplyTexts'ten çağrılır)
function cardApplyTexts() {
  if (card.open) loadCardImage();
}

setupCard();
