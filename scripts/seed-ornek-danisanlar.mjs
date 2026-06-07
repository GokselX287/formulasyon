/* =====================================================================
   3 DOLU ÖRNEK DANIŞAN — seed script
   Çalıştır:  node scripts/seed-ornek-danisanlar.mjs
   Geri al:   node scripts/seed-ornek-danisanlar.mjs --reset
   referral_source = 'Örnek dosya (seed)' → örnek dosyalar bu alandan bulunur.
   ===================================================================== */
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database(path.join(__dirname, '..', 'data.db'));
const MARKER = 'Örnek dosya (seed)';

// ── --reset: önceki seed örneklerini temizle ──────────────────────────
if (process.argv.includes('--reset')) {
  const rows = db.prepare(`SELECT id FROM clients WHERE referral_source = ?`).all(MARKER);
  const del = db.prepare(`DELETE FROM clients WHERE id = ?`); // CASCADE → formulations/seanslar/items
  const tx = db.transaction(() => rows.forEach((r) => del.run(r.id)));
  tx();
  console.log(`Silindi: ${rows.length} örnek danışan.`);
  process.exit(0);
}

let sid = 0;
const nextSeansId = () => `seed_${Date.now().toString(36)}_${(++sid).toString(36)}`;

function seedClient(c) {
  const tx = db.transaction(() => {
    // clients
    const cr = db.prepare(`
      INSERT INTO clients (alias, age, gender, occupation, marital_status, referral_source, telefon, email, status, sunum_sorunu, hedefler)
      VALUES (@alias, @age, @gender, @occupation, @marital_status, @referral_source, @telefon, @email, 'active', @sunum_sorunu, @hedefler)
    `).run({ ...c.client, referral_source: MARKER });
    const clientId = cr.lastInsertRowid;

    // formulations
    const fr = db.prepare(`
      INSERT INTO formulations (
        client_id, presenting_problem, client_goal, therapist_goal, narrative, clinical_notes, rupture_notes,
        predispozan, presipitan, perpetuan, protektif,
        temel_inanclar, ara_inanclar, basa_cikma, otomatik_dusunceler, duygu_bedensel, davranislar
      ) VALUES (
        @client_id, @presenting_problem, @client_goal, @therapist_goal, @narrative, @clinical_notes, @rupture_notes,
        @predispozan, @presipitan, @perpetuan, @protektif,
        @temel_inanclar, @ara_inanclar, @basa_cikma, @otomatik_dusunceler, @duygu_bedensel, @davranislar
      )
    `).run({ client_id: clientId, ...c.formulation });
    const fid = fr.lastInsertRowid;

    // flexibility_scores
    db.prepare(`
      INSERT INTO flexibility_scores (formulation_id, defusion, acceptance, present_moment, self_as_context, values_clarity, committed_action)
      VALUES (@formulation_id, @defusion, @acceptance, @present_moment, @self_as_context, @values_clarity, @committed_action)
    `).run({ formulation_id: fid, ...c.flexibility });

    // formulation_items
    const itemStmt = db.prepare(`INSERT INTO formulation_items (formulation_id, category, content, order_index) VALUES (?, ?, ?, ?)`);
    for (const [category, list] of Object.entries(c.items)) {
      list.forEach((content, i) => itemStmt.run(fid, category, content, i));
    }

    // seanslar
    const seansStmt = db.prepare(`
      INSERT INTO seanslar (id, client_id, tarih, sure, no, tip, seans_notu_data, created_at, guncelleme_tarihi)
      VALUES (?, ?, ?, 50, ?, ?, ?, ?, ?)
    `);
    c.seanslar.forEach((s, i) => {
      seansStmt.run(nextSeansId(), clientId, s.tarih, i + 1, s.tip ?? 'seans',
        JSON.stringify(s.notu), s.tarih, s.tarih);
    });

    return clientId;
  });
  const id = tx();
  console.log(`✓ ${c.client.alias} → #${id} (${c.seanslar.length} seans, ${Object.values(c.items).flat().length} öğe)`);
}

