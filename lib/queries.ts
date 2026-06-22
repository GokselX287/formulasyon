import { getDb } from './db';

export interface Client {
  id: number;
  alias: string;
  age: number | null;
  gender: string | null;
  occupation: string | null;
  marital_status: string | null;
  referral_source: string | null;
  telefon: string | null;
  email: string | null;
  status: string | null;
  exit_reason: string | null;
  sunum_sorunu: string | null;
  hedefler: string | null;
  seans_ucreti: number | null;
  takip_sikligi: string | null;
  kisilik_tipi: string | null;
  created_at: string;
  updated_at: string;
}

export interface Formulation {
  id: number;
  client_id: number;
  presenting_problem: string | null;
  client_goal: string | null;
  therapist_goal: string | null;
  narrative: string | null;
  clinical_notes: string | null;
  rupture_notes: string | null;
  predispozan: string | null;
  presipitan: string | null;
  perpetuan: string | null;
  protektif: string | null;
  temel_inanclar: string | null;
  ara_inanclar: string | null;
  basa_cikma: string | null;
  otomatik_dusunceler: string | null;
  duygu_bedensel: string | null;
  davranislar: string | null;
  smart_spesifik: string | null;
  smart_olculebilir: string | null;
  smart_zaman: string | null;
  ana_sikayetler: string | null;
  yonlendirme_nedeni: string | null;
  act_kabul: string | null;
  act_defuzyon: string | null;
  act_simdi: string | null;
  act_baglam: string | null;
  act_degerler: string | null;
  act_eylem: string | null;
  act_yaratici_caresizlik: string | null;
  benlik_algisi_json: string | null;
  danisan_hedefleri_json: string | null;
  updated_at: string;
}

export interface FormulationItem {
  id: number;
  formulation_id: number;
  category: string;
  content: string;
  order_index: number;
  created_at: string;
}

export interface FlexibilityScores {
  formulation_id: number;
  defusion: number;
  acceptance: number;
  present_moment: number;
  self_as_context: number;
  values_clarity: number;
  committed_action: number;
  updated_at: string;
}

export interface Seans {
  id: string;
  client_id: number;
  tarih: string;
  sure: number;
  konu: string | null;
  notlar: string | null;
  odev: string | null;
  durum: 'katildi' | 'katilmadi' | 'ertelendi' | 'iptal';
  created_at: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end_time: string | null;
  notes: string | null;
  created_at: string;
}

export interface PendingFile {
  id: string;
  ad_soyad: string;
  randevu_tarihi: string;
  not_text: string | null;
  status: string;
  drop_reason: string | null;
  dropped_at: string | null;
  created_at: string;
}

export interface SmsLog {
  id: string;
  phone: string;
  name: string | null;
  message: string;
  trigger_type: string;
  status: string;
  error: string | null;
  created_at: string;
  sent_at: string | null;
}

export interface ClinicalTag {
  id: string;
  category: string;
  label: string;
  count: number;
  created_at: string;
}

// ─── Clients ────────────────────────────────────────────────────────────────

export function getAllClients(ownerId: string): Client[] {
  return getDb().prepare('SELECT * FROM clients WHERE owner_id = ? ORDER BY created_at DESC').all(ownerId) as Client[];
}

export function getClient(id: number, ownerId: string): Client | null {
  return (getDb().prepare('SELECT * FROM clients WHERE id = ? AND owner_id = ?').get(id, ownerId) as Client) ?? null;
}

