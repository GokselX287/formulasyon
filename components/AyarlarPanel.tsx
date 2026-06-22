'use client';

import { useEffect, useRef, useState } from 'react';
import './CalmieChrome.css';
import './AyarlarPanel.css';

// ──────────────────────────────────────────────────────────────────────────
// Ayarlar — editöryel ayar sayfası. Tema mesh zemin + üst menü (Ana Sayfa ile
// aynı dock) + kabartılı beyaz nöromorfik ayar kartları. Tüm alanlar
// /api/settings ile gerçek çalışır (onUpdateSetting). Tema localStorage'da.
// ──────────────────────────────────────────────────────────────────────────

export type AyarlarSettings = {
  therapistName: string;
  smsWebhookUrl: string;
  netgsmUser: string;
  netgsmPassword: string;
  netgsmHeader: string;
  smsAutoAppointmentReminder: boolean;
  smsAutoWorkshopSignup: boolean;
  smsDayOfReminder: boolean;
  noShowTracking: boolean;
};

export type AyarlarPanelProps = {
  settings: AyarlarSettings;
  onUpdateSetting: (patch: Partial<AyarlarSettings>) => void | Promise<void>;
  onNav?: (target: string) => void;
  onOpenProfile?: () => void;
  onExportData?: () => void;
  onBack?: () => void;
  backLabel?: string;
};

const DEFAULT_BG = '/calmie-hero-default.jpg';
const lsGet = (k: string): string | null => { try { return typeof window !== 'undefined' ? localStorage.getItem(k) : null; } catch { return null; } };

const DOCK = [
  { label: 'Ana Sayfa', target: 'home' },
  { label: 'Çalışma Alanı', target: 'calisma-alani' },
  { label: 'Profil', target: 'terapist' },
  { label: 'Ayarlar', target: 'ayarlar', active: true },
];

const THEMES = [
  { k: 'default', sw: 'linear-gradient(135deg,#E58BA6,#F3B49B)', t: 'Sıcak (varsayılan)' },
  { k: 'mavi', sw: 'linear-gradient(135deg,#1E2C5E,#7E3A66 62%,#B23E66)', t: 'Cherry · gece mavisi' },
  { k: 'gri', sw: 'linear-gradient(135deg,#A6B2C0,#DEE3E8)', t: 'Kürk · soft blue' },
  { k: 'su', sw: 'linear-gradient(135deg,#3FA89E,#8ED8CC)', t: 'Su yeşili' },
  { k: 'koyu', sw: 'linear-gradient(135deg,#2C5040,#5E9670)', t: 'Koyu yeşil' },
];

const initials = (n: string) => (n || 'GA').trim().split(/\s+/).map((w) => w[0] || '').join('').slice(0, 2).toUpperCase();