// ─────────────────────────────────────────────────────────────────────
// ÖRNEK 1 — Elif Yıldırım · Sosyal kaygı · ACT
// ─────────────────────────────────────────────────────────────────────
seedClient({
  client: {
    alias: 'Elif Yıldırım', age: 29, gender: 'Kadın', occupation: 'Grafik Tasarımcı',
    marital_status: 'Bekâr', telefon: '0532 000 00 01', email: 'elif@ornek.test',
    sunum_sorunu: 'Sosyal kaygı, Mükemmeliyetçilik, Deneyimsel kaçınma',
    hedefler: 'Toplantıda fikir paylaşabilmek; kaygıyla birlikte değerli adımlar atmak',
  },
  formulation: {
    presenting_problem: 'Sosyal değerlendirilme korkusu; toplantı ve sunumlarda donma\nMükemmeliyetçilik ve sert öz-eleştiri\nKaygı yükselince ortamdan ve temastan geri çekilme',
    client_goal: 'Toplantıda fikrimi söyleyebilmek\nKaygıdan kaçmadan günü yaşamak',
    therapist_goal: 'Defüzyon ve kabul becerilerini geliştirmek\nDeğerli eylemi kaygıdan bağımsız sürdürmek',
    narrative: 'Sunum sırasında eli titrediğinde, herkesin onu bir sahtekâr olarak gördüğüne dair eski bir sahne yeniden canlanıyor; oysa odadaki kimse fark etmemişti.',
    clinical_notes: 'İttifak güçlü. Kırılma-onarım deneyimi terapötik olarak verimli kullanılabilir. Bir sonraki blok: kabul ekseni.',
    rupture_notes: '8. seansta ödev üzerine gelen geri bildirimi eleştiri olarak algıladı; seans sonunda adlandırılıp onarıldı, ittifak güçlendi.',
    predispozan: 'Eleştirel ve yüksek beklentili aile ortamı; erken dönemde koşullu değer öğrenmesi',
    presipitan: 'Yeni pozisyonda ilk büyük sunum; kamusal görünürlük artışı',
    perpetuan: 'Kaçınma ve onay arama davranışları kısa vadede rahatlatıp inancı uzun vadede besliyor',
    protektif: 'Güçlü değer pusulası; destekleyici partner ilişkisi; yüksek terapi uyumu',
    temel_inanclar: 'Yetersizim; sevilmeye değmem',
    ara_inanclar: 'Eğer hata yaparsam, değersiz olduğum ortaya çıkar',
    basa_cikma: 'Aşırı hazırlık, kontrol etme, sosyal ortamlardan kaçınma',
    otomatik_dusunceler: 'Herkes beni sahtekâr olarak görüyor; rezil olacağım',
    duygu_bedensel: 'Kaygı, utanç; mide kasılması, el titremesi, yüz kızarması',
    davranislar: 'Toplantıda fikrini söylememe, göz temasından kaçınma, teslimi erteleme',
  },
  flexibility: { defusion: 6, acceptance: 4, present_moment: 7, self_as_context: 5, values_clarity: 8, committed_action: 6 },
  items: {
    value: ['Otantiklik', 'Yakınlık', 'Ustalık', 'Katkı'],
    strength: ['Yüksek içgörü', 'Değer netliği', 'Ev ödevi uyumu'],
    barrier_thought: ['“Herkes beni sahtekâr olarak görüyor”', '“Hata yaparsam değersizim”'],
    barrier_emotion: ['Sunum öncesi kaygı', 'Fark edilme utancı'],
    control_strategy: ['İşi defalarca kontrol etmek', 'Sosyal davetleri geri çevirmek'],
    intervention_done: ['Yaprak metaforu (defüzyon)', 'Dereceli maruziyet hiyerarşisi', 'Değerler pusulası kartı'],
    intervention_planned: ['Toplantıda fikir sunma maruziyeti'],
    action_step: ['Haftada 1 kez ekip toplantısında fikir paylaş', 'Kaygı yükselince 3 dk şimdiki an demiri'],
    supervision_question: ['Maruziyet temposu danışanın değer hızıyla uyumlu mu?', 'Terapist onay-verme davranışı, onay aramayı besliyor olabilir mi?'],
  },
  seanslar: [
    { tarih: '2026-03-08', tip: 'anamnez', notu: { ruhHali: 3, seansOdagi: 'İlk görüşme & değerlendirme', gundemMaddeleri: 'Başvuru nedeni ve öykü', kullanilanTeknikler: ['Klinik görüşme', 'Ölçek bataryası'], gelisimGozlemi: 'Sosyal değerlendirilme korkusu ön planda; ittifak kuruldu.', evOdevi: 'İlk hafta kaygı günlüğü', riskDegerlendirme: 'yok' } },
    { tarih: '2026-03-22', notu: { ruhHali: 4, seansOdagi: 'Düşünce–duygu–davranış kaydı', gundemMaddeleri: 'Kaygı döngüsü', kullanilanTeknikler: ['ABC kaydı', 'Psikoeğitim'], gelisimGozlemi: 'Kaçınma zinciri birlikte çıkarıldı.', evOdevi: 'Günlük 1 ABC kaydı', riskDegerlendirme: 'yok' } },
    { tarih: '2026-04-12', notu: { ruhHali: 5, seansOdagi: 'Defüzyon — düşünceden ayrışma', gundemMaddeleri: '“Yetersizim” düşüncesi', kullanilanTeknikler: ['Yaprak-dere imgelemi', '“…düşüncesine sahibim”'], gelisimGozlemi: 'Düşüncenin zihin ürünü olduğu deneyimsel görüldü.', evOdevi: 'Sert öz-eleştiri anında etiketleme', riskDegerlendirme: 'yok' } },
    { tarih: '2026-05-24', notu: { ruhHali: 7, seansOdagi: 'Sahne provası — küçük maruziyet', gundemMaddeleri: 'Toplantıda fikir sunma senaryosu', kullanilanTeknikler: ['Dereceli maruziyet', 'Değer merdiveni'], gelisimGozlemi: 'Kaygı yükselirken değer yönünde kalabildi.', evOdevi: 'Haftada 1 kez ekip toplantısında fikir paylaş', riskDegerlendirme: 'yok' } },
  ],
});

