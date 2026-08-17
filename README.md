# Tedit — YouTube Thumbnail Editörü

> **Saf HTML5 Canvas + Vanilla JS ile çalışan, sunucu gerektirmeyen modern YouTube thumbnail editörü.**

![Durum](https://img.shields.io/badge/Durum-Aktif-27B3FF?style=for-the-badge) ![Teknoloji](https://img.shields.io/badge/Teknoloji-Vanilla%20JS-F7DF1E?style=for-the-badge&logo=javascript)

---

## 📋 İçindekiler

- [Proje Hakkında](#-proje-hakkında)
- [Özellikler](#-özellikler)
- [Nasıl Kullanılır](#-kurulum--kullanım)
- [Arayüz Mimarisi](#-arayüz-mimarisi)
- [Araçlar & Kısayollar](#-araçlar--kısayollar)
- [Dosya Yapısı](#-dosya-yapısı)
- [Teknik Detaylar](#-teknik-detaylar)

---

## 🎯 Proje Hakkında

**Tedit**, YouTube içerik üreticileri için tasarlanmış, tarayıcı tabanlı bir thumbnail editörüdür. Herhangi bir kurulum veya sunucu gerektirmez — doğrudan `index.html` dosyasını açarak kullanmaya başlayabilirsiniz.

Proje; **1280 × 720** piksel (YouTube standart boyutu) canvas üzerinde katman tabanlı bir düzenleme deneyimi sunar. Tüm işlemler istemci tarafında çalışır, verileriniz hiçbir zaman dışarıya aktarılmaz.

---

## ✨ Özellikler

### 🖋️ Metin Aracı
- Özelleştirilebilir **yazı tipi** (Anton, Bangers, Montserrat, Poppins, Inter, Impact, Permanent Marker)
- Yazı boyutu: **16 – 250 px** (slider + sayısal giriş)
- **Yazı rengi** ve **kenarlık (stroke) rengi** bağımsız olarak ayarlanabilir
- **Kenarlık kalınlığı**: 0 – 30 px
- **Thumbnail Gölge Efekti** (toggle ile etkinleştirilebilir)

### 🔷 Şekil Aracı

Aşağıdaki şekilleri canvas'a ekleyebilirsiniz:

| Şekil | Açıklama |
|---|---|
| Dikdörtgen | Klasik rectangle, yuvarlak köşe desteğiyle |
| Daire | Tam çember / oval |
| Yıldız / Parlama | Dikkat çeken starburst efekti |
| Ok İşareti | Yön oku |
| Thumbnail Rozeti | Hazır rozet/etiket şekli |

- **Dolgu rengi** ve açma/kapama toggle'ı
- **Kenarlık rengi** ve kalınlığı
- **Köşe yuvarlaklığı**: 0 – 60 px

### ✏️ Serbest Çizim
- Özelleştirilebilir **fırça rengi** ve **kalınlığı** (2 – 60 px)
- Çizim modu bittiğinde katman olarak eklenir

### 🖼️ Görsel Yükleme
- `image/*` destekli yerel dosya yükleme
- Yüklenen görsel katman olarak eklenir ve diğer katmanlarla birlikte yönetilir

### 🔄 Undo / Redo
- **30 adıma** kadar geri alma/ileri alma geçmişi
- `Ctrl+Z` / `Ctrl+Y` kısayolları

### 📐 Magnetik Hizalama (Snap)
- Katman ortalandığında yatay/dikey **mavi kılavuz çizgiler** belirir
- İkisi aynı anda aktifken canvas merkezinde **artı (+) işareti** ve **kırmızı nokta** gösterilir

### 🗂️ Katman Yönetimi
- Sürükle-bırak ile **katman sırası değiştirme**
- **Opaklık (0 – 100%)** kontrolü
- Katmanı **üste / alta taşı**, **çoğalt**, **sil**

### 🔍 Yakınlaştırma & Kaydırma
- `Ctrl + Mouse Scroll` ile zoom in/out
- `Space` tuşu basılıyken sürükleyerek **pan (kaydırma)**
- Zoom sıfırlama butonu

### 💾 Dışa Aktarma
- **PNG** (yüksek kalite, şeffaflık destekli)
- **JPG** (küçük dosya boyutu)
- Çıktı her zaman **1280 × 720 px** gerçek canvas boyutunda

---

## 🚀 Nasıl Kullanılır

Aşağıdaki bağlantıya tıklayarak kullanmaya başlayabilirsiniz.

https://cmehmetd.github.io/Tedit/

> **Not:** Google Fonts ve Material Symbols için internet bağlantısı gereklidir.

---

## 🏗️ Arayüz Mimarisi

```
┌─────────────────────────────────────────────────────┐
│           Üst Araç Çubuğu (Floating Panels)          │
│  [Tedit Logo] [Zoom | Arka Plan] [Undo/Redo | İndir] │
├──────────────┬──────────────────────┬────────────────┤
│  Sol Panel   │                      │   Sağ Panel    │
│ (Özellikler) │    Canvas Alanı      │  (Katmanlar)   │
│              │    1280 × 720        │                │
│  • Metin     │                      │  • Katman 1    │
│  • Şekil     │  [interactive-canvas]│  • Katman 2    │
│  • Çizim     │  [main-canvas]       │  • ...         │
│  • Transform │                      │                │
├──────────────┴──────────────────────┴────────────────┤
│          Alt Araç Çubuğu (Floating Bar)              │
│      [Metin] [Şekil] [Çizim] | [Görsel Yükle]       │
└──────────────────────────────────────────────────────┘
```

---

## ⌨️ Araçlar & Kısayollar

| Kısayol | İşlev |
|---|---|
| `Ctrl + Z` | Geri al (Undo) |
| `Ctrl + Y` | İleri al (Redo) |
| `Ctrl + Scroll` | Yakınlaştır / Uzaklaştır |
| `Space + Sürükle` | Canvas'ı kaydır (Pan) |
| `Delete` / `Backspace` | Seçili katmanı sil |
| `Tıklama` | Katman seç |

---

## 📁 Dosya Yapısı

```
Tedit/
├── index.html     # Uygulama giriş noktası, tüm HTML yapısı
├── style.css      # Dark theme UI stilleri (~1076 satır)
├── app.js         # Canvas motoru, katman sistemi, olay yönetimi (~1779 satır)
├── README.md      # Bu dosya
└── AGENTS.md      # AI ajan geliştirme rehberi
```

---

## 🔧 Teknik Detaylar

### Canvas Mimarisi
Uygulama **çift canvas** katmanı kullanır:

| Canvas | ID | Amaç |
|---|---|---|
| Ana Canvas | `#main-canvas` | Gerçek çıktı (1280×720), tüm katmanların render edildiği yer |
| Etkileşim Canvas | `#interactive-canvas` | Seçim tutamaçları, hizalama çizgileri, canlı çizim önizlemesi |

### State Yönetimi
Tek bir `state` nesnesi üzerinden yönetilir:

```js
state = {
  canvasWidth: 1280, canvasHeight: 720,
  backgroundColor: '#FFFFFF',
  layers: [],              // tüm katman verileri
  selectedLayerId: null,   // aktif katman
  history: [],             // undo/redo geçmişi (max 30)
  historyIndex: -1,
  userZoom: 1.0,           // viewport zoom
  panX: 0, panY: 0,        // viewport pan
  activeTool: 'select',    // 'select' | 'drawing'
  drawingBrush: { color, size, points }
}
```

### Render Döngüsü
1. Ana canvas temizlenir
2. Arka plan rengi çizilir
3. Katmanlar **alttan üste** sırayla render edilir
4. Etkileşim canvas'ına seçim tutamaçları / snap kılavuzları / canlı çizim eklenir
5. Katmanlar paneli DOM güncellenir

### Desteklenen Katman Türleri

| Tür | `type` | Açıklama |
|---|---|---|
| Metin | `text` | Font, boyut, renk, stroke, gölge |
| Dikdörtgen | `rect` | Dolgu, kenarlık, köşe radius |
| Daire | `circle` | Dolgu, kenarlık |
| Yıldız | `star` | Starburst efekti |
| Ok | `arrow` | Yönlü ok şekli |
| Rozet | `badge` | Thumbnail etiketi |
| Görsel | `image` | HTMLImageElement referansı |
| Serbest Çizim | `freehand` | Nokta dizisi (path tabanlı) |

---

## 🎨 Tema & CSS Değişkenleri

| Değişken | Değer | Kullanım |
|---|---|---|
| `--bg-main` | `#101010` | Ana uygulama arka planı |
| `--bg-panel` | `rgba(24,24,28,0.92)` | Floating panel arka planı (blur) |
| `--accent-color` | `#27B3FF` | Vurgu rengi, odak, aktif element |
| `--brand-red` | `#FF2B2B` | Logo "T" harfi, fırça varsayılanı |
| `--danger-color` | `#FF453A` | Silme / hata durumları |
| `--panel-width` | `280px` | Sol ve sağ panel genişliği |

---

## 📄 Lisans

Bu proje GNU General Public License v3.0 (GPLv3) ile lisanslanmıştır. Ayrıntılar için LICENSE dosyasına göz atabilirsiniz.
