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

        [4, 'Gözlemleyen Ben (Bağlamsal benlik)', 'ACT',
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

    if (version < 26) {
      // Seans katılım durumu: katildi | katilmadi | ertelendi | iptal
      try { db.exec(`ALTER TABLE seanslar ADD COLUMN durum TEXT DEFAULT 'katildi'`); } catch {}
      db.pragma('user_version = 26');
    }

    if (version < 27) {
      // Danışanın kendi hedefleri (terapist hedeflerinden AYRI koleksiyon):
      // JSON dizi [{hedef, durum: 'tamamlandi'|'devam'|'baslanmadi'}]
      try { db.exec(`ALTER TABLE formulations ADD COLUMN danisan_hedefleri_json TEXT`); } catch {}
      db.pragma('user_version = 27');
    }

    if (version < 28) {
      // Yansıma notu İKİ BÖLÜM: "Fark ettiklerim" + "Klinik yansımalar"
      // (Klinik yansımalar eski adı: "İnsanlarla ilgili çıkarımlarım".)
      // MIGRATION: eski tek-alan `body` verisi ayrıştırılıp yeni kolonlara map'lenir.
      //   - "Fark ettiklerim — X" / "Klinik yansımalar — Y" işaretçileri varsa bölünür.
      //   - İşaretçi yoksa tüm metin "Klinik yansımalar" bölümüne map'lenir.
      try { db.exec(`ALTER TABLE reflections ADD COLUMN fark_notu TEXT`); } catch {}
      try { db.exec(`ALTER TABLE reflections ADD COLUMN klinik_notu TEXT`); } catch {}
      try {
        const rows = db.prepare(
          `SELECT id, body FROM reflections WHERE type = 'daily' AND fark_notu IS NULL AND klinik_notu IS NULL`
        ).all() as { id: number; body: string | null }[];
        const upd = db.prepare(`UPDATE reflections SET fark_notu = ?, klinik_notu = ? WHERE id = ?`);
        for (const r of rows) {
          const b = String(r.body ?? '');
          let fark: string | null = null;
          let klinik: string | null = null;
          const fm = b.match(/Fark ettiklerim\s*[—–-]\s*([\s\S]*?)(?:\n+\s*(?:Klinik yansımalar|İnsanlarla ilgili çıkarımlarım)\s*[—–-]|$)/);
          const km = b.match(/(?:Klinik yansımalar|İnsanlarla ilgili çıkarımlarım)\s*[—–-]\s*([\s\S]*)$/);
          if (fm || km) {
            fark = fm && fm[1].trim() ? fm[1].trim() : null;
            klinik = km && km[1].trim() ? km[1].trim() : null;
          } else {
            klinik = b.trim() || null; // işaretçisiz eski not → Klinik yansımalar bölümü
          }
          upd.run(fark, klinik, r.id);
        }
      } catch {}
      db.pragma('user_version = 28');
    }

    if (version < 29) {
      // ── Admin paneli: hesaplar (terapist/ekip/müşteri), paylaşım izinleri, denetim günlüğü ──
      // NOT: Bunlar danışan (clients) verisinden tamamen AYRIDIR. Admin paneli danışanlara erişmez.
      db.exec(`
        CREATE TABLE IF NOT EXISTS app_users (
          id           TEXT PRIMARY KEY,
          name         TEXT NOT NULL,
          email        TEXT,
          phone        TEXT,
          role         TEXT DEFAULT 'terapist',   -- terapist | ekip | musteri
          status       TEXT DEFAULT 'aktif',      -- aktif | askida | davetli
          plan         TEXT DEFAULT 'aylik',      -- aylik | yillik | deneme
          base_price   INTEGER DEFAULT 0,         -- temel abonelik ücreti (TL)
          discount_pct REAL DEFAULT 0,            -- indirim yüzdesi
          price_adjust INTEGER DEFAULT 0,         -- manuel +/- düzeltme (zam/indirim, TL)
          notes        TEXT,
          last_sms_at  TEXT,
          created_at   TEXT DEFAULT (datetime('now')),
          updated_at   TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS user_shares (
          id           TEXT PRIMARY KEY,
          from_user_id TEXT NOT NULL,
          to_user_id   TEXT NOT NULL,
          permission   TEXT DEFAULT 'goruntule',  -- goruntule | duzenle | tam
          note         TEXT,
          created_at   TEXT DEFAULT (datetime('now'))
        );
        CREATE INDEX IF NOT EXISTS idx_shares_from ON user_shares(from_user_id);
        CREATE INDEX IF NOT EXISTS idx_shares_to   ON user_shares(to_user_id);

        CREATE TABLE IF NOT EXISTS admin_audit (
          id         INTEGER PRIMARY KEY AUTOINCREMENT,
          action     TEXT NOT NULL,               -- user.create | user.update | user.delete | price.change | share.create | share.delete | broadcast.send | auth.login
          target_id  TEXT,
          detail     TEXT,                         -- JSON
          created_at TEXT DEFAULT (datetime('now'))
        );
      `);
      db.pragma('user_version = 29');
    }

    if (version < 30) {
      // Paylaşım kapsamı — bir izin neyin paylaşıldığını belirtir (tum | tasarim | sablon | mudahale).
      try { db.exec(`ALTER TABLE user_shares ADD COLUMN scope TEXT DEFAULT 'tum'`); } catch {}
      db.pragma('user_version = 30');
    }

    if (version < 31) {
      // Danışan sorun döngüleri — her danışana eklenen bozukluk döngüsü + doldurulan alanlar.
      // type = döngü anahtarı (sosyal-kaygi, okb, panik…); fields_json = diyagram alanları.
      db.exec(`
        CREATE TABLE IF NOT EXISTS client_cycles (
          id          TEXT PRIMARY KEY,
          client_id   TEXT NOT NULL,
          type        TEXT NOT NULL,
          label       TEXT,
          fields_json TEXT,
          created_at  TEXT DEFAULT (datetime('now')),
          updated_at  TEXT DEFAULT (datetime('now'))
        );
        CREATE INDEX IF NOT EXISTS idx_client_cycles ON client_cycles(client_id);
      `);
      db.pragma('user_version = 31');
    }

    if (version < 32) {
      // ── Kişisel Antrenör (Personal Trainer) alt uygulaması ──
      // İzole pt_* namespace; klinik tablolara dokunmaz (sonradan bölünüp satılabilir).
      // Para = INTEGER TL. Tarihler TEXT ISO. JSON alanlar autosave deseni (clients.anamnez_json gibi).
      db.exec(`
        CREATE TABLE IF NOT EXISTS pt_trainers (
          id           TEXT PRIMARY KEY,
          ad_soyad     TEXT NOT NULL,
          telefon      TEXT,
          email        TEXT,
          uzmanlik     TEXT,
          brans        TEXT,
          bio          TEXT,
          durum        TEXT DEFAULT 'aktif',          -- aktif | pasif
          program_json TEXT,                          -- haftalık program [{gun,baslangic,bitis,tip,not}]
          created_at   TEXT DEFAULT (datetime('now')),
          updated_at   TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS pt_members (
          id            TEXT PRIMARY KEY,
          ad_soyad      TEXT NOT NULL,
          telefon       TEXT,
          email         TEXT,
          yas           INTEGER,
          dogum_tarihi  TEXT,
          meslek        TEXT,
          trainer_id    TEXT REFERENCES pt_trainers(id) ON DELETE SET NULL,
          durum         TEXT DEFAULT 'aktif',         -- aktif | dondurulmus | ayrildi
          hedefler      TEXT,
          qr_token      TEXT UNIQUE NOT NULL,
          profile_json  TEXT,                         -- PAR-Q, postür, sağlık, hedefler (autosave)
          profile_updated_at TEXT,
          created_at    TEXT DEFAULT (datetime('now')),
          updated_at    TEXT DEFAULT (datetime('now'))
        );
        CREATE INDEX IF NOT EXISTS idx_pt_members_trainer ON pt_members(trainer_id);

        CREATE TABLE IF NOT EXISTS pt_measurements (
          id          TEXT PRIMARY KEY,
          member_id   TEXT NOT NULL REFERENCES pt_members(id) ON DELETE CASCADE,
          ay          TEXT NOT NULL,                  -- 'YYYY-MM'
          mezura_json TEXT,                           -- tape: {gogus,bel,kalca,kol,bacak,...}
          makine_json TEXT,                           -- body-comp: {kilo,yag_yuzde,kas_kg,vki,...}
          notlar      TEXT,
          created_at  TEXT DEFAULT (datetime('now')),
          updated_at  TEXT DEFAULT (datetime('now')),
          UNIQUE(member_id, ay)
        );
        CREATE INDEX IF NOT EXISTS idx_pt_meas_member ON pt_measurements(member_id, ay);

        CREATE TABLE IF NOT EXISTS pt_packages (
          id          TEXT PRIMARY KEY,
          member_id   TEXT NOT NULL REFERENCES pt_members(id) ON DELETE CASCADE,
          paket_no    INTEGER NOT NULL,               -- üye bazlı sıra (1,2,3…)
          ad          TEXT,
          tutar       INTEGER NOT NULL,               -- TL
          seans_adedi INTEGER,
          kalan_seans INTEGER,
          baslangic   TEXT NOT NULL,                  -- YYYY-MM-DD
          bitis       TEXT,
          durum       TEXT DEFAULT 'aktif',           -- aktif | bitti | iptal
          created_at  TEXT DEFAULT (datetime('now'))
        );
        CREATE INDEX IF NOT EXISTS idx_pt_pkg_member ON pt_packages(member_id, paket_no);

        CREATE TABLE IF NOT EXISTS pt_payments (
          id            TEXT PRIMARY KEY,
          member_id     TEXT NOT NULL REFERENCES pt_members(id) ON DELETE CASCADE,
          package_id    TEXT REFERENCES pt_packages(id) ON DELETE SET NULL,
          paket_no      INTEGER,                      -- denormalize (SMS geçmişi sabit kalsın)
          tutar         INTEGER NOT NULL,
          tarih         TEXT NOT NULL,                -- YYYY-MM-DD
          yontem        TEXT,                         -- nakit | kart | havale
          sms_gonderildi INTEGER DEFAULT 0,
          created_at    TEXT DEFAULT (datetime('now'))
        );
        CREATE INDEX IF NOT EXISTS idx_pt_pay_member ON pt_payments(member_id);
        CREATE INDEX IF NOT EXISTS idx_pt_pay_tarih ON pt_payments(tarih);

        CREATE TABLE IF NOT EXISTS pt_attendance (
          id          TEXT PRIMARY KEY,
          member_id   TEXT NOT NULL REFERENCES pt_members(id) ON DELETE CASCADE,
          tarih       TEXT NOT NULL,                  -- YYYY-MM-DD
          giris_at    TEXT,
          cikis_at    TEXT,
          kaynak      TEXT DEFAULT 'qr',              -- qr | manuel
          lesson_id   TEXT,
          created_at  TEXT DEFAULT (datetime('now'))
        );
        CREATE INDEX IF NOT EXISTS idx_pt_att_member ON pt_attendance(member_id, tarih);

        CREATE TABLE IF NOT EXISTS pt_lessons (
          id          TEXT PRIMARY KEY,
          trainer_id  TEXT REFERENCES pt_trainers(id) ON DELETE CASCADE,
          member_id   TEXT REFERENCES pt_members(id) ON DELETE CASCADE,
          tarih       TEXT NOT NULL,                  -- YYYY-MM-DD
          baslangic   TEXT NOT NULL,                  -- HH:MM
          bitis       TEXT,
          tip         TEXT DEFAULT 'ders',            -- ders | grup | musait | kapali
          durum       TEXT DEFAULT 'planli',          -- planli | tamamlandi | iptal
          notlar      TEXT,
          created_at  TEXT DEFAULT (datetime('now'))
        );
        CREATE INDEX IF NOT EXISTS idx_pt_lessons_date ON pt_lessons(tarih);

        CREATE TABLE IF NOT EXISTS pt_collections (
          id          TEXT PRIMARY KEY,
          member_id   TEXT NOT NULL REFERENCES pt_members(id) ON DELETE CASCADE,
          package_id  TEXT REFERENCES pt_packages(id) ON DELETE SET NULL,
          tutar       INTEGER,
          soz_tarihi  TEXT NOT NULL,                  -- YYYY-MM-DD (söz verilen ödeme günü)
          durum       TEXT DEFAULT 'bekleyen',        -- bekleyen | odendi | gecikti
          odeme_id    TEXT REFERENCES pt_payments(id) ON DELETE SET NULL,
          notlar      TEXT,
          created_at  TEXT DEFAULT (datetime('now'))
        );
        CREATE INDEX IF NOT EXISTS idx_pt_coll_member ON pt_collections(member_id);

        CREATE TABLE IF NOT EXISTS pt_expenses (
          id          TEXT PRIMARY KEY,
          kategori    TEXT,                           -- kira | maas | ekipman | fatura | diger
          aciklama    TEXT,
          tutar       INTEGER NOT NULL,
          tarih       TEXT NOT NULL,
          created_at  TEXT DEFAULT (datetime('now'))
        );
        CREATE INDEX IF NOT EXISTS idx_pt_exp_tarih ON pt_expenses(tarih);
      `);
      db.pragma('user_version = 32');
    }

    if (version < 33) {
      // Ortak öneri havuzu — terapistlerin doldurduğu ifadeler (danışan kimliği
      // OLMADAN) alan/düğüm bazlı toplanır; yazarken autocomplete önerisi olur.
      db.exec(`
        CREATE TABLE IF NOT EXISTS field_suggestions (
          id          INTEGER PRIMARY KEY AUTOINCREMENT,
          field_key   TEXT NOT NULL,                 -- BDX düğüm alanı (ör. sa_safety)
          value       TEXT NOT NULL,                 -- ifade — danışan kimliği YOK
          freq        INTEGER NOT NULL DEFAULT 1,    -- kaç kez girildi
          updated_at  TEXT DEFAULT (datetime('now')),
          UNIQUE(field_key, value)
        );
        CREATE INDEX IF NOT EXISTS idx_field_sugg_key ON field_suggestions(field_key);
      `);
      db.pragma('user_version = 33');
    }

    if (version < 34) {
      // ── Çok-kullanıcılı üyelik (Faz 1: kimlik & erişim) ──
      // app_users artık gerçek HESAP tablosu: login kimliği burada. Auth kolonları
      // eklenir; OAuth bağları user_identities'te; e-posta doğrulama/şifre sıfırlama
      // jetonları auth_tokens'ta tutulur. Mevcut tek-kullanıcı (app_settings'teki
      // auth_email/auth_pw_hash) erişimini kaybetmesin diye app_users'a taşınır.
      for (const col of [
        'password_hash TEXT',
        'email_verified INTEGER DEFAULT 0',
        'created_via TEXT DEFAULT \'email\'',  // email | google | microsoft | legacy
        'last_login_at TEXT',
        'avatar_url TEXT',
        'title TEXT',                          // klinik unvan (tp2 profiline beslenir)
      ]) {
        try { db.exec(`ALTER TABLE app_users ADD COLUMN ${col}`); } catch {}
      }

      db.exec(`
        CREATE TABLE IF NOT EXISTS user_identities (
          id           TEXT PRIMARY KEY,
          user_id      TEXT NOT NULL,
          provider     TEXT NOT NULL,          -- google | microsoft
          provider_uid TEXT NOT NULL,          -- sağlayıcıdaki benzersiz kullanıcı id'si
          email        TEXT,
          created_at   TEXT DEFAULT (datetime('now')),
          UNIQUE(provider, provider_uid)
        );
        CREATE INDEX IF NOT EXISTS idx_identities_user ON user_identities(user_id);

        CREATE TABLE IF NOT EXISTS auth_tokens (
          id         TEXT PRIMARY KEY,
          user_id    TEXT NOT NULL,
          kind       TEXT NOT NULL,            -- verify | reset
          token_hash TEXT NOT NULL,            -- ham jetonun sha256'sı (ham değer saklanmaz)
          expires_at TEXT NOT NULL,
          used_at    TEXT,
          created_at TEXT DEFAULT (datetime('now'))
        );
        CREATE INDEX IF NOT EXISTS idx_authtok_hash ON auth_tokens(token_hash);
        CREATE INDEX IF NOT EXISTS idx_authtok_user ON auth_tokens(user_id);
      `);

      // E-posta benzersizliği (büyük/küçük harf duyarsız) — yeni kayıtların
      // çakışmasını DB düzeyinde engelle. Mevcut yinelenen e-posta yoksa kurulur.
      try { db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_app_users_email ON app_users(lower(email)) WHERE email IS NOT NULL'); } catch {}

      // Eski sahibi taşı: app_settings.auth_email → app_users (idempotent).
      try {
        db.exec(`
          INSERT INTO app_users (id, name, email, role, status, plan, password_hash, email_verified, created_via)
          SELECT lower(hex(randomblob(16))), 'Hesap Sahibi', ae.value, 'terapist', 'aktif', 'aylik',
                 (SELECT value FROM app_settings WHERE key = 'auth_pw_hash'), 1, 'legacy'
          FROM app_settings ae
          WHERE ae.key = 'auth_email'
            AND ae.value IS NOT NULL AND ae.value <> ''
            AND NOT EXISTS (SELECT 1 FROM app_users u WHERE lower(u.email) = lower(ae.value));
        `);
      } catch {}

      db.pragma('user_version = 34');
    }

    if (version < 35) {
      // ── Çok-kiracılı VERİ İZOLASYONU (Faz 2) ──
      // Tüm klinik tablolara owner_id; mevcut veri tek sahibe (legacy hesap) atanır.
      // KAPSAM DIŞI (bilerek): pt_* (ayrı alt-uygulama), interventions/clinical_tags
      // (paylaşımlı katalog/sözlük — danışan verisi değil), app_settings (per-user
      // ayarlar ayrı bir adımda). field_suggestions zaten kimliksiz paylaşımlı.
      const directTables = [
        'clients', 'calendar_events', 'design_files', 'musaitlik_blok', 'musaitlik_sablon',
        'pending_files', 'reflections', 'sms_log', 'supervizyon', 'supervizyon_notlari',
        'takvim_gecmis', 'terapist_checkin', 'terapist_mood',
      ];
      const childByClient = [
        'formulations', 'seanslar', 'client_cycles', 'danisan_ayarlar', 'form_linkleri',
        'form_yanitlari', 'intervention_assignments', 'randevu', 'seans_bildirimleri', 'session_plans',
      ];
      const childByPatient = ['brief_notu', 'mindmap_nodes'];
      const childByFormulation = ['formulation_items', 'formulation_snapshots', 'flexibility_scores'];
      const allScoped = [...directTables, ...childByClient, ...childByPatient, ...childByFormulation];

      for (const t of allScoped) { try { db.exec(`ALTER TABLE ${t} ADD COLUMN owner_id TEXT`); } catch {} }

      // Sahip = legacy hesap (yoksa en eski kullanıcı). Veri ondan önce tekti.
      const owner = db.prepare(
        `SELECT id FROM app_users ORDER BY (created_via = 'legacy') DESC, created_at ASC LIMIT 1`
      ).get() as { id: string } | undefined;

      if (owner?.id) {
        for (const t of directTables) {
          db.prepare(`UPDATE ${t} SET owner_id = ? WHERE owner_id IS NULL`).run(owner.id);
        }
        // CAST'li join — id (INTEGER) ile patient_id/client_id (TEXT) affinity tuzağını önler.
        for (const t of childByClient) {
          db.exec(`UPDATE ${t} SET owner_id = (SELECT c.owner_id FROM clients c WHERE CAST(c.id AS TEXT) = CAST(${t}.client_id AS TEXT)) WHERE owner_id IS NULL`);
        }
        for (const t of childByPatient) {
          db.exec(`UPDATE ${t} SET owner_id = (SELECT c.owner_id FROM clients c WHERE CAST(c.id AS TEXT) = CAST(${t}.patient_id AS TEXT)) WHERE owner_id IS NULL`);
        }
        for (const t of childByFormulation) {
          db.exec(`UPDATE ${t} SET owner_id = (SELECT f.owner_id FROM formulations f WHERE CAST(f.id AS TEXT) = CAST(${t}.formulation_id AS TEXT)) WHERE owner_id IS NULL`);
        }
        // Yetim çocuk satırları (parent'ı silinmiş) da sahibe verilsin — sızıntı/null kalmasın.
        for (const t of [...childByClient, ...childByPatient, ...childByFormulation]) {
          db.prepare(`UPDATE ${t} SET owner_id = ? WHERE owner_id IS NULL`).run(owner.id);
        }
      }

      for (const t of allScoped) {
        try { db.exec(`CREATE INDEX IF NOT EXISTS idx_${t}_owner ON ${t}(owner_id)`); } catch {}
      }
      db.pragma('user_version = 35');
    }

    if (version < 36) {
      // SMS gönderim denetimi — uyarı metnindeki "IP ile kayıt altına alınır"
      // taahhüdünü GERÇEK kılan kolon: her SMS'i gönderen kullanıcının IP'si.
      try { db.exec(`ALTER TABLE sms_log ADD COLUMN ip TEXT`); } catch {}
      db.pragma('user_version = 36');
    }

    if (version < 37) {
      // ── app_settings'in PER-USER kısmını izole et (v35'te bilerek ertelenen adım) ──
      // Terapist profili + Netgsm/Gmail kimlikleri + todayIntent artık kullanıcıya özel,
      // ayrı `user_settings (owner_id, key)` tablosunda. app_settings'te yalnız GERÇEKTEN
      // global olanlar kalır (admin_pw_hash, admin_secret, tags_seeded, auth_*).
      db.exec(`CREATE TABLE IF NOT EXISTS user_settings (
        owner_id TEXT NOT NULL,
        key      TEXT NOT NULL,
        value    TEXT,
        PRIMARY KEY (owner_id, key)
      )`);
      const PER_USER_KEYS = [
        'therapistName', 'therapistTitle', 'therapistAbout', 'therapistLocation', 'therapistEmail',
        'therapistPhone', 'therapistSchools', 'smsWebhookUrl', 'netgsmUser', 'netgsmPassword',
        'netgsmHeader', 'smsAutoAppointmentReminder', 'smsAutoWorkshopSignup', 'smsDayOfReminder',
        'noShowTracking', 'gmailUser', 'gmailAppPassword', 'gmailImapHost', 'gmailImapPort', 'todayIntent',
      ];
      // Mevcut (tek-kullanıcı dönemi) ayarları legacy sahibe taşı — v35 ile aynı sahip çözümü.
      const owner = db.prepare(
        `SELECT id FROM app_users ORDER BY (created_via = 'legacy') DESC, created_at ASC LIMIT 1`
      ).get() as { id: string } | undefined;
      if (owner?.id) {
        const ins = db.prepare('INSERT OR IGNORE INTO user_settings (owner_id, key, value) VALUES (?, ?, ?)');
        const sel = db.prepare('SELECT value FROM app_settings WHERE key = ?');
        for (const k of PER_USER_KEYS) {
          const row = sel.get(k) as { value: string } | undefined;
          if (row && row.value != null && row.value !== '') ins.run(owner.id, k, row.value);
        }
      }
      db.pragma('user_version = 37');
    }

    if (version < 38) {
      // ── Uzunlamasına formülasyon: anamnezden tek seferlik tohumlama ──────
      // `erken_yasam` panel API'sinde okunuyordu ama kolon yoktu (hep boştu).
      // Şimdi gerçek kolon + tohum bayrağı: anamnez sinyalleri (gelişim/aile/
      // travma → erken yaşantılar, bağlanma → başa çıkma) boş uzunlamasına
      // yuvalara BİR KEZ yazılır; sonra terapist bağımsız düzenler (independent).
      try { db.exec(`ALTER TABLE formulations ADD COLUMN erken_yasam TEXT`); } catch {}
      try { db.exec(`ALTER TABLE formulations ADD COLUMN longitudinal_seeded INTEGER DEFAULT 0`); } catch {}
      db.pragma('user_version = 38');
    }
  }
  return db;
}
