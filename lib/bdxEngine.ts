/* ════════════════════════════════════════════════════════════════════════
   BDX — Bozukluk Döngüsü diyagram motoru (ESM port)
   Tek tutarlı kutu + ok dili. Tüm 23 model bu motorla çizilir.
   Renk YOK (monokrom antrasit + nötr); vurgu = koyu plastik dolgulu düğüm.
   Forward ok = düz ince çizgi · feedback ok = kesik çizgi. Aynı ok başı.
   Düğümler düzenlenebilir <textarea> taşır (fieldKey korunur).

   Kaynak: design_handoff_bozukluk_dongusu/bdx-engine.js (window.BDX.render)
   → renderBdx(host, def, get, set) olarak dışa aktarıldı (no window global).
   ════════════════════════════════════════════════════════════════════════ */
import type { DiagramDef, BdxNode, BdxEdge } from './bdxDefs';

const XH = 'http://www.w3.org/1999/xhtml';
const esc = (s: unknown) =>
  String(s == null ? '' : s).replace(/[&<>"]/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));

type Pt = [number, number];

// ── Geometri yardımcıları ───────────────────────────────────────────────
const cen = (n: BdxNode): Pt => [n.x + n.w / 2, n.y + n.h / 2];
function sidePt(n: BdxNode, side?: string, at?: number): Pt {
  at = at == null ? 0.5 : at;
  const { x, y, w, h } = n;
  if (side === 't') return [x + w * at, y];
  if (side === 'b') return [x + w * at, y + h];
  if (side === 'l') return [x, y + h * at];
  return [x + w, y + h * at]; // r
}
function perim(n: BdxNode, tx: number, ty: number): Pt {
  const [cx, cy] = cen(n); let dx = tx - cx, dy = ty - cy;
  if (!dx && !dy) return [cx, cy];
  const rx = n.w / 2, ry = n.h / 2;
  if (n.shape === 'circle' || n.shape === 'oval') {
    const t = 1 / Math.sqrt((dx * dx) / (rx * rx) + (dy * dy) / (ry * ry));
    return [cx + dx * t, cy + dy * t];
  }
  const s = 1 / Math.max(Math.abs(dx) / rx, Math.abs(dy) / ry);
  return [cx + dx * s, cy + dy * s];
}

// ── yuvarlatılmış köşeli (ortogonal) yol ── premium yönlendirme ──────────
function roundCorners(pts: Pt[], r: number): string {
  if (pts.length < 3) return `M ${pts[0][0]},${pts[0][1]} L ${pts[pts.length - 1][0]},${pts[pts.length - 1][1]}`;
  let d = `M ${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const p0 = pts[i - 1], p1 = pts[i], p2 = pts[i + 1];
    const v1x = p0[0] - p1[0], v1y = p0[1] - p1[1], l1 = Math.hypot(v1x, v1y) || 1;
    const v2x = p2[0] - p1[0], v2y = p2[1] - p1[1], l2 = Math.hypot(v2x, v2y) || 1;
    const rr = Math.min(r, l1 / 2, l2 / 2);
    const a = [p1[0] + (v1x / l1) * rr, p1[1] + (v1y / l1) * rr];
    const b = [p1[0] + (v2x / l2) * rr, p1[1] + (v2y / l2) * rr];
    d += ` L ${a[0].toFixed(1)},${a[1].toFixed(1)} Q ${p1[0].toFixed(1)},${p1[1].toFixed(1)} ${b[0].toFixed(1)},${b[1].toFixed(1)}`;
  }
  const e = pts[pts.length - 1];
  d += ` L ${e[0].toFixed(1)},${e[1].toFixed(1)}`;
  return d;
}

type EdgeResult = { d: string; tipEnd: Pt; dirEnd: Pt; tipStart: Pt; dirStart: Pt };

// ── Ok yolu + uç teğetleri ──────────────────────────────────────────────
function edgePath(def: DiagramDef, e: BdxEdge, byKey: Record<string, BdxNode>): EdgeResult | null {
  const A = byKey[e.from], B = byKey[e.to];
  if (!A || !B) return null;
  const [bcx, bcy] = cen(B), [acx, acy] = cen(A);
  let p1: Pt = e.fromSide ? sidePt(A, e.fromSide, e.fromAt) : perim(A, bcx, bcy);
  let p2: Pt = e.toSide ? sidePt(B, e.toSide, e.toAt) : perim(B, acx, acy);
  const route = e.route || 'auto';
  const vbW = def.vb[0], vbH = def.vb[1];
  const R = 15; // köşe yuvarlatma
  const unit = (a: Pt, b: Pt): Pt => { const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; return [dx / l, dy / l]; };
  const pull = (p: Pt, dir: Pt, g: number): Pt => [p[0] - dir[0] * g, p[1] - dir[1] * g];

  // ── halka yayı ── ring döngülerinde kenarlar dışa doğru kavislenir ───
  if (def.ring && route === 'auto' && !e.fromSide && !e.toSide &&
      (A.shape === 'circle' || A.shape === 'oval') &&
      (B.shape === 'circle' || B.shape === 'oval')) {
    if (!def._ringC) {
      const rs = def.nodes!.filter((m) => m.shape === 'circle' || m.shape === 'oval');
      def._ringC = [rs.reduce((s, m) => s + cen(m)[0], 0) / rs.length,
                    rs.reduce((s, m) => s + cen(m)[1], 0) / rs.length];
    }
    const C = def._ringC;
    const m0: Pt = [(acx + bcx) / 2, (acy + bcy) / 2];
    let ovx = m0[0] - C[0], ovy = m0[1] - C[1];
    const ol = Math.hypot(ovx, ovy) || 1; ovx /= ol; ovy /= ol;
    const chord = Math.hypot(bcx - acx, bcy - acy);
    const bow = e.bow != null ? e.bow : chord * 0.20;
    const ctrl: Pt = [m0[0] + ovx * bow, m0[1] + ovy * bow];
    const q1 = perim(A, ctrl[0], ctrl[1]);
    const q2 = perim(B, ctrl[0], ctrl[1]);
    const dEnd = unit(ctrl, q2), dStart = unit(ctrl, q1);
    const tEnd = pull(q2, dEnd, 6), tStart = pull(q1, dStart, e.bidir ? 6 : 2.5);
    return { d: `M ${tStart[0].toFixed(1)},${tStart[1].toFixed(1)} Q ${ctrl[0].toFixed(1)},${ctrl[1].toFixed(1)} ${tEnd[0].toFixed(1)},${tEnd[1].toFixed(1)}`,
      tipEnd: tEnd, dirEnd: dEnd, tipStart: tStart, dirStart: dStart };
  }

  if (route === 'wallR' || route === 'wallL') {
    const wx = e.wall != null ? e.wall : (route === 'wallR' ? vbW - 14 : 14);
    const c1: Pt = [wx, p1[1]], c2: Pt = [wx, p2[1]];
    const dEnd = unit(c2, p2), dStart = unit(c1, p1);
    const tEnd = pull(p2, dEnd, 6), tStart = pull(p1, dStart, e.bidir ? 6 : 2.5);
    return { d: roundCorners([p1, c1, c2, tEnd], R), tipEnd: tEnd, dirEnd: dEnd, tipStart: tStart, dirStart: dStart };
  }
  if (route === 'wallB' || route === 'wallT') {
    const wy = e.wall != null ? e.wall : (route === 'wallT' ? 14 : vbH - 14);
    const c1: Pt = [p1[0], wy], c2: Pt = [p2[0], wy];
    const dEnd = unit(c2, p2), dStart = unit(c1, p1);
    const tEnd = pull(p2, dEnd, 6), tStart = pull(p1, dStart, e.bidir ? 6 : 2.5);
    return { d: roundCorners([p1, c1, c2, tEnd], R), tipEnd: tEnd, dirEnd: dEnd, tipStart: tStart, dirStart: dStart };
  }
  if (route === 'curve') {
    const ctrl: Pt = [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2 + (e.bow || 60)];
    const dEnd = unit(ctrl, p2), dStart = unit(ctrl, p1);
    const tEnd = pull(p2, dEnd, 6), tStart = pull(p1, dStart, e.bidir ? 6 : 4);
    return { d: `M ${tStart[0].toFixed(1)},${tStart[1].toFixed(1)} Q ${ctrl[0].toFixed(1)},${ctrl[1].toFixed(1)} ${tEnd[0].toFixed(1)},${tEnd[1].toFixed(1)}`,
      tipEnd: tEnd, dirEnd: dEnd, tipStart: tStart, dirStart: dStart };
  }
  // düz / otomatik — paralel çiftler için dik kayma
  if (e.off) {
    const dx = p2[0] - p1[0], dy = p2[1] - p1[1], l = Math.hypot(dx, dy) || 1;
    const ox = (-dy / l) * e.off, oy = (dx / l) * e.off;
    p1 = [p1[0] + ox, p1[1] + oy]; p2 = [p2[0] + ox, p2[1] + oy];
  }
  const dir = unit(p1, p2);
  const gEnd = 6, gStart = e.bidir ? 6 : 2.5;
  const a: Pt = [p1[0] + dir[0] * gStart, p1[1] + dir[1] * gStart];
  const b: Pt = [p2[0] - dir[0] * gEnd, p2[1] - dir[1] * gEnd];
  return { d: `M ${a[0].toFixed(1)},${a[1].toFixed(1)} L ${b[0].toFixed(1)},${b[1].toFixed(1)}`,
    tipEnd: b, dirEnd: dir, tipStart: a, dirStart: [-dir[0], -dir[1]] };
}

// ── ok başı (açık, net üçgen) ───────────────────────────────────────────
function arrowHead(tip: Pt, dir: Pt, color: string): string {
  const L = 10.5, Wf = 4.7, notch = 6.8;
  const bx = tip[0] - dir[0] * L, by = tip[1] - dir[1] * L;
  const nx = tip[0] - dir[0] * notch, ny = tip[1] - dir[1] * notch;
  const px = -dir[1] * Wf, py = dir[0] * Wf;
  return `<path d="M${tip[0].toFixed(1)},${tip[1].toFixed(1)} ` +
    `L${(bx + px).toFixed(1)},${(by + py).toFixed(1)} ` +
    `L${nx.toFixed(1)},${ny.toFixed(1)} ` +
    `L${(bx - px).toFixed(1)},${(by - py).toFixed(1)} Z" fill="${color}"/>`;
}

// ── Düğüm gövdesi (şekil) ───────────────────────────────────────────────
function shapeSvg(n: BdxNode): string {
  const fillAcc = 'url(#bdxAcc)';
  let fill: string, stroke: string, sw = 1.4, dash = '';
  if (n.variant === 'accent') { fill = fillAcc; stroke = 'rgba(0,0,0,.18)'; sw = 1; }
  else if (n.variant === 'soft') { fill = '#efeeec'; stroke = 'rgba(0,0,0,.16)'; dash = n.dashed ? '6,4' : ''; }
  else { fill = '#ffffff'; stroke = 'rgba(0,0,0,.10)'; dash = n.dashed ? '6,4' : ''; }
  const at = `fill="${fill}" stroke="${stroke}" stroke-width="${sw}"${dash ? ` stroke-dasharray="${dash}"` : ''} filter="url(#bdxSh)"`;
  if (n.shape === 'oval' || n.shape === 'circle') {
    const [cx, cy] = cen(n);
    return `<ellipse cx="${cx}" cy="${cy}" rx="${n.w / 2}" ry="${n.h / 2}" ${at}/>`;
  }
  const rx = n.shape === 'pill' ? n.h / 2 : (n.rx != null ? n.rx : 13);
  return `<rect x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" rx="${rx}" ${at}/>`;
}

// ── basit kelime sarma ──────────────────────────────────────────────────
function wrap(text: unknown, maxChars: number): string[] {
  const words = String(text == null ? '' : text).split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const lines: string[] = []; let cur = '';
  for (const w of words) {
    if (!cur) cur = w;
    else if ((cur + ' ' + w).length <= maxChars) cur += ' ' + w;
    else { lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);
  return lines;
}

// ── Düğüm içeriği ────────────────────────────────────────────────────────
function nodeBody(n: BdxNode): string {
  const acc = n.variant === 'accent';
  const lblC = acc ? '#F4F3EF' : (n.variant === 'soft' ? '#6f6d67' : '#2A2926');
  const txtC = acc ? '#E7E5DF' : '#57554F';
  const subC = acc ? 'rgba(244,243,239,.62)' : '#9a988f';
  const phC  = acc ? 'rgba(244,243,239,.45)' : '#b3b1aa';
  const circ = n.shape === 'oval' || n.shape === 'circle';
  const padX = circ ? Math.max(12, n.w * 0.12) : 11;
  const cx = n.x + n.w / 2;
  const lblSize = n.lblSize || (n.h < 56 ? 8.6 : 9.4);
  const lineH = lblSize * 1.22;
  const lblMax = Math.max(6, Math.floor((n.w - padX * 2) / (lblSize * 0.62)));
  const lines = wrap(n.title, lblMax);
  const subSize = 7.5;
  const subLines = n.sub ? wrap(n.sub, Math.max(8, Math.floor((n.w - padX * 2) / (subSize * 0.58)))) : [];
  const hasTa = !!n.key;

  const labelH = lines.length * lineH;
  const subH = subLines.length ? subLines.length * subSize * 1.3 + 3 : 0;

  let base: number;
  if (hasTa) base = n.y + (circ ? n.h * 0.30 : 12) + lblSize;
  else base = n.y + (n.h - labelH - subH) / 2 + lblSize * 0.92;

  let out = `<text x="${cx}" y="${base.toFixed(1)}" text-anchor="middle" font-weight="700" font-size="${lblSize}" letter-spacing="0.045em" fill="${lblC}" style="text-transform:uppercase;">`;
  lines.forEach((l, i) => { out += `<tspan x="${cx}" dy="${i === 0 ? 0 : lineH.toFixed(1)}">${esc(l)}</tspan>`; });
  out += `</text>`;

  let lastY = base + (lines.length - 1) * lineH;
  if (subLines.length) {
    const sy = lastY + subSize + 2;
    out += `<text x="${cx}" y="${sy.toFixed(1)}" text-anchor="middle" font-weight="600" font-size="${subSize}" fill="${subC}">`;
    subLines.forEach((l, i) => { out += `<tspan x="${cx}" dy="${i === 0 ? 0 : (subSize * 1.3).toFixed(1)}">${esc(l)}</tspan>`; });
    out += `</text>`;
    lastY = sy + (subLines.length - 1) * subSize * 1.3;
  }

  if (hasTa) {
    const taTop = lastY + 5;
    const taH = Math.max(15, n.y + n.h - taTop - (circ ? 12 : 8));
    out += `<foreignObject x="${(n.x + padX).toFixed(1)}" y="${taTop.toFixed(1)}" width="${(n.w - padX * 2).toFixed(1)}" height="${taH.toFixed(1)}">` +
      `<div xmlns="${XH}" class="bdx-node ${acc ? 'is-acc' : ''}">` +
      `<textarea data-fkey="${esc(n.key)}" data-label="${esc(n.title || '')}" data-desc="${esc(n.desc || '')}" placeholder="${esc(n.ph || '…')}" rows="1" style="width:100%;background:transparent;border:0;outline:0;resize:none;text-align:center;font-family:inherit;font-size:9px;line-height:1.4;color:${txtC};overflow:hidden;${acc ? '--ph:' + phC : ''}"></textarea>` +
      `</div></foreignObject>`;
  }
  return out;
}

// ── Formül özel düzeni (anksiyete-formul) ───────────────────────────────
function formulaSvg(): string {
  const card = (x: number, y: number, w: number, h: number, key: string, label: string) => {
    const cx = x + w / 2;
    const lineH = 9.5 * 1.22;
    const lines = wrap(label, Math.max(8, Math.floor((w - 18) / (9.5 * 0.62))));
    const base = y + 16 + 9.5;
    let t = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="13" fill="#fff" stroke="rgba(0,0,0,.10)" stroke-width="1.4" filter="url(#bdxSh)"/>`;
    t += `<text x="${cx}" y="${base.toFixed(1)}" text-anchor="middle" font-weight="700" font-size="9.5" letter-spacing="0.045em" fill="#2A2926" style="text-transform:uppercase;">`;
    lines.forEach((l, i) => { t += `<tspan x="${cx}" dy="${i === 0 ? 0 : lineH.toFixed(1)}">${esc(l)}</tspan>`; });
    t += `</text>`;
    const taTop = base + (lines.length - 1) * lineH + 6;
    const taH = Math.max(16, y + h - taTop - 8);
    t += `<foreignObject x="${x + 10}" y="${taTop.toFixed(1)}" width="${w - 20}" height="${taH.toFixed(1)}"><div xmlns="${XH}" class="bdx-node"><textarea data-fkey="${key}" data-label="${esc(label || '')}" placeholder="…" rows="1" style="width:100%;background:transparent;border:0;outline:0;resize:none;text-align:center;font-family:inherit;font-size:9px;line-height:1.4;color:#57554F;overflow:hidden;"></textarea></div></foreignObject>`;
    return t;
  };
  const op = (x: number, y: number, t: string) => `<text x="${x}" y="${y}" font-size="26" font-weight="500" fill="#2A2926" text-anchor="middle">${t}</text>`;
  return [
    `<text x="40" y="180" font-size="14" font-weight="700" fill="#8C8A84" transform="rotate(-90 40 180)" text-anchor="middle" letter-spacing="2" font-family="inherit">ANKSİYETE</text>`,
    op(96, 168, '='),
    card(140, 30, 195, 102, 'ank_buyukluk', 'Tehlikenin Büyüklüğü'),
    op(352, 95, '×'),
    card(372, 30, 270, 102, 'ank_olasilik', 'Tehlikenin Olasılığı'),
    `<line x1="132" y1="158" x2="650" y2="158" stroke="#2A2926" stroke-width="2.5"/>`,
    card(140, 168, 195, 102, 'ank_bascikma', 'Başa Çıkma Becerisi'),
    op(352, 233, '+'),
    card(372, 168, 270, 102, 'ank_imkan', 'İmkânlar / Destek'),
  ].join('');
}

// ── Ana çizim ───────────────────────────────────────────────────────────
export type GetFn = (k: string) => string;
export type SetFn = (k: string, v: string) => void;

export function renderBdx(host: HTMLElement, def: DiagramDef, get: GetFn, set: SetFn): void {
  const [W, H] = def.vb;
  const byKey: Record<string, BdxNode> = {};
  (def.nodes || []).forEach((n) => { if (n.key) byKey[n.key] = n; else { n._id = '_' + Math.random().toString(36).slice(2, 7); byKey[n._id] = n; } });
  // edges may reference node by key OR by an explicit id stored on node as .id
  (def.nodes || []).forEach((n) => { if (n.id) byKey[n.id] = n; });

  let edges = '';
  (def.edges || []).forEach((e) => {
    const r = edgePath(def, e, byKey);
    if (!r) return;
    const fb = e.kind === 'feedback';
    const stroke = fb ? '#7d7b75' : '#56544f';
    const headC = '#2A2926';
    const dash = fb || e.dashed ? ' stroke-dasharray="7,5"' : '';
    edges += `<path d="${r.d}" fill="none" stroke="${stroke}" stroke-width="${fb ? 1.7 : 1.9}" stroke-linecap="round" stroke-linejoin="round"${dash}/>`;
    edges += arrowHead(r.tipEnd, r.dirEnd, headC);
    if (e.bidir) edges += arrowHead(r.tipStart, r.dirStart, headC);
  });

  let body: string;
  if (def.layout === 'formula') {
    body = formulaSvg();
  } else {
    let nodes = '';
    (def.nodes || []).forEach((n) => { nodes += shapeSvg(n) + nodeBody(n); });
    body = edges + nodes;
  }

  const defsSvg =
    `<defs>` +
    `<linearGradient id="bdxAcc" x1="0" y1="0" x2="0.5" y2="1">` +
    `<stop offset="0" stop-color="#3a3a38"/><stop offset="0.45" stop-color="#262624"/><stop offset="1" stop-color="#141413"/></linearGradient>` +
    `<filter id="bdxSh" x="-20%" y="-20%" width="140%" height="150%">` +
    `<feDropShadow dx="0" dy="2" stdDeviation="3.2" flood-color="#1a1a1a" flood-opacity="0.13"/></filter>` +
    `</defs>`;

  host.innerHTML =
    `<svg viewBox="0 0 ${W} ${H}" width="100%" style="display:block;max-width:${def.max || W}px;margin:0 auto;height:auto;font-family:'Plus Jakarta Sans',sans-serif;">${defsSvg}${body}</svg>` +
    (def.cite ? `<p class="bdx-cite">${esc(def.cite)}</p>` : '');

  // legend
  if (def.legend !== false && def.layout !== 'formula' && (def.edges || []).some((e) => e.kind === 'feedback')) {
    const lg = document.createElement('div');
    lg.className = 'bdx-legend';
    lg.innerHTML =
      `<span><svg width="24" height="8"><line x1="1" y1="4" x2="15" y2="4" stroke="#56544f" stroke-width="1.9"/><path d="M15,1 L22,4 L15,7 L17,4 Z" fill="#2A2926"/></svg>İleri akış</span>` +
      `<span><svg width="24" height="8"><line x1="1" y1="4" x2="15" y2="4" stroke="#7d7b75" stroke-width="1.7" stroke-dasharray="4,3"/><path d="M15,1 L22,4 L15,7 L17,4 Z" fill="#2A2926"/></svg>Geri besleme</span>`;
    host.insertBefore(lg, host.querySelector('.bdx-cite'));
  }

  // bind textareas
  host.querySelectorAll<HTMLTextAreaElement>('textarea[data-fkey]').forEach((ta) => {
    const k = ta.getAttribute('data-fkey') as string;
    ta.value = get(k) || '';
    const grow = () => { ta.style.height = 'auto'; ta.style.height = ta.scrollHeight + 'px'; };
    grow();
    ta.addEventListener('input', () => { set(k, ta.value); grow(); });
  });
}
