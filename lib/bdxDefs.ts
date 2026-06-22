/* ═════════════════════════════════════════════════════════════════
   BDX_DEFS — 23 bozukluk döngüsü modelinin veri tanımları (ESM port).
   bdxEngine.ts (renderBdx) tarafından çizilir.
   • Kutu/ok TOPOLOJİSİ ve fieldKey'ler kaynak dosyayla birebir korunur.
   • Görsel dil tek tutarlı motordan gelir: monokrom antrasit + nötr,
     forward ok = düz / feedback ok = kesik, tek ok başı, plastik gölge.
   • variant: 'accent' (koyu plastik dolgulu vurgu düğümü) · 'soft' (gri) ·
     boş (beyaz). dashed:true → kesik kenarlık.

   Kaynak: design_handoff_bozukluk_dongusu/bdx-defs.js (window.BDX_DEFS)
   ════════════════════════════════════════════════════════════════ */

export type BdxNode = {
  id?: string;            // edge referansı
  key?: string;           // fieldKey — VARSA düzenlenebilir textarea taşır
  x: number; y: number; w: number; h: number;
  shape?: 'rect' | 'pill' | 'oval' | 'circle';   // varsayılan rect
  variant?: 'accent' | 'soft';
  dashed?: boolean;
  rx?: number;
  lblSize?: number;
  title: string;
  sub?: string;
  ph?: string;
  desc?: string;          // kavram açıklaması — doldurma kartının siyah başlığında gösterilir
  _id?: string;           // motor içi geçici kimlik
};

export type BdxEdge = {
  from: string; to: string;
  kind?: 'feedback';
  dashed?: boolean;
  fromSide?: 't' | 'b' | 'l' | 'r';
  toSide?: 't' | 'b' | 'l' | 'r';
  fromAt?: number; toAt?: number;
  route?: 'wallL' | 'wallR' | 'wallB' | 'wallT' | 'curve';
  wall?: number; bow?: number;
  off?: number;
  bidir?: boolean;
};

export type DiagramDef = {
  vb: [number, number];
  max?: number;
  cite?: string;
  legend?: false;
  ring?: true;
  layout?: 'formula';
  nodes?: BdxNode[];
  edges?: BdxEdge[];
  _ringC?: [number, number];   // motor içi ön bellek
};

