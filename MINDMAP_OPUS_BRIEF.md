# Formulasyon — Klinik Mind Map Geliştirme Briefi
### Claude Opus için Kapsamlı Proje ve Görev Belgesi

---

## 1. PROJE GENEL BAKIŞ

**Formulasyon**, Türk psikolog/psikiyatristler için geliştirilmiş bir klinik vaka yönetim sistemidir. Uygulamanın amacı:
- Danışan dosyaları, formülasyonlar ve seans notlarını yönetmek
- BDT (Bilişsel Davranışçı Terapi) ve ACT (Kabul ve Kararlılık Terapisi) formülasyon araçları sunmak
- Terapist öz-bakım ve gelişim takibi yapmak

Şu an **geliştirme aşamasındaki en kritik özellik**: Danışan bazlı klinik mind map simülasyonu.

---

## 2. TEKNİK STACK

```
Framework  : Next.js 14 (App Router, 'use client' bileşenler)
Dil        : TypeScript (strict mode)
Stil       : Tailwind CSS v3
Grafikler  : Recharts (var olan grafik bileşenleri için)
Görselleştirme: Saf SVG (React inline SVG, hiç kütüphane yok)
Veri saklama: 
  - Sunucu tarafı: SQLite (API route'lar: /api/clients, /api/formulations, /api/seanslar vb.)
  - İstemci tarafı: localStorage (terapist öz-bakım, todo, profil verileri)
State yönetimi: useReducer (page.tsx'te tek global State)
```

**Dizin yapısı:**
```
/formulasyon
├── app/
│   ├── page.tsx              ← Ana uygulama, tüm state buraya ait
│   └── api/
│       ├── clients/          ← Danışan CRUD
│       ├── formulations/     ← Formülasyon CRUD
│       ├── seanslar/         ← Seans CRUD
│       └── settings/         ← Ayarlar
├── components/
│   ├── DanisanMindMap.tsx    ← HEDEF BİLEŞEN (sen geliştireceksin)
│   ├── HomePanel.tsx
│   ├── TerapistProfil.tsx
│   ├── MudahaleKutuphanesi.tsx
│   ├── ActFormulasyon.tsx
│   ├── BozuklukDongusu.tsx
│   ├── VakaHaritasi.tsx      ← Başka bir görselleştirme referansı
│   └── ... (20+ bileşen)
└── lib/
    └── types.ts
```

---

## 3. VERİ MODELİ

### 3.1 Patient (Danışan)
```typescript
type Patient = {
  id: string;
  adSoyad: string;
  yas?: string;
  cinsiyet?: string;
  telefon?: string;
  email?: string;
  basvuruTarihi?: string;
  sunumSorunu?: string;
  hedefler?: string;
  status: "intake" | "active" | "archived";
  patientType?: 'cocuk' | 'yetiskin';
  il?: string;
  ilce?: string;
  onamImzalandi?: boolean;
  createdAt: string;
};
```

### 3.2 Formulation (Vaka Formülasyonu) — Mind Map'in ana veri kaynağı
```typescript
type Formulation = {
  id: string;
  patientId: string;
  
  // Klinik Profil
  anaSikayetler?: string;        // Ana başvuru şikayetleri
  yonlendirmeNedeni?: string;    // Kim yönlendirdi, neden
  
  // 4P Modeli (Klinik Vaka Formülasyonu)
  predispozan?: string;          // Yatkınlaştıran faktörler (biyolojik, gelişimsel)
  presipitan?: string;           // Tetikleyici faktörler (yakın dönem stresörler)
  perpetuan?: string;            // Sürdürücü faktörler (kaçınma, güçlendirme döngüleri)
  protektif?: string;            // Koruyucu faktörler (güçlü yönler, destek sistemleri)
  
  // Bilişsel Model (Beck'in Kognitif Modeli)
  temelInanclar?: string;        // Core beliefs (genellikle şematik, erken dönem kökenli)
  araInanclar?: string;          // Intermediate beliefs (kurallar, tutumlar, varsayımlar)
  basaCikma?: string;            // Başa çıkma stratejileri
  otomatikDusunceler?: string;   // Automatic thoughts (durum-spesifik)
  duyguBedensel?: string;        // Duygusal ve bedensel tepkiler
  davranislar?: string;          // Davranışsal tepkiler
  
  // SMART Hedefler
  smartSpesifik?: string;
  smartOlculebilir?: string;
  smartZaman?: string;
  
  // ACT Hexaflex (6 psikolojik esneklik süreci)
  actKabul?: string;             // Acceptance (duygusal deneyimi kabul)
  actDefuzyon?: string;          // Cognitive defusion (düşüncelerden ayrışma)
  actSimdi?: string;             // Present moment (şimdiki anda olma)
  actBaglam?: string;            // Self-as-context (gözlemleyen benlik)
  actDegerler?: string;          // Values (kişisel değerler)
  actEylem?: string;             // Committed action (değer yönlü eylem)
  actYaraticiCaresizlik?: string; // Creative hopelessness (kontrol stratejilerinin işe yaramaması)
  
  updatedAt: string;
};
```

