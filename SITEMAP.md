# Klinik Asistan — Site Haritası

## Genel Yapı

```
Uygulama
├── Navbar (sabit üstte, tam genişlik)
│   ├── Logo: "Klinik" (Fraunces italic) + "Asistan" (Jakarta)
│   ├── [Ana Sayfa] [Takvim & Randevular] [Danışanlar] [Formülasyon]
│   │   [Kütüphane] [Terapist Profili] [Yol Haritası]
│   └── CTA: "Bekleme" butonu
│
├── 1. ANA SAYFA (HomePanel)
├── 2. TAKVİM & RANDEVULAR (TakvimPanel)
├── 3. DANIŞANLAR (DanisanlarPanel)
├── 4. FORMÜLASYON (FormulationPanel)
├── 5. KÜTÜPHANE (KutuphanePaneli)
├── 6. TERAPİST PROFİLİ (TerapistProfil)
└── 7. YOL HARİTASI (TasarimArsivi)
```

---

## 1. ANA SAYFA

```
Ana Sayfa
├── Hero (full-bleed, gradient arka plan, navbar üzerinde kayar)
│   ├── Sol: Başlık + Alt başlık + 2 CTA butonu
│   ├── Sağ: Editoryal istatistikler (kart yok, düz metin)
│   │   ├── Toplam Seans Sayısı
│   │   ├── Aktif Danışan
│   │   ├── Süreklilik Oranı
│   │   └── Bekleyen Randevu
│   └── Arka plan görsel yükleme sistemi (PCden yükle / kaldır)
│
└── Scroll-over İçerik (hero üzerine kayar, yuvarlak üst köşe)
    ├── Haftalık Özet Kartları (StatCard × 4)
    │   ├── Bu Haftaki Seanslar (ring progress)
    │   ├── Aktif Danışan
    │   ├── Tamamlama Oranı
    │   └── Bekleyen Görevler
    │
    ├── Seans Yoğunluk Grafiği (AreaChart)
    │
    ├── Danışan Dağılımı + Cinsiyet / Yaş kartları (yan yana)
    │
    ├── Seansa Girmeden: Önemli Notlar (briefing kartı, açık renk)
    │   ├── Bir sonraki seans için hazırlık notları
    │   └── InfoChip'ler (Seans, Danışan, Hafta, Süre)
    │
    ├── Bildirimler Kartı
    │   ├── Seans hatırlatıcıları
    │   ├── Görev bildirimleri
    │   └── Sistem uyarıları
    │
    ├── Coğrafi Dağılım
    │
    └── Terapistin Planları
        ├── Ruh Hali Slider
        └── Günlük plan girişi
```

---

## 2. TAKVİM & RANDEVULAR

```
Takvim & Randevular
├── Takvim Görünümü (WeekCalendar)
│   ├── Haftalık görünüm
│   └── Randevu kartları (tıklanabilir)
│
├── Randevu Paneli (RandevuPanel)
│   ├── Yaklaşan randevular listesi
│   └── Yeni randevu ekle
│
└── SMS Paneli (SmsPanel)
    ├── Randevu hatırlatma SMS
    └── Gönderim durumu
```

---

## 3. DANIŞANLAR

```
Danışanlar
├── Alt Sekmeler: [Danışanlar] [Seanslar]
│
├── Danışanlar Sekmesi (IntakeInbox)
│   ├── Danışan listesi (kartlar)
│   │   ├── Ad, yaş, cinsiyet
│   │   ├── Son seans tarihi
│   │   └── Formülasyona git butonu
│   └── Yeni danışan ekle
│
└── Seanslar Sekmesi (SeansPanel)
    ├── Danışan seçimi
    ├── Seans listesi (SeansCard × n)
    │   ├── Tarih, süre, seans numarası
    │   ├── SUDS / Ruh Hali skorları (slider)
    │   └── Seans detayına git
    └── Yeni seans ekle
        └── Seans Detayı (SeansDetay)
            ├── Seans notu (SeansNotuForm)
            ├── Ölçek puanlama (slider, 0-10)
            │   ├── SUDS (Öznel Rahatsızlık Birimi)
            │   └── Ruh Hali
            ├── Ödev takibi
            └── Bir sonraki seans planı
```

