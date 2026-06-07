# Tasarım Handoff — Günlük Randevu Özeti (modal)

> "Klinik Editöryel Dosya" tasarım sistemine geçirilecek tek ekran. Bu briefi Claude Design'a ver; çıkan tasarımı koda ben (mevcut veriye bağlı şekilde) port ederim. Tasarım dışı veri/işlev korunacak — aşağıdaki davranışlar **bağlayıcı**.

## 1. Ekran nedir, ne işe yarar
Terapist sabah uygulamayı açtığında **dün–bugün–yarın** penceresindeki randevu **değişikliklerini** tek bakışta görür: iptal/erteleme/no-show, yeni oluşturulan randevular ve (varsa) o gün gelecek **ilk görüşme** danışanının özeti. Ana sayfadaki **"Bugünün briefing'i"** butonuyla açılan bir **modal**.

- **Format:** ortalanmış modal, genişlik ~640px (max-w-2xl), max-yükseklik %90vh, gövde scroll'lu. Tam sayfa DEĞİL.
- **Arka plan:** koyu yarı saydam overlay + blur; overlay'e tıklayınca kapanır.

## 2. Tasarım dili (mevcut V2 ekranlarla birebir tutarlı olmalı)
- **Zemin:** modal yüzeyi krem `#FAF8F5`; ince ayraçlar `rgba(14,15,18,0.06–0.08)`.
- **Accent:** kil turuncusu `#C2522A` (vurgular, ilk-görüşme eyebrow'u, "düzenle" linkleri).
- **Tipografi:** başlık **Fraunces** (serif, italik vurgu — örn. "Bugünün *Briefing*'i"); gövde **Plus Jakarta Sans**; eyebrow/etiketler **mono** (Space Mono / JetBrains Mono), `UPPERCASE`, `letter-spacing ~0.16em`, renk nötr gri `#7B7C82`.
- **Rozetler:** pill; yeşil `#2F5D3A` zemin `rgba(47,93,58,0.08)` (olumlu/"Yeni"); durum rozetleri için iptal/erteleme/no-show farklı tonlar (aşağıda).
- **Köşeler:** modal ~24px (rounded-3xl); rozet/buton pill.
- **Eyebrow → başlık → ince ayraçlı bölümler** ritmi (AnaSayfa `.as` ve Takvim `.trv` ile aynı dil).

## 3. Yapı ve bölümler (yukarıdan aşağıya)

### A) Başlık (sabit, scroll etmez)
- Eyebrow (mono): `GÜNLÜK ÖZET · {uzun tarih}` — örn. `GÜNLÜK ÖZET · 4 HAZİRAN 2026 PERŞEMBE`
- Başlık (Fraunces): **Bugünün _Briefing_'i** ("Briefing" italik + kil rengi)
- Sağ üst: kapat (×) yuvarlak buton.

### B) İptal · Erteleme · No-show  *(varsa)*
- Bölüm eyebrow: `İPTAL · ERTELEME · NO-SHOW`
- **Tarihe göre gruplu**; grup başlığı `Dün` / `Bugün` / `Yarın` (mono, koyu).
- Her satır:
  - durum **rozeti** (İptal / Erteleme / No-show — her biri farklı renk),
  - danışan adı,
  - saat (mono),
  - erteleme ise `→ {yeni tarih}` (yeşil).
  - Altında **gerekçe/mazeret** alanı: yoksa "+ gerekçe ekle" (kil, dotted underline); varsa italik metin + "düzenle"; düzenleme modunda textarea + Kaydet/Vazgeç.

### C) Yeni Oluşturulan Randevular  *(varsa)*
- Bölüm eyebrow: `YENİ OLUŞTURULAN RANDEVULAR`
- Her satır: yeşil "Yeni" rozeti · danışan adı · sağda `Dün/Bugün/Yarın · saat`.

### D) İlk Görüşme · Bugün  *(o gün ilk kez gelen yeni danışan varsa)*
- Bölüm eyebrow (kil renkli): `İLK GÖRÜŞME · BUGÜN`
- İki sütun:
  - **Sol — danışan kartı:** ad (Fraunces) · yaş/cinsiyet/telefon · "başvuru nedeni" (sunum sorunu) · "telefon notu" (varsa, italik, kil sol-kenarlık).
  - **Sağ — "İlk seans ana hatları":** numaralı 7 adımlık liste, her adımın sağında süre (dk):
    1. Tanışma ve ilişki kurma — 10 dk
    2. Sunulan sorunun ayrıntılandırılması — 15 dk
    3. Psikiyatrik / psikolojik geçmiş — 8 dk
    4. Aile geçmişi ve sosyal destek sistemi — 7 dk
    5. Motivasyon ve beklentiler — 5 dk
    6. Gizlilik, onam ve ücret bilgilendirmesi — 5 dk
    7. Sonraki randevu ve gözlem ödevi — 5 dk

### E) Footer (sabit)
- Sol: özet metin — `{n} değişiklik · {m} yeni randevu` ya da "Tüm randevular aktif".
- Sağ: **Kapat** (ghost) + (ilk görüşme varsa) **Dosyayı Aç** (koyu, dolu, dosya ikonu).

### Boş durum
Hiç değişiklik/yeni/ilk-görüşme yoksa: ortada nazik mesaj — "Dün, bugün ve yarın için kayıtlı değişiklik yok." (başlık + footer yine durur).

## 4. Örnek içerik (tasarım gerçekçi görünsün diye)
- İptal: 🔴 **İptal** · *Sena Melis Erkal* · 13:30 — gerekçe: "Grip oldu, hafta sonu arayacak."
- Erteleme: 🟡 **Erteleme** · *Mert Karaca* · 11:00 → 26 Haziran
- No-show: ⚫ **No-show** · *Selin Aydın* · 18:30 — "+ gerekçe ekle"
- Yeni: 🟢 **Yeni** · *Neslihan Dere* · Yarın · 11:00
- İlk görüşme: *İrem Çevik*, 27 yaş · Kadın · 05xx — başvuru: "Sınav kaygısı, uyku sorunu" — telefon notu: "Üniversite son sınıf, ilk kez terapiye geliyor."

## 5. Korunacak işlev / veri (porting notu — tasarımı kısıtlamaz)
- Veri: `GET /api/randevu-ozet` → `{ window:{yesterday,today,tomorrow}, cancellations:[{id,clientName,date,time,durum,mazeret,ertlemeTarihi}], newAppointments:[{id,title,start}] }`.
- İlk görüşme: o günün yeni danışanı (`state.patients`, createdAt=bugün) + takvim eşleşmesi; alanlar `adSoyad,yas,cinsiyet,telefon,sunumSorunu` + `calEvent.notes`.
- Mazeret kaydet: `PATCH /api/seans-bildirimleri/{id}` `{mazeret}` (inline, anında).
- "Dosyayı Aç": `/profil/{id}`.
- Durum tipleri: `iptal`, `erteleme` (→ yeni tarih), `no-show`.

## 6. Claude Design'a not
- Çıktı **tek bir modal** tasarımı olsun; mevcut "Klinik Editöryel Dosya" diliyle (krem zemin, Fraunces başlık, mono eyebrow, kil accent) tam uyumlu.
- 3 durumu da göster: (1) dolu (iptal+yeni+ilk görüşme), (2) sadece ilk görüşme, (3) boş.
- Responsive: dar ekranda ilk-görüşme iki sütunu alt alta gelsin.
