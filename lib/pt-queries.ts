/* =====================================================================
   pt-queries — Kişisel Antrenör veri katmanı (typed prepared statements).
   lib/queries.ts deseni. API rotaları bunu kullanır; rotalar ince kalır.
   ===================================================================== */
import { randomUUID } from 'crypto';
import { getDb } from './db';
import type {
  PtTrainer, PtMember, PtMeasurement, PtPackage, PtPayment,
  PtAttendance, PtLesson, PtCollection, PtExpense, PtNotification,
} from './pt-types';

const uid = (p: string) => `${p}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
const ym = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
const today = () => new Date().toISOString().slice(0, 10);

/* ─── Eğitmenler ─────────────────────────────────────────────────────── */
export function listTrainers(): PtTrainer[] {
  return getDb().prepare('SELECT * FROM pt_trainers ORDER BY ad_soyad').all() as PtTrainer[];
}
export function getTrainer(id: string): PtTrainer | null {
  return (getDb().prepare('SELECT * FROM pt_trainers WHERE id = ?').get(id) as PtTrainer) ?? null;
}
export function createTrainer(d: Partial<PtTrainer>): PtTrainer {
  const id = uid('ptt');
  getDb().prepare(`INSERT INTO pt_trainers (id, ad_soyad, telefon, email, uzmanlik, brans, bio, durum, program_json)
    VALUES (@id, @ad_soyad, @telefon, @email, @uzmanlik, @brans, @bio, @durum, @program_json)`).run({
    id, ad_soyad: d.ad_soyad ?? 'İsimsiz', telefon: d.telefon ?? null, email: d.email ?? null,
    uzmanlik: d.uzmanlik ?? null, brans: d.brans ?? null, bio: d.bio ?? null,
    durum: d.durum ?? 'aktif', program_json: d.program_json ?? null,
  });
  return getTrainer(id)!;
}
export function updateTrainer(id: string, d: Partial<PtTrainer>): void {
  const allowed = ['ad_soyad', 'telefon', 'email', 'uzmanlik', 'brans', 'bio', 'durum', 'program_json'] as const;
  const sets = allowed.filter((k) => k in d).map((k) => `${k} = @${k}`);
  if (!sets.length) return;
  getDb().prepare(`UPDATE pt_trainers SET ${sets.join(', ')}, updated_at = datetime('now') WHERE id = @id`).run({ id, ...d } as any);
}
export function deleteTrainer(id: string): void {
  getDb().prepare('DELETE FROM pt_trainers WHERE id = ?').run(id);
}

/* ─── Üyeler ─────────────────────────────────────────────────────────── */
export function listMembers(): (PtMember & { trainer_ad?: string | null })[] {
  return getDb().prepare(`SELECT m.*, t.ad_soyad AS trainer_ad
    FROM pt_members m LEFT JOIN pt_trainers t ON t.id = m.trainer_id ORDER BY m.ad_soyad`).all() as any[];
}
export function getMember(id: string): PtMember | null {
  return (getDb().prepare('SELECT * FROM pt_members WHERE id = ?').get(id) as PtMember) ?? null;
}
export function getMemberByToken(token: string): PtMember | null {
  return (getDb().prepare('SELECT * FROM pt_members WHERE qr_token = ?').get(token) as PtMember) ?? null;
}
export function createMember(d: Partial<PtMember>): PtMember {
  const id = uid('ptm');
  getDb().prepare(`INSERT INTO pt_members (id, ad_soyad, telefon, email, yas, dogum_tarihi, meslek, trainer_id, durum, hedefler, qr_token, profile_json)
    VALUES (@id, @ad_soyad, @telefon, @email, @yas, @dogum_tarihi, @meslek, @trainer_id, @durum, @hedefler, @qr_token, @profile_json)`).run({
    id, ad_soyad: d.ad_soyad ?? 'İsimsiz', telefon: d.telefon ?? null, email: d.email ?? null,
    yas: d.yas ?? null, dogum_tarihi: d.dogum_tarihi ?? null, meslek: d.meslek ?? null,
    trainer_id: d.trainer_id ?? null, durum: d.durum ?? 'aktif', hedefler: d.hedefler ?? null,
    qr_token: d.qr_token ?? randomUUID(), profile_json: d.profile_json ?? null,
  });
  return getMember(id)!;
}
export function updateMember(id: string, d: Partial<PtMember>): void {
  const allowed = ['ad_soyad', 'telefon', 'email', 'yas', 'dogum_tarihi', 'meslek', 'trainer_id', 'durum', 'hedefler'] as const;
  const sets = allowed.filter((k) => k in d).map((k) => `${k} = @${k}`);
  if (!sets.length) return;
  getDb().prepare(`UPDATE pt_members SET ${sets.join(', ')}, updated_at = datetime('now') WHERE id = @id`).run({ id, ...d } as any);
}
export function updateMemberProfile(id: string, profile: any): void {
  const cur = getDb().prepare('SELECT profile_json FROM pt_members WHERE id = ?').get(id) as { profile_json: string | null } | undefined;
  let merged: any = {};
  try { merged = cur?.profile_json ? JSON.parse(cur.profile_json) : {}; } catch { merged = {}; }
  merged = { ...merged, ...(profile ?? {}) };
  getDb().prepare(`UPDATE pt_members SET profile_json = ?, profile_updated_at = datetime('now'), updated_at = datetime('now') WHERE id = ?`)
    .run(JSON.stringify(merged), id);
}
export function deleteMember(id: string): void {
  getDb().prepare('DELETE FROM pt_members WHERE id = ?').run(id);
}

/* ─── Aylık ölçümler ─────────────────────────────────────────────────── */
export function listMeasurements(memberId: string): PtMeasurement[] {
  return getDb().prepare('SELECT * FROM pt_measurements WHERE member_id = ? ORDER BY ay DESC').all(memberId) as PtMeasurement[];
}
export function getMeasurement(memberId: string, ay: string): PtMeasurement | null {
  return (getDb().prepare('SELECT * FROM pt_measurements WHERE member_id = ? AND ay = ?').get(memberId, ay) as PtMeasurement) ?? null;
}
export function upsertMeasurement(memberId: string, ay: string, d: { mezura?: any; makine?: any; notlar?: string }): PtMeasurement {
  const existing = getMeasurement(memberId, ay);
  const mezura = d.mezura !== undefined ? JSON.stringify(d.mezura) : existing?.mezura_json ?? null;
  const makine = d.makine !== undefined ? JSON.stringify(d.makine) : existing?.makine_json ?? null;
  const notlar = d.notlar !== undefined ? d.notlar : existing?.notlar ?? null;
  if (existing) {
    getDb().prepare(`UPDATE pt_measurements SET mezura_json=?, makine_json=?, notlar=?, updated_at=datetime('now') WHERE id=?`)
      .run(mezura, makine, notlar, existing.id);
    return getMeasurement(memberId, ay)!;
  }
  const id = uid('ptmeas');
  getDb().prepare(`INSERT INTO pt_measurements (id, member_id, ay, mezura_json, makine_json, notlar) VALUES (?,?,?,?,?,?)`)
    .run(id, memberId, ay, mezura, makine, notlar);
  return getMeasurement(memberId, ay)!;
}

/* ─── Paketler ───────────────────────────────────────────────────────── */
export function listPackages(memberId: string): PtPackage[] {
  return getDb().prepare('SELECT * FROM pt_packages WHERE member_id = ? ORDER BY paket_no').all(memberId) as PtPackage[];
}
export function getPackage(id: string): PtPackage | null {
  return (getDb().prepare('SELECT * FROM pt_packages WHERE id = ?').get(id) as PtPackage) ?? null;
}
export function createPackage(d: Partial<PtPackage> & { member_id: string; tutar: number }): PtPackage {
  const id = uid('ptpkg');
  const row = getDb().prepare('SELECT MAX(paket_no) AS mx FROM pt_packages WHERE member_id = ?').get(d.member_id) as { mx: number | null };
  const paket_no = (row?.mx ?? 0) + 1;
  getDb().prepare(`INSERT INTO pt_packages (id, member_id, paket_no, ad, tutar, seans_adedi, kalan_seans, baslangic, bitis, durum)
    VALUES (@id, @member_id, @paket_no, @ad, @tutar, @seans_adedi, @kalan_seans, @baslangic, @bitis, @durum)`).run({
    id, member_id: d.member_id, paket_no, ad: d.ad ?? `${paket_no}. paket`, tutar: d.tutar,
    seans_adedi: d.seans_adedi ?? null, kalan_seans: d.seans_adedi ?? d.kalan_seans ?? null,
    baslangic: d.baslangic ?? today(), bitis: d.bitis ?? null, durum: d.durum ?? 'aktif',
  });
  return getPackage(id)!;
}
export function updatePackage(id: string, d: Partial<PtPackage>): void {
  const allowed = ['ad', 'tutar', 'seans_adedi', 'kalan_seans', 'baslangic', 'bitis', 'durum'] as const;
  const sets = allowed.filter((k) => k in d).map((k) => `${k} = @${k}`);
  if (!sets.length) return;
  getDb().prepare(`UPDATE pt_packages SET ${sets.join(', ')} WHERE id = @id`).run({ id, ...d } as any);
}
export function deletePackage(id: string): void {
  getDb().prepare('DELETE FROM pt_packages WHERE id = ?').run(id);
}

/* ─── Ödemeler ───────────────────────────────────────────────────────── */
export function listPayments(memberId?: string): PtPayment[] {
  return memberId
    ? getDb().prepare('SELECT * FROM pt_payments WHERE member_id = ? ORDER BY tarih DESC').all(memberId) as PtPayment[]
    : getDb().prepare('SELECT * FROM pt_payments ORDER BY tarih DESC').all() as PtPayment[];
}
export function createPayment(d: { member_id: string; package_id?: string | null; tutar: number; tarih?: string; yontem?: string }): PtPayment {
  const id = uid('ptpay');
  const pkg = d.package_id ? getPackage(d.package_id) : null;
  getDb().prepare(`INSERT INTO pt_payments (id, member_id, package_id, paket_no, tutar, tarih, yontem)
    VALUES (?,?,?,?,?,?,?)`).run(id, d.member_id, d.package_id ?? null, pkg?.paket_no ?? null, d.tutar, d.tarih ?? today(), d.yontem ?? null);
  return getDb().prepare('SELECT * FROM pt_payments WHERE id = ?').get(id) as PtPayment;
}
export function markPaymentSms(id: string): void {
  getDb().prepare('UPDATE pt_payments SET sms_gonderildi = 1 WHERE id = ?').run(id);
}
export function deletePayment(id: string): void {
  getDb().prepare('DELETE FROM pt_payments WHERE id = ?').run(id);
}

/* ─── Yoklama (geliş-gidiş) ──────────────────────────────────────────── */
export function listAttendance(memberId?: string, from?: string, to?: string): PtAttendance[] {
  const cl: string[] = []; const ps: any[] = [];
  if (memberId) { cl.push('member_id = ?'); ps.push(memberId); }
  if (from) { cl.push('tarih >= ?'); ps.push(from); }
  if (to) { cl.push('tarih <= ?'); ps.push(to); }
  const where = cl.length ? `WHERE ${cl.join(' AND ')}` : '';
  return getDb().prepare(`SELECT * FROM pt_attendance ${where} ORDER BY tarih DESC, giris_at DESC`).all(...ps) as PtAttendance[];
}
/** Aynı üyenin son N dakikadaki girişini bul (kiosk dedupe). */
export function recentCheckin(memberId: string, withinMin = 90): PtAttendance | null {
  const since = new Date(Date.now() - withinMin * 60000).toISOString();
  return (getDb().prepare(`SELECT * FROM pt_attendance WHERE member_id = ? AND giris_at >= ? ORDER BY giris_at DESC LIMIT 1`)
    .get(memberId, since) as PtAttendance) ?? null;
}
export function createAttendance(d: { member_id: string; kaynak?: string; lesson_id?: string | null }): PtAttendance {
  const id = uid('ptatt');
  const now = new Date();
  getDb().prepare(`INSERT INTO pt_attendance (id, member_id, tarih, giris_at, kaynak, lesson_id) VALUES (?,?,?,?,?,?)`)
    .run(id, d.member_id, now.toISOString().slice(0, 10), now.toISOString(), d.kaynak ?? 'manuel', d.lesson_id ?? null);
  return getDb().prepare('SELECT * FROM pt_attendance WHERE id = ?').get(id) as PtAttendance;
}
export function updateAttendance(id: string, d: Partial<PtAttendance>): void {
  const allowed = ['cikis_at', 'lesson_id'] as const;
  const sets = allowed.filter((k) => k in d).map((k) => `${k} = @${k}`);
  if (!sets.length) return;
  getDb().prepare(`UPDATE pt_attendance SET ${sets.join(', ')} WHERE id = @id`).run({ id, ...d } as any);
}
export function deleteAttendance(id: string): void {
  getDb().prepare('DELETE FROM pt_attendance WHERE id = ?').run(id);
}

/* ─── Dersler (ders takvimi) ─────────────────────────────────────────── */
export function listLessons(opts: { trainerId?: string; from?: string; to?: string } = {}): PtLesson[] {
  const cl: string[] = []; const ps: any[] = [];
  if (opts.trainerId) { cl.push('trainer_id = ?'); ps.push(opts.trainerId); }
  if (opts.from) { cl.push('tarih >= ?'); ps.push(opts.from); }
  if (opts.to) { cl.push('tarih <= ?'); ps.push(opts.to); }
  const where = cl.length ? `WHERE ${cl.join(' AND ')}` : '';
  return getDb().prepare(`SELECT * FROM pt_lessons ${where} ORDER BY tarih, baslangic`).all(...ps) as PtLesson[];
}
export function createLesson(d: Partial<PtLesson> & { tarih: string; baslangic: string }): PtLesson {
  const id = uid('ptles');
  getDb().prepare(`INSERT INTO pt_lessons (id, trainer_id, member_id, tarih, baslangic, bitis, tip, durum, notlar)
    VALUES (@id, @trainer_id, @member_id, @tarih, @baslangic, @bitis, @tip, @durum, @notlar)`).run({
    id, trainer_id: d.trainer_id ?? null, member_id: d.member_id ?? null, tarih: d.tarih, baslangic: d.baslangic,
    bitis: d.bitis ?? null, tip: d.tip ?? 'ders', durum: d.durum ?? 'planli', notlar: d.notlar ?? null,
  });
  return getDb().prepare('SELECT * FROM pt_lessons WHERE id = ?').get(id) as PtLesson;
}
export function updateLesson(id: string, d: Partial<PtLesson>): void {
  const allowed = ['trainer_id', 'member_id', 'tarih', 'baslangic', 'bitis', 'tip', 'durum', 'notlar'] as const;
  const sets = allowed.filter((k) => k in d).map((k) => `${k} = @${k}`);
  if (!sets.length) return;
  getDb().prepare(`UPDATE pt_lessons SET ${sets.join(', ')} WHERE id = @id`).run({ id, ...d } as any);
}
export function deleteLesson(id: string): void {
  getDb().prepare('DELETE FROM pt_lessons WHERE id = ?').run(id);
}

/* ─── Tahsilat sözleri ───────────────────────────────────────────────── */
export function listCollections(overdueOnly = false): (PtCollection & { member_ad?: string })[] {
  const base = `SELECT c.*, m.ad_soyad AS member_ad FROM pt_collections c LEFT JOIN pt_members m ON m.id = c.member_id`;
  if (overdueOnly) return getDb().prepare(`${base} WHERE c.durum='bekleyen' AND c.soz_tarihi < ? ORDER BY c.soz_tarihi`).all(today()) as any[];
  return getDb().prepare(`${base} ORDER BY c.soz_tarihi`).all() as any[];
}
export function createCollection(d: { member_id: string; package_id?: string | null; tutar?: number; soz_tarihi: string; notlar?: string }): PtCollection {
  const id = uid('ptcol');
  getDb().prepare(`INSERT INTO pt_collections (id, member_id, package_id, tutar, soz_tarihi, notlar) VALUES (?,?,?,?,?,?)`)
    .run(id, d.member_id, d.package_id ?? null, d.tutar ?? null, d.soz_tarihi, d.notlar ?? null);
  return getDb().prepare('SELECT * FROM pt_collections WHERE id = ?').get(id) as PtCollection;
}
export function updateCollection(id: string, d: Partial<PtCollection>): void {
  const allowed = ['tutar', 'soz_tarihi', 'durum', 'odeme_id', 'notlar'] as const;
  const sets = allowed.filter((k) => k in d).map((k) => `${k} = @${k}`);
  if (!sets.length) return;
  getDb().prepare(`UPDATE pt_collections SET ${sets.join(', ')} WHERE id = @id`).run({ id, ...d } as any);
}
export function deleteCollection(id: string): void {
  getDb().prepare('DELETE FROM pt_collections WHERE id = ?').run(id);
}

/* ─── Giderler ───────────────────────────────────────────────────────── */
export function listExpenses(month?: string): PtExpense[] {
  return month
    ? getDb().prepare("SELECT * FROM pt_expenses WHERE substr(tarih,1,7) = ? ORDER BY tarih DESC").all(month) as PtExpense[]
    : getDb().prepare('SELECT * FROM pt_expenses ORDER BY tarih DESC').all() as PtExpense[];
}
export function createExpense(d: { kategori?: string; aciklama?: string; tutar: number; tarih?: string }): PtExpense {
  const id = uid('ptexp');
  getDb().prepare(`INSERT INTO pt_expenses (id, kategori, aciklama, tutar, tarih) VALUES (?,?,?,?,?)`)
    .run(id, d.kategori ?? null, d.aciklama ?? null, d.tutar, d.tarih ?? today());
  return getDb().prepare('SELECT * FROM pt_expenses WHERE id = ?').get(id) as PtExpense;
}
export function deleteExpense(id: string): void {
  getDb().prepare('DELETE FROM pt_expenses WHERE id = ?').run(id);
}

/* ─── Raporlar ───────────────────────────────────────────────────────── */
/** Aylık satış = o ay açılan paketlerin tutar toplamı (opsiyonel eğitmen filtresi). */
export function salesForMonth(month: string, trainerId?: string): { total: number; packages: (PtPackage & { member_ad?: string })[] } {
  const params: any[] = [month];
  let where = "substr(p.baslangic,1,7) = ?";
  if (trainerId) { where += ' AND m.trainer_id = ?'; params.push(trainerId); }
  const packages = getDb().prepare(`SELECT p.*, m.ad_soyad AS member_ad FROM pt_packages p
    LEFT JOIN pt_members m ON m.id = p.member_id WHERE ${where} ORDER BY p.baslangic DESC`).all(...params) as any[];
  const total = packages.reduce((s, p) => s + (p.tutar || 0), 0);
  return { total, packages };
}
/** Aylık gelir/gider raporu. */
export function financeForMonth(month: string) {
  const income = (getDb().prepare("SELECT COALESCE(SUM(tutar),0) AS s FROM pt_payments WHERE substr(tarih,1,7) = ?").get(month) as { s: number }).s;
  const expRows = getDb().prepare("SELECT kategori, COALESCE(SUM(tutar),0) AS s FROM pt_expenses WHERE substr(tarih,1,7) = ? GROUP BY kategori").all(month) as { kategori: string | null; s: number }[];
  const expense = expRows.reduce((s, r) => s + r.s, 0);
  return { month, income, expense, net: income - expense, byCategory: expRows };
}
/** Yönetici bildirimleri — türetilmiş (ölçüm/paket) + kalıcı (tahsilat). */
export function computeNotifications(): PtNotification[] {
  const db = getDb();
  const out: PtNotification[] = [];
  const thisMonth = ym();
  const t = today();

  // 1) Bu ay ölçümü girilmemiş aktif üyeler
  const missing = db.prepare(`SELECT m.id, m.ad_soyad FROM pt_members m
    WHERE m.durum='aktif' AND NOT EXISTS (SELECT 1 FROM pt_measurements x WHERE x.member_id=m.id AND x.ay=?)`).all(thisMonth) as { id: string; ad_soyad: string }[];
  for (const m of missing) out.push({ tip: 'olcum_eksik', severity: 'warn', memberId: m.id, memberName: m.ad_soyad, detail: `${thisMonth} ölçümü girilmemiş`, link: `/pt/uyeler/${m.id}/olcum` });

  // 2) Geciken tahsilat sözleri
  const overdue = db.prepare(`SELECT c.member_id, c.soz_tarihi, c.tutar, m.ad_soyad FROM pt_collections c
    LEFT JOIN pt_members m ON m.id=c.member_id WHERE c.durum='bekleyen' AND c.soz_tarihi < ?`).all(t) as any[];
  for (const c of overdue) out.push({ tip: 'tahsilat_gecikti', severity: 'risk', memberId: c.member_id, memberName: c.ad_soyad ?? '—', detail: `Ödeme sözü geçti (${c.soz_tarihi}${c.tutar ? ` · ${c.tutar} TL` : ''})`, link: `/pt/finans` });

  // 3) Süresi/seansı biten paketler
  const ended = db.prepare(`SELECT p.member_id, p.paket_no, p.bitis, p.kalan_seans, p.seans_adedi, m.ad_soyad FROM pt_packages p
    LEFT JOIN pt_members m ON m.id=p.member_id WHERE p.durum='aktif' AND ((p.bitis IS NOT NULL AND p.bitis < ?) OR (p.seans_adedi IS NOT NULL AND p.kalan_seans <= 0))`).all(t) as any[];
  for (const p of ended) out.push({ tip: 'paket_bitti', severity: 'warn', memberId: p.member_id, memberName: p.ad_soyad ?? '—', detail: `${p.paket_no}. paket bitti`, link: `/pt/uyeler/${p.member_id}` });

  return out;
}
