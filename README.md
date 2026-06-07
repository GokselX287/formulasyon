# ACT Vaka Formulasyonu

Psikologlar icin lokal calisan ACT (Acceptance and Commitment Therapy) vaka formulasyon uygulamasi. Tum veriler bilgisayarda saklanir, internete gonderilmez.

## Nasil Calistirilir

### Gereksinimler

- Node.js 18+
- npm

### Baslangic

```bash
cd /Users/ga/formulasyon
npm install
npm run dev
```

Tarayicida [http://localhost:3000](http://localhost:3000) adresini ac.

### Uretim Derlemesi

```bash
npm run build
npm start
```

## Veritabani

**data.db** dosyasi proje klasorunde olusur (`/Users/ga/formulasyon/data.db`).

- Uygulama ilk calismada otomatik olusturur.
- Silinirse tum veriler kaybolur; uygulama temiz baslar.
- Git tarafindan izlenmez (`.gitignore`'a eklenebilir).

### Yedek Alma

```bash
# Manuel yedek
cp /Users/ga/formulasyon/data.db /Users/ga/formulasyon/data.db.bak

# Tarihli yedek
cp /Users/ga/formulasyon/data.db "/Users/ga/formulasyon/data_$(date +%Y%m%d_%H%M).db"
```

### Otomatik Yedek (cron ornegi)

Her gun saat 18:00'de yedek almak icin `crontab -e` ile ekle:

```
0 18 * * * cp /Users/ga/formulasyon/data.db "/Users/ga/Desktop/formulasyon_yedek_$(date +\%Y\%m\%d).db"
```

## Klasor Yapisi

```
formulasyon/
  data.db              <- SQLite veritabani (runtime'da olusur)
  lib/
    db.ts              <- Veritabani baglantisi (WAL modu)
    schema.sql         <- Tablo tanimlari
    queries.ts         <- CRUD fonksiyonlari
  app/
    page.tsx           <- Danisan listesi
    clients/[id]/
      layout.tsx       <- Sol sekme seridi (9 sekme)
      [tab]/page.tsx   <- Sekme icerikleri
    api/               <- REST endpoint'leri
  components/
    ChipList.tsx       <- Etiket listesi bileseni
    HexaflexRadar.tsx  <- 6 eksenli ACT radar grafigi (SVG)
    MatrixGrid.tsx     <- ACT matrisi (4 kadran)
    Field.tsx          <- Form alani sarmalayici
    Section.tsx        <- Kart/bolum sarmalayici
```

## Sekmeler

| Sekme | Icerik |
|-------|--------|
| 01 Profil | Danisan demografik bilgileri |
| 02 Sorun & Hedef | Sunulan sorun, danisan/terapist hedefleri |
| 03 Bariyerler | Engel dusunceler, duygular, anlar; kontrol stratejileri |
| 04 Esneklik | Hexaflex radar (slider ile 0-10 puanlama) |
| 05 Degerler | Temel degerler + ACT matrisi |
| 06 Guclu Yanlar | Kaynaklar ve guclu yanlar |
| 07 Hikaye | Serbest anlati metni |
| 08 Mudahaleler | Yapilan/planlanan mudahaleler, eylem adimlari |
| 09 Iliski | Klinik notlar, kirilma/onarim, supervizyon sorulari |