export const BDX_DEFS: Record<string, DiagramDef> = {

  /* 1 ── Sosyal Kaygı (Clark & Wells 1995) ─────────────────────── */
  'sosyal-kaygi': {
    vb: [720, 770], max: 660,
    cite: 'Clark & Wells (1995) — Sosyal Kaygı BDT Modeli',
    nodes: [
      { id: 'A', key: 'sa_situation',  x: 228, y: 22,  w: 264, h: 74, shape: 'pill',
        title: 'Sosyal Durum', ph: 'Durumu belirtin…',
        desc: 'Kaygının tetiklendiği sosyal bağlam — danışanın değerlendirilebileceğini ya da izlendiğini hissettiği ortam.' },
      { id: 'B', key: 'sa_assumptions', x: 200, y: 150, w: 320, h: 74, shape: 'rect',
        title: 'Varsayımların Aktivasyonu', ph: 'Etkinleşen erken dönem varsayımlar…',
        desc: 'Erken dönemde oluşan koşullu inanç ve kuralların o anda devreye girmesi (ör. "Hata yaparsam reddedilirim").' },
      { id: 'C', key: 'sa_threat', x: 190, y: 272, w: 340, h: 84, shape: 'rect',
        title: 'Sosyal Tehdit Algısı', sub: '(Olumsuz Otomatik Düşünceler)', ph: 'Otomatik düşünceler…',
        desc: 'Durumun tehlike olarak yorumlanması; o ana özgü olumsuz otomatik düşüncelerin belirmesi.' },
      { id: 'D', key: 'sa_processing', x: 176, y: 408, w: 368, h: 92, shape: 'oval', variant: 'accent',
        title: 'Kendini Sosyal Nesne Olarak İşlemleme', ph: 'İçeriden izleme, imaj…',
        desc: 'Dikkatin dışarıdan kendine/içsel imaja kayması; kişinin kendini başkalarının gözünden olumsuz bir nesne gibi izlemesi.' },
      { id: 'E', key: 'sa_safety', x: 26,  y: 588, w: 250, h: 86, shape: 'rect',
        title: 'Güvenlik Arama Davranışları', ph: 'Kaçınma, güvenlik sinyalleri…',
        desc: 'Kaygıyı azaltmak ya da korkulan sonucu önlemek için yapılan kaçınma ve önlemler (göz teması kurmama, prova etme, susma). Kısa vadede rahatlatır; uzun vadede kaygıyı sürdürür.' },
      { id: 'F', key: 'sa_symptoms', x: 444, y: 588, w: 250, h: 86, shape: 'rect',
        title: 'Somatik & Bilişsel Semptomlar', ph: 'Titreme, yüz kızarması…',
        desc: 'Kaygının bedensel ve zihinsel belirtileri (titreme, yüz kızarması, kalp çarpıntısı, zihin boşalması, odak kaybı).' },
    ],
    edges: [
      { from: 'A', to: 'B', fromSide: 'b', toSide: 't' },
      { from: 'B', to: 'C', fromSide: 'b', toSide: 't' },
      { from: 'C', to: 'D', off: 11 },
      { from: 'D', to: 'C', off: 11 },
      { from: 'D', to: 'E', toSide: 't' },
      { from: 'D', to: 'F', toSide: 't' },
      { from: 'E', to: 'F', fromSide: 'r', toSide: 'l' },
      { from: 'E', to: 'A', kind: 'feedback', route: 'wallL', fromSide: 'l', toSide: 'l' },
      { from: 'F', to: 'A', kind: 'feedback', route: 'wallR', fromSide: 'r', toSide: 'r' },
    ],
  },

  /* 2 ── OKB Döngüsü (Salkovskis) ──────────────────────────────── */
  'okb': {
    vb: [760, 660], max: 720,
    cite: 'OKB — Salkovskis Bilişsel Döngü Modeli',
    nodes: [
      { id: 'AVO', key: 'ocd_avoidance', x: 18,  y: 20, w: 150, h: 56, title: 'Kaçınma', ph: '…' },
      { id: 'WRL', key: 'ocd_world',     x: 186, y: 20, w: 150, h: 56, title: 'Dış / İç Dünya', ph: '…' },
      { id: 'ATT', key: 'ocd_attention', x: 354, y: 20, w: 150, h: 56, title: 'Dikkat', ph: '…' },
      { id: 'TRG', key: 'ocd_trigger',   x: 540, y: 20, w: 200, h: 56, variant: 'accent',
        title: 'Tetikleyici', sub: 'İç / Dış Uyaranlar', ph: '…' },
      { id: 'OBS', key: 'ocd_obsession', x: 560, y: 150, w: 180, h: 64,
        title: 'Tehlike Algısı', sub: '(Obsesyon)', ph: '…' },
      { id: 'SEC', key: 'ocd_sec_appraisal', x: 560, y: 252, w: 180, h: 60, title: 'İkincil Değerlendirme', ph: '…' },
      { id: 'DSR', key: 'ocd_distress_right', x: 560, y: 350, w: 180, h: 54, title: 'Sıkıntı', ph: '…' },
      { id: 'SUP', key: 'ocd_suppression', x: 285, y: 168, w: 220, h: 70, variant: 'soft', dashed: true,
        title: 'Düşünce Baskılama', ph: '…' },
      { id: 'CMP', key: 'ocd_compulsion', x: 430, y: 470, w: 220, h: 66, variant: 'accent',
        title: 'Nötralizasyon — Kompülsiyon', ph: '…' },
      { id: 'REL', key: 'ocd_relief', x: 120, y: 472, w: 200, h: 60, title: 'Rahatlama', ph: '…' },
      { id: 'NEU', key: 'ocd_neut_appraisal', x: 20, y: 350, w: 210, h: 64, title: 'Nötralizasyonla İlgili Değerlendirme', ph: '…' },
      { id: 'DSL', key: 'ocd_distress_left', x: 20, y: 250, w: 210, h: 54, title: 'Sıkıntı', ph: '…' },
    ],
    edges: [
      { from: 'AVO', to: 'WRL', fromSide: 'r', toSide: 'l' },
      { from: 'WRL', to: 'ATT', fromSide: 'r', toSide: 'l' },
      { from: 'ATT', to: 'TRG', fromSide: 'r', toSide: 'l' },
      { from: 'TRG', to: 'OBS', fromSide: 'b', toSide: 't' },
      { from: 'OBS', to: 'SEC', fromSide: 'b', toSide: 't' },
      { from: 'SEC', to: 'DSR', fromSide: 'b', toSide: 't' },
      { from: 'DSR', to: 'CMP', fromSide: 'b', toSide: 'r' },
      { from: 'CMP', to: 'REL', fromSide: 'l', toSide: 'r' },
      { from: 'REL', to: 'OBS', kind: 'feedback', route: 'wallL', fromSide: 'l', toSide: 'l' },
      { from: 'SUP', to: 'OBS', dashed: true, fromSide: 'r', toSide: 'l' },
      { from: 'NEU', to: 'SUP', fromSide: 't', toSide: 'b', fromAt: 0.5, toAt: 0.3 },
      { from: 'DSL', to: 'NEU', fromSide: 'b', toSide: 't' },
      { from: 'REL', to: 'DSL', kind: 'feedback', fromSide: 't', toSide: 'b' },
    ],
  },

  /* 3 ── Depresyon — Gelişimsel (dikey akış) ───────────────────── */
  'depresyon-gelisimsel': {
    vb: [520, 560], max: 500,
    cite: 'Depresyon — Gelişimsel Formülasyon (Beck)',
    legend: false,
    nodes: [
      { id: 'N1', key: 'gen_early_exp',         x: 60, y: 16,  w: 400, h: 70, title: 'Erken Yaşantılar', ph: '…' },
      { id: 'N2', key: 'gen_core_beliefs',      x: 60, y: 122, w: 400, h: 78, title: 'İşlevsel Olmayan İnançlar', sub: '(Temel + Ara İnançlar)', ph: '…' },
      { id: 'N3', key: 'gen_critical_incidents', x: 60, y: 236, w: 400, h: 70, title: 'Kritik Olaylar', ph: '…' },
      { id: 'N4', key: 'gen_negative_thoughts',  x: 60, y: 342, w: 400, h: 70, title: 'Olumsuz Otomatik Düşünceler', ph: '…' },
      { id: 'N5', key: 'gen_symptoms',           x: 60, y: 448, w: 400, h: 80, variant: 'accent',
        title: 'Belirtiler', sub: 'Davranışsal · Bilişsel · Duygusal · Somatik', ph: '…' },
    ],
    edges: [
      { from: 'N1', to: 'N2', fromSide: 'b', toSide: 't' },
      { from: 'N2', to: 'N3', fromSide: 'b', toSide: 't' },
      { from: 'N3', to: 'N4', fromSide: 'b', toSide: 't' },
      { from: 'N4', to: 'N5', fromSide: 'b', toSide: 't' },
    ],
  },

  /* 4 ── Depresyon Döngüsü (5 bileşen + merkez) ────────────────── */
  'depresyon-dongu': {
    vb: [680, 560], max: 640,
    cite: 'Depresyonun Karşılıklı Besleyen Beş Bileşeni',
    legend: false,
    nodes: [
      { id: 'HUB', x: 268, y: 232, w: 144, h: 96, shape: 'circle', variant: 'accent', title: 'Depresyon' },
      { id: 'PHY', key: 'dep_physiology',  x: 150, y: 30,  w: 170, h: 66, title: 'Fizyoloji', ph: '…' },
      { id: 'EMO', key: 'dep_emotion',     x: 360, y: 30,  w: 170, h: 66, title: 'Duygu', ph: '…' },
      { id: 'ENV', key: 'dep_environment', x: 26,  y: 244, w: 170, h: 66, title: 'Çevre', ph: '…' },
      { id: 'COG', key: 'dep_cognition',   x: 484, y: 244, w: 170, h: 66, title: 'Biliş', ph: '…' },
      { id: 'BEH', key: 'dep_behavior',    x: 255, y: 466, w: 170, h: 66, title: 'Davranış', ph: '…' },
    ],
    edges: [
      { from: 'HUB', to: 'PHY', bidir: true }, { from: 'HUB', to: 'EMO', bidir: true },
      { from: 'HUB', to: 'ENV', bidir: true }, { from: 'HUB', to: 'COG', bidir: true },
      { from: 'HUB', to: 'BEH', bidir: true },
    ],
  },

  /* 5 ── Panik (Clark 1986) ────────────────────────────────────── */
  'panik': {
    vb: [720, 600], max: 660,
    cite: 'Clark (1986) — Panik Bozukluğu Bilişsel Modeli',
    nodes: [
      { id: 'A', key: 'panic_trigger', x: 220, y: 18, w: 280, h: 60, shape: 'pill',
        title: 'Spontan Tetikleyici', ph: 'İç / dış uyaran…' },
      { id: 'B', key: 'panic_thought', x: 200, y: 122, w: 320, h: 64, title: 'Otomatik Düşünce', ph: '"Öleceğim / kontrolümü kaybediyorum"' },
      { id: 'C', key: 'panic_emotion', x: 200, y: 230, w: 320, h: 60, title: 'Duygu', ph: 'Yoğun korku, panik…' },
      { id: 'D', key: 'panic_body', x: 175, y: 338, w: 370, h: 68, title: 'Bedensel Duyumlar', ph: 'Çarpıntı, nefes darlığı…' },
      { id: 'E', key: 'panic_catastrophe', x: 155, y: 460, w: 410, h: 80, shape: 'pill', variant: 'accent',
        title: 'Katastrofik Yorumlama', sub: '(felaketleştirme)', ph: '"Bu kalp krizi" / "Bayılacağım"' },
      { id: 'ANS', x: 556, y: 330, w: 150, h: 84, variant: 'soft', dashed: true,
        title: 'Savaş-Kaç-Don', sub: 'Sempatik sinir sistemi aktivasyonu' },
    ],
    edges: [
      { from: 'A', to: 'B', fromSide: 'b', toSide: 't' },
      { from: 'B', to: 'C', fromSide: 'b', toSide: 't' },
      { from: 'C', to: 'D', fromSide: 'b', toSide: 't' },
      { from: 'D', to: 'E', fromSide: 'b', toSide: 't' },
      { from: 'ANS', to: 'D', dashed: true, fromSide: 'l', toSide: 'r' },
      { from: 'E', to: 'D', kind: 'feedback', route: 'wallL', wall: 30, fromSide: 'l', toSide: 'l' },
      { from: 'E', to: 'C', kind: 'feedback', route: 'wallL', wall: 13, fromSide: 'l', toSide: 'l' },
    ],
  },

  /* 6 ── YAB Formülasyonu (3 sütun) ────────────────────────────── */
  'yab': {
    vb: [720, 420], max: 680,
    cite: 'Yaygın Anksiyete Bozukluğu — Formülasyon',
    legend: false,
    nodes: [
      { id: 'L1', key: 'yab_worry_topics', x: 16, y: 28,  w: 200, h: 78, title: 'Güncel Kaygılar / Kişisel Hedefler', ph: '…' },
      { id: 'L2', key: 'yab_triggers',     x: 16, y: 130, w: 200, h: 88, title: 'Endişeyi Tetikleyen İç ve Dış Faktörler', ph: '…' },
      { id: 'CORE', key: 'yab_core_worry', x: 258, y: 150, w: 204, h: 96, variant: 'accent',
        title: 'Esas Endişe İçeriği ve Kaygı Belirtileri', ph: '…' },
      { id: 'R1', key: 'yab_meta_cognition', x: 504, y: 22,  w: 200, h: 78, title: 'Üst-bilişsel Değerlendirme Profili', ph: '…' },
      { id: 'R2', key: 'yab_control_strategy', x: 504, y: 122, w: 200, h: 78, title: 'Endişeyi Kontrol Etme Stratejisi', ph: '…' },
      { id: 'R3', key: 'yab_negative_orientation', x: 504, y: 222, w: 200, h: 88, title: 'Olumsuz Sorun Yönelimi ve Güvence Arama', ph: '…' },
    ],
    edges: [
      { from: 'L1', to: 'CORE', fromSide: 'r', toSide: 'l', toAt: 0.32 },
      { from: 'L2', to: 'CORE', fromSide: 'r', toSide: 'l', toAt: 0.7 },
      { from: 'CORE', to: 'R1', fromSide: 'r', toSide: 'l' },
      { from: 'CORE', to: 'R2', fromSide: 'r', toSide: 'l' },
      { from: 'CORE', to: 'R3', fromSide: 'r', toSide: 'l' },
    ],
  },

  /* 7 ── Çocuk Depresyon (5'li halka) ──────────────────────────── */
  'cocuk-depresyon': {
    vb: [720, 600], max: 660,
    cite: 'Çocuk Depresyonu — İnaktivasyon Kısır Döngüsü',
    ring: true,
    nodes: [
      { id: 'R0', key: 'cd_dep',  x: 294, y: 46,  w: 132, h: 132, shape: 'circle', variant: 'accent', title: 'Depresyon' },
      { id: 'R1', key: 'cd_enrj', x: 468, y: 186, w: 132, h: 132, shape: 'circle', title: 'Düşük Enerji', sub: 'Yorgunluk · Motivasyon' },
      { id: 'R2', key: 'cd_dnc',  x: 402, y: 390, w: 132, h: 132, shape: 'circle', title: 'Olumsuz Düşünce', sub: '/ İnançlar' },
      { id: 'R3', key: 'cd_cklm', x: 186, y: 390, w: 132, h: 132, shape: 'circle', title: 'Sosyal Çekilme', sub: 'Kış uykusu · Düşük aktivasyon' },
      { id: 'R4', key: 'cd_uznt', x: 120, y: 186, w: 132, h: 132, shape: 'circle', title: 'Üzüntü', sub: 'Suçluluk · Umutsuzluk' },
    ],
    edges: [
      { from: 'R0', to: 'R1' }, { from: 'R1', to: 'R2' }, { from: 'R2', to: 'R3' },
      { from: 'R3', to: 'R4' }, { from: 'R4', to: 'R0' },
    ],
  },

  /* 8 ── Ayrılık Kaygısı (Çocuk + Ebeveyn → Sonuçlar) ──────────── */
  'akb': {
    vb: [700, 490], max: 660,
    cite: 'Ayrılık Kaygısı Bozukluğu — Çocuk-Ebeveyn Etkileşim Modeli',
    legend: false,
    nodes: [
      { id: 'CH', key: 'akb_cocuk',   x: 20,  y: 20,  w: 270, h: 200, title: 'Çocuk', ph: 'Aşırı talepkâr, bunaltıcı, tatminsiz…' },
      { id: 'PA', key: 'akb_ebeveyn', x: 410, y: 20,  w: 270, h: 200, title: 'Ebeveyn', ph: 'Aşırı koruyucu, tutarsız…' },
      { id: 'RE', key: 'akb_sonuc',   x: 165, y: 300, w: 370, h: 165, variant: 'accent',
        title: 'Sonuçlar', ph: 'Öfke patlamaları, çatışma, suçluluk…' },
    ],
    edges: [
      { from: 'CH', to: 'RE', fromSide: 'b', toSide: 't', toAt: 0.3 },
      { from: 'PA', to: 'RE', fromSide: 'b', toSide: 't', toAt: 0.7 },
    ],
  },

  /* 9 ── Anksiyete Formülü (motor özel düzen) ──────────────────── */
  'anksiyete-formul': {
    vb: [680, 300], max: 680, layout: 'formula',
    cite: 'Anksiyete = (Tehlikenin Büyüklüğü × Olasılığı) / (Başa Çıkma + İmkânlar)',
  },

  /* 10 ── Özgül Fobi (Davis, Ollendick & Öst) ──────────────────── */
  'ozgul-fobi': {
    vb: [680, 745], max: 640,
    cite: 'Özgül Fobi Modeli — Davis, Ollendick & Öst',
    nodes: [
      { id: 'A', key: 'of_nesne',      x: 200, y: 15,  w: 280, h: 56, title: 'Tehlikeli Algılanan Nesne / Durum', ph: '…' },
      { id: 'B', key: 'of_kacinma',    x: 16,  y: 16,  w: 150, h: 54, title: 'Kaçınma', ph: '…' },
      { id: 'C', key: 'of_karsilasma', x: 200, y: 122, w: 280, h: 56, title: 'Fobik Nesne ile Karşılaşma', ph: '…' },
      { id: 'D', key: 'of_felaket',    x: 144, y: 238, w: 172, h: 56, title: 'Felaket Düşünceleri', ph: '…' },
      { id: 'E', key: 'of_fiziksel',   x: 362, y: 238, w: 172, h: 56, title: 'Fiziksel Uyarılma', ph: '…' },
      { id: 'F', key: 'of_inanma',     x: 8,   y: 228, w: 120, h: 78, shape: 'oval', variant: 'soft', title: 'Güçlü Biçimde İnanma' },
      { id: 'G', key: 'of_guvdav',     x: 172, y: 356, w: 310, h: 56, title: 'Kaçma / Güvenlik Davranışları', ph: '…' },
      { id: 'H', key: 'of_curutme',    x: 500, y: 344, w: 168, h: 80, shape: 'oval', variant: 'soft', title: 'Felaket Çürütmesi Engellenir' },
      { id: 'I', key: 'of_felaket2',   x: 172, y: 466, w: 310, h: 56, title: 'Felaket Oluşmaz · Kaygı Azalır', ph: '…' },
      { id: 'J', key: 'of_sonuc',      x: 172, y: 576, w: 310, h: 64, title: 'Çıkarılan Sonuç: Kaçma Felaketi Önledi', ph: '…' },
      { id: 'K', key: 'of_fobi',       x: 172, y: 686, w: 310, h: 56, variant: 'accent', title: 'Fobi Devam Ediyor', ph: '…' },
    ],
    edges: [
      { from: 'A', to: 'B', fromSide: 'l', toSide: 'r' },
      { from: 'A', to: 'C', fromSide: 'b', toSide: 't' },
      { from: 'C', to: 'D', fromSide: 'b', toSide: 't', fromAt: 0.4 },
      { from: 'C', to: 'E', fromSide: 'b', toSide: 't', fromAt: 0.6 },
      { from: 'D', to: 'F', fromSide: 'l', toSide: 'r' },
      { from: 'D', to: 'G', fromSide: 'b', toSide: 't', toAt: 0.36 },
      { from: 'E', to: 'G', fromSide: 'b', toSide: 't', toAt: 0.64 },
      { from: 'G', to: 'H', fromSide: 'r', toSide: 'l' },
      { from: 'G', to: 'I', fromSide: 'b', toSide: 't' },
      { from: 'I', to: 'J', fromSide: 'b', toSide: 't' },
      { from: 'J', to: 'K', fromSide: 'b', toSide: 't' },
      { from: 'H', to: 'K', kind: 'feedback', route: 'wallR', wall: 662, fromSide: 'r', toSide: 'r' },
    ],
  },

  /* 11 ── Yeme Sorunları (Fairburn tanı-üstü) ──────────────────── */
  'yeme-sorunlari': {
    vb: [680, 560], max: 640,
    cite: 'Yeme Bozukluğu — Tanı Üstü Bilişsel Model (Fairburn vd.)',
    nodes: [
      { id: 'A', key: 'ys_deger',  x: 190, y: 15,  w: 300, h: 64, variant: 'accent',
        title: 'Şekil, Kilo ve Kontrolün Aşırı Değerlendirilmesi', ph: '…' },
      { id: 'B', key: 'ys_diyet',  x: 190, y: 140, w: 300, h: 72, title: 'Katı Diyet / Kilo Kontrolü', ph: '…' },
      { id: 'C', key: 'ys_tikin',  x: 190, y: 278, w: 300, h: 58, title: 'Tıkınırcasına Yeme', ph: '…' },
      { id: 'D', key: 'ys_telafi', x: 190, y: 410, w: 300, h: 58, title: 'Telafi Edici Kusma / Laksatif', ph: '…' },
      { id: 'E', key: 'ys_olay',   x: 16,  y: 265, w: 150, h: 84, variant: 'soft', dashed: true,
        title: 'Olaylar & Duygu Durum Değişikliği', ph: '…' },
    ],
    edges: [
      { from: 'A', to: 'B', fromSide: 'b', toSide: 't' },
      { from: 'B', to: 'C', fromSide: 'b', toSide: 't' },
      { from: 'C', to: 'D', off: 11 },
      { from: 'D', to: 'C', off: 11 },
      { from: 'E', to: 'C', fromSide: 'r', toSide: 'l' },
      { from: 'D', to: 'B', kind: 'feedback', route: 'wallR', wall: 560, fromSide: 'r', toSide: 'r' },
      { from: 'D', to: 'A', kind: 'feedback', route: 'wallR', wall: 600, fromSide: 'r', toSide: 'r' },
    ],
  },

  /* 12 ── İstek / Mutluluk Döngüsü (üçgen) ─────────────────────── */
  'istek-mutluluk': {
    vb: [680, 500], max: 620,
    cite: 'İstek / Mutluluk Döngüsü — Davranışsal Aktivasyon',
    ring: true,
    nodes: [
      { id: 'A', key: 'im_yapmak',   x: 70,  y: 78,  w: 200, h: 108, shape: 'oval', title: 'Bir Şey Yapma', ph: '…' },
      { id: 'B', key: 'im_mutluluk', x: 410, y: 78,  w: 200, h: 108, shape: 'oval', title: 'Mutluluk / Hoşlanma', ph: '…' },
      { id: 'C', key: 'im_istek',    x: 240, y: 320, w: 200, h: 108, shape: 'oval', variant: 'accent', title: 'İstek', ph: '…' },
    ],
    edges: [
      { from: 'A', to: 'B' }, { from: 'B', to: 'C' }, { from: 'C', to: 'A' },
    ],
  },

  /* 13 ── Düşünce-Duygu-Davranış (bilişsel üçgen, çift yön) ────── */
  'ddd-basit': {
    vb: [680, 520], max: 620,
    cite: 'Bilişsel Üçgen — Düşünce, Duygu ve Davranış Etkileşimi',
    legend: false,
    nodes: [
      { id: 'T', key: 'ddd_dusunce',  x: 220, y: 40,  w: 240, h: 110, shape: 'oval', variant: 'accent', title: 'Düşünce', ph: '…' },
      { id: 'D', key: 'ddd_duygu',    x: 410, y: 320, w: 240, h: 110, shape: 'oval', title: 'Duygu', ph: '…' },
      { id: 'B', key: 'ddd_davranis', x: 30,  y: 320, w: 240, h: 110, shape: 'oval', title: 'Davranış', ph: '…' },
      { id: 'AT', key: 'ddd_ann_dusunce',  x: 470, y: 56,  w: 200, h: 64, variant: 'soft', title: 'Örn. Düşünce', ph: '"Beceremiyorum…"' },
      { id: 'AD', key: 'ddd_ann_duygu',    x: 470, y: 444, w: 200, h: 64, variant: 'soft', title: 'Örn. Duygu', ph: 'Üzüntü, kaygı…' },
      { id: 'AB', key: 'ddd_ann_davranis', x: 10,  y: 444, w: 200, h: 64, variant: 'soft', title: 'Örn. Davranış', ph: 'Çekilme, kaçınma…' },
    ],
    edges: [
      { from: 'T', to: 'D', bidir: true },
      { from: 'D', to: 'B', bidir: true },
      { from: 'B', to: 'T', bidir: true },
    ],
  },

  /* 14 ── AKB / Okul Reddi Komplex (hub + spoke) ───────────────── */
  'akb-komplex': {
    vb: [700, 620], max: 660,
    cite: 'Ayrılık Kaygısı / Okul Reddi — Komplex Formülasyon',
    legend: false,
    nodes: [
      { id: 'HUB', key: 'akbk_merkez', x: 220, y: 220, w: 260, h: 100, variant: 'accent',
        title: 'Ayrılık Kaygısı / Okul Reddi Problem Alanları', ph: '…' },
      { id: 'S0', key: 'akbk_algi',   x: 280, y: 30,  w: 140, h: 68, title: 'Algı', ph: '…' },
      { id: 'S1', key: 'akbk_bilis',  x: 500, y: 110, w: 140, h: 68, title: 'Biliş', ph: '…' },
      { id: 'S2', key: 'akbk_duygu',  x: 500, y: 300, w: 140, h: 68, title: 'Duygu', ph: '…' },
      { id: 'S3', key: 'akbk_beden',  x: 280, y: 392, w: 140, h: 68, title: 'Beden', ph: '…' },
      { id: 'S4', key: 'akbk_dav',    x: 60,  y: 300, w: 140, h: 68, title: 'Davranış', ph: '…' },
      { id: 'S5', key: 'akbk_kisilr', x: 60,  y: 110, w: 140, h: 68, title: 'Kişilerarası Uyum', ph: '…' },
      { id: 'OVAL', x: 205, y: 520, w: 290, h: 76, shape: 'oval', variant: 'soft', title: 'Sekonder Kazançlar Belirginleşir' },
    ],
    edges: [
      { from: 'HUB', to: 'S0' }, { from: 'HUB', to: 'S1' }, { from: 'HUB', to: 'S2' },
      { from: 'HUB', to: 'S3' }, { from: 'HUB', to: 'S4' }, { from: 'HUB', to: 'S5' },
      { from: 'HUB', to: 'OVAL', kind: 'feedback', fromSide: 'b', toSide: 't' },
    ],
  },

  /* 15 ── Kaçınma & Öğrenme (McGrath & Walsh 2007) ─────────────── */
  'kacinma-ogrenme': {
    vb: [790, 430], max: 720,
    cite: 'Kaçınmanın Öğrenmeyi Baskılaması — McGrath & Walsh (2007)',
    nodes: [
      { id: 'T', key: 'ko_tetik',     x: 14,  y: 132, w: 110, h: 110, shape: 'circle', title: 'Tetikleyici Olay', ph: '…' },
      { id: 'A', key: 'ko_yorumlama', x: 152, y: 132, w: 144, h: 100, title: 'Tehdidin Yanlış Yorumlanması', ph: '…' },
      { id: 'B', key: 'ko_kaygi',     x: 322, y: 132, w: 144, h: 100, title: 'Kaygı / Korku', ph: '…' },
      { id: 'C', key: 'ko_kacinma',   x: 492, y: 132, w: 144, h: 100, variant: 'accent', title: 'Kaçınma ile Baş Etme', ph: '…' },
      { id: 'X', x: 654, y: 138, w: 128, h: 90, shape: 'oval', variant: 'soft', dashed: true, title: 'Düzeltici Deneyim Edinilemiyor' },
    ],
    edges: [
      { from: 'T', to: 'A', fromSide: 'r', toSide: 'l' },
      { from: 'A', to: 'B', fromSide: 'r', toSide: 'l' },
      { from: 'B', to: 'C', fromSide: 'r', toSide: 'l' },
      { from: 'C', to: 'X', fromSide: 'r', toSide: 'l' },
      { from: 'X', to: 'A', kind: 'feedback', route: 'wallB', wall: 352, fromSide: 'b', toSide: 'b' },
    ],
  },

  /* 16 ── YAB Basit Model ──────────────────────────────────────── */
  'yab-basit': {
    vb: [680, 640], max: 640,
    cite: 'Yaygın Anksiyete Bozukluğu — Basit Model',
    nodes: [
      { id: 'OA', x: 140, y: 22,  w: 400, h: 80, shape: 'oval', variant: 'soft', dashed: true, title: 'Kaygılanmazsam bununla baş edemem' },
      { id: 'RB', key: 'yabb_felaket', x: 170, y: 158, w: 340, h: 70, title: 'Felaket Sonuçları', ph: '…' },
      { id: 'OC', x: 140, y: 252, w: 400, h: 80, shape: 'oval', variant: 'soft', dashed: true, title: 'Düşüncelerimi kontrol edemezsem…' },
      { id: 'RD', key: 'yabb_kontrol', x: 170, y: 390, w: 340, h: 70, variant: 'accent', title: 'Kontrolümü Kaybediyorum / Delireceğim', ph: '…' },
      { id: 'B1', key: 'yabb_dav',     x: 20,  y: 510, w: 190, h: 110, title: 'Davranış', ph: '…' },
      { id: 'B2', key: 'yabb_dusunce', x: 245, y: 510, w: 190, h: 110, title: 'Düşünce Kontrolü', ph: '…' },
      { id: 'B3', key: 'yabb_duygu',   x: 470, y: 510, w: 190, h: 110, title: 'Duygu & Beden', ph: '…' },
    ],
    edges: [
      { from: 'OA', to: 'RB', fromSide: 'b', toSide: 't' },
      { from: 'RB', to: 'OC', fromSide: 'b', toSide: 't' },
      { from: 'OC', to: 'RD', fromSide: 'b', toSide: 't' },
      { from: 'RD', to: 'B1', fromSide: 'b', toSide: 't' },
      { from: 'RD', to: 'B2', fromSide: 'b', toSide: 't' },
      { from: 'RD', to: 'B3', fromSide: 'b', toSide: 't' },
      { from: 'B3', to: 'RB', kind: 'feedback', route: 'wallR', wall: 645, fromSide: 'r', toSide: 'r' },
    ],
  },

  /* 17 ── Hastalık Anksiyetesi (Warwick & Salkovskis 1990) ─────── */
  'hastalik-anksiyete': {
    vb: [680, 510], max: 640,
    cite: 'Hastalık Anksiyetesi — Warwick & Salkovskis (1990)',
    legend: false,
    nodes: [
      { id: 'A', key: 'ha_varsayim', x: 140, y: 15,  w: 400, h: 70, title: 'Önceki Varsayım-İnanç Aktive Olur', ph: '…' },
      { id: 'B', key: 'ha_dusunce',  x: 140, y: 140, w: 400, h: 70, title: 'Artan Olumsuz Düşünce ve İmgeler', ph: '…' },
      { id: 'C', key: 'ha_kaygi',    x: 140, y: 265, w: 400, h: 70, variant: 'accent', title: 'Kaygı Artışı', ph: '…' },
      { id: 'B1', key: 'ha_dav',   x: 15,  y: 390, w: 150, h: 100, title: 'Davranış', ph: '…' },
      { id: 'B2', key: 'ha_duygu', x: 180, y: 390, w: 150, h: 100, title: 'Duygu', ph: '…' },
      { id: 'B3', key: 'ha_kog',   x: 345, y: 390, w: 150, h: 100, title: 'Kognitif', ph: '…' },
      { id: 'B4', key: 'ha_fiz',   x: 510, y: 390, w: 150, h: 100, title: 'Fizyolojik', ph: '…' },
    ],
    edges: [
      { from: 'A', to: 'B', fromSide: 'b', toSide: 't' },
      { from: 'B', to: 'C', fromSide: 'b', toSide: 't' },
      { from: 'C', to: 'B1', fromSide: 'b', toSide: 't' },
      { from: 'C', to: 'B2', fromSide: 'b', toSide: 't' },
      { from: 'C', to: 'B3', fromSide: 'b', toSide: 't' },
      { from: 'C', to: 'B4', fromSide: 'b', toSide: 't' },
    ],
  },

  /* 18 ── Hastalık Anksiyetesi — Detaylı ───────────────────────── */
  'hastalik-anksiyete-detay': {
    vb: [680, 735], max: 600,
    cite: 'Hastalık Anksiyetesi — Detaylı Model (Warwick & Salkovskis 1990)',
    legend: false,
    nodes: [
      { id: 'D1', key: 'had_gecmis',   x: 140, y: 12,  w: 400, h: 62, variant: 'soft', title: 'Geçmiş Yaşantı / Deneyim', ph: '…' },
      { id: 'D2', key: 'had_varsayim', x: 140, y: 120, w: 400, h: 62, variant: 'soft', title: 'İşlevsiz Varsayımlar', ph: '…' },
      { id: 'D3', key: 'had_kritik',   x: 140, y: 228, w: 400, h: 62, variant: 'soft', title: 'Kritik Olay', ph: '…' },
      { id: 'A', key: 'had_onc',     x: 140, y: 338, w: 400, h: 62, title: 'Önceki Varsayım-İnanç Aktive Olur', ph: '…' },
      { id: 'B', key: 'had_dusunce', x: 140, y: 448, w: 400, h: 62, title: 'Artan Olumsuz Düşünce ve İmgeler', ph: '…' },
      { id: 'C', key: 'had_kaygi',   x: 140, y: 558, w: 400, h: 62, variant: 'accent', title: 'Kaygı Artışı', ph: '…' },
      { id: 'B1', key: 'had_dav',   x: 15,  y: 668, w: 150, h: 54, title: 'Davranış', ph: '…' },
      { id: 'B2', key: 'had_duygu', x: 180, y: 668, w: 150, h: 54, title: 'Duygu', ph: '…' },
      { id: 'B3', key: 'had_kog',   x: 345, y: 668, w: 150, h: 54, title: 'Kognitif', ph: '…' },
      { id: 'B4', key: 'had_fiz',   x: 510, y: 668, w: 150, h: 54, title: 'Fizyolojik', ph: '…' },
    ],
    edges: [
      { from: 'D1', to: 'D2', fromSide: 'b', toSide: 't' },
      { from: 'D2', to: 'D3', fromSide: 'b', toSide: 't' },
      { from: 'D3', to: 'A', fromSide: 'b', toSide: 't' },
      { from: 'A', to: 'B', fromSide: 'b', toSide: 't' },
      { from: 'B', to: 'C', fromSide: 'b', toSide: 't' },
      { from: 'C', to: 'B1', fromSide: 'b', toSide: 't' },
      { from: 'C', to: 'B2', fromSide: 'b', toSide: 't' },
      { from: 'C', to: 'B3', fromSide: 'b', toSide: 't' },
      { from: 'C', to: 'B4', fromSide: 'b', toSide: 't' },
    ],
  },

  /* 19 ── Ruminasyon Döngüsü (ABCD, yatay) ─────────────────────── */
  'ruminasyon': {
    vb: [720, 470], max: 680,
    cite: 'Ruminasyon Döngüsü — ABCD Modeli',
    nodes: [
      { id: 'A', key: 'rum_a', x: 16,  y: 150, w: 140, h: 90, title: 'A · Tetikleyici Olay', ph: '…' },
      { id: 'B', key: 'rum_b', x: 196, y: 150, w: 150, h: 90, variant: 'accent', title: 'B · Ruminatif Düşünce', ph: '…' },
      { id: 'BA', key: 'rum_b_alt', x: 188, y: 268, w: 166, h: 92, variant: 'soft', dashed: true, title: 'Alt Düşünceler', ph: '"Aptal olduğumu düşünmüştür…"' },
      { id: 'C', key: 'rum_c', x: 388, y: 150, w: 150, h: 90, title: 'C · Duygu', ph: '…' },
      { id: 'D', key: 'rum_d', x: 568, y: 150, w: 140, h: 90, title: 'D · Davranış', ph: '…' },
    ],
    edges: [
      { from: 'A', to: 'B', fromSide: 'r', toSide: 'l' },
      { from: 'B', to: 'C', fromSide: 'r', toSide: 'l' },
      { from: 'C', to: 'D', fromSide: 'r', toSide: 'l' },
      { from: 'B', to: 'BA', dashed: true, fromSide: 'b', toSide: 't' },
      { from: 'D', to: 'B', kind: 'feedback', route: 'curve', bow: -120, fromSide: 't', toSide: 't' },
      { from: 'C', to: 'B', kind: 'feedback', route: 'curve', bow: 150, fromSide: 'b', toSide: 'b' },
    ],
  },

  /* 20 ── Ruminasyon — Üst-Biliş (Watkins/Wells) ───────────────── */
  'ruminasyon-ust-bilis': {
    vb: [720, 680], max: 680,
    cite: 'Ruminasyon — Watkins (2008) / Wells (1999) Üst-Biliş Modeli',
    nodes: [
      { id: 'A', key: 'rub_tetik',    x: 220, y: 16,  w: 280, h: 58, shape: 'pill', title: 'Tetikleyici Olay / Düşünce', ph: '…' },
      { id: 'B', key: 'rub_sureci',   x: 160, y: 136, w: 400, h: 70, variant: 'accent', title: 'Ruminatif Düşünce Süreci', ph: '…' },
      { id: 'C', key: 'rub_duygu',    x: 24,  y: 274, w: 214, h: 80, title: 'Duygusal Yoğunlaşma', ph: '…' },
      { id: 'D', key: 'rub_cozumsuz', x: 482, y: 274, w: 214, h: 80, title: 'Çözümsüzlük Hissi', ph: '…' },
      { id: 'E', key: 'rub_kacinma',  x: 24,  y: 420, w: 214, h: 80, title: 'Pasif Baş Etme / Kaçınma', ph: '…' },
      { id: 'F', key: 'rub_belirti',  x: 482, y: 420, w: 214, h: 80, title: 'Depresif Belirti Artışı', ph: '…' },
      { id: 'G', key: 'rub_dikkat',   x: 175, y: 556, w: 370, h: 68, title: 'Dikkat Daralması & Saplanma', ph: '…' },
      { id: 'M', key: 'rub_meta',     x: 534, y: 28,  w: 174, h: 80, variant: 'soft', dashed: true, title: 'Meta-İnanç', ph: '"Düşünmek sorunu çözer"' },
    ],
    edges: [
      { from: 'A', to: 'B', fromSide: 'b', toSide: 't' },
      { from: 'B', to: 'C', fromSide: 'l', toSide: 'r' },
      { from: 'B', to: 'D', fromSide: 'r', toSide: 'l' },
      { from: 'C', to: 'E', fromSide: 'b', toSide: 't' },
      { from: 'D', to: 'F', fromSide: 'b', toSide: 't' },
      { from: 'E', to: 'G', fromSide: 'b', toSide: 't', toAt: 0.18 },
      { from: 'F', to: 'G', fromSide: 'b', toSide: 't', toAt: 0.82 },
      { from: 'E', to: 'B', kind: 'feedback', route: 'wallL', wall: 8, fromSide: 'l', toSide: 'l' },
      { from: 'F', to: 'B', kind: 'feedback', route: 'wallR', wall: 712, fromSide: 'r', toSide: 'r' },
      { from: 'G', to: 'B', kind: 'feedback', route: 'curve', bow: 70, fromSide: 'b', toSide: 'b' },
      { from: 'M', to: 'B', dashed: true, fromSide: 'l', toSide: 'r', toAt: 0.2 },
    ],
  },

  /* 21 ── Çekingenlik (Geri Durma) ─────────────────────────────── */
  'cekingenlik': {
    vb: [680, 580], max: 620,
    cite: 'Çekingenlik (Geri Durma) Deseni',
    legend: false,
    nodes: [
      { id: 'S1', key: 'cek_durum',    x: 180, y: 20,  w: 320, h: 58, title: 'Durum', ph: '…' },
      { id: 'S2', key: 'cek_oto',      x: 180, y: 128, w: 320, h: 58, title: 'Otomatik (Anlık) Düşünce', ph: '…' },
      { id: 'S3', key: 'cek_duygu',    x: 180, y: 236, w: 320, h: 58, title: 'Olumsuz (Disforik) Duygu', ph: '…' },
      { id: 'S4', key: 'cek_davranis', x: 180, y: 344, w: 320, h: 68, variant: 'accent', title: 'Olumsuz Duyguya Yönelik Düşünce ve İlişkili Davranış', ph: '…' },
      { id: 'RL', key: 'cek_duyg_sonuc',  x: 40,  y: 472, w: 240, h: 80, title: 'Duygusal Sonuç', ph: '…' },
      { id: 'RR', key: 'cek_somut_sonuc', x: 400, y: 472, w: 240, h: 80, title: 'Somut Sonuç', ph: '…' },
    ],
    edges: [
      { from: 'S1', to: 'S2', fromSide: 'b', toSide: 't' },
      { from: 'S2', to: 'S3', fromSide: 'b', toSide: 't' },
      { from: 'S3', to: 'S4', fromSide: 'b', toSide: 't' },
      { from: 'S4', to: 'RL', fromSide: 'b', toSide: 't' },
      { from: 'S4', to: 'RR', fromSide: 'b', toSide: 't' },
    ],
  },

  /* 22 ── Basit Obsesyon Döngüsü (5'li halka) ──────────────────── */
  'basit-obsesyon': {
    vb: [680, 600], max: 640,
    cite: 'Basit Obsesyon Döngüsü — OKB Kısır Döngü Modeli',
    ring: true,
    nodes: [
      { id: 'R0', key: 'obs_tetik',   x: 268, y: 38,  w: 144, h: 144, shape: 'circle', variant: 'accent', title: 'Tetikleyici Uyaran', ph: '…' },
      { id: 'R1', key: 'obs_obs',     x: 458, y: 178, w: 144, h: 144, shape: 'circle', title: 'Obsesyon', ph: '…' },
      { id: 'R2', key: 'obs_sikinti', x: 386, y: 398, w: 144, h: 144, shape: 'circle', title: 'Sıkıntı', ph: '…' },
      { id: 'R3', key: 'obs_komp',    x: 150, y: 398, w: 144, h: 144, shape: 'circle', title: 'Kompulsiyon', ph: '…' },
      { id: 'R4', key: 'obs_rahat',   x: 78,  y: 178, w: 144, h: 144, shape: 'circle', title: 'Rahatlama', ph: '…' },
    ],
    edges: [
      { from: 'R0', to: 'R1' }, { from: 'R1', to: 'R2' }, { from: 'R2', to: 'R3' },
      { from: 'R3', to: 'R4' }, { from: 'R4', to: 'R0' },
    ],
  },

  /* 23 ── Travma (Ehlers & Clark 2000) ─────────────────────────── */
  'travma': {
    vb: [720, 560], max: 680,
    cite: 'Travma ve TSSB Bilişsel Modeli — Ehlers & Clark (2000)',
    ring: true,
    nodes: [
      { id: 'MEM', key: 'tr_ani', x: 290, y: 30, w: 270, h: 66, title: 'Travma Anısı', ph: 'Travma içeriği…' },
      { id: 'R0', key: 'tr_anlam',     x: 360, y: 130, w: 140, h: 140, shape: 'circle', title: 'Anlam / Yeniden Yaşama', sub: 'İşlevsiz anlamlandırma' },
      { id: 'R1', key: 'tr_kaygi',     x: 528, y: 230, w: 140, h: 140, shape: 'circle', variant: 'accent', title: 'Kaygı' },
      { id: 'R2', key: 'tr_kacinma',   x: 360, y: 330, w: 140, h: 140, shape: 'circle', title: 'Kaçınma' },
      { id: 'R3', key: 'tr_izolasyon', x: 192, y: 230, w: 140, h: 140, shape: 'circle', title: 'İzolasyon', sub: 'Yeni bilgi girişine engel' },
    ],
    edges: [
      { from: 'MEM', to: 'R0', fromSide: 'b', toSide: 't' },
      { from: 'R0', to: 'R1' }, { from: 'R1', to: 'R2' }, { from: 'R2', to: 'R3' }, { from: 'R3', to: 'R0' },
    ],
  },

};

