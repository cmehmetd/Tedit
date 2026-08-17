# AGENTS.md — Tedit için AI Ajan Rehberi

Bu dosya, Tedit projesini inceleyen veya geliştiren AI ajanlar (Copilot, Antigravity, Claude, GPT vb.) için kapsamlı bir rehberdir.

---

## 🗺️ Proje Özeti

| Özellik | Değer |
|---|---|
| Proje Adı | Tedit |
| Tür | Tarayıcı tabanlı görsel editör |
| Teknoloji | Vanilla JS, HTML5 Canvas API, CSS3 |
| Bağımlılık | Yok (sıfır npm/node bağımlılığı) |
| Giriş Noktası | `index.html` |
| Canvas Boyutu | 1280 × 720 px (YouTube standardı) |
| Yaklaşık Kod Büyüklüğü | ~3.100 satır (JS: 1779, CSS: 1076, HTML: 357) |

---

## 📁 Dosya Haritası

```
Tedit/
├── index.html   ← HTML yapısı, tüm DOM elementleri, panel düzenleri
├── style.css    ← Tüm stiller (dark theme, floating panels, animasyonlar)
├── app.js       ← Uygulama mantığı (tek büyük IIFE-like modül)
├── README.md    ← Kullanıcı belgesi
└── AGENTS.md    ← Bu dosya
```

---

## 🔑 Temel Mimari: `app.js`

Tüm uygulama mantığı `app.js` içindeki tek bir `DOMContentLoaded` dinleyicisinin içinde kapsüllenmiştir. **Global scope'a hiçbir şey sızdırılmaz.**

### Bölüm Haritası (`app.js`)

| Satır Aralığı | Bölüm | Açıklama |
|---|---|---|
| 1–50 | State Init | `state` nesnesi tanımı |
| 52–127 | DOM Refs | Tüm element referansları |
| 128–183 | Init & Scaling | `init()`, `setupCanvasScaling()`, responsive viewport |
| 185–252 | History | `saveHistoryState()`, `undo()`, `redo()`, `restoreState()` |
| 254–290 | Render Loop | `render()` — ana çizim döngüsü |
| 292–350 | Snap Guidelines | Hizalama kılavuz çizgileri, merkez artı/nokta |
| 351–600 | Layer Rendering | `renderLayer()`, `drawRect()`, `drawCircle()`, `drawStar()`, `drawArrow()`, `drawBadge()`, `drawText()`, `drawFreehand()` |
| 600–800 | Selection Handles | 8 tutamaç + döndürme, `renderSelectionHandles()` |
| 800–1000 | Mouse Events | `handleMouseDown/Move/Up()`, drag, resize, rotate |
| 1000–1150 | Snap Logic | Magnetik snap hesaplama |
| 1150–1350 | Tool Actions | Metin/şekil/çizim ekleme, görsel yükleme |
| 1350–1550 | Layer Panel | `renderLayersPanel()`, sürükle-bırak sıralama |
| 1550–1650 | Properties Panel | `updateUI()`, form→state senkronizasyonu |
| 1650–1779 | Event Bindings | `bindEvents()`, klavye kısayolları, export |

---

## 🧱 Katman (Layer) Veri Modeli

Tüm katmanlar `state.layers[]` dizisinde tutulur. Render sırası: **index 0 = en altta**.

### Ortak Alanlar (tüm türlerde)

```typescript
{
  id: string;          // 'layer_' + rastgele 9 karakter
  type: LayerType;     // aşağıya bakın
  x: number;           // sol üst köşe X (canvas koordinatı)
  y: number;           // sol üst köşe Y (canvas koordinatı)
  width: number;       // piksel genişlik
  height: number;      // piksel yükseklik
  rotation: number;    // derece, -180..180
  opacity: number;     // 0..100
  visible: boolean;
  label: string;       // katman panelinde görünen isim
}
```

### `type: 'text'`
```typescript
{
  text: string;
  fontFamily: string;
  fontSize: number;    // 16..250
  color: string;       // hex
  strokeColor: string; // hex
  strokeWidth: number; // 0..30
  shadow: boolean;
}
```

### `type: 'rect'`
```typescript
{
  fillEnabled: boolean;
  fillColor: string;
  strokeColor: string;
  strokeWidth: number; // 0..30
  radius: number;      // köşe yuvarlaklığı 0..60
}
```

### `type: 'circle'`
```typescript
{
  fillEnabled: boolean;
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
}
```

### `type: 'star'` | `type: 'arrow'` | `type: 'badge'`
```typescript
{
  fillEnabled: boolean;
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
}
```

### `type: 'image'`
```typescript
{
  _imgElement: HTMLImageElement;
  _imgSrc: string;     // (yalnızca history snapshot'larında)
}
```