### 3.3 Seans
```typescript
type Seans = {
  id: string;
  patientId: string;
  tarih: string;       // ISO date string
  sure?: number;       // dakika
  konu?: string;       // Seans konusu/başlığı
  notlar?: string;     // Terapist notları
  odev?: string;       // Verilen ödevler
};
```

---

## 4. MEVCUT MİND MAP UYGULAMASI

### 4.1 Dosya
`/formulasyon/components/DanisanMindMap.tsx`

### 4.2 Mimari
**Props:**
```typescript
type Props = {
  patient: Patient;
  formulation?: Formulation | null;
  seanslar?: Seans[];
};
```

**Bileşene nereden veri geliyor:**
`app/page.tsx` → `FormulationPanel` fonksiyonu → `DanisanMindMap`:
```tsx
<DanisanMindMap
  patient={patient}
  formulation={f}          // aktif formülasyon objesi
  seanslar={state.seanslar.filter(s => s.patientId === patient.id)}
/>
```

### 4.3 Mevcut Layout Sistemi
```
SVG viewBox: "0 0 1000 780"
Merkez: (CX=500, CY=390)
Dal yarıçapı: BR=210px (merkezden ana node'a)
Yaprak yarıçapı: LR=155px (ana node'dan yaprak node'a)
```

**6 Ana Dal ve Açıları:**
| Dal | Emoji | Açı (SVG°) | Renk |
|-----|-------|------------|------|
| Klinik Profil | 🩺 | 270° (üst) | #6366f1 indigo |
| 4P Modeli | 🔍 | 330° (sağ-üst) | #f59e0b amber |
| Bilişsel Model | 🧠 | 30° (sağ-alt) | #ef4444 red |
| ACT Hexaflex | ⬡ | 90° (alt) | #10b981 emerald |
| SMART Hedefler | 🎯 | 150° (sol-alt) | #8b5cf6 violet |
| Seans Notları | 📋 | 210° (sol-üst) | #3b82f6 blue |

**Koordinat sistemi:**
```typescript
const D2R = Math.PI / 180;
function polar(cx, cy, r, deg) {
  return { x: cx + r * Math.cos(deg * D2R), y: cy + r * Math.sin(deg * D2R) };
}
// 270° = üst (12'de), 90° = alt (6'da)
```

**Yaprak fanlaması (leaf fanning):**
```typescript
const spread = Math.min(50, 14 * (branch.leaves.length - 1));
const startA = branch.angle - spread / 2;
const leafAngle = startA + (li / (branch.leaves.length - 1)) * spread;
```

### 4.4 Mevcut Etkileşim
- **Dal node'una tıklama**: yaprakları aç/kapa + sağ panelde detay göster
- **Yaprak node'una tıklama**: sağ panelde tam içerik göster
- **Mouse wheel**: zoom (0.25x – 2.8x)
- **Mouse drag**: pan (kaydırma)
- **RotateCcw butonu**: sıfırla

### 4.5 Sağ Panel (Detail Panel)
- Seçim yoksa: tüm dalların doluluk özeti (bar chart)
- Dal seçiliyse: o dalın yaprak listesi
- Yaprak seçiliyse: tam metin içerik

---

## 5. GELİŞTİRİLMESİ GEREKEN ÖZELLIKLER

Aşağıdaki geliştirmeler için Claude Opus'un çalışması bekleniyor:

### 5.1 Animasyon ve Geçiş Efektleri
**Sorun:** Şu an düğümler anlık görünüyor/kayboluyor. İstenen:
- Dal açılırken yapraklar merkez node'dan dışa doğru animasyonlu fanlansın (CSS transition veya SVG animate)
- Dal kapanırken yapraklar içe doğru toplanarak kaybolsun
- Yeni içerik yüklendiğinde (seanslar değiştiğinde) hafif bir fade-in efekti
- Zoom/pan daha akıcı hissettirmeli (easing)

**Teknik ipucu:** SVG `<animate>` veya React state geçişleri + CSS `transition` kullanılabilir. `opacity` ve `transform: scale()` kombinasyonu iyi çalışır.

### 5.2 Bağlantı Çizgilerinin İyileştirilmesi
**Sorun:** Şu an merkez → dal arası cubic bezier var, dal → yaprak arası düz çizgi var.
**İstenen:**
- Tüm bağlantılar akıcı cubic bezier eğrisi olsun
- Bağlantı kalınlığı doluluk yoğunluğuna göre değişsin (dolu alan = kalın çizgi, boş = ince kesik)
- Dal'ın rengi, o daldaki doluluk oranına göre hafifçe solsun (opacity)

```typescript
// Hedef bezier formülü - dal→yaprak için:
function leafBezier(px: number, py: number, lx: number, ly: number, angle: number) {
  const D2R = Math.PI / 180;
  const cpDist = 60;
  const cpx1 = px + cpDist * Math.cos(angle * D2R);
  const cpy1 = py + cpDist * Math.sin(angle * D2R);
  const cpx2 = lx - cpDist * 0.5 * Math.cos(angle * D2R);
  const cpy2 = ly - cpDist * 0.5 * Math.sin(angle * D2R);
  return `M ${px} ${py} C ${cpx1} ${cpy1}, ${cpx2} ${cpy2}, ${lx} ${ly}`;
}
```

### 5.3 Klinik İlişki Okları
**Sorun:** Şu an formülasyon verisinin klinik ilişkileri görsel olarak gösterilmiyor.
**İstenen:** BDT döngüsünü gösteren kesikli oklar:
- `temelInanclar` → `araInanclar` → `otomatikDusunceler` → `duyguBedensel` → `davranislar` arası geri-besleme döngüsü
- ACT'de `actKabul` ↔ `actDefuzyon` ilişkisi
- Bu oklar ince, kesik, semitransparent (≈0.3 opacity) olsun
- Hover'da belirginleşsin

```typescript
// Klinik ilişki tanımları
const CLINICAL_ARROWS = [
  { from: 'bilissel:temelInanclar', to: 'bilissel:araInanclar',       label: 'besler',    color: '#ef4444' },
  { from: 'bilissel:araInanclar',   to: 'bilissel:otomatikDusunceler', label: 'aktive eder', color: '#ef4444' },
  { from: 'bilissel:otomatikDusunceler', to: 'bilissel:duyguBedensel', label: 'üretir',   color: '#f97316' },
  { from: 'bilissel:duyguBedensel', to: 'bilissel:davranislar',        label: 'tetikler',  color: '#f97316' },
  { from: 'bilissel:davranislar',   to: '4p:perpetuan',                label: 'sürdürür',  color: '#dc2626' },
  { from: '4p:protektif',           to: 'hedefler:smartSpesifik',      label: 'destekler', color: '#10b981' },
];
```

### 5.4 Filtre ve Görünüm Modları
**İstenen:**
- **Odak modu**: Tek bir dal seçilince diğerleri fade out (opacity: 0.15), seçili dal ve yaprakları tam net
- **Boşluk modu**: Sadece boş alanlar gösterilsin (terapistin neyi doldurmadığını görür)
- **BDT modu**: Sadece bilişsel model + 4P dalları görünsün
- **ACT modu**: Sadece ACT hexaflex + hedefler görünsün

```typescript
type ViewMode = 'full' | 'focus' | 'gaps' | 'bdt' | 'act';
```

### 5.5 Seans Zaman Çizelgesi Entegrasyonu
**İstenen:** 
- Alt kısımda mini bir zaman çizelgesi (timeline) 
- Her seans bir nokta olarak gösterilsin
- Noktaya hover'da seans konusu tooltip olarak çıksın
- "En son seans" vurgulanmış olsun