/** DiagramType — 23 modelin tip birliği (DIAGRAMS sırasıyla aynı). */
export type DiagramType =
  | 'sosyal-kaygi' | 'okb' | 'depresyon-gelisimsel' | 'depresyon-dongu' | 'panik' | 'yab'
  | 'cocuk-depresyon' | 'akb' | 'anksiyete-formul' | 'ozgul-fobi' | 'yeme-sorunlari'
  | 'istek-mutluluk' | 'ddd-basit' | 'akb-komplex' | 'kacinma-ogrenme'
  | 'yab-basit' | 'hastalik-anksiyete' | 'hastalik-anksiyete-detay'
  | 'ruminasyon' | 'ruminasyon-ust-bilis' | 'cekingenlik' | 'basit-obsesyon' | 'travma';

/** Katalog — liste/seçim ekranlarının kullandığı görünen ad + etiket. */
export const DIAGRAMS: { id: DiagramType; label: string; tag: string }[] = [
  { id: 'sosyal-kaygi',            label: 'Sosyal Kaygı Döngüsü',           tag: 'BDT' },
  { id: 'okb',                     label: 'OKB Döngüsü',                    tag: 'BDT' },
  { id: 'depresyon-gelisimsel',    label: 'Depresyon — Gelişimsel',         tag: 'BDT' },
  { id: 'depresyon-dongu',         label: 'Depresyon Döngüsü',              tag: 'BDT' },
  { id: 'panik',                   label: 'Panik Döngüsü',                  tag: 'BDT' },
  { id: 'yab',                     label: 'YAB Formülasyonu',               tag: 'BDT' },
  { id: 'cocuk-depresyon',         label: 'Çocuk Depresyon Döngüsü',        tag: 'BDT' },
  { id: 'akb',                     label: 'Ayrılık Kaygısı (AKB)',          tag: 'BDT' },
  { id: 'anksiyete-formul',        label: 'Anksiyete Formülü',              tag: 'BDT' },
  { id: 'ozgul-fobi',              label: 'Özgül Fobi Modeli',              tag: 'BDT' },
  { id: 'yeme-sorunlari',          label: 'Yeme Sorunları Modeli',          tag: 'BDT' },
  { id: 'istek-mutluluk',          label: 'İstek / Mutluluk Döngüsü',       tag: 'BDT' },
  { id: 'ddd-basit',               label: 'Düşünce-Duygu-Davranış',         tag: 'BDT' },
  { id: 'akb-komplex',             label: 'AKB / Okul Reddi — Komplex',     tag: 'BDT' },
  { id: 'kacinma-ogrenme',         label: 'Kaçınma & Öğrenme Modeli',       tag: 'BDT' },
  { id: 'yab-basit',               label: 'YAB — Basit Model',              tag: 'BDT' },
  { id: 'hastalik-anksiyete',      label: 'Hastalık Anksiyetesi',           tag: 'BDT' },
  { id: 'hastalik-anksiyete-detay',label: 'Hastalık Anksiyetesi — Detaylı', tag: 'BDT' },
  { id: 'ruminasyon',               label: 'Ruminasyon Döngüsü (ABCD)',      tag: 'BDT' },
  { id: 'ruminasyon-ust-bilis',     label: 'Ruminasyon — Üst-Biliş Modeli', tag: 'BDT' },
  { id: 'cekingenlik',              label: 'Çekingenlik (Geri Durma)',        tag: 'BDT' },
  { id: 'basit-obsesyon',           label: 'Basit Obsesyon Döngüsü',         tag: 'BDT' },
  { id: 'travma',                   label: 'Travma Modeli',                   tag: 'BDT' },
];