---

## 4. FORMÜLASYON

```
Formülasyon
├── Danışan seçimi
│
├── [Yetişkin Danışan Alt Sekmeleri]
│   ├── Formülasyon      → Ana formülasyon formu (4P + ACT + BDT alanları)
│   ├── Ekler            → FormulasyonEkleri
│   ├── Şemalar          → SemaTerapisi
│   ├── Döngü            → BozuklukDongusu (interaktif SVG döngü)
│   ├── Şablonlar        → FormulasyonSablonlari
│   ├── Model            → ModelOlustur (BDT modeli oluşturucu)
│   ├── ACT              → ActFormulasyon
│   ├── Pratik           → PratikYap
│   ├── Değer            → DegerKartlari
│   ├── Protokol         → SeansPlanlayici
│   └── 🌐 3D Map        → DanisanMindMap / DanisanMindMap3D
│
├── [Çocuk Danışan Alt Sekmeleri]
│   ├── Çocuk Formu      → CocukDegerlendirme
│   ├── BDT Formu        → CocukBdtForm
│   ├── Oyun Terapisi    → OyunTerapisi
│   ├── Ekler            → FormulasyonEkleri
│   ├── Şemalar          → SemaTerapisi
│   ├── Döngü            → BozuklukDongusu
│   ├── Şablonlar        → FormulasyonSablonlari
│   ├── Pratik           → PratikYap
│   ├── Değer            → DegerKartlari
│   ├── Protokol         → SeansPlanlayici
│   └── 🌐 3D Map        → DanisanMindMap / DanisanMindMap3D
│
└── Vaka Haritası (VakaHaritasi) — modal olarak açılır
```

---

## 5. KÜTÜPHANE

```
Kütüphane
├── Alt Sekmeler: [Kütüphane] [Arşiv]
│
├── Kütüphane (MudahaleKutuphanesi)
│   ├── Klinik etiket marquee (çift satır, renk kodlu kategoriler)
│   ├── Kategori filtre butonları
│   └── Müdahale kartları (arama + filtre)
│
└── Arşiv (ArchivePanel)
    └── Arşivlenmiş içerikler
```

---

## 6. TERAPİST PROFİLİ

```
Terapist Profili (TerapistProfil)
├── Alt Sekmeler: [Profil] [Süpervizyon] [Onam Metinleri]
│
├── Profil Sekmesi
│   ├── Ad, unvan, uzmanlık alanları
│   ├── Eğitim bilgileri
│   └── İletişim bilgileri
│
├── Süpervizyon Sekmesi (SupervizyonPanel)
│   ├── Süpervizyon kayıtları
│   ├── Saat takibi
│   └── Yeni kayıt ekle
│
└── Onam Metinleri Sekmesi (OnamMetinleri)
    ├── Aydınlatılmış onam metni
    ├── Gizlilik politikası
    └── PDF çıktı
```

---

## 7. YOL HARİTASI (TasarimArsivi)

```
Yol Haritası
├── İlerleme çubuğu (n/18 tamamlandı)
├── Filtre: [Tümü] [Bekleyen] [Tamamlandı]
│
└── Özellik Kartları (18 madde, tıkla → tamamlandı işaretle)
    │
    ├── Ölçüm Araçları (PHQ-9, GAD-7, BDI-II…)
    ├── BDT Döngüsü Görselleştirme
    ├── ACT Matriks Görselleştirme
    ├── Radar Chart & Heatmap Dashboard
    ├── Otomatik Klinik Rapor Taslağı
    ├── Terapist Profil & Yeterlilik Takibi
    ├── Deficit/Excess Davranış Takibi
    ├── Kariyer Danışmanlığı & Okul Ortak Sistemi
    ├── Ders Programı Hazırlama
    ├── Etkinlik Dosyası Oluşturma
    ├── Anlaşmalı Eğitimler
    ├── Maruziyet Rasyoneli Formu
    ├── Maruziyet Çalışma Formu
    ├── Maruziyet Karşılaştırma Grafikleri
    ├── Kişilik Tipleri Bilgilendirme Formları
    ├── Örnek Formülasyon (Kişilik Tiplerine Göre)
    ├── Kişilik Örüntüsü İçerik Kütüphanesi
    └── Aile Bilgilendirme Formları
```

