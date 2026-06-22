'use client';

import { useEffect, useMemo, useState } from 'react';
import './CalmieChrome.css';
import './AdminPanel.css';

// ──────────────────────────────────────────────────────────────────────────
// Yönetim Paneli — /admin. Sunucu-doğrulamalı şifre kapısı + 5 bölüm:
// genel bakış · kullanıcılar (terapist/ekip/müşteri) · paylaşım izinleri ·
// toplu SMS · fiyatlandırma (indirim/zam). Danışan verisine ASLA erişmez.
// Tema/zemin Calmie ile paylaşımlı; görsel dil .ayr/.cas ile birebir.
// ──────────────────────────────────────────────────────────────────────────

const DEFAULT_BG = '/calmie-hero-default.jpg';
const lsGet = (k: string): string | null => { try { return typeof window !== 'undefined' ? localStorage.getItem(k) : null; } catch { return null; } };

type User = {
  id: string; name: string; email: string | null; phone: string | null;
  role: string; status: string; plan: string;
  base_price: number; discount_pct: number; price_adjust: number;
  notes: string | null; last_sms_at: string | null; created_at: string; updated_at: string;
  net_price: number;
};
type Overview = { total: number; aktif: number; askida: number; davetli: number; terapist: number; ekip: number; musteri: number; mrr: number; shares: number };
type Share = { id: string; from_user_id: string; to_user_id: string; permission: string; scope: string; note: string | null; created_at: string };
type AuditRow = { id: number; action: string; target_id: string | null; detail: string | null; created_at: string };

const ROLE_LBL: Record<string, string> = { terapist: 'Terapist', ekip: 'Ekip üyesi', musteri: 'Müşteri' };
const STATUS_LBL: Record<string, string> = { aktif: 'Aktif', askida: 'Askıda', davetli: 'Davetli' };
const PLAN_LBL: Record<string, string> = { aylik: 'Aylık', yillik: 'Yıllık', deneme: 'Deneme' };
const PERM_LBL: Record<string, string> = { goruntule: 'Görüntüleme', duzenle: 'Düzenleme', tam: 'Tam erişim' };
const SCOPE_LBL: Record<string, string> = { tum: 'Tümü', tasarim: 'Tasarım dosyaları', sablon: 'Şablonlar', mudahale: 'Müdahale kütüphanesi' };
const STATUS_TONE: Record<string, string> = { aktif: 'green', askida: 'red', davetli: 'amber' };

const SECTIONS = [
  { k: 'genel', label: 'Genel bakış' },
  { k: 'kullanicilar', label: 'Kullanıcılar' },
  { k: 'paylasim', label: 'Paylaşım & izinler' },
  { k: 'sms', label: 'Toplu SMS' },
  { k: 'fiyat', label: 'Fiyatlandırma' },
  { k: 'gunluk', label: 'Günlük' },
];

const tl = (n: number) => '₺' + (n || 0).toLocaleString('tr-TR');
const netOf = (b: number, d: number, a: number) => Math.max(0, Math.round(((b || 0) + (a || 0)) * (1 - (d || 0) / 100)));
const fmtDate = (s?: string | null) => {
  if (!s) return '—';
  try {
    const iso = s.includes('T') ? s : s.replace(' ', 'T') + 'Z';
    return new Date(iso).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return s; }
};

async function api(url: string, opts?: RequestInit): Promise<{ ok: boolean; status: number; d: any }> {
  const r = await fetch(url, { ...opts, headers: { 'Content-Type': 'application/json', ...(opts?.headers || {}) } });
  const d = await r.json().catch(() => ({}));
  return { ok: r.ok, status: r.status, d };
}