### `type: 'freehand'`
```typescript
{
  points: Array<{ x: number; y: number }>;
  color: string;
  size: number;        // 2..60
}
```

---

## 🖥️ Canvas Koordinat Sistemi

Uygulama **iki farklı koordinat alanı** kullanır:

| Alan | Açıklama | Dönüşüm |
|---|---|---|
| **Canvas Koordinatları** | 1280×720 mantıksal alan, layer verileri burada saklanır | — |
| **Ekran Koordinatları** | Kullanıcının gördüğü ölçeklenmiş + kaydırılmış alan | `(ekran - panOffset) / (scale * zoom)` |

Mouse olaylarında ekran → canvas dönüşümü:
```js
// interactiveCanvas üzerindeki tıklama koordinatı:
const rect = interactiveCanvas.getBoundingClientRect();
const scaleX = state.canvasWidth / rect.width;
const scaleY = state.canvasHeight / rect.height;
const canvasX = (event.clientX - rect.left) * scaleX;
const canvasY = (event.clientY - rect.top) * scaleY;
```

> **Önemli:** Pan ve zoom etkisi `canvasWrapper` üzerindeki CSS `transform`'a yansıtılır, canvas koordinatları değişmez.

---

## 🛠️ Değişiklik Yaparken Dikkat Edilecek Kurallar

### 1. State Tutarlılığı
- `state.layers` dizisini doğrudan mutate edebilirsiniz; ancak her değişiklikten sonra `saveHistoryState()` ve `render()` çağrılmalıdır.
- History snapshot'ları `image` türü için `_imgSrc` kullanır; `_imgElement` serialize edilmez.

### 2. Render'ı Tetikleme
Herhangi bir görsel değişiklik için:
```js
saveHistoryState(); // değişiklik kaydedilmeli
render();           // sonra render
updateUI();         // panel güncelleme (gerekirse)
```

### 3. Yeni Katman Türü Ekleme
1. `state.layers`'a yeni bir obje push edin (ortak alanlar + tipe özgü alanlar).
2. `renderLayer()` içine `case 'yeni-tur':` ekleyin.
3. `renderLayersPanel()`'da ikon/label tanımı ekleyin.
4. Gerekirse Properties Panel'e yeni kontroller ekleyin ve `updateUI()` + `bindEvents()` içinde bağlayın.

### 4. CSS Değişikliği
Tüm renkler ve boyutlar CSS custom properties (`--` değişkenleri) ile yönetilir. Renk değişikliklerini doğrudan hex yazmak yerine `:root` bloğundan yapın.

### 5. Boyut Sınırları
Canvas boyutu şu an **sabit 1280×720**'dir. `state.canvasWidth` ve `state.canvasHeight` aracılığıyla referans alın; sabit sayı yazmayın.

---

## 🔒 Güvenlik & Kısıtlamalar

- **CORS:** Yüklenen görseller `FileReader` API ile `data:` URL'e dönüştürülür, cross-origin sorun yoktur.
- **Persistent Storage Yok:** Oturum verisi saklanmaz; sayfa yenilendiğinde her şey sıfırlanır.
- **Offline:** Uygulama mantığı offline çalışır; Google Fonts ve Material Symbols için internet gerekir.

---

## 🧪 Test Stratejisi

Bu proje otomatik test içermez. Manuel test adımları:

1. **Metin:** Metin ekle → font/boyut/renk/stroke değiştir → PNG olarak indir → boyutları doğrula.
2. **Şekil:** Her şekil türünü ekle → seç → yeniden boyutlandır → döndür → opaklık ayarla.
3. **Undo/Redo:** 5+ eylem yap → `Ctrl+Z` ile geri dön → `Ctrl+Y` ile ileri git.
4. **Snap:** Katmanı yavaşça ortaya sürükle → mavi kılavuz çizgiler ve kırmızı merkez noktası belirsin.
5. **Export:** PNG ve JPG olarak indir → dosya boyutlarını ve 1280×720 boyutunu doğrula.

---

## 💡 Bilinen Sınırlamalar & Geliştirme Fırsatları

| Alan | Mevcut Durum | Potansiyel İyileştirme |
|---|---|---|
| Kalıcı Depolama | Yok | `localStorage` veya IndexedDB ile proje kaydetme |
| Font Yükleme | Sabit 7 Google Font | Font yükleme desteği veya genişletilmiş liste |
| Geri Alma Limiti | 30 adım | Ayarlanabilir limit |
| Çoklu Seçim | Desteklenmiyor | Shift+tıklama ile çoklu katman seçimi |
| Kılavuz Çizgiler | Yalnızca merkez | Özel konumlandırılabilir kılavuzlar |
| Responsive | Kısmi | Tam mobil dokunma desteği |
| Keyboard Shortcuts | Ctrl+Z/Y, Delete | Daha kapsamlı kısayol seti |
