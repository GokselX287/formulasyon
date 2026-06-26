# Kurulum — Formulasyon

Bu repo **uygulama kodunun tamamını** içerir. Gizlilik gereği şunlar repoda
**yoktur** ve kurulumda yerelde üretilir:

- `node_modules/` → `npm install` ile gelir
- `.env.local` → gizli anahtarlar (`.env.example`'dan kopyalanır)
- `data.db` → SQLite veritabanı (danışan PII'si). İlk çalıştırmada
  `lib/schema.sql`'den **otomatik oluşturulur** (boş başlar).

## Sıfırdan çalıştırma

```bash
# 1) Bağımlılıklar
npm install

# 2) Ortam değişkenleri
cp .env.example .env.local       # sonra .env.local içini doldur

# 3) Örnek (sahte) danışan verisi — ekranların boş DB'de hata vermemesi için
npm run seed                     # 3 dolu örnek danışan ekler
#   geri al:  node scripts/seed-ornek-danisanlar.mjs --reset

# 4) Geliştirme sunucusu
npm run dev                      # http://localhost:3000
```

## Notlar

- **better-sqlite3** native (C++) bir modüldür; `npm install` sırasında derlenir.
  Derleme yapamayan/sunucusuz (serverless) ortamlarda DB'ye bağlanan ekranlar
  çalışmaz — yerel veya tam Node.js ortamı gerekir.
- Giriş kapısı prototipte kapalıdır (`proxy.ts`); tüm rotalar açıktır.
- Örnek danışanlar `referral_source = 'Örnek dosya (seed)'` ile işaretlidir,
  `--reset` ile temizlenir.
