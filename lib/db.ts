import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data.db');
const SCHEMA_PATH = path.join(process.cwd(), 'lib', 'schema.sql');

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');

    const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
    db.exec(schema);

    // Migration v2 — yeni kolonlar clients ve formulations tablolarına
    const version = db.pragma('user_version', { simple: true }) as number;
    if (version < 2) {
      const clientCols = ['telefon', 'email', 'status', 'sunum_sorunu', 'hedefler'];
      for (const col of clientCols) {
        try { db.exec(`ALTER TABLE clients ADD COLUMN ${col} TEXT`); } catch {}
      }

      const formCols = [
        'predispozan', 'presipitan', 'perpetuan', 'protektif',
        'temel_inanclar', 'ara_inanclar', 'basa_cikma', 'otomatik_dusunceler',
        'duygu_bedensel', 'davranislar', 'smart_spesifik', 'smart_olculebilir',
        'smart_zaman', 'ana_sikayetler', 'yonlendirme_nedeni',
      ];
      for (const col of formCols) {
        try { db.exec(`ALTER TABLE formulations ADD COLUMN ${col} TEXT`); } catch {}
      }

      db.pragma('user_version = 2');
    }

    if (version < 3) {
      const seanslarCols = ['no', 'tip', 'anamnez_data', 'seans_notu_data', 'guncelleme_tarihi'];
      const seanslarTypes = ['INTEGER DEFAULT 1', 'TEXT DEFAULT "seans"', 'TEXT', 'TEXT', 'TEXT'];
      seanslarCols.forEach((col, i) => {
        try { db.exec(`ALTER TABLE seanslar ADD COLUMN ${col} ${seanslarTypes[i]}`); } catch {}
      });
      db.pragma('user_version = 3');
    }

    if (version < 4) {
      // ACT hexaflex fields on formulations
      const actCols = ['act_kabul', 'act_defuzyon', 'act_simdi', 'act_baglam', 'act_degerler', 'act_eylem', 'act_yaratici_caresizlik'];
      for (const col of actCols) {
        try { db.exec(`ALTER TABLE formulations ADD COLUMN ${col} TEXT`); } catch {}
      }

      // Supervision table
      db.exec(`CREATE TABLE IF NOT EXISTS supervizyon (
        id TEXT PRIMARY KEY,
        tarih TEXT,
        supervisor TEXT,
        format TEXT DEFAULT 'bireysel',
        duration INTEGER,
        goal TEXT,
        selected_cases TEXT,
        case_notes TEXT,
        tools TEXT,
        notes TEXT,
        post_notes TEXT,
        status TEXT DEFAULT 'hazirlanıyor',
        created_at TEXT DEFAULT (datetime('now'))
      )`);

      db.pragma('user_version = 4');
    }

    if (version < 5) {
      // Randevu (manual appointments) table
      db.exec(`CREATE TABLE IF NOT EXISTS randevu (
        id TEXT PRIMARY KEY,
        client_id TEXT,
        client_name TEXT,
        tarih TEXT,
        saat TEXT,
        sure INTEGER DEFAULT 50,
        not_text TEXT,
        done INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now'))
      )`);

      // Terapist check-in table
      db.exec(`CREATE TABLE IF NOT EXISTS terapist_checkin (
        id TEXT PRIMARY KEY,
        tarih TEXT,
        degerler INTEGER DEFAULT 0,
        kacinma INTEGER DEFAULT 0,
        burnout INTEGER DEFAULT 0,
        eylem TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      )`);

      // Terapist mood log table
      db.exec(`CREATE TABLE IF NOT EXISTS terapist_mood (
        id TEXT PRIMARY KEY,
        tarih TEXT,
        skor INTEGER,
        emoji TEXT,
        not_text TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      )`);

      // Brief notes per patient
      db.exec(`CREATE TABLE IF NOT EXISTS brief_notu (
        patient_id TEXT PRIMARY KEY,
        not_text TEXT,
        guncelleme TEXT DEFAULT (datetime('now'))
      )`);

      db.pragma('user_version = 5');
    }

    if (version < 6) {
      db.exec(`CREATE TABLE IF NOT EXISTS mindmap_nodes (
        id TEXT PRIMARY KEY,
        patient_id TEXT NOT NULL,
        parent_process TEXT NOT NULL,
        label TEXT NOT NULL,
        content TEXT DEFAULT '',
        created_at TEXT DEFAULT (datetime('now'))
      )`);
      db.pragma('user_version = 6');
    }

    if (version < 7) {
      db.exec(`CREATE TABLE IF NOT EXISTS seans_bildirimleri (
        id TEXT PRIMARY KEY,
        randevu_id TEXT NOT NULL,
        client_id TEXT NOT NULL,
        client_name TEXT NOT NULL,
        seans_no INTEGER NOT NULL,
        randevu_tarihi TEXT NOT NULL,
        randevu_saati TEXT,
        durum TEXT DEFAULT 'bekleyen',
        mazeret TEXT,
        terapist_tutum TEXT,
        dikkat_edilecekler TEXT,
        niyet_kalibi TEXT,
        erteleme_tarihi TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        kapandi_at TEXT
      )`);
      db.pragma('user_version = 7');
    }

    if (version < 8) {
      db.exec(`CREATE TABLE IF NOT EXISTS takvim_gecmis (
        id TEXT PRIMARY KEY,
        event_title TEXT NOT NULL,
        start_dt TEXT NOT NULL,
        end_dt TEXT,
        saat TEXT,
        is_cancelled INTEGER DEFAULT 0,
        synced_at TEXT DEFAULT (datetime('now'))
      )`);
      db.pragma('user_version = 8');
    }

    if (version < 9) {
      db.exec(`CREATE TABLE IF NOT EXISTS danisan_ayarlar (
        client_id TEXT PRIMARY KEY,
        on_form_aktif INTEGER DEFAULT 0,
        haftalik_olcek_aktif INTEGER DEFAULT 0,
        haftalik_olcek_id TEXT,
        updated_at TEXT DEFAULT (datetime('now'))
      )`);
      db.exec(`CREATE TABLE IF NOT EXISTS form_linkleri (
        id TEXT PRIMARY KEY,
        token TEXT UNIQUE NOT NULL,
        client_id TEXT NOT NULL,
        client_name TEXT NOT NULL,
        form_tipi TEXT NOT NULL,
        olcek_id TEXT,
        olcek_ad TEXT,
        aktif INTEGER DEFAULT 1,
        created_at TEXT DEFAULT (datetime('now'))
      )`);
      db.exec(`CREATE TABLE IF NOT EXISTS form_yanitlari (
        id TEXT PRIMARY KEY,
        token TEXT NOT NULL,
        client_id TEXT NOT NULL,
        form_tipi TEXT NOT NULL,
        olcek_id TEXT,
        yanit_data TEXT NOT NULL,
        submitted_at TEXT DEFAULT (datetime('now'))
      )`);
      db.pragma('user_version = 9');
    }

    if (version < 10) {
      // Haftalık çalışma şablonu: her gün için çalışma/mola/yemek/kapali bloğu
      db.exec(`CREATE TABLE IF NOT EXISTS musaitlik_sablon (
        id TEXT PRIMARY KEY,
        gun INTEGER NOT NULL,
        tip TEXT NOT NULL,
        baslangic TEXT,
        bitis TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      )`);
      // Özel tarih bazlı bloklar
      db.exec(`CREATE TABLE IF NOT EXISTS musaitlik_blok (
        id TEXT PRIMARY KEY,
        tarih TEXT NOT NULL,
        baslangic TEXT NOT NULL,
        bitis TEXT NOT NULL,
        aciklama TEXT,
        renk TEXT DEFAULT 'gray',
        created_at TEXT DEFAULT (datetime('now'))
      )`);
      db.pragma('user_version = 10');
    }

    if (version < 11) {
      // Takip girişim kayıtları — seans_bildirimleri'ne yeni kolonlar
      const takipCols = ['takip_notu', 'takip_tarihi', 'sonraki_adim'];
      for (const col of takipCols) {
        try { db.exec(`ALTER TABLE seans_bildirimleri ADD COLUMN ${col} TEXT`); } catch {}
      }
      try { db.exec(`ALTER TABLE seans_bildirimleri ADD COLUMN takip_sayisi INTEGER DEFAULT 0`); } catch {}
      db.pragma('user_version = 11');
    }

    if (version < 12) {
      // 15 bölümlü AnamnezPanel wizard verisi
      try { db.exec(`ALTER TABLE clients ADD COLUMN anamnez_json TEXT`); } catch {}
      try { db.exec(`ALTER TABLE clients ADD COLUMN anamnez_updated_at TEXT`); } catch {}
      db.pragma('user_version = 12');
    }

    if (version < 13) {
      // SeansDetayVerisi (hexaflex dahil) kalıcı depolama
      try { db.exec(`ALTER TABLE seanslar ADD COLUMN detay_json TEXT`); } catch {}
      db.pragma('user_version = 13');
    }

    if (version < 14) {
      // 12 bölümlü CocukPanel wizard verisi
      try { db.exec(`ALTER TABLE clients ADD COLUMN cocuk_json TEXT`); } catch {}
      try { db.exec(`ALTER TABLE clients ADD COLUMN cocuk_updated_at TEXT`); } catch {}
      db.pragma('user_version = 14');
    }

    if (version < 15) {
      // SMS iletim raporu alanları (Gmail IMAP sync)
      try { db.exec(`ALTER TABLE sms_log ADD COLUMN delivery_status TEXT`); } catch {}
      try { db.exec(`ALTER TABLE sms_log ADD COLUMN delivered_at TEXT`); } catch {}
      db.pragma('user_version = 15');
    }

    if (version < 16) {
      // Müdahale Kütüphanesi + Seans Planlayıcı tabloları
      db.exec(`
        CREATE TABLE IF NOT EXISTS interventions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          modality TEXT,
          problems TEXT,
          age_groups TEXT,
          format TEXT,
          duration TEXT,
          duration_minutes INTEGER,
          evidence TEXT,
          description TEXT,
          protocol TEXT,
          materials TEXT,
          contraindications TEXT,
          variants TEXT,
          references_json TEXT,
          homework_variant TEXT,
          personal_notes TEXT,
          favorite INTEGER DEFAULT 0,
          use_count INTEGER DEFAULT 0,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS intervention_assignments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          intervention_id INTEGER NOT NULL,
          client_id INTEGER NOT NULL,
          when_type TEXT,
          scheduled_date TEXT,
          duration_minutes INTEGER,
          as_homework INTEGER DEFAULT 0,
          note TEXT,
          outcome TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS session_plans (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          client_id INTEGER,
          session_length INTEGER,
          items_json TEXT,
          homework TEXT,
          next_focus TEXT,
          is_template INTEGER DEFAULT 0,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // ── Seed: 25 evrensel müdahale (ACT / BDT / CFT / EFT / EMDR) ──────
      const seedInsert = db.prepare(`
        INSERT OR IGNORE INTO interventions
          (id, title, modality, problems, age_groups, format, duration, duration_minutes,
           evidence, description, protocol, materials, contraindications, homework_variant,
           favorite, use_count)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
      `);

      const seedMany = db.transaction((rows: Parameters<typeof seedInsert.run>[]) => {
        for (const r of rows) seedInsert.run(...r);
      });

      const J = (v: unknown) => JSON.stringify(v);
      seedMany([
        // ── ACT ────────────────────────────────────────────────────────────
        [1, 'Defüzyon · "Yapraklar dalda" egzersizi', 'ACT',
          J(['rumination','sosyal kaygı']), J(['yetiskin','ergen']),
          'seans-ici', 'orta', 15, 'rkc',
          'Düşünceleri akıntıdaki yaprak gibi izleme — defüzyon temel pratiği.',
          J(['Sessiz oturuş, gözler kapalı.','Düşünce → yaprak metaforu.','10-15 dk akış.','Çıkış + paylaşım.']),
          J(['Sessiz ortam']), J(['Aktif intihar düşüncesi']),
          'Günde 1 kez 8 dk yaprak pratiği.', 1, 24],

        [2, 'Değerler Pusulası', 'ACT',
          J(['mükemmeliyetçilik','değer','tükenmişlik']), J(['yetiskin']),
          'calisma-kagidi', 'orta', 20, 'rkc',
          '10 yaşam alanında değer-eylem boşluğunu haritalayan kart pratiği.',
          J(['Değer alanlarını listele.','Her alana önem puanı ver (0-10).','Mevcut eylem tutarlılığını değerlendir.','Bir sonraki hafta için taahhüt seç.']),
          J(['Değerler pusulası formu']), null,
          'Haftalık 1 değerli eylem seç, günlük tut.', 1, 18],

        [3, 'Şimdiki an demirleme (5-4-3-2-1)', 'ACT',
          J(['kaçınma','panik','dissosiyasyon']), J(['yetiskin','ergen']),
          'seans-ici', 'kisa', 8, 'sistematik-review',
          '5-4-3-2-1 duyusal demirleme; dissosiyatif zemini iyileştirir.',
          J(['5 görsel,',' 4 dokunsal, 3 işitsel, 2 koku, 1 tat.','Nefes odağıyla bitir.']),
          null, null,
          'Sabah farkındalık demirleme 5 dk.', 0, 12],

        [4, 'Gözlemleyen Ben (Bağlam-benlik)', 'ACT',
          J(['kimlik karışıklığı','öz-eleştiri']), J(['yetiskin']),
          'seans-ici', 'orta', 20, 'rkc',
          'İçerik-benlik ile gözlemleyen ben arasındaki ayrımı deneyimletme.',
          J(['"Düşünüyorum" → "Bende bir düşünce var" formatı.','Gözlemleyen ben imgesi.','Güvenli mesafe deneyi.']),
          null, null, null, 0, 8],

        [5, 'Maruziyet hiyerarşisi (ACT + değer bağlantısı)', 'ACT',
          J(['sosyal kaygı','panik','kaçınma']), J(['yetiskin','ergen']),
          'seans-ici', 'uzun', 40, 'rkc',
          'ACT çerçevesinde değer-temelli maruziyet basamakları.',
          J(['Kaçınma listesi + SUDS.','Değer bağlantısı: "Bu neden önemli?"','En düşükten maruziyet.','Tepki önleme + demirleme.']),
          null, J(['Aktif intihar düşüncesi','Madde intoksikasyonu']),
          'En düşük SUDS\'lu durumu hafta 3× uygula.', 1, 31],

        // ── BDT ────────────────────────────────────────────────────────────
        [6, 'Düşünce kaydı (ABC formu)', 'BDT',
          J(['depresyon','YAB','OKB']), J(['yetiskin','ergen','cocuk-7-11']),
          'ev-odevi', 'orta', 20, 'rkc',
          'A-B-C kayıt + kanıt incelemesi + alternatif düşünce.',
          J(['Aktivatör olay (A).','Otomatik düşünce (B) + duygu puanı.','Kanıtları sorgula.','Alternatif düşünce üret.']),
          J(['Düşünce kaydı formu']), null,
          '7 gün × 2 kayıt.', 0, 22],

        [7, 'Davranışsal aktivasyon', 'BDT',
          J(['depresyon','anhedoni']), J(['yetiskin','ergen']),
          'ev-odevi', 'uzun', 45, 'rkc',
          'Haz/ustalık çizelgeleri ile aktivite çoğaltma.',
          J(['Aktivite izleme (1 hafta).','Haz (P) / Ustalık (M) sınıflandır.','Haftalık aktivite planla.','Sosyal geri çekilmeyi kademeli azalt.']),
          J(['Aktivite çizelgesi']), null,
          '7 günlük etkinlik çizelgesi + ruh hali puanı.', 0, 19],

        [8, 'Sokratik sorgulama', 'BDT',
          J(['bilişsel çarpıtmalar','depresyon','kaygı']), J(['yetiskin','ergen']),
          'seans-ici', 'kisa', 15, 'rkc',
          'Güdümlü keşif yöntemi; danışan kendi çözümüne ulaşır.',
          J(['"Bu düşünceyi destekleyen kanıtlar?"','"Kanıta karşı?"','"Başkası nasıl yorumlar?"','"Olasılığı?"']),
          null, null, null, 0, 14],

        [9, 'Davranış deneyi', 'BDT',
          J(['sosyal kaygı','panik','performans kaygısı']), J(['yetiskin','ergen']),
          'ev-odevi', 'orta', 25, 'rkc',
          'İnanca yönelik test deneyi; öncesi-sonrası tahmin.',
          J(['Hedef inanç + tahmin yaz.','Deneyi planla.','Deneyi yap + not al.','Kanıt karşılaştır.']),
          null, null,
          'Haftada 1 davranış deneyi planla ve gerçekleştir.', 0, 16],

        [10, 'Problem çözme eğitimi', 'BDT',
          J(['stres','karar güçlüğü','tükenmişlik']), J(['yetiskin','ergen']),
          'seans-ici', 'orta', 20, 'rkc',
          "D'Zurilla 7-adım modeli: problemi tanımla, çözüm üret, değerlendir.",
          J(['Problemi operasyonel tanımla.','Beyin fırtınası: 10 çözüm.','Artı-eksi tablosu.','Seç ve uygula.','Sonucu değerlendir.']),
          null, null,
          'Seçilen çözümü bu hafta dene.', 0, 11],

        [11, 'Maruziyet + ERP (OKB)', 'BDT',
          J(['OKB']), J(['yetiskin','ergen','cocuk-7-11']),
          'seans-ici', 'uzun', 60, 'rkc',
          'Obsesyon tetikleyicisine maruziyet + zorlama tepkisini önleme.',
          J(['OKB hiyerarşisi oluştur.','Düşük SUDs\'dan başla.','Zorlama önleme + anksiyete habitüasyonu.','Ev ödevi: günlük ERP pratiği.']),
          null, J(['Aktif psikoz','İntihar riski yüksek']),
          'Günlük 30 dk ERP pratiği.', 1, 27],

        // ── CFT ────────────────────────────────────────────────────────────
        [12, 'Şefkatli imgelem', 'CFT',
          J(['öz-eleştiri','utanç','travma']), J(['yetiskin','ergen']),
          'seans-ici', 'orta', 20, 'sistematik-review',
          'Sakinlik sistemini etkinleştiren imgeleme; şefkatli figür geliştirme.',
          J(['Güvenli yer kurul.','Şefkatli figür imgele: ses, yüz, sıcaklık.','Figür sesi: "Ne yapabilirsin?"','Şefkatle yüzleşme.']),
          null, null,
          'Günde 5 dk şefkatli figür imgelemi.', 0, 9],

        [13, 'Tehdit-sürüş-sakinlik psikoeğitimi', 'CFT',
          J(['kaygı','öz-eleştiri','tükenmişlik']), J(['yetiskin']),
          'psikoegitim', 'kisa', 10, 'klinik-kilavuz',
          'Evrimsel 3-sistem modeli ile semptomlara normalizasyon.',
          J(['3 sistem açıkla: tehdit, sürüş, sakinlik.','Danışanın dominant sistemini belirle.','Sakinlik aktivatörlerini keşfet.']),
          null, null, null, 0, 6],

        [14, 'Şefkatli mektup (öz-eleştiriye)', 'CFT',
          J(['öz-eleştiri','depresyon','mükemmeliyetçilik']), J(['yetiskin','ergen']),
          'ev-odevi', 'orta', 20, 'sistematik-review',
          'Danışan bir arkadaşına yazdığı şefkat dolu mektubu kendine yazar.',
          J(['Senaryo: en iyi arkadaş aynı problemi yaşıyor.','Arkadaşına mektup yaz.','"Kendine" olarak baştan yaz.','Seansta oku ve tartış.']),
          null, null,
          'Haftalık 1 şefkat mektubu.', 0, 7],

        // ── EFT ────────────────────────────────────────────────────────────
        [15, 'İki sandalye diyaloğu', 'EFT',
          J(['iç çatışma','karar güçlüğü','öz-eleştiri']), J(['yetiskin']),
          'seans-ici', 'uzun', 40, 'sistematik-review',
          'Eleştirel ses ile yaşantılayan ben arasındaki diyaloğu canlandırma.',
          J(['Eleştirel ses sandalyeyi tanımla.','Sandalye değiştirerek diyalog.','Yumuşama + ihtiyaç netleştirme.','Anlaşma veya kabul.']),
          null, null, null, 0, 8],

        [16, 'Boş sandalye (çözülmemiş ilişki)', 'EFT',
          J(['yas','travma','ilişki sorunları']), J(['yetiskin']),
          'seans-ici', 'uzun', 45, 'sistematik-review',
          'Önemli bir kişiye söylenemeyen şeyleri boş sandalyeye konuşturma.',
          J(['Hedef kişiyi belirleme ve seansta hazırlık.','Konuşmaya davet.','Duyguya derine inme.','İfade tamamlama + güvenli kapanış.']),
          null, J(['Aktif kriz'], ),
          null, 0, 5],

        [17, 'Duygu işleme (markeré dayalı)', 'EFT',
          J(['depresyon','travma','ilişki sorunları']), J(['yetiskin']),
          'seans-ici', 'orta', 30, 'sistematik-review',
          'Primer-sekonder-enstrümantal duygu ayrımını derinleştirme.',
          J(['Duygu farkındalığı + beden taraması.','Primer duyguya ulaş.','İhtiyacı ifade et.','Adaptatif eylem impulsunu güçlendir.']),
          null, null, null, 0, 6],

        // ── EMDR ────────────────────────────────────────────────────────────
        [18, 'EMDR stabilizasyon (güvenli yer)', 'EMDR',
          J(['travma','PTSD','kaygı']), J(['yetiskin','ergen']),
          'seans-ici', 'orta', 20, 'klinik-kilavuz',
          'EMDR kaynak geliştirme: güvenli yer imgelemi + BLS.',
          J(['Güvenli yer imgele + duyusal detaylar.','Kelime bul + BLS uygula.','Negatif yük varsa değiştir.','Pratik için ev ödevi ver.']),
          null, null,
          'Günde 2 dk güvenli yer pratiği.', 1, 15],

        [19, 'EMDR standart protokol (F1-8)', 'EMDR',
          J(['PTSD','travma']), J(['yetiskin','ergen']),
          'seans-ici', 'tam-seans', 90, 'rkc',
          'Shapiro 8-fazlı standart protokol; yalnızca EMDR eğitimli terapistler.',
          J(['Tarihçe + plan.','Stabilizasyon.','Hedef seç + NC/PC.','Duyarsızlaştırma.','Kurulum + beden taraması.','Kapanış + yeniden değerlendirme.']),
          null, J(['EMDR eğitimi olmayan terapist','Aktif disosiyatif bozukluk']),
          null, 1, 20],

        [20, 'BLS (çift dikkat uyarımı) micro-pratik', 'EMDR',
          J(['stres','kaygı','travma']), J(['yetiskin','ergen']),
          'seans-ici', 'kisa', 10, 'klinik-kilavuz',
          'Kısa BLS (göz hareketi / tap) ile aktif stres regülasyonu.',
          J(['Stres anısını sınırla.','Kısa BLS setleri (12-24).','Dinle + not al.','Kapat + konteyner.']),
          null, null, null, 0, 10],

        // ── Şema ────────────────────────────────────────────────────────────
        [21, 'Şema tespiti + kart egzersizi', 'Şema',
          J(['kişilik','depresyon','kaygı']), J(['yetiskin']),
          'seans-ici', 'orta', 25, 'klinik-kilavuz',
          'Young şema envanteri veya kart seti ile erken uyum bozucu şemaları belirleme.',
          J(['YSQ-SF uygula veya kart seti kullan.','En yüksek 3 şemayı bul.','Yaşam deneyimiyle bağlantı kur.','Modlar haritala.']),
          J(['YSQ-SF formu','Şema kartları']), null, null, 0, 12],

        [22, 'Sınırlı yeniden ebeveynlik (şema modu)', 'Şema',
          J(['kişilik','travma','öz-eleştiri']), J(['yetiskin']),
          'seans-ici', 'uzun', 40, 'klinik-kilavuz',
          'Savunmasız çocuk moduna şefkatli terapist sesi ile bakım sağlama.',
          J(['Modu etkinleştir (imgelem/diyalog).','Şefkatli ses ile ihtiyacı karşıla.','Dışsallaştırma + rol oynama.','Yetişkin moda geçiş.']),
          null, J(['Aktif psikoz']), null, 0, 7],

        // ── Sistemik ────────────────────────────────────────────────────────
        [23, 'Döngüsel soru teknikleri', 'Sistemik',
          J(['ilişki sorunları','çift','aile']), J(['yetiskin','cift']),
          'seans-ici', 'orta', 30, 'klinik-kilavuz',
          'Farklı bakış açılarını ortaya çıkaran döngüsel ve yansıtma soruları.',
          J(['"X olmasa ne değişirdi?"','"Y sizi böyle görünce ne hisseder?"','Döngüyü haritalama.','Farkı fark ettirme.']),
          null, null, null, 0, 9],

        [24, 'Çift çatışma haritası', 'EFT',
          J(['çift','ilişki sorunları']), J(['cift']),
          'seans-ici', 'orta', 35, 'rkc',
          'İkincil tepkinin altındaki primer duygu ve ihtiyacı görünür kılma.',
          J(['Döngüyü adlandır: "talep-çekilme"','Her partnerin ikincil tepkisini bul.','Primer duyguya ulaş.','Döngüyü yeniden çerçevele.']),
          null, null, null, 0, 11],

        [25, 'Nefes farkındalığı (7-11 nefes)', 'ACT',
          J(['kaygı','stres','panik']), J(['yetiskin','ergen','cocuk-7-11']),
          'ev-odevi', 'kisa', 8, 'sistematik-review',
          '7 sayarak nefes al, 11 sayarak ver — parasempatik aktivasyon.',
          J(['Nefes al: 7 sayı.','Nefes ver: 11 sayı.','10 döngü.','SUDS öncesi-sonrası yaz.']),
          null, null,
          'Günde 2× 8 dk nefes pratiği.', 0, 13],
      ] as Parameters<typeof seedInsert.run>[]);

      db.pragma('user_version = 16');
    }

    if (version < 17) {
      db.exec(`
        CREATE TABLE IF NOT EXISTS reflections (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          therapist_id INTEGER,
          body TEXT,
          accent_word TEXT,
          emotions TEXT,
          created_at TEXT DEFAULT (datetime('now'))
        )
      `);
      db.pragma('user_version = 17');
    }

    if (version < 18) {
      // Add type, emotion, meta columns to reflections
      db.exec(`
        ALTER TABLE reflections ADD COLUMN type TEXT NOT NULL DEFAULT 'daily';
        ALTER TABLE reflections ADD COLUMN emotion TEXT;
        ALTER TABLE reflections ADD COLUMN meta TEXT;
      `);
      db.pragma('user_version = 18');
    }

    if (version < 19) {
      db.exec(`
        CREATE TABLE IF NOT EXISTS supervizyon_notlari (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          note_no TEXT,
          date TEXT,
          case_code TEXT,
          topic TEXT,
          supervisor_name TEXT,
          therapist_initials TEXT,
          segments_json TEXT,
          themes_json TEXT,
          difficulty INTEGER,
          learning INTEGER,
          red_flag TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `);
      db.pragma('user_version = 19');
    }

    // v20: benlik_algisi_json kolonu formulations tablosuna
    if (version < 20) {
      db.exec(`
        ALTER TABLE formulations ADD COLUMN benlik_algisi_json TEXT;
      `);
      db.pragma('user_version = 20');
    }

    if (version < 21) {
      db.exec(`
        CREATE TABLE IF NOT EXISTS design_files (
          id          TEXT PRIMARY KEY,
          name        TEXT NOT NULL,
          original_name TEXT NOT NULL,
          mime_type   TEXT NOT NULL,
          size_bytes  INTEGER NOT NULL,
          source      TEXT NOT NULL DEFAULT 'upload',  -- 'upload' | 'canva'
          canva_id    TEXT,                            -- Canva design ID (ileride)
          thumbnail   TEXT,                            -- /uploads/designs/thumb_*.jpg
          path        TEXT NOT NULL,                   -- /uploads/designs/*.ext
          notes       TEXT,
          created_at  TEXT NOT NULL
        );
      `);
      db.pragma('user_version = 21');
    }

    if (version < 22) {
      // Terapist iyilik hali check-in'i: 0-10 skor (reflections type='check-in')
      try { db.exec(`ALTER TABLE reflections ADD COLUMN score INTEGER`); } catch {}
      db.pragma('user_version = 22');
    }

    if (version < 23) {
      // Danışan seans ücreti (TL) — haftalık kazanç tahmini için
      try { db.exec(`ALTER TABLE clients ADD COLUMN seans_ucreti INTEGER`); } catch {}
      db.pragma('user_version = 23');
    }

    if (version < 24) {
      // Form-link payload (JSON) — Hexaflex esneklik anketi soruları için
      try { db.exec(`ALTER TABLE form_linkleri ADD COLUMN payload TEXT`); } catch {}
      db.pragma('user_version = 24');
    }

    if (version < 25) {
      // Danışan: takip sıklığı (aktif danışan kırılımı) + kişilik tipi
      try { db.exec(`ALTER TABLE clients ADD COLUMN takip_sikligi TEXT`); } catch {}
      try { db.exec(`ALTER TABLE clients ADD COLUMN kisilik_tipi TEXT`); } catch {}
      db.pragma('user_version = 25');
    }
  }
  return db;
}