// ─────────────────────────────────────────────────────────────────────
// ÖRNEK 2 — Mert Karaca · OKB · BDT-ERP
// ─────────────────────────────────────────────────────────────────────
seedClient({
  client: {
    alias: 'Mert Karaca', age: 34, gender: 'Erkek', occupation: 'Yazılım Mühendisi',
    marital_status: 'Evli', telefon: '0532 000 00 02', email: 'mert@ornek.test',
    sunum_sorunu: 'OKB, Bulaşma obsesyonu, Yıkama kompulsiyonu',
    hedefler: 'Kompulsiyonları azaltmak; günlük işlevselliği geri kazanmak',
  },
  formulation: {
    presenting_problem: 'Bulaşma obsesyonları ve yıkama kompulsiyonları\nKontrol etme davranışları\nGünlük rutinde aşırı zaman kaybı',
    client_goal: 'El yıkama süremi normale döndürmek\nİşe geç kalmamak',
    therapist_goal: 'ERP ile kompulsif döngüyü kırmak\nBelirsizliğe tahammülü artırmak',
    narrative: 'Kapı koluna dokunduğunda zihnine “ya hastalık bulaştıysa” düşüncesi geliyor; yıkama onu anlık rahatlatıyor ama ertesi gün kaygı daha erken başlıyor.',
    clinical_notes: 'ERP hiyerarşisi danışanla birlikte oluşturuldu. Eşi süreç hakkında bilgilendirildi, güvence verme azaltılıyor.',
    rupture_notes: '',
    predispozan: 'Ailede kaygı bozukluğu öyküsü; titizlik üzerine kurulu ev ortamı',
    presipitan: 'Pandemi dönemi hijyen vurgusu; iş yerinde sağlık kaygısı',
    perpetuan: 'Yıkama ve güvence arama kısa vadede kaygıyı düşürüp obsesyonu pekiştiriyor',
    protektif: 'Yüksek zekâ ve motivasyon; destekleyici eş; iş güvencesi',
    temel_inanclar: 'Tehlikeyi önlemekten ben sorumluyum',
    ara_inanclar: 'Eğer kontrol etmezsem kötü bir şey olur ve suçlu ben olurum',
    basa_cikma: 'Tekrarlı yıkama, kontrol etme, kaçınma, güvence arama',
    otomatik_dusunceler: 'Ya hastalık bulaştıysa; temiz olmazsam birine zarar veririm',
    duygu_bedensel: 'Kaygı, tiksinti; ellerde gerginlik, huzursuzluk',
    davranislar: 'Uzun süre el yıkama, kapı koluna dokunmama, eşinden güvence isteme',
  },
  flexibility: { defusion: 4, acceptance: 3, present_moment: 5, self_as_context: 4, values_clarity: 6, committed_action: 5 },
  items: {
    value: ['Aile', 'Üretkenlik', 'Sağlık (esnek)'],
    strength: ['Analitik düşünme', 'Yüksek motivasyon', 'Eş desteği'],
    barrier_thought: ['“Bulaştıysa sorumlusu benim”', '“Kontrol etmezsem felaket olur”'],
    barrier_emotion: ['Tiksinti', 'Belirsizlik kaygısı'],
    control_strategy: ['Tekrarlı el yıkama', 'Eşten güvence isteme'],
    intervention_done: ['ERP psikoeğitimi', 'Maruz bırakma hiyerarşisi'],
    intervention_planned: ['Kapı koluna dokunup yıkamayı geciktirme (ERP)'],
    action_step: ['El yıkamayı 20 sn ile sınırla'],
    supervision_question: ['Güvence verme döngüsünü eşle birlikte nasıl azaltırız?'],
  },
  seanslar: [
    { tarih: '2026-03-21', tip: 'anamnez', notu: { ruhHali: 3, seansOdagi: 'Anamnez & OKB değerlendirme', gundemMaddeleri: 'Obsesyon-kompulsiyon haritası', kullanilanTeknikler: ['Klinik görüşme', 'Y-BOCS'], gelisimGozlemi: 'İçgörü iyi; tedaviye motive.', evOdevi: 'Kompulsiyon günlüğü', riskDegerlendirme: 'yok' } },
    { tarih: '2026-04-04', notu: { ruhHali: 5, seansOdagi: 'ERP psikoeğitimi', gundemMaddeleri: 'Döngünün açıklanması', kullanilanTeknikler: ['Psikoeğitim', 'Bilişsel Yeniden Yapılandırma'], gelisimGozlemi: 'Güvenlik sinyallerini fark etmeye başladı.', evOdevi: 'Hafta içinde 1 kez yıkamayı 10 sn geciktir', riskDegerlendirme: 'yok' } },
    { tarih: '2026-05-02', notu: { ruhHali: 6, seansOdagi: 'İlk maruz bırakma', gundemMaddeleri: 'Kapı kolu egzersizi', kullanilanTeknikler: ['ERP', 'SUDS izleme'], gelisimGozlemi: 'SUDS 8→5 düştü; yıkamayı erteleyebildi.', evOdevi: 'Günlük 1 ERP egzersizi', riskDegerlendirme: 'yok' } },
  ],
});