export default function AdminPanel() {
  // SSR ile uyum için tema mount sonrası okunur (localStorage sunucuda yok → hidrasyon uyumsuzluğunu önler).
  const [theme, setTheme] = useState<string>('default');
  const [bgPhoto, setBgPhoto] = useState<string | null>(null);
  useEffect(() => { setTheme(lsGet('calmie_home_bgtheme') || 'default'); setBgPhoto(lsGet('siyi_home_bg_v1')); }, []);

  const [phase, setPhase] = useState<'loading' | 'setup' | 'login' | 'ok'>('loading');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [gateErr, setGateErr] = useState('');
  const [gateBusy, setGateBusy] = useState(false);

  const [section, setSection] = useState('genel');
  const [users, setUsers] = useState<User[]>([]);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [shares, setShares] = useState<Share[]>([]);
  const [audit, setAudit] = useState<AuditRow[]>([]);
  const [toast, setToast] = useState('');
  const [editor, setEditor] = useState<{ open: boolean; user: User | null }>({ open: false, user: null });

  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(''), 2600); };
  const userById = useMemo(() => Object.fromEntries(users.map((u) => [u.id, u])), [users]);

  const loadData = async () => {
    const [u, s, a] = await Promise.all([api('/api/admin/users'), api('/api/admin/shares'), api('/api/admin/audit')]);
    if (u.ok) { setUsers(u.d.users || []); setOverview(u.d.overview || null); }
    if (s.ok) setShares(s.d.shares || []);
    if (a.ok) setAudit(a.d.audit || []);
  };

  useEffect(() => {
    (async () => {
      const { d } = await api('/api/admin/auth');
      if (d.authed) { setPhase('ok'); loadData(); }
      else setPhase(d.configured ? 'login' : 'setup');
    })();
  }, []);

  const doLogin = async () => {
    setGateBusy(true); setGateErr('');
    const { ok, d } = await api('/api/admin/auth', { method: 'POST', body: JSON.stringify({ action: 'login', password: pw }) });
    setGateBusy(false);
    if (ok) { setPw(''); setPhase('ok'); loadData(); } else setGateErr(d.error || 'Giriş başarısız.');
  };
  const doSetup = async () => {
    if (pw.length < 6) { setGateErr('Şifre en az 6 karakter olmalı.'); return; }
    if (pw !== pw2) { setGateErr('Şifreler eşleşmiyor.'); return; }
    setGateBusy(true); setGateErr('');
    const { ok, d } = await api('/api/admin/auth', { method: 'POST', body: JSON.stringify({ action: 'set-password', password: pw }) });
    setGateBusy(false);
    if (ok) { setPw(''); setPw2(''); setPhase('ok'); loadData(); } else setGateErr(d.error || 'Hata oluştu.');
  };
  const doLogout = async () => {
    // Admin = terapist hesabı → tek oturum. Çıkış tüm uygulamadan çıkarır.
    try { await api('/api/auth', { method: 'POST', body: JSON.stringify({ action: 'logout' }) }); } catch {}
    window.location.assign('/giris');
  };

  const saveUser = async (form: Partial<User>) => {
    if (form.id) {
      const { ok, d } = await api('/api/admin/users/' + form.id, { method: 'PATCH', body: JSON.stringify(form) });
      if (ok) { flash('Kullanıcı güncellendi.'); setEditor({ open: false, user: null }); loadData(); } else flash(d.error || 'Hata.');
    } else {
      const { ok, d } = await api('/api/admin/users', { method: 'POST', body: JSON.stringify(form) });
      if (ok) { flash('Kullanıcı eklendi.'); setEditor({ open: false, user: null }); loadData(); } else flash(d.error || 'Hata.');
    }
  };
  const removeUser = async (id: string) => {
    const { ok } = await api('/api/admin/users/' + id, { method: 'DELETE' });
    if (ok) { flash('Kullanıcı silindi.'); setEditor({ open: false, user: null }); loadData(); }
  };

  // ── zemin + üst bar (her fazda) ──
  const Chrome = (
    <>
      <div className="app-bg" aria-hidden="true">
        <span className="hb-mesh" />
        <img className="hb-photo" alt="" src={bgPhoto || DEFAULT_BG} />
        <img className="hb-cherry" alt="" src="/tema-cherry.jpg" /><span className="hb-cherry-scrim" />
        <img className="hb-fur" alt="" src="/tema-kurk.jpg" /><span className="hb-fur-scrim" />
        <span className="hb-tint" /><span className="hb-veil" /><span className="hb-grain" />
      </div>
      <header className="adm-top">
        <span className="adm-brand"><b>Calmie</b><i>Yönetim</i><span className="tag">admin</span></span>
        <span className="sp" />
        {phase === 'ok' && <button className="adm-logout" type="button" onClick={doLogout}>Çıkış yap</button>}
      </header>
    </>
  );

  if (phase !== 'ok') {
    const setup = phase === 'setup';
    return (
      <div className="adm cchrome" data-bg={theme === 'default' ? undefined : theme}>
        {Chrome}
        <div className="gate">
          {phase === 'loading' ? (
            <div className="gate-card"><p style={{ margin: 0 }}>Yükleniyor…</p></div>
          ) : (
            <div className="gate-card">
              <div className="lock" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="11" width="16" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
              </div>
              <h2>{setup ? 'Yönetim şifresi belirle' : 'Yönetim girişi'}</h2>
              <p>{setup
                ? 'Bu panel yalnızca sana açık. Devam etmek için bir yönetici şifresi belirle (en az 6 karakter). Şifre sunucuda güvenli biçimde saklanır.'
                : 'Devam etmek için yönetici şifreni gir.'}</p>
              <div className="field">
                <label>Şifre</label>
                <input className="inp" type="password" value={pw} autoFocus
                  onChange={(e) => setPw(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !setup) doLogin(); }}
                  placeholder="••••••••" autoComplete={setup ? 'new-password' : 'current-password'} />
              </div>
              {setup && (
                <div className="field">
                  <label>Şifre (tekrar)</label>
                  <input className="inp" type="password" value={pw2}
                    onChange={(e) => setPw2(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') doSetup(); }}
                    placeholder="••••••••" autoComplete="new-password" />
                </div>
              )}
              {gateErr && <div className="note err">{gateErr}</div>}
              <button className="btn primary" type="button" disabled={gateBusy} onClick={setup ? doSetup : doLogin}>
                {gateBusy ? <><span className="spin" /> Lütfen bekle…</> : setup ? 'Şifreyi belirle ve gir' : 'Giriş yap'}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="adm cchrome" data-bg={theme === 'default' ? undefined : theme}>
      {Chrome}
      <div className="adm-scroll">
        <div className="adm-inner">
          <header className="adm-head">
            <span className="eyebrow">Yönetim · kontrol paneli</span>
            <h1>Hesap <i>yönetimi</i></h1>
            <p className="lead">Terapist, ekip ve müşteri hesaplarını yönet; paylaşım izinlerini ver, toplu SMS gönder, fiyatlandırmayı düzenle. Danışan dosyaları bu panele dahil değildir.</p>
          </header>

          <nav className="adm-tabs">
            {SECTIONS.map((s) => (
              <button key={s.k} type="button" className={'adm-tab' + (section === s.k ? ' on' : '')} onClick={() => setSection(s.k)}>
                {s.label}
                {s.k === 'kullanicilar' && users.length > 0 && <span className="cnt">{users.length}</span>}
                {s.k === 'paylasim' && shares.length > 0 && <span className="cnt">{shares.length}</span>}
              </button>
            ))}
          </nav>

          {section === 'genel' && <GenelBakis overview={overview} users={users} onGoUsers={() => setSection('kullanicilar')} />}
          {section === 'kullanicilar' && (
            <Kullanicilar users={users} onNew={() => setEditor({ open: true, user: null })} onEdit={(u) => setEditor({ open: true, user: u })} />
          )}
          {section === 'paylasim' && <Paylasim users={users} shares={shares} userById={userById} onChange={loadData} flash={flash} />}
          {section === 'sms' && <TopluSms users={users} flash={flash} onSent={loadData} />}
          {section === 'fiyat' && <Fiyatlandirma users={users} onChange={loadData} flash={flash} onEdit={(u) => setEditor({ open: true, user: u })} />}
          {section === 'gunluk' && <Gunluk audit={audit} userById={userById} onRefresh={loadData} />}
        </div>
      </div>

      {editor.open && (
        <UserEditor user={editor.user} onClose={() => setEditor({ open: false, user: null })} onSave={saveUser} onDelete={removeUser} />
      )}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

// ── Genel bakış ──────────────────────────────────────────────────────────
function GenelBakis({ overview, users, onGoUsers }: { overview: Overview | null; users: User[]; onGoUsers: () => void }) {
  const o = overview;
  const recent = users.slice(0, 5);
  return (
    <>
      <div className="adm-stats">
        <div className="stat"><div className="k">Toplam hesap</div><div className="v num">{o?.total ?? 0}</div><div className="sub">{o?.aktif ?? 0} aktif · {o?.askida ?? 0} askıda · {o?.davetli ?? 0} davetli</div></div>
        <div className="stat accent"><div className="k">Aylık gelir (MRR)</div><div className="v num">{tl(o?.mrr ?? 0)}</div><div className="sub">aktif hesapların net toplamı</div></div>
        <div className="stat"><div className="k">Terapist</div><div className="v num">{o?.terapist ?? 0}</div><div className="sub">müşteri terapist hesabı</div></div>
        <div className="stat"><div className="k">Ekip üyesi</div><div className="v num">{o?.ekip ?? 0}</div><div className="sub">{o?.musteri ?? 0} müşteri · {o?.shares ?? 0} paylaşım</div></div>
      </div>
      <section className="adm-card">
        <div className="adm-card-head"><span className="no">·</span><h2>Son eklenenler</h2><span className="sp" /><button className="btn ghost sm" type="button" onClick={onGoUsers}>Tüm kullanıcılar →</button></div>
        {recent.length === 0 ? (
          <p className="empty">Henüz hesap yok. “Kullanıcılar” bölümünden ilk hesabı ekle.</p>
        ) : (
          <div className="tbl-scroll"><table className="tbl">
            <thead><tr><th>Ad</th><th>Rol</th><th>Durum</th><th>Plan</th><th style={{ textAlign: 'right' }}>Net ücret</th></tr></thead>
            <tbody>
              {recent.map((u) => (
                <tr key={u.id}>
                  <td><span className="nm">{u.name}</span>{u.email && <div className="mut">{u.email}</div>}</td>
                  <td><span className="badge role">{ROLE_LBL[u.role] || u.role}</span></td>
                  <td><span className={'badge ' + (STATUS_TONE[u.status] || 'slate')}>{STATUS_LBL[u.status] || u.status}</span></td>
                  <td className="mut">{PLAN_LBL[u.plan] || u.plan}</td>
                  <td className="price" style={{ textAlign: 'right' }}>{tl(u.net_price)}</td>
                </tr>
              ))}
            </tbody>
          </table></div>
        )}
      </section>
    </>
  );
}

// ── Kullanıcılar ─────────────────────────────────────────────────────────
function Kullanicilar({ users, onNew, onEdit }: { users: User[]; onNew: () => void; onEdit: (u: User) => void }) {
  const [q, setQ] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const filtered = users.filter((u) =>
    (!q || (u.name + ' ' + (u.email || '') + ' ' + (u.phone || '')).toLocaleLowerCase('tr-TR').includes(q.toLocaleLowerCase('tr-TR')))
    && (!role || u.role === role) && (!status || u.status === status));
  return (
    <section className="adm-card">
      <div className="adm-card-head"><span className="no">01</span><h2>Kullanıcılar</h2><span className="sp" /><button className="btn primary sm" type="button" onClick={onNew}>+ Yeni kullanıcı</button></div>
      <div className="row" style={{ marginBottom: 16 }}>
        <input className="inp" style={{ flex: '1 1 220px', width: 'auto' }} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ara: ad, e-posta, telefon…" />
        <select className="sel" style={{ width: 'auto', flex: '0 0 auto' }} value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="">Tüm roller</option><option value="terapist">Terapist</option><option value="ekip">Ekip üyesi</option><option value="musteri">Müşteri</option>
        </select>
        <select className="sel" style={{ width: 'auto', flex: '0 0 auto' }} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Tüm durumlar</option><option value="aktif">Aktif</option><option value="askida">Askıda</option><option value="davetli">Davetli</option>
        </select>
      </div>
      {filtered.length === 0 ? (
        <p className="empty">{users.length === 0 ? 'Henüz hesap yok. İlk kullanıcıyı ekle.' : 'Filtreyle eşleşen kullanıcı yok.'}</p>
      ) : (
        <div className="tbl-scroll"><table className="tbl">
          <thead><tr><th>Ad</th><th>İletişim</th><th>Rol</th><th>Durum</th><th>Plan</th><th style={{ textAlign: 'right' }}>Net ücret</th></tr></thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id} className="click" onClick={() => onEdit(u)}>
                <td><span className="nm">{u.name}</span></td>
                <td className="mut">{u.phone || '—'}{u.email && <div>{u.email}</div>}</td>
                <td><span className="badge role">{ROLE_LBL[u.role] || u.role}</span></td>
                <td><span className={'badge ' + (STATUS_TONE[u.status] || 'slate')}>{STATUS_LBL[u.status] || u.status}</span></td>
                <td className="mut">{PLAN_LBL[u.plan] || u.plan}</td>
                <td className="price" style={{ textAlign: 'right' }}>
                  {(u.discount_pct > 0 || u.price_adjust !== 0) && <span className="was">{tl(u.base_price)}</span>}
                  {tl(u.net_price)}
                </td>
              </tr>
            ))}
          </tbody>
        </table></div>
      )}
    </section>
  );
}

// ── Kullanıcı düzenleyici (modal) ──────────────────────────────────────────
function UserEditor({ user, onClose, onSave, onDelete }: { user: User | null; onClose: () => void; onSave: (f: Partial<User>) => void; onDelete: (id: string) => void }) {
  const isNew = !user;
  const [f, setF] = useState({
    name: user?.name || '', email: user?.email || '', phone: user?.phone || '',
    role: user?.role || 'terapist', status: user?.status || 'aktif', plan: user?.plan || 'aylik',
    base_price: user?.base_price ?? 0, discount_pct: user?.discount_pct ?? 0, price_adjust: user?.price_adjust ?? 0,
    notes: user?.notes || '',
  });
  const [confirmDel, setConfirmDel] = useState(false);
  const set = (k: string, v: any) => setF((p) => ({ ...p, [k]: v }));
  const net = netOf(Number(f.base_price), Number(f.discount_pct), Number(f.price_adjust));

  const submit = () => {
    if (!f.name.trim()) return;
    onSave({
      ...(user ? { id: user.id } : {}),
      name: f.name.trim(), email: f.email.trim() || null, phone: f.phone.trim() || null,
      role: f.role, status: f.status, plan: f.plan,
      base_price: Number(f.base_price) || 0, discount_pct: Number(f.discount_pct) || 0, price_adjust: Number(f.price_adjust) || 0,
      notes: f.notes.trim() || null,
    });
  };

  return (
    <div className="ov" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <h3>{isNew ? 'Yeni kullanıcı' : 'Kullanıcıyı düzenle'}</h3>
          <span className="sp" />
          <button className="x" type="button" onClick={onClose} aria-label="Kapat">×</button>
        </div>

        <div className="field"><label>Ad Soyad</label><input className="inp" value={f.name} autoFocus onChange={(e) => set('name', e.target.value)} placeholder="Örn. Dr. Ayşe Yılmaz" /></div>
        <div className="grid2">
          <div className="field"><label>Telefon</label><input className="inp" value={f.phone} onChange={(e) => set('phone', e.target.value)} placeholder="0555…" /></div>
          <div className="field"><label>E-posta <span className="opt">(opsiyonel)</span></label><input className="inp" value={f.email} onChange={(e) => set('email', e.target.value)} placeholder="ad@ornek.com" /></div>
        </div>
        <div className="grid3">
          <div className="field"><label>Rol</label><select className="sel" value={f.role} onChange={(e) => set('role', e.target.value)}><option value="terapist">Terapist</option><option value="ekip">Ekip üyesi</option><option value="musteri">Müşteri</option></select></div>
          <div className="field"><label>Durum</label><select className="sel" value={f.status} onChange={(e) => set('status', e.target.value)}><option value="aktif">Aktif</option><option value="askida">Askıda</option><option value="davetli">Davetli</option></select></div>
          <div className="field"><label>Plan</label><select className="sel" value={f.plan} onChange={(e) => set('plan', e.target.value)}><option value="aylik">Aylık</option><option value="yillik">Yıllık</option><option value="deneme">Deneme</option></select></div>
        </div>

        <div className="adm-card-head" style={{ margin: '6px 0 10px' }}><span className="no">₺</span><h2 style={{ fontSize: 16 }}>Fiyatlandırma</h2></div>
        <div className="grid3">
          <div className="field"><label>Temel ücret (₺)</label><input className="inp" type="number" min={0} value={f.base_price} onChange={(e) => set('base_price', e.target.value)} /></div>
          <div className="field"><label>İndirim (%)</label><input className="inp" type="number" min={0} max={100} value={f.discount_pct} onChange={(e) => set('discount_pct', e.target.value)} /></div>
          <div className="field"><label>Manuel düzeltme (₺)</label><input className="inp" type="number" value={f.price_adjust} onChange={(e) => set('price_adjust', e.target.value)} /></div>
        </div>
        <div className="pricebox">
          <div className="pr-net"><b>{tl(net)}</b><span>net ücret</span></div>
          <div className="pr-calc">{tl(Number(f.base_price) || 0)} temel{Number(f.price_adjust) ? ` ${Number(f.price_adjust) > 0 ? '+' : '−'} ${tl(Math.abs(Number(f.price_adjust)))} düzeltme` : ''}{Number(f.discount_pct) ? ` − %${f.discount_pct} indirim` : ''}</div>
        </div>

        <div className="field" style={{ marginTop: 16 }}><label>Not <span className="opt">(opsiyonel)</span></label><textarea className="ta" style={{ minHeight: 70 }} value={f.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Hesapla ilgili dahili not…" /></div>

        <div className="sheet-foot">
          {!isNew && (
            confirmDel
              ? <button className="btn danger sm" type="button" onClick={() => onDelete(user!.id)}>Evet, sil</button>
              : <button className="btn danger sm" type="button" onClick={() => setConfirmDel(true)}>Sil</button>
          )}
          <span className="sp" />
          <button className="btn ghost" type="button" onClick={onClose}>Vazgeç</button>
          <button className="btn primary" type="button" onClick={submit} disabled={!f.name.trim()}>{isNew ? 'Kullanıcı ekle' : 'Kaydet'}</button>
        </div>
      </div>
    </div>
  );
}

// ── Paylaşım & izinler ─────────────────────────────────────────────────────
function Paylasim({ users, shares, userById, onChange, flash }: { users: User[]; shares: Share[]; userById: Record<string, User>; onChange: () => void; flash: (m: string) => void }) {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [perm, setPerm] = useState('goruntule');
  const [scope, setScope] = useState('tum');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const add = async () => {
    if (!from || !to) { flash('Paylaşan ve paylaşılan seçilmeli.'); return; }
    if (from === to) { flash('Kullanıcı kendisiyle paylaşamaz.'); return; }
    setBusy(true);
    const { ok, d } = await api('/api/admin/shares', { method: 'POST', body: JSON.stringify({ from_user_id: from, to_user_id: to, permission: perm, scope, note: note.trim() || null }) });
    setBusy(false);
    if (ok) { flash('Paylaşım izni verildi.'); setTo(''); setNote(''); onChange(); } else flash(d.error || 'Hata.');
  };
  const del = async (id: string) => {
    const { ok } = await api('/api/admin/shares?id=' + encodeURIComponent(id), { method: 'DELETE' });
    if (ok) { flash('Paylaşım kaldırıldı.'); onChange(); }
  };

  return (
    <>
      <section className="adm-card">
        <div className="adm-card-head"><span className="no">02</span><h2>Yeni paylaşım izni</h2></div>
        <p className="adm-card-lead">Bir kullanıcının içeriğini (dosya/şablon paylaşımları) başka bir kullanıcıya açar. İzin seviyesini sen belirlersin.</p>
        <div className="grid2">
          <div className="field"><label>Paylaşan</label><select className="sel" value={from} onChange={(e) => setFrom(e.target.value)}><option value="">Seç…</option>{users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</select></div>
          <div className="field"><label>Paylaşılan</label><select className="sel" value={to} onChange={(e) => setTo(e.target.value)}><option value="">Seç…</option>{users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</select></div>
        </div>
        <div className="grid2">
          <div className="field"><label>Kapsam <span className="opt">(ne paylaşılıyor)</span></label><select className="sel" value={scope} onChange={(e) => setScope(e.target.value)}><option value="tum">Tümü</option><option value="tasarim">Tasarım dosyaları</option><option value="sablon">Şablonlar</option><option value="mudahale">Müdahale kütüphanesi</option></select></div>
          <div className="field"><label>İzin seviyesi</label><select className="sel" value={perm} onChange={(e) => setPerm(e.target.value)}><option value="goruntule">Görüntüleme</option><option value="duzenle">Düzenleme</option><option value="tam">Tam erişim</option></select></div>
        </div>
        <div className="field"><label>Not <span className="opt">(opsiyonel)</span></label><input className="inp" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Paylaşıma dair kısa not…" /></div>
        <div className="row end"><button className="btn primary" type="button" disabled={busy} onClick={add}>{busy ? <><span className="spin" /> Veriliyor…</> : 'İzin ver'}</button></div>
      </section>

      <section className="adm-card">
        <div className="adm-card-head"><span className="no">·</span><h2>Mevcut paylaşımlar</h2><span className="sp" /><span className="badge slate">{shares.length}</span></div>
        {shares.length === 0 ? (
          <p className="empty">Henüz paylaşım izni yok.</p>
        ) : (
          <div className="tbl-scroll"><table className="tbl">
            <thead><tr><th>Paylaşan</th><th>Paylaşılan</th><th>Kapsam</th><th>İzin</th><th>Not</th><th>Tarih</th><th></th></tr></thead>
            <tbody>
              {shares.map((s) => (
                <tr key={s.id}>
                  <td className="nm">{userById[s.from_user_id]?.name || '—'}</td>
                  <td className="nm">{userById[s.to_user_id]?.name || '—'}</td>
                  <td><span className="badge role">{SCOPE_LBL[s.scope] || s.scope || 'Tümü'}</span></td>
                  <td><span className="badge slate">{PERM_LBL[s.permission] || s.permission}</span></td>
                  <td className="mut">{s.note || '—'}</td>
                  <td className="mut">{fmtDate(s.created_at)}</td>
                  <td style={{ textAlign: 'right' }}><button className="btn danger sm" type="button" onClick={() => del(s.id)}>Kaldır</button></td>
                </tr>
              ))}
            </tbody>
          </table></div>
        )}
      </section>
    </>
  );
}

// ── Toplu SMS ──────────────────────────────────────────────────────────────
function TopluSms({ users, flash, onSent }: { users: User[]; flash: (m: string) => void; onSent: () => void }) {
  const [msg, setMsg] = useState('');
  const [roles, setRoles] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ total: number; sent: number; failed: number } | null>(null);

  const toggle = (arr: string[], v: string, set: (a: string[]) => void) => set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  const targets = users.filter((u) => u.phone && String(u.phone).trim()
    && (!roles.length || roles.includes(u.role)) && (!statuses.length || statuses.includes(u.status)));

  const send = async () => {
    if (!msg.trim()) { flash('Mesaj boş olamaz.'); return; }
    setSending(true); setResult(null);
    const { ok, d } = await api('/api/admin/broadcast', { method: 'POST', body: JSON.stringify({ message: msg, roles, statuses }) });
    setSending(false);
    if (ok) { setResult({ total: d.total, sent: d.sent, failed: d.failed }); flash(`${d.sent}/${d.total} gönderildi.`); onSent(); }
    else flash(d.error || 'Gönderilemedi.');
  };

  const chip = (label: string, on: boolean, fn: () => void) => (
    <button type="button" className={'adm-tab' + (on ? ' on' : '')} onClick={fn} style={{ boxShadow: on ? undefined : 'var(--sh-inset-sm)', background: on ? undefined : 'var(--well)' }}>{label}</button>
  );

  return (
    <section className="adm-card">
      <div className="adm-card-head"><span className="no">03</span><h2>Toplu SMS</h2></div>
      <p className="adm-card-lead">Telefon kayıtlı hesaplara tek mesaj gönderir. Filtre seçmezsen tüm hesaplara gider. Netgsm hattını kullanır (Ayarlar → Bildirim &amp; SMS).</p>

      <div className="field"><label>Roller <span className="opt">(boş = hepsi)</span></label>
        <div className="row">{['terapist', 'ekip', 'musteri'].map((r) => chip(ROLE_LBL[r], roles.includes(r), () => toggle(roles, r, setRoles)))}</div>
      </div>
      <div className="field"><label>Durumlar <span className="opt">(boş = hepsi)</span></label>
        <div className="row">{['aktif', 'askida', 'davetli'].map((s) => chip(STATUS_LBL[s], statuses.includes(s), () => toggle(statuses, s, setStatuses)))}</div>
      </div>
      <div className="field"><label>Mesaj</label><textarea className="ta" value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Tüm kullanıcılara gidecek mesaj…" /><p className="hint">{msg.length} karakter · ~{Math.max(1, Math.ceil(msg.length / 160))} SMS kredisi / kişi</p></div>

      <div className="row end" style={{ alignItems: 'center' }}>
        <span className="hint" style={{ marginRight: 'auto' }}>Bu gönderim <b>{targets.length}</b> hesaba ulaşacak{users.length - targets.length > 0 ? ` (${users.length - targets.length} hesap telefonsuz/filtre dışı)` : ''}.</span>
        <button className="btn primary" type="button" disabled={sending || targets.length === 0} onClick={send}>{sending ? <><span className="spin" /> Gönderiliyor…</> : `Gönder (${targets.length})`}</button>
      </div>
      {result && <div className={'note ' + (result.failed ? 'err' : 'ok')}>{result.total} hesap denendi · {result.sent} başarılı{result.failed ? ` · ${result.failed} başarısız` : ''}.</div>}
    </section>
  );
}

// ── Günlük (denetim) ───────────────────────────────────────────────────────
const ACTION_LBL: Record<string, string> = {
  'user.create': 'Kullanıcı eklendi', 'user.update': 'Kullanıcı güncellendi', 'user.delete': 'Kullanıcı silindi',
  'price.change': 'Fiyat değişti', 'share.create': 'Paylaşım izni verildi', 'share.delete': 'Paylaşım kaldırıldı',
  'broadcast.send': 'Toplu SMS gönderildi', 'auth.login': 'Yönetici girişi',
};
const ACTION_TONE: Record<string, string> = {
  'user.create': 'green', 'user.delete': 'red', 'price.change': 'amber', 'share.create': 'role',
  'share.delete': 'red', 'broadcast.send': 'role', 'auth.login': 'slate', 'user.update': 'slate',
};
const fmtDateTime = (s?: string | null) => {
  if (!s) return '—';
  try { const iso = s.includes('T') ? s : s.replace(' ', 'T') + 'Z'; return new Date(iso).toLocaleString('tr-TR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }); } catch { return s; }
};
function auditDetail(a: AuditRow, userById: Record<string, User>): string {
  let d: any = null; try { d = a.detail ? JSON.parse(a.detail) : null; } catch { /* ham metin */ }
  const nm = (id: string | null) => (id ? userById[id]?.name || '—' : '—');
  switch (a.action) {
    case 'user.create': return `${d?.name ?? nm(a.target_id)} · ${ROLE_LBL[d?.role] || d?.role || ''}`;
    case 'user.update': return Array.isArray(d) ? d.join(', ') : nm(a.target_id);
    case 'user.delete': return d?.name ?? '';
    case 'price.change': {
      if (!d) return nm(a.target_id);
      const extra = d.bulk ? ` · toplu ${d.type === 'zam' ? 'zam' : 'indirim'} ${d.mode === 'pct' ? '%' + d.value : tl(d.value)}` : '';
      return `${nm(a.target_id)}: ${tl(d.before?.net || 0)} → ${tl(d.after?.net || 0)} net${extra}`;
    }
    case 'share.create': return `${d?.from ?? '—'} → ${d?.to ?? '—'} · ${SCOPE_LBL[d?.scope] || 'Tümü'} · ${PERM_LBL[d?.permission] || d?.permission || ''}`;
    case 'broadcast.send': return `${d?.sent ?? 0}/${d?.count ?? 0} gönderildi${d?.failed ? ` · ${d.failed} başarısız` : ''}${d?.message ? ` — “${d.message}”` : ''}`;
    case 'share.delete':
    case 'auth.login': return '';
    default: return a.detail || '';
  }
}
function Gunluk({ audit, userById, onRefresh }: { audit: AuditRow[]; userById: Record<string, User>; onRefresh: () => void }) {
  return (
    <section className="adm-card">
      <div className="adm-card-head"><span className="no">05</span><h2>Denetim günlüğü</h2><span className="sp" /><button className="btn ghost sm" type="button" onClick={onRefresh}>Yenile</button></div>
      <p className="adm-card-lead">Panelde yapılan her işlem (kullanıcı, fiyat, paylaşım, toplu SMS, giriş) zaman damgasıyla kayıtlıdır. Son {audit.length} kayıt gösteriliyor.</p>
      {audit.length === 0 ? <p className="empty">Henüz kayıt yok.</p> : (
        <div className="tbl-scroll"><table className="tbl">
          <thead><tr><th>İşlem</th><th>Ayrıntı</th><th>Zaman</th></tr></thead>
          <tbody>
            {audit.map((a) => (
              <tr key={a.id}>
                <td><span className={'badge ' + (ACTION_TONE[a.action] || 'slate')}>{ACTION_LBL[a.action] || a.action}</span></td>
                <td className="mut">{auditDetail(a, userById) || '—'}</td>
                <td className="mut">{fmtDateTime(a.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table></div>
      )}
    </section>
  );
}

// ── Fiyatlandırma ──────────────────────────────────────────────────────────
function Fiyatlandirma({ users, onChange, flash, onEdit }: { users: User[]; onChange: () => void; flash: (m: string) => void; onEdit: (u: User) => void }) {
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [type, setType] = useState('zam');
  const [mode, setMode] = useState('pct');
  const [value, setValue] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const toggle = (id: string) => setSel((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const allChecked = users.length > 0 && sel.size === users.length;
  const toggleAll = () => setSel(allChecked ? new Set() : new Set(users.map((u) => u.id)));

  const apply = async () => {
    const v = Number(value);
    if (!isFinite(v) || v <= 0) { flash('Geçerli bir değer gir.'); return; }
    const ids = sel.size ? [...sel] : users.map((u) => u.id);
    if (!ids.length) { flash('Kullanıcı yok.'); return; }
    setBusy(true);
    const { ok, d } = await api('/api/admin/pricing', { method: 'POST', body: JSON.stringify({ ids, type, mode, value: v, note: note.trim() || null }) });
    setBusy(false);
    if (ok) { flash(`${d.changed} hesaba ${type === 'zam' ? 'zam' : 'indirim'} uygulandı.`); setValue(''); setNote(''); setSel(new Set()); onChange(); }
    else flash(d.error || 'Hata.');
  };

  const scopeLabel = sel.size ? `${sel.size} seçili hesap` : 'tüm hesaplar';

  return (
    <>
      <section className="adm-card">
        <div className="adm-card-head"><span className="no">04</span><h2>Toplu fiyat değişikliği</h2></div>
        <p className="adm-card-lead">Seçili hesaplara (hiç seçmezsen tümüne) zam veya indirim uygula. Temel ücret üzerinde çalışır; her değişiklik denetim günlüğüne yazılır.</p>
        <div className="row" style={{ gap: 14 }}>
          <div className="seg"><button className={type === 'zam' ? 'on' : ''} onClick={() => setType('zam')}>Zam</button><button className={type === 'indirim' ? 'on' : ''} onClick={() => setType('indirim')}>İndirim</button></div>
          <div className="seg"><button className={mode === 'pct' ? 'on' : ''} onClick={() => setMode('pct')}>Yüzde %</button><button className={mode === 'tl' ? 'on' : ''} onClick={() => setMode('tl')}>Sabit ₺</button></div>
          <input className="inp" type="number" min={0} style={{ width: 'auto', flex: '0 1 140px' }} value={value} onChange={(e) => setValue(e.target.value)} placeholder={mode === 'pct' ? '%' : '₺'} />
          <input className="inp" style={{ width: 'auto', flex: '1 1 180px' }} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Not (opsiyonel)…" />
          <button className="btn primary" type="button" disabled={busy} onClick={apply}>{busy ? <><span className="spin" /> Uygulanıyor…</> : 'Uygula'}</button>
        </div>
        <p className="hint" style={{ marginTop: 12 }}>Hedef: <b>{scopeLabel}</b>. Aşağıdaki tablodan tek tek seçebilirsin.</p>
      </section>

      <section className="adm-card">
        <div className="adm-card-head"><span className="no">·</span><h2>Hesap ücretleri</h2><span className="sp" /><span className="badge slate">{users.length} hesap</span></div>
        {users.length === 0 ? (
          <p className="empty">Henüz hesap yok.</p>
        ) : (
          <div className="tbl-scroll"><table className="tbl">
            <thead><tr>
              <th style={{ width: 28 }}><input type="checkbox" className="tbl-check" checked={allChecked} onChange={toggleAll} /></th>
              <th>Ad</th><th>Temel</th><th>İndirim</th><th>Düzeltme</th><th style={{ textAlign: 'right' }}>Net</th><th></th>
            </tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td><input type="checkbox" className="tbl-check" checked={sel.has(u.id)} onChange={() => toggle(u.id)} /></td>
                  <td><span className="nm">{u.name}</span> <span className="badge role">{ROLE_LBL[u.role] || u.role}</span></td>
                  <td className="num">{tl(u.base_price)}</td>
                  <td className="mut num">{u.discount_pct ? `%${u.discount_pct}` : '—'}</td>
                  <td className="mut num">{u.price_adjust ? (u.price_adjust > 0 ? '+' : '−') + tl(Math.abs(u.price_adjust)) : '—'}</td>
                  <td className="price" style={{ textAlign: 'right' }}>{tl(u.net_price)}</td>
                  <td style={{ textAlign: 'right' }}><button className="btn ghost sm" type="button" onClick={() => onEdit(u)}>Düzenle</button></td>
                </tr>
              ))}
            </tbody>
          </table></div>
        )}
      </section>
    </>
  );
}