---

## Danışan Dosyası (Ayrı Route: /clients/[id]/[tab])

```
/clients/:id/
├── Header: ← Danışanlar | [Danışan Adı] [Yaş]
├── Sol Menü (dikey sekme çubuğu)
│
├── 01 Profil
│   └── Ad, yaş, cinsiyet, meslek, medeni durum, yönlendiren
│
├── 02 Sorun & Hedef
│   └── Sunulan sorun, danışan hedefi, terapist hedefi
│
├── 03 Bariyerler
│   └── Engel olan düşünceler, duygular, anılar,
│       kontrol stratejileri, dikkat kalıpları, benlik kalıpları
│
├── 04 Esneklik
│   └── ACT Hexaflex radar chart (6 boyut, 0-10 slider)
│
├── 05 Değerler
│   └── Temel değerler chip listesi + ACT Matrisi (4 kadrant)
│
├── 06 Güçlü Yanlar
│   └── Güçlü yanlar ve kaynaklar chip listesi
│
├── 07 Hikaye
│   └── Serbest anlatı metin alanı (Fraunces serif)
│
├── 08 Müdahaleler
│   └── Yapılan müdahaleler, planlanan müdahaleler, eylem adımları
│
├── 09 İlişki
│   └── Klinik notlar, kırılma/onarım notları, süpervizyon soruları
│
└── 10 Boylamsal Formülasyon
    ├── 4P Modeli
    │   ├── Yatkınlaştıran (Predispozan)
    │   ├── Tetikleyici (Presipitan)
    │   ├── Sürdürücü (Perpetuan)
    │   └── Koruyucu (Protektif)
    ├── Beck Bilişsel Modeli — İnanç Yapısı
    │   ├── Temel İnançlar
    │   ├── Ara İnançlar & Varsayımlar
    │   └── Telafi & Başa Çıkma Stratejileri
    └── Durumsal Tepki Zinciri
        ├── Otomatik Düşünceler
        ├── Duygu & Bedensel Tepkiler
        └── Davranışlar
```

---

## Modal / Overlay Katmanı

```
Modaller (herhangi bir ekranın üzerinde açılabilir)
├── BriefModal          → Danışan özet briefing
├── FormulasyonOzetiModal → Formülasyon özeti
├── AnamnezForm         → Anamnez formu
└── VakaHaritası        → Interaktif vaka haritası (tam ekran)
```

---

## Tasarım Sistemi Referansı

```
Renkler
├── Arka plan: #F4F5F8
├── Yüzey: rgba(255,255,255,0.88) — glassmorphism
├── Ana metin: #0E0F12
├── İkincil metin: #6B7280
├── Vurgu seans: #C2522A (turuncu-kırmızı)
├── Vurgu danışan: #6D28D9 (mor)
├── Vurgu süreklilik: #166534 (yeşil)
└── Vurgu bekleyen: #92400E (amber)

Tipografi
├── Başlık serif: Fraunces (italic)
├── UI genel: Plus Jakarta Sans
└── Ağırlıklar: 300 (light) → 400 (regular) → 600 (semibold)

Bileşen Sınıfları
├── .card         → Glassmorphism kart (beyaz, blur, shadow)
├── .card-dark    → Koyu gradyan kart
├── .card-stat    → İstatistik kartı (hafif glassmorphism)
├── .glass        → Ham glassmorphism yüzey
├── .pill-toggle  → Segment control (filtre çubuğu)
└── .hover-3d     → 3D hover efekti (translateY + rotateX/Y)
```
