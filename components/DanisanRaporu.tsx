'use client';

import { useEffect, useRef } from 'react';
import './DanisanRaporu.css';
import { PROFIL_DATA as DEFAULT_DATA } from './danisanRaporuData';

// ──────────────────────────────────────────────────────────────────────────
// Danışan Raporu — "Klinik Editöryel Dosya" (Cv görsel-9 birebir port)
// Statik shell JSX; render/davranış orijinal JS'ten birebir, .dr köküne scope'lu.
// ──────────────────────────────────────────────────────────────────────────

export type DanisanRaporuProps = {
  data?: any;
  backLabel?: string;
  onBack?(): void;
  onCreateBriefing?(): void;
  onOpenFormulationHub?(): void;
  onOpenStory?(): void;
  onSaveBenlik?(notes: { self: string; outer: string }): void | Promise<void>;
  onSaveFee?(amount: number | null): void | Promise<void>;
  onSaveClientPatch?(patch: Record<string, unknown>): void | Promise<void>;
  onNav?(target: string): void;
};

const DOCK: { label: string; target: string; active?: boolean }[] = [
  { label: 'Ana Sayfa', target: 'home' },
  { label: 'Çalışma Alanı', target: 'calisma-alani' },
  { label: 'Profil', target: 'terapist', active: true },
  { label: 'Yol Haritası', target: 'tasarim-arsivi' },
  { label: 'ACT Geliştirme', target: 'act-gelistirme' },
];