export function createClient(data: Partial<Client> & { adSoyad?: string }, ownerId: string): number {
  const db = getDb();
  const alias = (data as any).adSoyad ?? data.alias ?? 'Anonim';
  const feeRaw = (data as any).seansUcreti ?? data.seans_ucreti;
  const result = db.prepare(
    `INSERT INTO clients (alias, age, gender, occupation, marital_status, referral_source, telefon, email, status, sunum_sorunu, hedefler, seans_ucreti, takip_sikligi, kisilik_tipi, owner_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    alias,
    data.age ?? null,
    data.gender ?? (data as any).cinsiyet ?? null,
    data.occupation ?? null,
    data.marital_status ?? null,
    data.referral_source ?? null,
    data.telefon ?? null,
    data.email ?? null,
    data.status ?? 'intake',
    data.sunum_sorunu ?? (data as any).sunumSorunu ?? null,
    data.hedefler ?? null,
    feeRaw != null && feeRaw !== '' ? Number(feeRaw) : null,
    (data as any).takipSikligi ?? data.takip_sikligi ?? null,
    (data as any).kisilikTipi ?? data.kisilik_tipi ?? null,
    ownerId,
  );
  const clientId = result.lastInsertRowid as number;

  const fResult = db.prepare(`INSERT INTO formulations (client_id, owner_id) VALUES (?, ?)`).run(clientId, ownerId);
  const formulationId = fResult.lastInsertRowid as number;
  db.prepare(`INSERT INTO flexibility_scores (formulation_id, owner_id) VALUES (?, ?)`).run(formulationId, ownerId);

  return clientId;
}

export function updateClient(id: number, data: Partial<Client> & { adSoyad?: string; cinsiyet?: string; sunumSorunu?: string; exitReason?: string; seansUcreti?: number | null; takipSikligi?: string | null; kisilikTipi?: string | null }, ownerId: string): void {
  const allowed: (keyof Client)[] = ['alias', 'age', 'gender', 'occupation', 'marital_status', 'referral_source', 'telefon', 'email', 'status', 'exit_reason', 'sunum_sorunu', 'hedefler', 'seans_ucreti', 'takip_sikligi', 'kisilik_tipi'];
  const updates: string[] = [];
  const values: unknown[] = [];

  // camelCase seansUcreti → seans_ucreti
  if ((data as any).seansUcreti !== undefined) {
    const v = (data as any).seansUcreti;
    updates.push('seans_ucreti = ?');
    values.push(v != null && v !== '' ? Number(v) : null);
  }
  if ((data as any).takipSikligi !== undefined) { updates.push('takip_sikligi = ?'); values.push((data as any).takipSikligi || null); }
  if ((data as any).kisilikTipi !== undefined) { updates.push('kisilik_tipi = ?'); values.push((data as any).kisilikTipi || null); }

  // handle adSoyad → alias
  if ((data as any).adSoyad !== undefined) {
    updates.push('alias = ?');
    values.push((data as any).adSoyad);
  }
  if ((data as any).exitReason !== undefined) {
    updates.push('exit_reason = ?');
    values.push((data as any).exitReason);
  }
  if ((data as any).cinsiyet !== undefined) {
    updates.push('gender = ?');
    values.push((data as any).cinsiyet);
  }
  if ((data as any).sunumSorunu !== undefined) {
    updates.push('sunum_sorunu = ?');
    values.push((data as any).sunumSorunu);
  }

  for (const field of allowed) {
    if (field in data && field !== 'alias') {
      updates.push(`${field} = ?`);
      values.push((data as Record<string, unknown>)[field]);
    } else if (field === 'alias' && !(data as any).adSoyad && 'alias' in data) {
      updates.push('alias = ?');
      values.push(data.alias);
    }
  }
  if (updates.length === 0) return;
  updates.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id, ownerId);
  getDb().prepare(`UPDATE clients SET ${updates.join(', ')} WHERE id = ? AND owner_id = ?`).run(...values);
}

export function deleteClient(id: number, ownerId: string): void {
  getDb().prepare('DELETE FROM clients WHERE id = ? AND owner_id = ?').run(id, ownerId);
}

// ─── Formulations ────────────────────────────────────────────────────────────

export function getFormulationByClient(clientId: number, ownerId: string): Formulation | null {
  return (getDb().prepare('SELECT * FROM formulations WHERE client_id = ? AND owner_id = ?').get(clientId, ownerId) as Formulation) ?? null;
}

export function updateFormulation(id: number, data: Partial<Formulation>, ownerId: string): void {
  const fields = [
    'presenting_problem', 'client_goal', 'therapist_goal', 'narrative', 'clinical_notes', 'rupture_notes',
    'predispozan', 'presipitan', 'perpetuan', 'protektif',
    'temel_inanclar', 'ara_inanclar', 'basa_cikma', 'otomatik_dusunceler',
    'duygu_bedensel', 'davranislar', 'smart_spesifik', 'smart_olculebilir',
    'smart_zaman', 'ana_sikayetler', 'yonlendirme_nedeni',
    'act_kabul', 'act_defuzyon', 'act_simdi', 'act_baglam', 'act_degerler', 'act_eylem', 'act_yaratici_caresizlik',
    'benlik_algisi_json', 'danisan_hedefleri_json',
  ];
  const updates: string[] = [];
  const values: unknown[] = [];
  for (const field of fields) {
    if (field in data) {
      updates.push(`${field} = ?`);
      values.push((data as Record<string, unknown>)[field]);
    }
  }
  if (updates.length === 0) return;
  updates.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id, ownerId);
  getDb().prepare(`UPDATE formulations SET ${updates.join(', ')} WHERE id = ? AND owner_id = ?`).run(...values);
}

// Danışana göre formülasyonu güncelle. Formülasyon↔danışan 1:1 olduğundan,
// API'nin tek bir tutarlı anahtarla (client_id) çalışması için bu sarmalayıcıyı
// kullanıyoruz — böylece formülasyon satır PK'si ile client_id'nin ayrışması
// (ör. danışan silinip yeniden oluşunca) sessiz "yanlış satıra yazma" hatası olmaz.
export function updateFormulationByClient(clientId: number, data: Partial<Formulation>, ownerId: string): void {
  const f = getFormulationByClient(clientId, ownerId);
  if (!f) return;
  updateFormulation(f.id, data, ownerId);
}

// ─── Formulation Items ───────────────────────────────────────────────────────

export function getItemsByCategory(formulationId: number, category: string, ownerId: string): FormulationItem[] {
  return getDb().prepare(
    'SELECT * FROM formulation_items WHERE formulation_id = ? AND category = ? AND owner_id = ? ORDER BY order_index ASC, id ASC'
  ).all(formulationId, category, ownerId) as FormulationItem[];
}

export function getItemsByFormulation(formulationId: number, ownerId: string): FormulationItem[] {
  return getDb().prepare(
    'SELECT * FROM formulation_items WHERE formulation_id = ? AND owner_id = ? ORDER BY category, order_index ASC, id ASC'
  ).all(formulationId, ownerId) as FormulationItem[];
}

export function addItem(formulationId: number, category: string, content: string, ownerId: string): number {
  const result = getDb().prepare(
    'INSERT INTO formulation_items (formulation_id, category, content, owner_id) VALUES (?, ?, ?, ?)'
  ).run(formulationId, category, content, ownerId);
  return result.lastInsertRowid as number;
}

export function deleteItem(id: number, ownerId: string): void {
  getDb().prepare('DELETE FROM formulation_items WHERE id = ? AND owner_id = ?').run(id, ownerId);
}

// ─── Flexibility Scores ──────────────────────────────────────────────────────

export function getScores(formulationId: number, ownerId: string): FlexibilityScores | null {
  return (getDb().prepare('SELECT * FROM flexibility_scores WHERE formulation_id = ? AND owner_id = ?').get(formulationId, ownerId) as FlexibilityScores) ?? null;
}

export function updateScores(formulationId: number, data: Partial<FlexibilityScores>, ownerId: string): void {
  const fields = ['defusion', 'acceptance', 'present_moment', 'self_as_context', 'values_clarity', 'committed_action'];
  const updates: string[] = [];
  const values: unknown[] = [];
  for (const field of fields) {
    if (field in data) {
      updates.push(`${field} = ?`);
      values.push((data as Record<string, unknown>)[field]);
    }
  }
  if (updates.length === 0) return;
  updates.push('updated_at = CURRENT_TIMESTAMP');
  values.push(formulationId, ownerId);
  getDb().prepare(`UPDATE flexibility_scores SET ${updates.join(', ')} WHERE formulation_id = ? AND owner_id = ?`).run(...values);
}

// ─── Seanslar ────────────────────────────────────────────────────────────────

export function getAllSeanslar(ownerId: string): (Seans & { adSoyad: string })[] {
  return getDb().prepare(
    `SELECT s.*, c.alias as adSoyad FROM seanslar s
     LEFT JOIN clients c ON c.id = s.client_id
     WHERE s.owner_id = ?
     ORDER BY s.tarih DESC`
  ).all(ownerId) as (Seans & { adSoyad: string })[];
}

export function createSeans(data: Partial<Seans> & { patientId?: string }, ownerId: string): void {
  const id = data.id ?? `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
  const clientId = data.client_id ?? (data as any).patientId;
  getDb().prepare(
    `INSERT INTO seanslar (id, client_id, tarih, sure, konu, notlar, odev, owner_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, clientId, data.tarih, data.sure ?? 50, data.konu ?? null, data.notlar ?? null, data.odev ?? null, ownerId);
}

export function deleteSeans(id: string, ownerId: string): void {
  getDb().prepare('DELETE FROM seanslar WHERE id = ? AND owner_id = ?').run(id, ownerId);
}

// ─── Calendar Events ─────────────────────────────────────────────────────────

export function getAllEvents(ownerId: string): CalendarEvent[] {
  return getDb().prepare('SELECT * FROM calendar_events WHERE owner_id = ? ORDER BY start ASC').all(ownerId) as CalendarEvent[];
}

export function createEvent(data: Partial<CalendarEvent>, ownerId: string): void {
  const id = data.id ?? `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
  getDb().prepare(
    `INSERT INTO calendar_events (id, title, start, end_time, notes, owner_id) VALUES (?, ?, ?, ?, ?, ?)`
  ).run(id, data.title, data.start, data.end_time ?? (data as any).end ?? null, data.notes ?? null, ownerId);
}

export function updateEvent(id: string, data: Partial<CalendarEvent>, ownerId: string): void {
  const allowed = ['title', 'start', 'end_time', 'notes'];
  const updates: string[] = [];
  const values: unknown[] = [];
  for (const field of allowed) {
    if (field in data) { updates.push(`${field} = ?`); values.push((data as any)[field]); }
  }
  if ('end' in data) { updates.push('end_time = ?'); values.push((data as any).end); }
  if (updates.length === 0) return;
  values.push(id, ownerId);
  getDb().prepare(`UPDATE calendar_events SET ${updates.join(', ')} WHERE id = ? AND owner_id = ?`).run(...values);
}

export function deleteEvent(id: string, ownerId: string): void {
  getDb().prepare('DELETE FROM calendar_events WHERE id = ? AND owner_id = ?').run(id, ownerId);
}

// ─── Pending Files ───────────────────────────────────────────────────────────

export function getAllPending(ownerId: string): PendingFile[] {
  return getDb().prepare('SELECT * FROM pending_files WHERE owner_id = ? ORDER BY created_at DESC').all(ownerId) as PendingFile[];
}

export function createPending(data: Partial<PendingFile> & { adSoyad?: string; randevuTarihi?: string; not?: string }, ownerId: string): void {
  const id = data.id ?? `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
  getDb().prepare(
    `INSERT INTO pending_files (id, ad_soyad, randevu_tarihi, not_text, status, drop_reason, dropped_at, owner_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    data.ad_soyad ?? (data as any).adSoyad,
    data.randevu_tarihi ?? (data as any).randevuTarihi,
    data.not_text ?? (data as any).not ?? null,
    data.status ?? 'pending',
    data.drop_reason ?? (data as any).dropReason ?? null,
    data.dropped_at ?? (data as any).droppedAt ?? null,
    ownerId,
  );
}

export function updatePending(id: string, data: Partial<PendingFile> & { dropReason?: string; droppedAt?: string }, ownerId: string): void {
  const updates: string[] = [];
  const values: unknown[] = [];
  const map: Record<string, string> = { status: 'status', drop_reason: 'drop_reason', dropped_at: 'dropped_at', not_text: 'not_text', dropReason: 'drop_reason', droppedAt: 'dropped_at' };
  for (const [k, col] of Object.entries(map)) {
    if (k in data) { updates.push(`${col} = ?`); values.push((data as any)[k]); }
  }
  if (updates.length === 0) return;
  values.push(id, ownerId);
  getDb().prepare(`UPDATE pending_files SET ${updates.join(', ')} WHERE id = ? AND owner_id = ?`).run(...values);
}

export function deletePending(id: string, ownerId: string): void {
  getDb().prepare('DELETE FROM pending_files WHERE id = ? AND owner_id = ?').run(id, ownerId);
}

// ─── SMS Log ─────────────────────────────────────────────────────────────────

export function getAllSms(ownerId: string): SmsLog[] {
  return getDb().prepare('SELECT * FROM sms_log WHERE owner_id = ? ORDER BY created_at DESC LIMIT 200').all(ownerId) as SmsLog[];
}

export function createSms(data: Partial<SmsLog> & { trigger?: string }, ownerId: string, ip?: string): string {
  const id = data.id ?? `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
  getDb().prepare(
    `INSERT INTO sms_log (id, phone, name, message, trigger_type, status, error, sent_at, owner_id, ip) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id, data.phone, data.name ?? null, data.message,
    data.trigger_type ?? (data as any).trigger ?? 'manual',
    data.status ?? 'queued', data.error ?? null, data.sent_at ?? null, ownerId, ip ?? null,
  );
  return id;
}

export function updateSms(id: string, data: Partial<SmsLog> & { delivery_status?: string; delivered_at?: string }, ownerId: string): void {
  const allowed = ['status', 'error', 'sent_at', 'delivery_status', 'delivered_at'];
  const updates: string[] = [];
  const values: unknown[] = [];
  for (const field of allowed) {
    if (field in data) { updates.push(`${field} = ?`); values.push((data as any)[field]); }
  }
  if (updates.length === 0) return;
  values.push(id, ownerId);
  getDb().prepare(`UPDATE sms_log SET ${updates.join(', ')} WHERE id = ? AND owner_id = ?`).run(...values);
}

// ─── Clinical Tags ───────────────────────────────────────────────────────────

export function getAllTags(): ClinicalTag[] {
  return getDb().prepare('SELECT * FROM clinical_tags ORDER BY category, label').all() as ClinicalTag[];
}

export function createTag(data: Partial<ClinicalTag>): void {
  const id = data.id ?? `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
  getDb().prepare(
    `INSERT OR IGNORE INTO clinical_tags (id, category, label, count) VALUES (?, ?, ?, ?)`
  ).run(id, data.category, data.label, data.count ?? 0);
}

export function deleteTag(id: string): void {
  getDb().prepare('DELETE FROM clinical_tags WHERE id = ?').run(id);
}

// ─── App Settings ─────────────────────────────────────────────────────────────

export function getSetting(key: string): string | null {
  const row = getDb().prepare('SELECT value FROM app_settings WHERE key = ?').get(key) as { value: string } | undefined;
  return row?.value ?? null;
}

export function setSetting(key: string, value: string): void {
  getDb().prepare('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)').run(key, value);
}

export function getAllSettings(): Record<string, string> {
  const rows = getDb().prepare('SELECT key, value FROM app_settings').all() as { key: string; value: string }[];
  return Object.fromEntries(rows.map(r => [r.key, r.value]));
}