```typescript
// Timeline layout
// x: tarih (lineer scale, ilk seans → son seans)
// y: sabit (timeline çizgisinde)
// r: 5px sabit
```

### 5.6 Düğüm İçi Metin Sarma
**Sorun:** Şu an SVG `<text>` elementi tek satır, uzun metinler kesiyor.
**İstenen:** `<foreignObject>` ile HTML div içinde gerçek metin sarma:

```tsx
// Yaprak node için foreignObject örneği:
<foreignObject x={lp.x - 58} y={lp.y - 22} width="116" height="44">
  <div xmlns="http://www.w3.org/1999/xhtml"
    className="w-full h-full flex flex-col justify-center px-2 py-1">
    <p className="text-[8px] font-bold text-gray-600 leading-none">{leaf.label}</p>
    <p className="text-[7px] text-gray-400 line-clamp-2 leading-tight mt-0.5">{leaf.content}</p>
  </div>
</foreignObject>
```

### 5.7 Minimap (Genel Bakış Penceresi)
**İstenen:** Sağ alt köşede 100x80px küçük bir önizleme penceresi:
- Tam haritayı küçültülmüş gösterir
- Şu an görünen alanı bir dikdörtgen çerçeve ile işaretler
- Dikdörtgene tıklayarak o bölgeye atlamayı sağlar

### 5.8 Çocuk Danışan Özel Dalları
**Durum:** `patient.patientType === 'cocuk'` olduğunda formülasyon verisinin yapısı farklı.
Çocuk danışanlar için ayrı veri kaynakları var:
- `localStorage.getItem('oyun_terapisi_${patientId}')` → OyunTerapisi formu
- `localStorage.getItem('cocuk_bdt_${patientId}')` → CocukBdtForm

**İstenen:** Çocuk danışanlarda farklı dal yapısı:
| Dal | İçerik |
|-----|--------|
| Oyun Terapisi | Oyun terapi gözlemleri, teknikler |
| Gelişimsel Profil | Motor, dil, sosyal gelişim |
| Aile Sistemi | Ebeveyn çalışması notları |
| Tetikleyiciler | Çocuğa özgü tetikleyiciler |
| Güçlü Yönler | Çocuğun kaynakları |
| Hedefler | Gelişimsel hedefler |

---

## 6. KLİNİK SİMÜLASYON MANTIĞI

Mind map'in saf görselleştirmenin ötesine geçmesi isteniyor. Aşağıdaki simülasyon mantıkları eklenmeli:

### 6.1 Otomatik Klinik İçgörü Üretimi
Formülasyon alanları doldukça sistem otomatik bağlantılar kurmalı:

```typescript
function inferClinicalConnections(f: Formulation): ClinicalInsight[] {
  const insights: ClinicalInsight[] = [];
  
  // Temel inanç → otomatik düşünce tutarlılığı
  if (f.temelInanclar && f.otomatikDusunceler) {
    const hasConsistency = checkThematicConsistency(f.temelInanclar, f.otomatikDusunceler);
    if (hasConsistency) {
      insights.push({
        type: 'connection',
        from: 'temelInanclar',
        to: 'otomatikDusunceler',
        label: 'Tematik tutarlılık var',
        strength: 'high',
      });
    }
  }
  
  // ACT değerleri ile SMART hedefler örtüşüyor mu?
  if (f.actDegerler && f.smartSpesifik) {
    insights.push({
      type: 'alignment',
      from: 'actDegerler',
      to: 'smartSpesifik',
      label: 'Değer-hedef hizalaması',
      strength: 'medium',
    });
  }
  
  // Protektif faktörler hedeflerle bağlantılı mı?
  if (f.protektif && f.actEylem) {
    insights.push({
      type: 'resource',
      from: 'protektif',
      to: 'actEylem',
      label: 'Kaynak → Eylem bağlantısı',
      strength: 'medium',
    });
  }
  
  return insights;
}
```

### 6.2 Formülasyon Olgunluk Skoru
Her dal için bir "olgunluk" skoru hesaplanmalı:

```typescript
function getBranchMaturity(branch: MindBranch): 'sparse' | 'developing' | 'rich' {
  const filled   = branch.leaves.filter(l => l.content !== '—').length;
  const avgWords = branch.leaves
    .filter(l => l.content !== '—')
    .reduce((a, l) => a + l.content.split(' ').length, 0) / Math.max(filled, 1);
  
  if (filled === 0) return 'sparse';
  if (filled < branch.leaves.length / 2 || avgWords < 5) return 'developing';
  return 'rich';
}
// 'sparse' → açık gri, kesik çizgi
// 'developing' → renkli ama soluk
// 'rich' → tam doygun renk, kalın çizgi
```

### 6.3 Dinamik Ağırlık Görselleştirmesi
Yaprak node'larının boyutu içerik zenginliğiyle orantılı olmalı:

```typescript
function getLeafSize(content: string): { w: number; h: number } {
  if (content === '—') return { w: 100, h: 32 };
  const words = content.split(' ').length;
  const w = Math.min(160, 100 + words * 2);
  const h = Math.min(60, 32 + Math.floor(words / 5) * 8);
  return { w, h };
}
```

### 6.4 Seans İlerlemesi Animasyonu
Seans sayısı arttıkça mind map'in "büyümesi" simüle edilmeli:
- İlk seans: sadece merkez + Klinik Profil açık, diğerleri soluk
- 3. seans sonrası: 4P ve Bilişsel Model dalları tam aktif
- 8. seans sonrası: tüm dallar tam görünür
- Bu sayı eşikleri terapist tarafından ayarlanabilir olsun

```typescript
function getSessionBasedVisibility(sessionCount: number, branchId: string): number {
  const thresholds: Record<string, number> = {
    'klinik':   0,   // her zaman görünür
    '4p':       2,   // 2. seanstan sonra
    'bilissel': 3,   // 3. seanstan sonra
    'hedefler': 4,   // 4. seanstan sonra
    'act':      5,   // 5. seanstan sonra
    'seans':    1,   // 1. seanstan sonra
  };
  const threshold = thresholds[branchId] ?? 0;
  if (sessionCount < threshold) return 0.25; // soluk
  if (sessionCount === threshold) return 0.7; // yeni açılıyor
  return 1.0; // tam görünür
}
```

---

## 7. TASARIM PRENSİPLERİ

### 7.1 Renk Dili
```
Ana arkaplan: #FAFBFC (çok hafif gri)
Kart arkaplanı: #FFFFFF
Ana metin: #0E0F12 (neredeyse siyah)
İkincil metin: #6B7280
Soluk metin: #9CA3AF

Merkez node: #0E0F12 (siyah, gradient)
Dal renkleri: her dalın hex kodu (üstteki tabloya bak)
Boş yaprak: #F9FAFB arkaplan, #E5E7EB kenarlık, kesik çizgi
Dolu yaprak: dal rengi %10 opaklıkla arkaplan
```

### 7.2 Typography
```
SVG text:
  - Dal etiketi: fontSize="10.5", fontWeight="700", fill="white"
  - Yaprak etiketi: fontSize="9", fontWeight="700", fill="#374151"
  - Yaprak içerik snippet: fontSize="8", fill={branch.hex}

HTML text (foreignObject içinde):
  - Tailwind: text-[9px] font-bold leading-none (etiket)
  - Tailwind: text-[7.5px] text-gray-500 line-clamp-2 (içerik)
```

### 7.3 Etkileşim Hiyerarşisi
1. **Hover** → düğüm hafifçe büyür (scale 1.05), tooltip gösterir
2. **Click** → seçili duruma geçer, sağ panel güncellenir
3. **Double-click** → dal'ı tam açar (tüm yapraklar görünür)
4. **Drag (boş alana)** → haritayı kaydırır
5. **Wheel** → zoom

### 7.4 Erişilebilirlik
- Tüm etkileşimli elementlerde `aria-label` olmalı
- Keyboard navigation için `tabIndex` ve `onKeyDown` eklenmeli
- Renk körü uyumu: renk + şekil kombinasyonu (sadece renge güvenme)

---

## 8. ENTEGRASYON NOKTALARI