export default function DanisanRaporu(props: DanisanRaporuProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const D: any = props.data ?? DEFAULT_DATA;
    const esc = (s: any) => (s == null ? '' : String(s)).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));
    const $ = (sel: string) => root.querySelector(sel) as HTMLElement | null;
    const $$ = (sel: string) => Array.from(root.querySelectorAll(sel)) as HTMLElement[];

    // ---- geri etiketi
    const backLabelEl = $('#backLabel');
    if (backLabelEl) backLabelEl.textContent = props.backLabel ?? (D.from === 'havuz' ? 'Günün seansları' : 'Danışanlar');

    // ---- sağ ray nav
    const navHost = $('#railNav');
    if (navHost) {
      navHost.innerHTML = D.sidebar.map((it: any, i: number) => `
        <a class="rn-item ${it.key === D.activeSection ? 'active' : ''}" href="#${esc(it.anchor)}" data-key="${esc(it.key)}">
          <span class="rn-num">${String(i + 1).padStart(2, '0')}</span>
          <span class="rn-label">${esc(it.label)}</span>
          <span class="rn-tick"></span>
        </a>`).join('');
    }

    // ---- bölüm başlığı yardımcıları
    const visToggle = (policyKey?: string) => {
      if (!policyKey) return '';
      const policy = D.SECTION_POLICY[policyKey];
      const hidden = policy === 'gizli';
      return `<button class="vis terapist-only" data-hidden="${hidden ? 1 : 0}" type="button"><span class="dot"></span><span class="vt">${hidden ? 'Danışandan gizli' : 'Danışana açık'}</span></button>`;
    };
    const head = (eyebrow: string, title: string, sub?: string, policyKey?: string) => `
      <div class="sec-head"><div class="l">
        <span class="eyebrow">${esc(eyebrow)}</span>
        <h2 class="sec-title">${title}</h2>
        ${sub ? `<span class="sec-sub">${sub}</span>` : ''}
      </div>${visToggle(policyKey)}</div>`;

    // ---- ANA KOLON
    const m: string[] = [];
    const recs = D.sessionRecords;
    const dotJoin = (arr: any[]) => (arr || []).map(esc).join(' · ');

    // ---- TERAPİ HEDEFLERİ — ilerleme grafiği (Cv görsel-18)
    // Gerçek ölçüm zaman serisi gelirse D.hedefProgress kullanılır; yoksa örnek görünüm.
    {
      const HEDEF_EX: any[] = [
        { id: 'g1', ad: 'Sosyal maruziyet hiyerarşisi', oncelik: 1, ilerleme: 72,
          noktalar: [{ seans: 1, deger: 8 }, { seans: 2, deger: 26 }, { seans: 3, deger: 48 }, { seans: 4, deger: 70 }, { seans: 5, deger: 86 }, { seans: 6, deger: 60 }, { seans: 7, deger: 72 }],
          engeller: [{ seansIndex: 5, not: 'İş yerinde sunum görevi gelince kaçınma davranışı geri döndü; “başaramayacağım” düşüncesi nüksetti.' }] },
        { id: 'g2', ad: 'Deneyimsel kaçınmayı azaltma', oncelik: 2, ilerleme: 58,
          noktalar: [{ seans: 1, deger: 15 }, { seans: 2, deger: 27 }, { seans: 3, deger: 40 }, { seans: 4, deger: 31 }, { seans: 5, deger: 46 }, { seans: 6, deger: 53 }, { seans: 7, deger: 58 }],
          engeller: [{ seansIndex: 3, not: 'Yoğun stres döneminde eski güvenlik davranışlarına dönüş.' }] },
        { id: 'g3', ad: 'Uyku rutini', oncelik: 3, ilerleme: 41,
          noktalar: [{ seans: 1, deger: 18 }, { seans: 2, deger: 24 }, { seans: 3, deger: 30 }, { seans: 4, deger: 33 }, { seans: 5, deger: 37 }, { seans: 6, deger: 39 }, { seans: 7, deger: 41 }],
          engeller: [] },
      ];
      const provided = (D as any).hedefProgress;
      const hedefler: any[] = (Array.isArray(provided) && provided.length) ? provided : HEDEF_EX;
      const isExampleGoals = !(Array.isArray(provided) && provided.length);
      const W = 320, H = 58, PL = 6, PR = 30, PT = 13, PB = 9;
      const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
      const sorted = [...hedefler].sort((a, b) => a.oncelik - b.oncelik);
      const maxP = Math.max(...sorted.map((h) => h.oncelik), 1);
      const avgG = sorted.length ? Math.round(sorted.reduce((s, h) => s + h.ilerleme, 0) / sorted.length) : 0;
      const f1 = (n: number) => n.toFixed(1);
      const prioStyle = (oncelik: number) => {
        const t = maxP > 1 ? (oncelik - 1) / (maxP - 1) : 0;
        const height = lerp(46, 22, t); const alpha = Math.round(lerp(1, 0.34, t) * 100);
        return `height:${f1(height)}px;background:color-mix(in srgb, var(--th-ink, var(--ink)) ${alpha}%, transparent)`;
      };
      const spark = (h: any) => {
        const n = h.noktalar.length;
        const xFor = (i: number) => PL + (n > 1 ? i / (n - 1) : 0) * (W - PL - PR);
        const yFor = (v: number) => H - PB - (v / 100) * (H - PT - PB);
        const obs = new Set(h.engeller.map((e: any) => e.seansIndex));
        const pts = h.noktalar.map((p: any, i: number) => [xFor(i), yFor(p.deger)]);
        const flagX = W - 14, flagTop = yFor(100);
        const segs = pts.slice(1).map((p: any, idx: number) => { const i = idx + 1; const o = obs.has(i);
          return `<line x1="${f1(pts[i - 1][0])}" y1="${f1(pts[i - 1][1])}" x2="${f1(p[0])}" y2="${f1(p[1])}" stroke="${o ? 'var(--th-orange)' : 'var(--th-teal)'}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`; }).join('');
        const dots = pts.map((p: any, i: number) => `<circle cx="${f1(p[0])}" cy="${f1(p[1])}" r="${i === n - 1 ? 3.4 : 2.4}" fill="${obs.has(i) ? 'var(--th-orange)' : 'var(--th-teal)'}"/>`).join('');
        const tris = h.engeller.map((e: any) => { const i = Math.min(Math.max(e.seansIndex, 0), n - 1); const x = pts[i][0], y = pts[i][1], ty = y - 9;
          return `<g class="th-obs"><polygon points="${f1(x)},${f1(ty - 5)} ${f1(x + 5.4)},${f1(ty + 4.5)} ${f1(x - 5.4)},${f1(ty + 4.5)}" fill="var(--th-warn)" stroke="var(--th-orange)" stroke-width="0.9" stroke-linejoin="round"/><title>${esc(e.not)}</title></g>`; }).join('');
        return `<div class="th-spark"><svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="${esc(h.ad)} — güncel ilerleme %${esc(h.ilerleme)}; ${n} seans${h.engeller.length ? `, ${h.engeller.length} engel` : ''}">
          <line x1="${flagX}" y1="${f1(flagTop)}" x2="${flagX}" y2="${H - PB}" stroke="var(--th-grid)" stroke-width="1.4" stroke-dasharray="3 3"/>
          <polygon points="${flagX},${f1(flagTop)} ${flagX + 10},${f1(flagTop + 3.4)} ${flagX},${f1(flagTop + 6.8)}" fill="var(--ink-mute)"/>
          ${segs}${dots}${tris}
        </svg></div>`;
      };
      const ring = (pct: number) => { const R = 20, C = 2 * Math.PI * R, on = C * (Math.max(0, Math.min(100, pct)) / 100);
        return `<div class="th-ring"><svg viewBox="0 0 50 50" class="th-ring-svg" aria-hidden="true">
          <circle cx="25" cy="25" r="${R}" fill="none" stroke="var(--th-track)" stroke-width="4.5"/>
          <circle cx="25" cy="25" r="${R}" fill="none" stroke="var(--th-teal)" stroke-width="4.5" stroke-linecap="round" stroke-dasharray="${f1(on)} ${f1(C)}"/>
        </svg><span class="th-ring-val">${esc(pct)}<em>%</em></span></div>`; };
      const rows = sorted.map((h) => `<div class="th-row">
        <span class="th-prio" style="${prioStyle(h.oncelik)}"></span>
        <div class="th-name"><div class="th-ad">${esc(h.ad)}</div><div class="th-seans">${h.noktalar.length} seans</div></div>
        ${spark(h)}${ring(h.ilerleme)}
      </div>`).join('');
      m.push(`<section class="section" id="hedefler" data-screen-label="Terapi Hedefleri">
        ${head('Danışan dosyası · ilerleme', 'Terapi <i>Hedefleri</i>', 'Her hedefin seanslar boyunca ilerlemesi — teal: ilerleme, turuncu: geri çekilme, sarı üçgen: engel (üzerine gel).')}
        <div class="th-card">
          <div class="th-top">
            <div class="th-avg"><b>${avgG}%</b><span>ortalama<br>ilerleme</span></div>
            ${isExampleGoals ? '<span class="th-ex">örnek görünüm · ölçümler biriktikçe gerçek veriyle dolar</span>' : ''}
          </div>
          <div class="th-rows">${rows}</div>
          <div class="th-legend">
            <span class="th-leg"><span class="th-sw teal"></span>İlerleme</span>
            <span class="th-leg"><span class="th-sw orange"></span>Geri çekilme</span>
            <span class="th-leg"><span class="th-tri"></span>Engel</span>
            <span class="th-leg"><span class="th-flag"></span>Hedef (%100)</span>
          </div>
        </div>
      </section>`);
    }

    m.push(`<section class="section" id="seans-kayitlari" data-screen-label="Seans Kayıtları">
      ${head('Seans kayıtları', `Bugüne dek <i>${esc(recs.length > 0 ? D.client.sessionCount : 0)} seans</i>.`, 'Her seansta ne çalışıldığının kısa özeti — kullanılan teknikler ve verilen ödevlerle.')}
      <div class="timeline-scroll"><div class="timeline">
        ${recs.map((r: any, i: number) => `
          <article class="tl-step ${i % 2 === 0 ? 'side-left' : 'side-right'}" id="rec-${esc(r.seansNo)}" data-seans="${esc(r.seansNo)}">
            <div class="tl-node"><span class="num">${String(r.seansNo).padStart(2, '0')}</span></div>
            <div class="tl-content">
              <div class="tl-step-lbl">Seans ${esc(r.seansNo)} · ${esc(r.date)}</div>
              <h3 class="tl-title">${esc(r.title)}</h3>
              <p class="tl-sum">${esc(r.summary)}</p>
              <div class="tl-detail">
                <div class="tl-cell"><span class="tl-lbl">Kullanılan teknikler</span><div class="tl-tags">${dotJoin(r.interventions)}</div></div>
                <div class="tl-cell"><span class="tl-lbl">Verilen ödev</span><div class="tl-tags">${dotJoin(r.homework)}</div></div>
              </div>
              <div class="tl-foot">
                <span class="tl-focus">${esc(r.modality)} · ${esc(r.durationMin)} dk</span>
                ${(r.suds != null || r.mood != null) ? `<div class="tl-scores">
                  ${r.suds != null ? `<span class="tl-score"><span class="rng" style="background:var(--clay)">${esc(r.suds)}</span>SUDS</span>` : ''}
                  ${r.mood != null ? `<span class="tl-score"><span class="rng" style="background:var(--sage)">${esc(r.mood)}</span>Ruh hali</span>` : ''}
                </div>` : ''}
              </div>
            </div>
          </article>`).join('')}
      </div></div>
    </section>`);

    const sw = D.strengthsWeaknesses;
    m.push(`<section class="section" id="bariyerler" data-screen-label="Güçlü &amp; Zayıf">
      ${head('Güçlü yanlar & bariyerler', `<span class="terapist-only">Güçlü ve <i>zayıf</i> yönler.</span><span class="danisan-only">Güçlü <i>yönlerin.</i></span>`, '', 'bariyerler')}
      <div class="card"><div class="two-col">
        <div>
          <div class="col-head"><span class="col-dot" style="background:var(--sage)"></span><span class="col-title">Koruyucu & güçlü</span></div>
          ${sw.strengths.map((t: any) => `<div class="trait"><div class="t-lbl">${esc(t.label)}</div><div class="t-det">${esc(t.detail)}</div></div>`).join('')}
        </div>
        <div class="terapist-only">
          <div class="col-head"><span class="col-dot" style="background:var(--clay)"></span><span class="col-title">Zayıf yan / bariyer</span></div>
          ${sw.weaknesses.map((t: any) => `<div class="trait"><div class="t-lbl">${esc(t.label)}</div><div class="t-det">${esc(t.detail)}</div></div>`).join('')}
        </div>
      </div></div>
    </section>`);

    m.push(`<section class="section" id="formulasyon" data-screen-label="4P Formülasyon">
      ${head('4P Formülasyon', 'Vakanın dört penceresi.', 'Travmalar, Olumsuz Deneyimler · Tetikleyici · Sürdürücü · Koruyucu', 'formulasyon')}
      <div class="fourp">
        ${D.fourP.map((p: any) => `
          <div class="p-card ${p.accent ? 'accent' : ''} ${p.good ? 'good' : ''}">
            <span class="p-num">${esc(p.num)}</span>
            <h3 class="p-label">${esc(p.label)}<small>${esc(p.sub)}</small></h3>
            <p class="p-body">${esc(p.body)}</p>
            <div class="p-chips">${(p.chips || []).map((c: string) => `<span class="chip">${esc(c)}</span>`).join('')}</div>
          </div>`).join('')}
      </div>
    </section>`);

    const f = D.flexibility;
    m.push(`<section class="section" id="esneklik" data-screen-label="Esneklik">
      ${head('Esneklik · ACT Hexaflex', esc(f.headline), '', 'esneklik')}
      <div class="card"><div class="flex-wrap">
        <div class="radar-box" id="radarBox"></div>
        <div>
          <div class="flex-score"><span class="big num">${esc(f.score)}</span><span class="den">/10 ortalama</span></div>
          <p class="flex-desc">${esc(f.description)}</p>
          <div class="axes">
            ${f.axes.map((a: any) => `
              <div class="axis-row">
                <span class="axis-name"><span class="terapist-only">${esc(a.name)}</span><span class="danisan-only">${esc(a.sade)}</span></span>
                <span class="axis-bar"><span class="axis-fill" style="width:${a.value * 10}%"></span></span>
                <span class="axis-val num">${esc(a.value)}</span>
              </div>`).join('')}
          </div>
        </div>
      </div></div>
    </section>`);

    m.push(`<section class="section" id="degerler" data-screen-label="ACT matrisi">${(() => {
      const mx = D.actMatrix, ax = mx.axes;
      const li = (it: any) => {
        const main = esc(typeof it === 'string' ? it : it.label);
        const sade = (it && it.sade) ? esc(it.sade) : main;
        return `<li><span class="terapist-only">${main}</span><span class="danisan-only">${sade}</span></li>`;
      };
      const quad = (q: any) => `
        <div class="mx-cell ${esc(q.pos)} side-${esc(q.side)}"><div class="mx-q-inner">
          <div class="mx-q-tag"><span class="mx-q-mark"></span><span class="mx-q-num">${esc(q.num)}</span><span class="mx-q-side terapist-only">${esc(q.sideLabel)} · ${esc(q.layerLabel)}</span></div>
          <h4 class="mx-q-ask"><span class="terapist-only">${esc(q.q_terapist)}</span><span class="danisan-only">${esc(q.q_danisan)}</span></h4>
          <ul class="mx-q-items">${q.items.map(li).join('')}</ul>
        </div></div>`;
      return `
      <div class="mx-subhead"><span class="eyebrow">ACT matrisi</span>
        <button class="mx-share terapist-only" data-act="share-matris" type="button"><svg viewBox="0 0 24 24"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/></svg>Danışanla paylaş</button>
        <span class="mx-share-state" id="matrisShareState"></span>
        <p class="mx-subhead-desc">
          <span class="terapist-only">Davranışları iki soruyla haritalar: danışan şu an önemli olandan <i>uzağa</i> mı, ona <i>doğru</i> mu hareket ediyor? Üstte gözlenebilir davranışlar, altta içsel deneyimler.</span>
          <span class="danisan-only">Şu an senin için önemli olandan <i>uzağa</i> mı, ona <i>doğru</i> mu gittiğini fark etmene yardımcı olan bir harita.</span>
        </p>
      </div>
      <div class="matrix">
        <div class="mx-axis-v mx-axis-top"><span class="terapist-only">${esc(ax.top.terapist)}</span><span class="danisan-only">${esc(ax.top.danisan)}</span></div>
        <div class="mx-axis-v mx-axis-bottom"><span class="terapist-only">${esc(ax.bottom.terapist)}</span><span class="danisan-only">${esc(ax.bottom.danisan)}</span></div>
        <span class="mx-line h-left"></span><span class="mx-line h-right"></span><span class="mx-line v-top"></span><span class="mx-line v-bottom"></span>
        ${mx.quadrants.map(quad).join('')}
      </div>
      <div class="mx-home"><span class="mx-home-tag">Ödev</span><p><span class="terapist-only">${esc(mx.homework.terapist)}</span><span class="danisan-only">${esc(mx.homework.danisan)}</span></p></div>`;
    })()}</section>`);

    const ba = D.benlikAlgisi;
    const baScale = (s: any) => `
      <div class="ba-scale"><div class="ba-scale-name">${esc(s.name)}</div>
        <div class="ba-track"><span class="ba-fill" style="width:${esc(s.value)}%"></span><span class="ba-knob" style="left:${esc(s.value)}%">${esc(s.value)}</span></div>
        <div class="ba-ends"><span>${esc(s.lo)}</span><span>${esc(s.hi)}</span></div>
      </div>`;
    const baCol = (c: any, side: string, dotVar: string, ph: string) => `
      <div class="ba-col ${esc(side)}">
        <div class="ba-col-head"><span class="col-dot" style="background:${dotVar}"></span><div><div class="ba-col-title">${esc(c.title)}</div><div class="ba-col-sub">${esc(c.sub)}</div></div></div>
        <div class="ba-block-lbl">${side === 'self' ? 'Öz-etiketler' : 'Dış etiketler'}</div>
        <div class="ba-chips">${c.labels.map((l: string) => `<span class="ba-chip">${esc(l)}</span>`).join('')}</div>
        <div class="ba-scales">${c.scales.map(baScale).join('')}</div>
        <div class="ba-block-lbl">Klinik not</div>
        <textarea class="benlik-note" data-side="${esc(side)}" spellcheck="false" placeholder="${esc(ph)}">${esc(c.note)}</textarea>
      </div>`;
    m.push(`<section class="section terapist-only" id="benlik" data-screen-label="Benlik &amp; Algı">
      ${head('Benlik & Algı', `Kendini nasıl görüyor — başkaları <i>nasıl görüyor.</i>`, '', '')}
      <div class="ba-bar"><div><div class="ba-bar-title">${esc(ba.bar.title)}</div><div class="ba-bar-meta">${esc(D.client.firstName)} ${esc(D.client.lastName)} · ${esc(ba.bar.meta)}</div></div>
        <div class="ba-bar-act"><span class="save-state" id="saveState">Otomatik kaydedilir</span><button class="btn btn-light" data-act="save-benlik" type="button">Kaydet</button></div>
      </div>
      <div class="ba-cols">${baCol(ba.self, 'self', '#F2F1ED', 'Danışanın kendi hakkındaki temel anlatısı…')}${baCol(ba.outer, 'outer', 'var(--clay)', 'Seans içi gözlemler, yakınların anlatıları…')}</div>
    </section>`);

    m.push(`<section class="section" id="mudahaleler" data-screen-label="Müdahaleler">
      ${head('Müdahaleler', 'Uygulanan teknikler ve sonuçları.', '', '')}
      <div class="card"><div class="iv-table">
        <div class="iv-row head"><span>#</span><span>Başlık</span><span>Ekol</span><span>Süre</span><span>Sonuç</span></div>
        ${D.interventions.map((iv: any) => `
          <div class="iv-row"><span class="iv-rn">${esc(iv.romanNum)}</span><span class="iv-title">${esc(iv.title)}</span><span class="iv-mod">${esc(iv.modality)}</span><span class="iv-dur num">${esc(iv.durationMin)} dk</span><span class="outcome ${esc(iv.outcome)}">${esc(iv.outcome)}</span></div>`).join('')}
      </div></div>
    </section>`);

    const rel = D.relationship;
    m.push(`<section class="section terapist-only" id="iliski" data-screen-label="İlişki">
      ${head('İlişki & klinik notlar', 'Kırılma–onarım, süpervizyon, serbest not.', '', 'iliski')}
      <div class="card"><div class="note-grid">
        <div class="note-block"><div class="nb-lbl">Kırılma & onarım</div><p>${esc(rel.rupture)}</p></div>
        <div class="note-block"><div class="nb-lbl">Süpervizyon soruları</div><ul class="q-list">${rel.supervision.map((q: string) => `<li>${esc(q)}</li>`).join('')}</ul></div>
      </div>
      <div class="note-block" style="margin-top:18px;padding-top:18px;border-top:1px solid var(--line)"><div class="nb-lbl">Serbest klinik not</div><p>${esc(rel.note)}</p></div></div>
    </section>`);

    const sc = D.scaleScores;
    const maxS = Math.max(...sc.map((x: any) => x.score), 10);
    m.push(`<section class="section terapist-only" id="olcek" data-screen-label="Ölçek skorları">
      ${head('Ölçek skorları', 'Seans bazlı puan serisi.', '')}
      <div class="card tint"><div class="scale-row">
        ${sc.map((x: any) => `<div class="scale-bar"><span class="sv num">${esc(x.score)}</span><span class="bar" style="height:${(x.score / maxS) * 100}%"></span><span class="sl">S${esc(x.seansNo)}</span></div>`).join('')}
      </div></div>
    </section>`);

    const mainCol = $('#mainCol');
    if (mainCol) mainCol.innerHTML = m.join('');

    // ---- HERO
    const s = D.story, h = D.heroQuote, c = D.client;
    const initials = (c.firstName[0] || '') + (c.lastName[0] || '');
    const metaBits = [c.age && c.age + ' yaş', c.gender, c.occupation].filter(Boolean);
    const pg = D.problemsGoals;
    const dual = (v: any) => (v && typeof v === 'object') ? { t: esc(v.terapist), d: esc(v.danisan) } : { t: esc(v), d: esc(v) };
    const dualSpan = (v: any) => { const x = dual(v); return `<span class="terapist-only">${x.t}</span><span class="danisan-only">${x.d}</span>`; };
    const pgItem = (it: any) => `<li><span class="pg-label">${dualSpan(it.label)}</span><span class="pg-note">${dualSpan(it.note)}</span></li>`;
    const heroBanner = $('#heroBanner');
    if (heroBanner) heroBanner.innerHTML = `<section class="section" id="sorun" data-screen-label="Sorun &amp; Hedef">
      <div class="hero2" id="idCard"><div class="hero2-top">
        <div class="hero2-head">
          <span class="eyebrow hero2-eyebrow"><span class="terapist-only">${esc(h.eyebrowTerapist)}</span><span class="danisan-only">${esc(h.eyebrowDanisan)}</span></span>
          <h1 class="hero2-name">${esc(c.firstName)} <i>${esc(c.lastName)}</i></h1>
          <div class="hero2-meta">${metaBits.map((mm: any) => `<span>${esc(mm)}</span>`).join('')}</div>
          <p class="hero2-desc">${esc(h.description)}</p>
        </div>
        <aside class="hero-story terapist-only" id="hikaye" data-screen-label="Hikaye">
          <span class="eyebrow hero-story-label">Danışanın Hayat Hikayesi</span>
          <blockquote class="story-quote">${esc(s.preQuote)}<i>${esc(s.accentItalicPhrase)}</i>${esc(s.postQuote)}</blockquote>
          <div class="story-foot"><span class="meta">${esc(s.meta)}</span><a class="link-act" href="#" data-act="hikaye-modal">Detaylı hikayeyi gör →</a></div>
        </aside>
      </div>
      <div class="hero2-card">
        <div class="hc-q">${dualSpan(pg.head)}</div>
        <div class="hc-pg">
          <div class="hc-pg-col problems"><div class="hc-pg-lbl"><span class="dot"></span>${dualSpan(pg.problemsLabel)}</div><ul class="hc-pg-list">${pg.problems.map(pgItem).join('')}</ul></div>
          <div class="hc-pg-arrow" aria-hidden="true">→</div>
          <div class="hc-pg-col goals"><div class="hc-pg-lbl"><span class="dot"></span>${dualSpan(pg.goalsLabel)}</div><ul class="hc-pg-list">${pg.goals.map(pgItem).join('')}</ul></div>
        </div>
        <div class="hc-divider"></div>
        <div class="hc-lbl">Dosya özeti</div>
        <div class="hmods">
          <div class="hmod"><span class="hmod-lbl">Vaka</span><span class="hmod-val">#${esc(c.vakaNo)}</span></div>
          <div class="hmod"><span class="hmod-lbl">Toplam seans</span><span class="hmod-val">${esc(c.sessionCount)}</span></div>
          ${c.nextSessionLabel ? `<div class="hmod"><span class="hmod-lbl">Sonraki seans</span><span class="hmod-val">${esc(c.nextSessionLabel)}</span></div>` : ''}
          <div class="hmod fee terapist-only"><span class="hmod-lbl">Seans ücreti</span>
            <span class="fee-edit"><span class="fee-cur">₺</span><input class="fee-input" id="feeInput" type="number" inputmode="numeric" min="0" step="50" value="${c.seansUcreti != null ? esc(c.seansUcreti) : ''}" placeholder="—" /><button class="fee-save" data-act="save-fee" type="button">kaydet</button><span class="fee-state" id="feeState"></span></span>
          </div>
          <div class="hmod fee terapist-only"><span class="hmod-lbl">Takip sıklığı</span>
            <span class="fee-edit"><select class="fee-input" id="takipSelect">
              <option value=""${!c.takipSikligi ? ' selected' : ''}>—</option>
              <option value="haftalik"${c.takipSikligi === 'haftalik' ? ' selected' : ''}>Haftalık</option>
              <option value="iki_haftalik"${c.takipSikligi === 'iki_haftalik' ? ' selected' : ''}>2 haftalık</option>
              <option value="aylik"${c.takipSikligi === 'aylik' ? ' selected' : ''}>Aylık</option>
            </select><button class="fee-save" data-act="save-takip" type="button">kaydet</button><span class="fee-state" id="takipState"></span></span>
          </div>
          <div class="hmod fee terapist-only"><span class="hmod-lbl">Kişilik tipi</span>
            <span class="fee-edit"><input class="fee-input" id="kisilikInput" type="text" value="${c.kisilikTipi ? esc(c.kisilikTipi) : ''}" placeholder="örn. Kaçıngan / INFP" style="width:140px" /><button class="fee-save" data-act="save-kisilik" type="button">kaydet</button><span class="fee-state" id="kisilikState"></span></span>
          </div>
        </div>
        <div class="hero-cta terapist-only"><button class="btn btn-ghost" data-act="formulasyon-hub">${esc(h.secondaryCta)}</button><button class="btn btn-primary" data-act="brief">${esc(h.primaryCta)}</button></div>
      </div></div></section>`;

    const railNote = $('#railNote');
    if (railNote) railNote.textContent = D.railNote;

    // ---- HEXAFLEX RADAR
    (function buildRadar() {
      const box = $('#radarBox'); if (!box) return;
      const axes = D.flexibility.axes;
      const N = axes.length, cx = 130, cy = 130, R = 100, max = 10;
      const ang = (i: number) => (-Math.PI / 2) + (i * 2 * Math.PI / N);
      const pt = (i: number, r: number) => [cx + r * Math.cos(ang(i)), cy + r * Math.sin(ang(i))];
      const NS = 'http://www.w3.org/2000/svg';
      const svg = document.createElementNS(NS, 'svg');
      svg.setAttribute('width', '260'); svg.setAttribute('height', '260'); svg.setAttribute('viewBox', '0 0 260 260');
      const defs = document.createElementNS(NS, 'defs');
      defs.innerHTML = `
        <radialGradient id="radarFill" cx="46%" cy="44%" r="62%"><stop offset="0%" stop-color="#FF8A7C" stop-opacity="0.55"/><stop offset="46%" stop-color="#F07A93" stop-opacity="0.42"/><stop offset="100%" stop-color="#9A7BC4" stop-opacity="0.30"/></radialGradient>
        <linearGradient id="radarStroke" x1="20%" y1="8%" x2="84%" y2="96%"><stop offset="0%" stop-color="#FF9A86"/><stop offset="42%" stop-color="#FB6F8E"/><stop offset="100%" stop-color="#8E72C2"/></linearGradient>
        <radialGradient id="radarDot" cx="34%" cy="30%" r="78%"><stop offset="0%" stop-color="#FFFFFF"/><stop offset="48%" stop-color="#FF8E84"/><stop offset="100%" stop-color="#E36B8C"/></radialGradient>
        <filter id="radarGlow" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="4.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;
      svg.appendChild(defs);
      [0.25, 0.5, 0.75, 1].forEach((fr) => {
        const poly = document.createElementNS(NS, 'polygon');
        poly.setAttribute('points', axes.map((_: any, i: number) => pt(i, R * fr).join(',')).join(' '));
        poly.setAttribute('fill', 'none'); poly.setAttribute('stroke', 'rgba(20,20,20,.10)'); poly.setAttribute('stroke-width', '1');
        svg.appendChild(poly);
      });
      axes.forEach((a: any, i: number) => {
        const [x, y] = pt(i, R);
        const line = document.createElementNS(NS, 'line');
        line.setAttribute('x1', String(cx)); line.setAttribute('y1', String(cy)); line.setAttribute('x2', String(x)); line.setAttribute('y2', String(y));
        line.setAttribute('stroke', 'rgba(20,20,20,.08)'); line.setAttribute('stroke-width', '1'); svg.appendChild(line);
        const [lx, ly] = pt(i, R + 18);
        const tx = document.createElementNS(NS, 'text');
        tx.setAttribute('x', String(lx)); tx.setAttribute('y', String(ly));
        tx.setAttribute('font-family', "'Space Mono', monospace"); tx.setAttribute('font-size', '8.5'); tx.setAttribute('fill', '#8A8A8A');
        tx.setAttribute('text-anchor', lx < cx - 6 ? 'end' : lx > cx + 6 ? 'start' : 'middle');
        tx.setAttribute('dominant-baseline', 'middle'); tx.setAttribute('data-radar-label', String(i));
        tx.textContent = a.name; svg.appendChild(tx);
      });
      const glowPoly = document.createElementNS(NS, 'polygon');
      glowPoly.setAttribute('points', axes.map((a: any, i: number) => pt(i, R * (a.value / max)).join(',')).join(' '));
      glowPoly.setAttribute('fill', 'none'); glowPoly.setAttribute('stroke', 'url(#radarStroke)'); glowPoly.setAttribute('stroke-width', '2.5'); glowPoly.setAttribute('stroke-linejoin', 'round'); glowPoly.setAttribute('filter', 'url(#radarGlow)'); glowPoly.setAttribute('opacity', '.9');
      svg.appendChild(glowPoly);
      const fillPoly = document.createElementNS(NS, 'polygon');
      fillPoly.setAttribute('points', axes.map((a: any, i: number) => pt(i, R * (a.value / max)).join(',')).join(' '));
      fillPoly.setAttribute('fill', 'url(#radarFill)'); fillPoly.setAttribute('stroke', 'url(#radarStroke)'); fillPoly.setAttribute('stroke-width', '2'); fillPoly.setAttribute('stroke-linejoin', 'round');
      svg.appendChild(fillPoly);
      axes.forEach((a: any, i: number) => {
        const [x, y] = pt(i, R * (a.value / max));
        const halo = document.createElementNS(NS, 'circle');
        halo.setAttribute('cx', String(x)); halo.setAttribute('cy', String(y)); halo.setAttribute('r', '5.5'); halo.setAttribute('fill', '#FB6F8E'); halo.setAttribute('opacity', '.28'); halo.setAttribute('filter', 'url(#radarGlow)');
        svg.appendChild(halo);
        const dot = document.createElementNS(NS, 'circle');
        dot.setAttribute('cx', String(x)); dot.setAttribute('cy', String(y)); dot.setAttribute('r', '3.6'); dot.setAttribute('fill', 'url(#radarDot)'); dot.setAttribute('stroke', 'rgba(255,255,255,.7)'); dot.setAttribute('stroke-width', '0.8');
        svg.appendChild(dot);
      });
      box.appendChild(svg);
    })();

    // ---- KİTLE MODU
    const opts = $$('.audience .opt');
    const thumb = $('#audThumb');
    const setMode = (mode: string) => {
      root.setAttribute('data-mode', mode);
      opts.forEach((o) => {
        const on = o.dataset.mode === mode;
        o.setAttribute('aria-pressed', String(on));
        if (on && thumb) { thumb.style.left = o.offsetLeft + 'px'; thumb.style.width = o.offsetWidth + 'px'; }
      });
      $$('[data-radar-label]').forEach((t) => {
        const i = +(t.getAttribute('data-radar-label') as string);
        const ax = D.flexibility.axes[i];
        t.textContent = mode === 'danisan' ? ax.sade.split(' ')[0] : ax.name;
      });
    };
    const optClick = (e: Event) => setMode((e.currentTarget as HTMLElement).dataset.mode as string);
    opts.forEach((o) => o.addEventListener('click', optClick));
    setMode('terapist');
    const onResize = () => setMode(root.getAttribute('data-mode') || 'terapist');
    window.addEventListener('resize', onResize);

    // ---- NAV: scroll + spy
    const mb = $('#modalBody');
    const items = $$('.rn-item');
    const navClick = (e: Event) => {
      const a = e.currentTarget as HTMLAnchorElement;
      const id = (a.getAttribute('href') || '').slice(1);
      const el = $('#' + CSS.escape(id));
      if (el && mb) { e.preventDefault(); const y = el.getBoundingClientRect().top - mb.getBoundingClientRect().top + mb.scrollTop - 4; mb.scrollTo({ top: y, behavior: 'smooth' }); }
    };
    items.forEach((a) => a.addEventListener('click', navClick));
    let io: IntersectionObserver | null = null;
    if (mb) {
      io = new IntersectionObserver((ent) => {
        ent.forEach((e) => {
          if (e.isIntersecting) {
            items.forEach((i) => i.classList.remove('active'));
            items.filter((a) => a.getAttribute('href') === '#' + (e.target as HTMLElement).id).forEach((mn) => mn.classList.add('active'));
          }
        });
      }, { root: mb, rootMargin: '-20% 0px -70% 0px', threshold: 0 });
      $$('.section').forEach((sec) => io!.observe(sec));
    }

    // ---- AKSİYONLAR
    const onActClick = (e: Event) => {
      const a = (e.target as HTMLElement).closest('[data-act]') as HTMLElement | null;
      if (!a) return;
      const act = a.dataset.act;
      if (act === 'save-benlik') {
        e.preventDefault();
        const st = $('#saveState');
        if (st) { st.textContent = 'Kaydedildi · ' + new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }); st.classList.add('ok'); }
        const notes = { self: '', outer: '' };
        $$('.benlik-note').forEach((ta) => { notes[(ta as HTMLTextAreaElement).dataset.side as 'self' | 'outer'] = (ta as HTMLTextAreaElement).value; });
        props.onSaveBenlik?.(notes);
      } else if (act === 'save-fee') {
        e.preventDefault();
        const inp = $('#feeInput') as HTMLInputElement | null;
        const fst = $('#feeState');
        const raw = inp?.value?.trim() ?? '';
        const amount = raw === '' ? null : Number(raw);
        if (amount != null && (Number.isNaN(amount) || amount < 0)) {
          if (fst) { fst.textContent = 'Geçersiz'; fst.classList.remove('ok'); }
          return;
        }
        if (fst) { fst.textContent = 'Kaydedildi ✓'; fst.classList.add('ok'); }
        props.onSaveFee?.(amount);
      } else if (act === 'save-takip') {
        e.preventDefault();
        const sel = $('#takipSelect') as HTMLSelectElement | null;
        const st = $('#takipState'); if (st) { st.textContent = 'Kaydedildi ✓'; st.classList.add('ok'); }
        props.onSaveClientPatch?.({ takipSikligi: sel?.value || null });
      } else if (act === 'save-kisilik') {
        e.preventDefault();
        const inp = $('#kisilikInput') as HTMLInputElement | null;
        const st = $('#kisilikState'); if (st) { st.textContent = 'Kaydedildi ✓'; st.classList.add('ok'); }
        props.onSaveClientPatch?.({ kisilikTipi: (inp?.value ?? '').trim() || null });
      } else if (act === 'share-matris') {
        e.preventDefault();
        const st = $('#matrisShareState');
        const cid = String(D.client?.vakaNo ?? '');
        const cname = `${D.client?.firstName ?? ''} ${D.client?.lastName ?? ''}`.trim() || 'Danışan';
        const mx = D.actMatrix;
        const payload = {
          title: 'ACT Matrisi',
          axes: { left: mx.axes?.left?.tr, right: mx.axes?.right?.tr, top: mx.axes?.top?.danisan, bottom: mx.axes?.bottom?.danisan },
          center: mx.centerLabel,
          quadrants: (mx.quadrants ?? []).map((q: any) => ({ pos: q.pos, side: q.sideLabel, q: q.q_danisan, items: q.items })),
          homework: mx.homework?.danisan,
        };
        if (st) { st.textContent = 'Bağlantı oluşturuluyor…'; st.classList.remove('ok'); }
        fetch('/api/form-link', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clientId: cid, clientName: cname, formTipi: 'act-matris', olcekAd: 'ACT Matrisi', payload }),
        }).then((r) => r.json()).then(async (row) => {
          if (row?.token) {
            const url = `${window.location.origin}/form/${row.token}`;
            try { await navigator.clipboard.writeText(url); } catch {}
            if (st) { st.textContent = 'Bağlantı panoya kopyalandı ✓'; st.classList.add('ok'); }
          } else if (st) { st.textContent = 'Oluşturulamadı'; }
        }).catch(() => { if (st) st.textContent = 'Oluşturulamadı'; });
      } else if (act === 'brief') { e.preventDefault(); props.onCreateBriefing?.(); }
      else if (act === 'formulasyon-hub') { e.preventDefault(); props.onOpenFormulationHub?.(); }
      else if (act === 'hikaye-modal') { e.preventDefault(); props.onOpenStory?.(); }
    };
    root.addEventListener('click', onActClick);

    const onNoteInput = () => { const st = $('#saveState'); if (st) { st.textContent = 'Kaydedilmemiş değişiklik'; st.classList.remove('ok'); } };
    const notesEls = $$('.benlik-note');
    notesEls.forEach((ta) => ta.addEventListener('input', onNoteInput));

    // ---- focus=seanslar
    if (D.focus === 'seanslar' && mb) {
      requestAnimationFrame(() => {
        const el = $('#seans-kayitlari');
        if (el && mb) mb.scrollTo({ top: el.getBoundingClientRect().top - mb.getBoundingClientRect().top + mb.scrollTop - 22, behavior: 'smooth' });
      });
    }

    // ---- cleanup
    return () => {
      window.removeEventListener('resize', onResize);
      root.removeEventListener('click', onActClick);
      io?.disconnect();
      const hb = $('#heroBanner'); if (hb) hb.innerHTML = '';
      const mc = $('#mainCol'); if (mc) mc.innerHTML = '';
      const nh = $('#railNav'); if (nh) nh.innerHTML = '';
    };
  }, [props.data]);

  return (
    <div className="dr" ref={rootRef} data-mode="terapist">
      <div className="shell">
        <div className="topbar">
          <button className="back" type="button" onClick={props.onBack}><span className="chev">‹</span><span id="backLabel">Günün seansları</span></button>
          <div className="topbar-right">
            <a className="print-link terapist-only" href="#" onClick={(e) => { e.preventDefault(); if (typeof window !== 'undefined') window.print(); }}>Yazdır / PDF</a>
            <div className="audience" role="group" aria-label="Kitle modu">
              <span className="thumb" id="audThumb" />
              <button className="opt" data-mode="terapist" aria-pressed="true" type="button">Terapist</button>
              <button className="opt" data-mode="danisan" aria-pressed="false" type="button">Danışanla paylaş</button>
            </div>
          </div>
        </div>

        <div className="modal-body" id="modalBody">
          <div className="layout">
            <div className="hero-banner" id="heroBanner" />
            <main className="main" id="mainCol" />
          </div>
          <div className="note-footer terapist-only">
            <div className="note-inner"><div className="eyebrow">Süpervizyon notu</div><p id="railNote" /></div>
          </div>
        </div>

        <nav className="railnav" id="railNav" aria-label="Bölümler" />

        <nav className="dock">
          {DOCK.map((d) => (
            <a key={d.target} href="#" className={d.active ? 'active' : ''} onClick={(e) => { e.preventDefault(); props.onNav?.(d.target); }}>{d.label}</a>
          ))}
        </nav>
      </div>
    </div>
  );
}
