import { getDb } from './db';
import { randomUUID } from 'crypto';

// ──────────────────────────────────────────────────────────────────────────
// Admin paneli veri katmanı — hesaplar (terapist/ekip/müşteri), paylaşım
// izinleri, denetim günlüğü. Danışan (clients) verisinden TAMAMEN ayrıdır.
// ──────────────────────────────────────────────────────────────────────────

export type AppUser = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string;          // terapist | ekip | musteri
  status: string;        // aktif | askida | davetli
  plan: string;          // aylik | yillik | deneme
  base_price: number;    // temel abonelik ücreti (TL)
  discount_pct: number;  // indirim yüzdesi
  price_adjust: number;  // manuel +/- düzeltme (TL)
  notes: string | null;
  last_sms_at: string | null;
  created_at: string;
  updated_at: string;
};

export type UserShare = {
  id: string;
  from_user_id: string;
  to_user_id: string;
  permission: string;    // goruntule | duzenle | tam
  scope: string;         // tum | tasarim | sablon | mudahale
  note: string | null;
  created_at: string;
};

/** Net ücret = (temel + manuel düzeltme) × (1 − indirim%). */
export function netPrice(u: Pick<AppUser, 'base_price' | 'discount_pct' | 'price_adjust'>): number {
  const gross = (u.base_price || 0) + (u.price_adjust || 0);
  const net = gross * (1 - (u.discount_pct || 0) / 100);
  return Math.max(0, Math.round(net));
}

// ── kullanıcılar ──
export function listUsers(): AppUser[] {
  return getDb().prepare('SELECT * FROM app_users ORDER BY created_at DESC').all() as AppUser[];
}

export function getUser(id: string): AppUser | undefined {
  return getDb().prepare('SELECT * FROM app_users WHERE id = ?').get(id) as AppUser | undefined;
}

export function createUser(d: Partial<AppUser>): AppUser {
  const id = randomUUID();
  getDb().prepare(
    `INSERT INTO app_users (id, name, email, phone, role, status, plan, base_price, discount_pct, price_adjust, notes)
     VALUES (@id, @name, @email, @phone, @role, @status, @plan, @base_price, @discount_pct, @price_adjust, @notes)`
  ).run({
    id,
    name: (d.name ?? 'İsimsiz').toString().trim() || 'İsimsiz',
    email: d.email ?? null,
    phone: d.phone ?? null,
    role: d.role ?? 'terapist',
    status: d.status ?? 'aktif',
    plan: d.plan ?? 'aylik',
    base_price: Number(d.base_price) || 0,
    discount_pct: Number(d.discount_pct) || 0,
    price_adjust: Number(d.price_adjust) || 0,
    notes: d.notes ?? null,
  });
  return getUser(id)!;
}

const EDITABLE: (keyof AppUser)[] = ['name', 'email', 'phone', 'role', 'status', 'plan', 'base_price', 'discount_pct', 'price_adjust', 'notes', 'last_sms_at'];

export function updateUser(id: string, patch: Partial<AppUser>): AppUser | undefined {
  const keys = (Object.keys(patch) as (keyof AppUser)[]).filter((k) => EDITABLE.includes(k));
  if (keys.length) {
    const set = keys.map((k) => `${k} = @${k}`).join(', ');
    const vals: Record<string, unknown> = { id };
    for (const k of keys) vals[k] = (patch as any)[k];
    getDb().prepare(`UPDATE app_users SET ${set}, updated_at = datetime('now') WHERE id = @id`).run(vals);
  }
  return getUser(id);
}

export function deleteUser(id: string): void {
  const db = getDb();
  db.prepare('DELETE FROM user_shares WHERE from_user_id = ? OR to_user_id = ?').run(id, id);
  db.prepare('DELETE FROM app_users WHERE id = ?').run(id);
}

// ── paylaşım izinleri ──
export function listShares(): UserShare[] {
  return getDb().prepare('SELECT * FROM user_shares ORDER BY created_at DESC').all() as UserShare[];
}

export function createShare(d: Partial<UserShare>): UserShare {
  const id = randomUUID();
  getDb().prepare(
    'INSERT INTO user_shares (id, from_user_id, to_user_id, permission, scope, note) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(id, d.from_user_id, d.to_user_id, d.permission ?? 'goruntule', d.scope ?? 'tum', d.note ?? null);
  return getDb().prepare('SELECT * FROM user_shares WHERE id = ?').get(id) as UserShare;
}

export function deleteShare(id: string): void {
  getDb().prepare('DELETE FROM user_shares WHERE id = ?').run(id);
}

// ── denetim günlüğü ──
export function logAudit(action: string, targetId?: string | null, detail?: unknown): void {
  getDb().prepare('INSERT INTO admin_audit (action, target_id, detail) VALUES (?, ?, ?)')
    .run(action, targetId ?? null, detail != null ? JSON.stringify(detail) : null);
}

export function listAudit(limit = 40): { id: number; action: string; target_id: string | null; detail: string | null; created_at: string }[] {
  return getDb().prepare('SELECT * FROM admin_audit ORDER BY id DESC LIMIT ?').all(limit) as any[];
}

// ── genel bakış ──
export function overview() {
  const users = listUsers();
  const active = users.filter((u) => u.status === 'aktif');
  const byRole = (r: string) => users.filter((u) => u.role === r).length;
  return {
    total: users.length,
    aktif: active.length,
    askida: users.filter((u) => u.status === 'askida').length,
    davetli: users.filter((u) => u.status === 'davetli').length,
    terapist: byRole('terapist'),
    ekip: byRole('ekip'),
    musteri: byRole('musteri'),
    mrr: active.reduce((s, u) => s + netPrice(u), 0),
    shares: listShares().length,
  };
}