// ─────────────────────────────────────────────────────────────────────
// ÖRNEK 3 — Selin Aydın · Karmaşık yas · CFT
// ─────────────────────────────────────────────────────────────────────
seedClient({
  client: {
    alias: 'Selin Aydın', age: 41, gender: 'Kadın', occupation: 'Öğretmen',
    marital_status: 'Evli', telefon: '0532 000 00 03', email: 'selin@ornek.test',
    sunum_sorunu: 'Karmaşık yas, Suçluluk, Anlam kaybı',
    hedefler: 'Kayıpla bağ kurarken hayata yeniden katılmak',
  },
  formulation: {
    presenting_problem: 'Annenin kaybı sonrası yoğun yas (6. ay)\nSuçluluk ve “yeterince yapmadım” düşüncesi\nSosyal geri çekilme ve anlam kaybı',
    client_goal: 'Anneme dair anıları acı vermeden anabilmek\nİşime ve arkadaşlarıma geri dönmek',
    therapist_goal: 'Şefkat odaklı çalışmayla öz-eleştiriyi yumuşatmak\nYas sürecini anlam çerçevesine taşımak',
    narrative: 'Annesinin elini son tuttuğu anı tekrar tekrar yaşıyor; “keşke daha çok zaman ayırsaydım” cümlesi her sabah onu uyandırıyor.',
    clinical_notes: 'Şefkat egzersizlerine başlangıçta direnç vardı; güvenli yer imgelemiyle yumuşadı. İttifak sıcak.',
    rupture_notes: '',
    predispozan: 'Erken sorumluluk yüklenen çocukluk; “güçlü olmalıyım” öğrenmesi',
    presipitan: 'Annenin beklenmedik vefatı; cenaze sonrası destek azalması',
    perpetuan: 'Suçluluk ruminasyonu ve sosyal kaçınma yası dondurup sürdürüyor',
    protektif: 'Güçlü değerler; eşi ve kız kardeşinin desteği; mesleki anlam',
    temel_inanclar: 'Sevdiklerimi korumaktan ben sorumluyum',
    ara_inanclar: 'Eğer üzülmeyi bırakırsam onu unutmuş olurum',
    basa_cikma: 'Ruminasyon, sosyal kaçınma, duyguları bastırma',
    otomatik_dusunceler: 'Yeterince yapmadım; onu yüzüstü bıraktım',
    duygu_bedensel: 'Keder, suçluluk; göğüste ağırlık, yorgunluk',
    davranislar: 'İşe ara verme, davetleri reddetme, fotoğraflara bakmaktan kaçınma',
  },
  flexibility: { defusion: 5, acceptance: 5, present_moment: 4, self_as_context: 6, values_clarity: 7, committed_action: 4 },
  items: {
    value: ['Bağlılık', 'Şefkat', 'Anlam', 'Aile'],
    strength: ['Derin değer netliği', 'Güçlü sosyal destek', 'Mesleki adanmışlık'],
    barrier_thought: ['“Yeterince yapmadım”', '“Üzülmeyi bırakırsam unuturum”'],
    barrier_emotion: ['Suçluluk', 'Derin keder'],
    control_strategy: ['Ruminasyon', 'Anılardan kaçınma'],
    intervention_done: ['Güvenli yer imgelemi', 'Şefkatli benlik egzersizi'],
    intervention_planned: ['Anne ile sembolik veda mektubu'],
    action_step: ['Haftada 1 sosyal temas kur'],
    supervision_question: ['Şefkat çalışması yası bastırmaya değil işlemeye hizmet ediyor mu?'],
  },
  seanslar: [
    { tarih: '2026-02-15', tip: 'anamnez', notu: { ruhHali: 2, seansOdagi: 'Anamnez & yas değerlendirme', gundemMaddeleri: 'Kayıp öyküsü', kullanilanTeknikler: ['Klinik görüşme'], gelisimGozlemi: 'Karmaşık yas ölçütleri mevcut; risk düşük.', evOdevi: 'Duygu günlüğü', riskDegerlendirme: 'yok' } },
    { tarih: '2026-03-14', notu: { ruhHali: 3, seansOdagi: 'Şefkat odaklı giriş', gundemMaddeleri: 'Öz-eleştirinin işlevi', kullanilanTeknikler: ['Şefkatli benlik', 'Güvenli yer imgelemi'], gelisimGozlemi: 'Başlangıç direnci imgelemle yumuşadı.', evOdevi: 'Günde 2 dk şefkatli nefes', riskDegerlendirme: 'yok' } },
    { tarih: '2026-04-18', notu: { ruhHali: 4, seansOdagi: 'Anılarla bağ kurma', gundemMaddeleri: 'Suçluluk ruminasyonu', kullanilanTeknikler: ['Boş sandalye', 'Değer köprüsü'], gelisimGozlemi: 'Bir fotoğrafa acıyla da olsa bakabildi.', evOdevi: 'Anneyle ilgili 1 olumlu anıyı yaz', riskDegerlendirme: 'yok' } },
  ],
});

console.log('\nTamamlandı.');
db.close();
