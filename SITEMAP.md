# Formülasyon — Site Haritası (Gerçek Mimari)

_Son güncelleme: 13.06.2026 · Bu doküman koddaki **canlı** yapıyı yansıtır._

> Önceki sürüm eski (artık silinmiş) bileşenleri anlatıyordu. Bu sürüm `app/page.tsx`
> ve `app/**/page.tsx` route'larındaki gerçek render ağacına göre yazıldı.

---

## Genel yapı

Uygulama iki katmandan oluşur:

1. **Tek sayfa kabuğu (`app/page.tsx`)** — üst navigasyonla sekme değiştiren ana SPA.
2. **Ayrı Next.js route'ları (`app/**/page.tsx`)** — danışan dosyası, süpervizyon, briefing gibi derin akışlar.

---

## 1. Üst navigasyon (`NAV`, app/page.tsx)

| Sekme (`tab`) | Etiket | Render edilen bileşen |
|---|---|---|
| `home` | Ana Sayfa | `AnaSayfaV3` |
| `calisma-alani` | Çalışma Alanı | Hub + alt-sekmeler (aşağıda) |
| `terapist` | Profil | `TerapistProfilV2` |
| `tasarim-arsivi` | Yol Haritası | `YolHaritasiV2` |
| `act-gelistirme` | ACT Geliştirme | `ACTGelistirmeV2` |

> `mudahale-kutuphanesi` sekmesi (→ `MudahaleV2`) navigasyonda görünmez; "Kütüphane"
> bağlantılarından açılır.

---

## 2. Çalışma Alanı alt-sekmeleri (`calismaSubTab`)

| Alt-sekme | Render edilen bileşen | Açıklama |
|---|---|---|
| `hub` | `CalismaAlaniV2` | Çalışma alanı giriş/hub ekranı |
| `takvim` | `TakvimRandevular` | Takvim & randevular (kendi alt-sekmeleri var) |
| `danisanlar` | `DanisanlarV2` | Danışan listesi |
| `formulasyon` | `FormulasyonV2` | Formülasyon çalışma ekranı |
| `tasarimlar` | `TasarimDosyalariV2` | Tasarım dosyaları |
| `muhasebe` | `MuhasebePanel` | Muhasebe/ücret takibi |

### Takvim & Randevular (`TakvimRandevular`) iç sekmeleri
`takvim` · `hazirlik` · `musaitlik` · `gecmis` · `sms` · `gelisim` · **`takip` (yeni → `TakipListesi`)** · `websitesi`

---

## 3. Ayrı route'lar

| Route | Render eden | Not |
|---|---|---|
| `/profil` | `TerapistProfilPanel` | Terapistin kendi profili |
| `/profil/[id]` | `DanisanRaporu` | Danışanın zengin raporu/dosyası |
| `/clients/[id]` ve `/clients/[id]/[tab]` | — | **`/profil/[id]`'ye yönlendirir** (eski 10-sekmeli dosya kaldırıldı) |
| `/clients/[id]/anamnez` | `AnamnezPanel` | Anamnez formu |
| `/clients/[id]/cocuk` | `CocukPanel` | Çocuk değerlendirme |
| `/danisan/[id]` | (danışan açılış) | |
| `/briefing/[id]` | `BriefingPanel` | Seans öncesi özet |
| `/seansa-hazirlik/[id]` | `SeansaHazirlikV2` | Seansa hazırlık |
| `/seans-planlayici` | `SeansPlanlayiciV2` | Seans planlayıcı |
| `/supervizyon`, `/supervizyon/[id]`, `/supervizyon/yeni` | `SupervizyonV2` / `SupervizyonNotuPanel` | Süpervizyon |
| `/sozluk` | `SozlukV2` | Klinik sözlük |
| `/ozet` | `OzetInceleme` | Özet inceleme |
| `/protokol/cocuk-koruma` | (protokol) | Çocuk koruma protokolü |
| `/form/[token]` | (danışan formu) | Dışa açık danışan formu |

---

## 4. Modaller (herhangi bir ekran üzerinde)

`BriefModal` (danışan briefing) · `AnamnezForm` · `VakaHaritasi` (tam ekran vaka haritası) · `OnamMetinleri`

---

## 5. Tasarım sistemi

**Editöryel primitifler — tek kaynak: `components/ui/primitives.tsx`**
`Btn` · `Input` · `Textarea` · `Card` · `Label` · `Badge` · `Modal`

> Ayrıca `components/ui/` altında shadcn tabanlı (jenerik) `button/card/label/...` seti
> bulunur; bunlar editöryel görünümü kurmaz, yalnızca birkaç yerde kullanılır.

**Renkler:** arka plan `#F4F5F8` · ana metin `#0E0F12` · ikincil `#6B7280` ·
seans `#C2522A` · danışan `#6D28D9` · süreklilik `#166534` · bekleyen `#92400E`

**Tipografi:** Başlık serif **Fraunces** (italic) · UI **Plus Jakarta Sans** · ağırlıklar 300/400/600

**Sınıflar:** `.card` (glassmorphism) · `.card-dark` · `.card-stat` · `.glass` · `.pill-toggle` · `.hover-3d`

---

## 6. Tip kaynağı

Ortak tipler **tek dosyada**: `lib/types.ts`
(`Client`, `FourP`, `BeckChain`, `Hexaflex`, `SelectedNode`, `TakvimSubTab`, `GelisimEvent`,
`AnamnezData`, `BdtSeans`, `HexaflexScores` …)

---

## Çözülen / bekleyen notlar

- ✅ **Mudahale ikizi çözüldü** — Kütüphane artık tek bileşen: `MudahaleV2`. Eski
  `MudahalePanel`'deki PDF / kişisel not / danışana atama özellikleri V2'ye taşındı;
  ölü `MudahalePanel`, `SeansPlanlayiciPanel`, `MudahaleDetayModal` silindi.
- ⏳ **"Önerilen müdahaleler"** (eski panelde vardı) bağlamsal olduğu için V2'ye
  taşınmadı — istenirse sonra eklenebilir.
- ⏳ **`page.tsx` (4.545 satır)** hâlâ büyük — derin bölme (alt-bileşenler, veri hook'ları)
  bir sonraki sadeleştirme turunda.