### 8.1 page.tsx'teki InnerTab
```typescript
// Aktif innerTab tipi:
type InnerTab = 'formulasyon' | 'ekler' | 'protokol' | 'dongu' | 
                'sablonlar' | 'model' | 'act' | 'pratik' | 'deger' | 
                'cocuk-form' | 'cocuk-bdt' | 'oyun-terapisi' | 'mindmap';

// Render:
{innerTab === 'mindmap' && (
  <DanisanMindMap
    patient={patient}
    formulation={f}
    seanslar={state.seanslar.filter(s => s.patientId === patient.id)}
  />
)}
```

### 8.2 LocalStorage'dan ek veri çekme (çocuk danışanlar için)
```typescript
// OyunTerapisi verisi (çocuk danışanlarda):
const oyunData = JSON.parse(localStorage.getItem(`oyun_terapisi_${patient.id}`) || 'null');

// CocukBdt verisi (çocuk danışanlarda):
const cocukBdt = JSON.parse(localStorage.getItem(`cocuk_bdt_${patient.id}`) || 'null');
```

### 8.3 BozuklukDongusu bileşeni (referans)
`/components/BozuklukDongusu.tsx` — benzer SVG görselleştirme mantığı için referans alınabilir. Tetikleyici → Düşünce → Duygu → Davranış döngüsünü SVG ile çiziyor.

---

## 9. ÖNCELİKLENDİRME (ÖNCE → SONRA)

**Faz 1 (hemen):**
1. Bağlantı çizgilerini cubic bezier'e çevir (tüm bağlantılar için)
2. `<foreignObject>` ile metin sarma
3. Hover efektleri (scale, renk geçişi)
4. Klinik ilişki okları (kesik, hafif)

**Faz 2 (sonra):**
5. Görünüm modları (focus, gaps, BDT, ACT)
6. Animasyonlu dal açma/kapama
7. Seans sayısına göre görünürlük
8. Olgunluk skoru görselleştirmesi

**Faz 3 (gelişmiş):**
9. Minimap
10. Zaman çizelgesi entegrasyonu
11. Çocuk danışan özel dalları
12. Dinamik ağırlık (içerik zenginliğine göre düğüm boyutu)

---

## 10. ÖRNEK GERÇEK VERİ

Bir danışanın tipik formülasyon verisi şöyle görünür:

```json
{
  "anaSikayetler": "Sosyal ortamlarda yoğun kaygı, titreme, kızarma korkusu",
  "yonlendirmeNedeni": "Psikiyatrist yönlendirmesi, sosyal fobi tanısı",
  "predispozan": "Anne-baba ayrılığı (8 yaş), okul zorbalığı geçmişi",
  "presipitan": "Yeni iş yerinde sunum yapmak zorunda kalma",
  "perpetuan": "Sosyal ortamlardan kaçınma, güvenli davranışlar (telefona bakma)",
  "protektif": "Güçlü aile desteği, iş motivasyonu yüksek",
  "temelInanclar": "Ben yetersizim / İnsanlar beni küçümser",
  "araInanclar": "Eğer titrerssem, aptal sanılırım",
  "otomatikDusunceler": "Herkes bana bakıyor, kızaracağım, mahvolacağım",
  "duyguBedensel": "Anksiyete (%85), yüz kızarması, kalp çarpıntısı",
  "davranislar": "Toplantılara girmeme, lider olmaktan kaçınma",
  "actKabul": "Kaygının fiziksel duyumlarını direnmeden gözlemleme",
  "actDefuzyon": "'Mahvolacağım' düşüncesi sadece bir düşünce",
  "actDegerler": "Mesleki gelişim, bağlantı, özgünlük"
}
```

Bu verilerle mind map 6 dala yayılır ve her dal kendi rengiyle konumlanır.

---

## 11. DOSYA BOYUTU VE KALİTE KRİTERLERİ

- `DanisanMindMap.tsx` maksimum 600 satır olmalı (gerekirse alt bileşenlere böl)
- `npx tsc --noEmit` sıfır hata döndürmeli
- Tüm prop tipleri açık TypeScript, `any` kullanılmamalı
- SVG elementleri: `key` prop'ları zorunlu
- React event handler'ları `useCallback` ile sarılmalı (performans)
- `'use client'` direktifi dosyanın en başında

---

*Bu belge `/Users/ga/formulasyon/MINDMAP_OPUS_BRIEF.md` konumunda saklanmaktadır.*
*Son güncelleme: 2026-05-21*