export default function AyarlarPanel({ settings, onUpdateSetting, onNav, onOpenProfile, onExportData, onBack, backLabel }: AyarlarPanelProps) {
  // paylaşımlı tema + arkaplan görseli
  const [theme, setTheme] = useState<string>(() => lsGet('calmie_home_bgtheme') || 'default');
  const [bgPhoto] = useState<string | null>(() => lsGet('siyi_home_bg_v1'));
  const commitTheme = (v: string) => { setTheme(v); try { localStorage.setItem('calmie_home_bgtheme', v); } catch {} };

  // yerel form alanları (settings'i yansıtır; blur/değişimde kaydeder)
  const [name, setName] = useState(settings.therapistName || '');
  const [photo, setPhoto] = useState<string | null>(null);
  const [ng, setNg] = useState({ user: settings.netgsmUser || '', pass: settings.netgsmPassword || '', header: settings.netgsmHeader || '', webhook: settings.smsWebhookUrl || '' });
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setName(settings.therapistName || ''); }, [settings.therapistName]);
  useEffect(() => { setNg({ user: settings.netgsmUser || '', pass: settings.netgsmPassword || '', header: settings.netgsmHeader || '', webhook: settings.smsWebhookUrl || '' }); }, [settings.netgsmUser, settings.netgsmPassword, settings.netgsmHeader, settings.smsWebhookUrl]);
  useEffect(() => { try { setPhoto(lsGet('tp-profile-photo')); } catch {} }, []);

  // ── menü glider (Ana Sayfa ile aynı) ──
  const menuRef = useRef<HTMLElement>(null);
  const gliderRef = useRef<HTMLSpanElement>(null);
  const activeLink = () => (menuRef.current?.querySelector('a.active') || menuRef.current?.querySelector('a')) as HTMLElement | null;
  const moveGlider = (a: HTMLElement | null, instant = false) => {
    const g = gliderRef.current; if (!g || !a) return;
    if (instant) g.style.transition = 'none';
    g.style.width = a.offsetWidth + 'px';
    g.style.transform = `translateX(${a.offsetLeft}px)`;
    g.classList.add('on');
    menuRef.current?.querySelectorAll('a').forEach((l) => l.classList.toggle('lit', l === a));
    if (instant) { void g.offsetWidth; g.style.transition = ''; }
  };
  useEffect(() => {
    moveGlider(activeLink(), true);
    const onR = () => moveGlider(activeLink(), true);
    window.addEventListener('resize', onR);
    (document as any).fonts?.ready?.then(() => moveGlider(activeLink(), true));
    return () => window.removeEventListener('resize', onR);
  }, []);

  const pickPhoto = (file?: File) => {
    if (!file) return;
    const r = new FileReader();
    r.onload = () => { const v = typeof r.result === 'string' ? r.result : null; setPhoto(v); try { if (v) localStorage.setItem('tp-profile-photo', v); } catch {} };
    r.readAsDataURL(file);
  };

  const saveName = () => { const v = name.trim() || 'Terapist'; onUpdateSetting({ therapistName: v }); };
  const saveNg = (patch: Partial<AyarlarSettings>) => onUpdateSetting(patch);

  // test SMS
  const [testPhone, setTestPhone] = useState('0554 195 18 54');
  const [testing, setTesting] = useState(false);
  const [testMsg, setTestMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const smsReady = (ng.user.trim() && ng.header.trim()) || ng.webhook.trim();
  const sendTestSms = async () => {
    if (!testPhone.trim() || testing) return;
    setTesting(true); setTestMsg(null);
    try {
      const r = await fetch('/api/sms', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: testPhone.trim(), name: 'Test', message: 'Calmie test mesajı — SMS kurulumunuz çalışıyor. ✓', trigger_type: 'manual' }),
      });
      const d = await r.json().catch(() => ({}));
      if (d.ok) setTestMsg({ ok: true, text: 'Gönderildi ✓' + (d.jobid ? ` · jobid ${d.jobid}` : '') });
      else setTestMsg({ ok: false, text: d.error || 'Gönderilemedi' });
    } catch (e: any) {
      setTestMsg({ ok: false, text: e?.message ?? 'Ağ hatası' });
    } finally { setTesting(false); }
  };

  // hesap güvenliği — çıkış + şifre değiştir
  const [acctEmail, setAcctEmail] = useState('');
  const [pwCur, setPwCur] = useState('');
  const [pwNew, setPwNew] = useState('');
  const [pwBusy, setPwBusy] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);
  useEffect(() => { fetch('/api/auth').then((r) => r.json()).then((d) => setAcctEmail(d.email || '')).catch(() => {}); }, []);
  const doLogout = async () => {
    try { await fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'logout' }) }); } catch {}
    window.location.assign('/giris');
  };
  const doChangePw = async () => {
    if (pwNew.length < 8) { setPwMsg({ ok: false, text: 'Yeni şifre en az 8 karakter olmalı.' }); return; }
    setPwBusy(true); setPwMsg(null);
    try {
      const r = await fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'change-password', password: pwCur, newPassword: pwNew }) });
      const d = await r.json().catch(() => ({}));
      if (d.ok) { setPwMsg({ ok: true, text: 'Şifre güncellendi ✓' }); setPwCur(''); setPwNew(''); }
      else setPwMsg({ ok: false, text: d.error || 'Güncellenemedi.' });
    } catch (e: any) { setPwMsg({ ok: false, text: e?.message ?? 'Ağ hatası' }); }
    finally { setPwBusy(false); }
  };

  const Toggle = ({ on, onToggle, label, hint }: { on: boolean; onToggle: (v: boolean) => void; label: string; hint?: string }) => (
    <label className="ay-toggle">
      <input type="checkbox" checked={on} onChange={(e) => onToggle(e.target.checked)} />
      <span className="track" />
      <span className="tx"><b>{label}</b>{hint && <span className="hint">{hint}</span>}</span>
    </label>
  );

  return (
    <div className="ayr cchrome" data-bg={theme === 'default' ? undefined : theme}>
      {/* tema mesh/foto zemin — paylaşımlı */}
      <div className="app-bg" aria-hidden="true">
        <span className="hb-mesh" />
        <img className="hb-photo" alt="" src={bgPhoto || DEFAULT_BG} />
        <img className="hb-cherry" alt="" src="/tema-cherry.jpg" /><span className="hb-cherry-scrim" />
        <img className="hb-fur" alt="" src="/tema-kurk.jpg" /><span className="hb-fur-scrim" />
        <span className="hb-tint" /><span className="hb-veil" /><span className="hb-grain" />
      </div>

      {/* üst menü — Ana Sayfa dock'u ile aynı */}
      <header className="page-menu">
        <span className="pm-brand"><b>Calmie</b><i>.</i></span>
        <nav className="pm-nav" aria-label="Sayfa menüsü" ref={menuRef} onMouseLeave={() => moveGlider(activeLink())}>
          <span className="pm-glider" ref={gliderRef} aria-hidden="true" />
          {DOCK.map((d) => (
            <a key={d.target} href="#" className={d.active ? 'active' : ''} onMouseEnter={(e) => moveGlider(e.currentTarget)}
              onClick={(e) => { e.preventDefault(); if (!d.active) onNav?.(d.target); }}>{d.label}</a>
          ))}
        </nav>
      </header>

      {/* içerik */}
      <div className="ay-scroll">
        <div className="ay-inner">
          <header className="ay-head">
            {onBack && (
              <button type="button" className="ay-back" onClick={() => onBack()}>
                <span aria-hidden="true">‹</span>{backLabel ?? 'Geri'}
              </button>
            )}
            <span className="eyebrow">Hesap · tercihler</span>
            <h1>Ayarlar</h1>
            <p className="ay-lead">Profilini, bildirim kanallarını ve görünümünü tek yerden yönet. Değişiklikler anında kaydedilir.</p>
          </header>

          {/* PROFİL */}
          <section className="ay-card">
            <div className="ay-card-head"><span className="ay-no">01</span><h2>Profil</h2></div>
            <div className="ay-portrait">
              <div className="tile">{photo ? <img alt="" src={photo} /> : <span>{initials(name)}</span>}</div>
              <div className="pcol">
                <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => pickPhoto(e.target.files?.[0])} />
                <button className="ay-btn ghost sm" type="button" onClick={() => fileRef.current?.click()}>Fotoğraf yükle</button>
                {photo && <button className="ay-btn text sm" type="button" onClick={() => { setPhoto(null); try { localStorage.removeItem('tp-profile-photo'); } catch {} }}>Kaldır</button>}
              </div>
            </div>
            <div className="ay-field">
              <label htmlFor="ay-name">Ad Soyad</label>
              <input id="ay-name" className="ay-input" value={name} onChange={(e) => setName(e.target.value)} onBlur={saveName}
                onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }} placeholder="Göksel Akkaya" />
              <p className="ay-hint">Ana sayfa, çalışma alanı ve selamlamalarda kullanılır.</p>
            </div>
            <div className="ay-row">
              <button className="ay-btn ghost sm" type="button" onClick={() => onOpenProfile?.()}>Tüm profili düzenle →</button>
            </div>
          </section>

          {/* BİLDİRİM & SMS */}
          <section className="ay-card">
            <div className="ay-card-head"><span className="ay-no">02</span><h2>Bildirim &amp; SMS</h2></div>
            <p className="ay-card-lead">Danışanlara otomatik SMS göndermek için Netgsm bilgilerini gir. Başlık, Netgsm'de onaylı "bilgilendirme" tipli olmalıdır.</p>
            <div className="ay-grid2">
              <div className="ay-field">
                <label htmlFor="ay-ng-user">Netgsm kullanıcı kodu</label>
                <input id="ay-ng-user" className="ay-input" value={ng.user} onChange={(e) => setNg({ ...ng, user: e.target.value })} onBlur={() => saveNg({ netgsmUser: ng.user })} placeholder="850XXXXXXX" autoComplete="off" />
              </div>
              <div className="ay-field">
                <label htmlFor="ay-ng-pass">Netgsm API şifresi</label>
                <input id="ay-ng-pass" className="ay-input" type="password" value={ng.pass} onChange={(e) => setNg({ ...ng, pass: e.target.value })} onBlur={() => saveNg({ netgsmPassword: ng.pass })} placeholder="••••••••" autoComplete="off" />
              </div>
              <div className="ay-field">
                <label htmlFor="ay-ng-header">Mesaj başlığı</label>
                <input id="ay-ng-header" className="ay-input" value={ng.header} onChange={(e) => setNg({ ...ng, header: e.target.value })} onBlur={() => saveNg({ netgsmHeader: ng.header })} placeholder="onaylı başlık" autoComplete="off" />
              </div>
              <div className="ay-field">
                <label htmlFor="ay-ng-webhook">Yedek webhook URL <span className="opt">· opsiyonel</span></label>
                <input id="ay-ng-webhook" className="ay-input" value={ng.webhook} onChange={(e) => setNg({ ...ng, webhook: e.target.value })} onBlur={() => saveNg({ smsWebhookUrl: ng.webhook })} placeholder="https://…" autoComplete="off" />
              </div>
            </div>

            <div className="ay-test">
              <span className="ay-test-lbl">Test SMS</span>
              <input className="ay-input ay-test-inp" value={testPhone} onChange={(e) => setTestPhone(e.target.value)} placeholder="05__ ___ __ __" />
              <button className="ay-btn primary sm" type="button" disabled={!smsReady || testing} onClick={sendTestSms}>{testing ? 'Gönderiliyor…' : 'Gönder'}</button>
              {testMsg && <span className={`ay-test-res ${testMsg.ok ? 'ok' : 'err'}`}>{testMsg.text}</span>}
              {!smsReady && <span className="ay-test-res muted">Önce kullanıcı kodu + başlık (veya webhook) gir.</span>}
            </div>

            <div className="ay-toggles">
              <Toggle on={settings.smsAutoAppointmentReminder} onToggle={(v) => onUpdateSetting({ smsAutoAppointmentReminder: v })} label="Randevu hatırlatma" hint="Seanstan önce danışana otomatik SMS" />
              <Toggle on={settings.smsDayOfReminder} onToggle={(v) => onUpdateSetting({ smsDayOfReminder: v })} label="Seans günü hatırlatması" hint="Seans günü sabahı kısa anımsatma" />
              <Toggle on={settings.smsAutoWorkshopSignup} onToggle={(v) => onUpdateSetting({ smsAutoWorkshopSignup: v })} label="Atölye kaydı bildirimi" hint="Atölye kaydı yapıldığında SMS" />
            </div>
          </section>

          {/* GÖRÜNÜM & TERCİHLER */}
          <section className="ay-card">
            <div className="ay-card-head"><span className="ay-no">03</span><h2>Görünüm &amp; tercihler</h2></div>
            <div className="ay-field">
              <label>Arka plan teması</label>
              <p className="ay-hint" style={{ marginBottom: 12 }}>Ana sayfa, çalışma alanı ve tüm modal sayfalarda paylaşılır.</p>
              <div className="ay-swatches" role="group" aria-label="Arka plan teması">
                {THEMES.map((t) => (
                  <button key={t.k} type="button" className={`ay-sw${theme === t.k ? ' on' : ''}`} title={t.t} aria-label={t.t}
                    style={{ ['--sw' as any]: t.sw }} onClick={() => commitTheme(t.k)} />
                ))}
              </div>
            </div>
            <div className="ay-toggles">
              <Toggle on={settings.noShowTracking} onToggle={(v) => onUpdateSetting({ noShowTracking: v })} label="Gelmeyen seans takibi" hint="Devamsızlık ve mazeret kayıtlarını izle" />
            </div>
          </section>

          {/* VERİ */}
          <section className="ay-card">
            <div className="ay-card-head"><span className="ay-no">04</span><h2>Veri</h2></div>
            <p className="ay-card-lead">Tüm danışan, seans ve formülasyon verisi cihazında SQLite'ta yerel tutulur. İstediğin an JSON olarak dışa aktarabilirsin.</p>
            <div className="ay-row">
              <button className="ay-btn ghost sm" type="button" onClick={() => onExportData?.()}>Verileri dışa aktar (JSON)</button>
            </div>
          </section>

          {/* HESAP GÜVENLİĞİ */}
          <section className="ay-card">
            <div className="ay-card-head"><span className="ay-no">05</span><h2>Hesap güvenliği</h2></div>
            <p className="ay-card-lead">{acctEmail ? <>Giriş e-postan: <b>{acctEmail}</b>. Şifreni değiştirebilir ya da oturumunu kapatabilirsin.</> : 'Oturum ve şifre yönetimi.'}</p>
            <div className="ay-grid2">
              <div className="ay-field">
                <label htmlFor="ay-pw-cur">Mevcut şifre</label>
                <input id="ay-pw-cur" className="ay-input" type="password" value={pwCur} onChange={(e) => setPwCur(e.target.value)} placeholder="••••••••" autoComplete="current-password" />
              </div>
              <div className="ay-field">
                <label htmlFor="ay-pw-new">Yeni şifre <span className="opt">(en az 8 karakter)</span></label>
                <input id="ay-pw-new" className="ay-input" type="password" value={pwNew} onChange={(e) => setPwNew(e.target.value)} placeholder="••••••••" autoComplete="new-password" />
              </div>
            </div>
            <div className="ay-row" style={{ marginTop: 4, alignItems: 'center', gap: 12 }}>
              <button className="ay-btn primary sm" type="button" disabled={pwBusy || !pwCur || !pwNew} onClick={doChangePw}>{pwBusy ? 'Güncelleniyor…' : 'Şifreyi değiştir'}</button>
              <a className="ay-btn ghost sm" href="/admin">Yönetim paneli →</a>
              <button className="ay-btn ghost sm" type="button" onClick={doLogout}>Çıkış yap</button>
              {pwMsg && <span style={{ fontSize: 12.5, color: pwMsg.ok ? '#2F7A4A' : '#B23B3B' }}>{pwMsg.text}</span>}
            </div>
            <p className="ay-hint" style={{ marginTop: 10 }}>Yönetim paneli (hesaplar, paylaşım izinleri, toplu SMS, fiyatlandırma) hesabınla açılır — ayrı şifre gerekmez.</p>
          </section>

          <div style={{ height: 40 }} />
        </div>
      </div>
    </div>
  );
}
