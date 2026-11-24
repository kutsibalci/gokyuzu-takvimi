# Gökyüzü Takvimi

NASA'nın **APOD (Astronomy Picture of the Day / Günün Astronomi Fotoğrafı)** verisini kullanan bir web uygulaması. NASA'nın 1995'ten bu yana her gün yayınladığı astronomi fotoğraflarını açıklamalarıyla birlikte gösterir.

## Özellikler

**Günün fotoğrafı**
- Tarih çubuğu: ortadaki tarihe tıklayınca takvim açılır, iki yandaki butonlar önceki / sonraki günün tarihini gösterir
- Klavyeden ← → ile günler arasında geçiş, rastgele fotoğraf, en yeni güne dönüş
- Video olan günlerde videonun sayfada oynatılması (YouTube videoları dahil)
- Detaylar: görselin sahibi (bağlantılı), çözünürlük, görselin yazılı açıklaması, arşivdeki kaçıncı gün olduğu
- Türkçe modda açıklamanın Türkçeye çevrilmesi (Chrome'un cihaz içi çevirisiyle)

**Oyunlar ve rozetler**
- Kaydırmalı yapboz: üstteki ya da rastgele bir NASA fotoğrafı 3×3 veya 4×4 parçaya bölünür; tıklama veya ok tuşlarıyla oynanır, her zaman çözülebilir karıştırılır, hamle/süre rekoru saklanır
- Hafıza kartları: arşivden rastgele fotoğraflarla 12 veya 16 kartlık eşleştirme oyunu; oyun bitince kartlara tıklayıp fotoğrafları inceleyebilirsiniz
- Günlük seri: siteye üst üste girilen gün sayısı
- 10 rozet (seri, keşif, favori, doğum günü ve oyun başarıları); açılınca bildirim ve konfeti
- Koyu temada fareyle hafifçe kayan yıldızlı arka plan ve ara sıra kayan yıldız

**Görüntüleme**
- Tam ekran detay penceresi: fare tekerleği / çift tıklama ile yakınlaştırma, sürükleyerek gezinme, bilgi panelini açıp kapatma, klavye kısayolları (Esc, ← →, + −, 0)
- Fotoğrafı (veya video dosyasını) indirme
- Paylaşılabilir bağlantı: adres çubuğunda tarih durur (ör. `index.html#2024-03-05`), bağlantıyı açan doğrudan o günü görür

**Keşif**
- Geçmiş yıllarda bu tarih: seçilen günün önceki 5 yıldaki fotoğrafları
- Arşiv takvimi: bir ayın tüm günleri küçük resimlerle, ay ay gezinme
- Doğum günü fotoğrafları: doğum tarihine göre 1995'ten bu yana her doğum gününün fotoğrafı (29 Şubat doğumlular için artık olmayan yıllarda 28 Şubat)
- Arşiv: sayfa numaralarıyla gezinme (sayfa başına 20 fotoğraf, sayfaya git kutusu), başlık ve açıklamada arama, fotoğraf / video filtresi
- Detay penceresi: herhangi bir karta (arşiv, takvim, doğum günü, favoriler) tıklayınca fotoğraf ve bilgileri tam ekran açılır; oklarla aynı listede ilerlenir, arşivde sayfa sonuna gelince bir sonraki sayfaya geçilir, X veya Esc ile kapanır
- Favoriler

**Arayüz**
- Türkçe / İngilizce arayüz, açık / koyu tema (seçimler hatırlanır)
- Animasyonlar: gün değişince yönüne göre kayan içerik, sırayla beliren kartlar, kaydırınca beliren bölümler, yükleniyor iskeletleri. "Hareketi azalt" ayarını açan kullanıcılarda animasyonlar kapanır.
- Mobil uyumlu tasarım, klavyeyle kullanılabilir arayüz

**Teknik**
- Önbellek: çekilen sayfalar tarayıcıda saklanır, ikinci açılışta anında gelir
- Uygulama olarak yükleme (PWA): `manifest.webmanifest` + `sw.js`. Site bir sunucudan açılınca telefona ve bilgisayara uygulama gibi kurulabilir ve daha önce görülen günler çevrimdışı da açılır. Dosya çift tıklanarak açıldığında bu kısım devre dışıdır.

## Kullanılan API
- **NASA Science APOD API:** `https://science.nasa.gov/wp-json/wp/v2/apod-basic/?page=1`
- Her sayfa en yeniden eskiye 25 günü döndürür. Kullanılan parametre: `page`
- Kullanılan alanlar: `date`, `title`, `explanation`, `alt`, `copyright`, `credit`, `media_type`, `hdurl`, `url`, `basic_html` (video dosyası / YouTube bağlantısı için)
- API anahtarı gerektirmez.

> Not: Eski `api.nasa.gov/planetary/apod` adresi şu an gerçek fotoğraf yerine NASA logosu döndürdüğü için NASA'nın yeni APOD adresi kullanıldı.

## API'yle ilgili çözülen sorunlar
- **Tarihe göre arama yok:** API sadece sayfa numarası alıyor. Bir tarihin kaç gün önce olduğundan hangi sayfada olduğu hesaplanır, gerekirse komşu sayfaya geçilir.
- **Bazı günlerde küçük önizleme geliyor:** `hdurl` bazen 48×48 piksellik bir önizleme (`.../renditions/cq5dam.thumbnail.48.48.png`) oluyor. Adresten asıl resmin yolu çıkarılır.
- **Bazı günlerde resim yerine NASA logosu geliyor:** Bu durumda "görsel yok" gösterilir; YouTube videolarında videonun kendi önizleme resmi kullanılır.
- **Protokolsüz video adresleri:** `//www.youtube.com/...` biçimindeki adreslerin başına `https:` eklenir.

## Çeviri hakkında
NASA'nın metinleri İngilizcedir. Türkçe modda "Türkçeye çevir" butonuna basılınca Chrome'un tarayıcıya gömülü **Translator** özelliği kullanılır. Bu özellik bilgisayarın içinde çalışır; ayrı bir web API'si, hesap ya da anahtar gerektirmez. İlk kullanımda Chrome dil modelini bir kez indirir. Desteklemeyen tarayıcılarda orijinal İngilizce metin gösterilir.

## Çalıştırma
`index.html` dosyasını tarayıcıda açman yeterli. Kurulum gerekmez.

## Dosyalar
| Dosya | Açıklama |
|---|---|
| `index.html` | Sayfa yapısı |
| `style.css` | Tasarım, temalar ve animasyonlar |
| `script.js` | API istekleri, dil desteği ve uygulama mantığı |
| `games.js` | Yapboz, hafıza oyunu, günlük seri, rozetler, yıldızlı arka plan ve konfeti |
| `manifest.webmanifest` | Uygulama olarak kurulma bilgileri |
| `sw.js` | Çevrimdışı çalışma ve önbellek (service worker) |
| `icons/` | Uygulama ikonları |
