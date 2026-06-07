// =====================================================================
// ACT Hexaflex — Psikolojik Esneklik anketi (18 soru · 6 süreç × 3)
// Düzenlenebilir ölçek + skorlama. flexibility_scores POZİTİF kutupları
// tutar (0-10, yüksek=iyi); 6 grup birebir o kolonlara yazılır.
// Likert 0–6 (7'li): 0 = Hiç katılmıyorum … 6 = Tamamen katılıyorum.
// Tüm sorular pozitif yönde yazılır (ters puanlama yok).
// =====================================================================

export type HexGroupKey =
  | 'defusion' | 'acceptance' | 'present_moment'
  | 'self_as_context' | 'values_clarity' | 'committed_action';

export type HexQuestion = { id: string; text: string };
export type HexGroup = { key: HexGroupKey; label: string; sade: string; questions: HexQuestion[] };

export const HEX_LIKERT_MAX = 6;
export const HEX_LIKERT_LABELS = ['Hiç', '', '', 'Kısmen', '', '', 'Tamamen'];

export const HEX_GROUP_META: { key: HexGroupKey; label: string; sade: string }[] = [
  { key: 'present_moment',   label: 'Şimdiki an',        sade: 'Ana odaklanma' },
  { key: 'acceptance',       label: 'Kabul',             sade: 'Duyguları kabul' },
  { key: 'defusion',         label: 'Defüzyon',          sade: 'Düşünceden ayrışma' },
  { key: 'self_as_context',  label: 'Gözlemleyen benlik', sade: 'Kendini izleme' },
  { key: 'values_clarity',   label: 'Değerler',          sade: 'Değer netliği' },
  { key: 'committed_action', label: 'Kararlı eylem',     sade: 'Değerli adımlar' },
];

export const DEFAULT_HEX_SCALE: HexGroup[] = [
  { key: 'present_moment', label: 'Şimdiki an', sade: 'Ana odaklanma', questions: [
    { id: 'pm1', text: 'Günlük işlerimi yaparken dikkatim şu ana odaklı kalır.' },
    { id: 'pm2', text: 'Bir şey yaşarken zihnim başka yerlere kaçmadan o anı fark edebilirim.' },
    { id: 'pm3', text: 'Otomatik pilotta değil, bilinçli bir farkındalıkla hareket ederim.' },
  ] },
  { key: 'acceptance', label: 'Kabul', sade: 'Duyguları kabul', questions: [
    { id: 'ac1', text: 'Zor duygularımı bastırmaya çalışmadan, olduğu gibi kabul edebilirim.' },
    { id: 'ac2', text: 'Kaygı ya da üzüntü hissettiğimde onunla mücadele etmek yerine ona yer açabilirim.' },
    { id: 'ac3', text: 'Rahatsız edici duygular, yapmak istediğim şeyleri yapmama engel olmaz.' },
  ] },
  { key: 'defusion', label: 'Defüzyon', sade: 'Düşünceden ayrışma', questions: [
    { id: 'df1', text: 'Olumsuz düşüncelerimi, onlara kapılmadan bir kenara bırakabilirim.' },
    { id: 'df2', text: 'Bir düşüncenin gerçek değil, sadece bir düşünce olduğunu fark edebilirim.' },
    { id: 'df3', text: 'Zihnimin söylediği her şeye inanmak zorunda olmadığımı bilirim.' },
  ] },
  { key: 'self_as_context', label: 'Gözlemleyen benlik', sade: 'Kendini izleme', questions: [
    { id: 'sc1', text: 'Düşünce ve duygularımı, onlar tarafından tanımlanmadan gözlemleyebilirim.' },
    { id: 'sc2', text: 'Duygularım değişse de "ben"in değişmeden kaldığını hissederim.' },
    { id: 'sc3', text: 'Kendime, içimdeki deneyimleri izleyen bir gözlemci gibi bakabilirim.' },
  ] },
  { key: 'values_clarity', label: 'Değerler', sade: 'Değer netliği', questions: [
    { id: 'vc1', text: 'Hayatta benim için neyin önemli olduğunu (değerlerimi) net biliyorum.' },
    { id: 'vc2', text: 'Nasıl bir insan olmak istediğime dair bir yön duygum var.' },
    { id: 'vc3', text: 'Kararlarımı değerlerime göre verebiliyorum.' },
  ] },
  { key: 'committed_action', label: 'Kararlı eylem', sade: 'Değerli adımlar', questions: [
    { id: 'ca1', text: 'Zorlansam da değerlerime uygun adımları atmayı sürdürürüm.' },
    { id: 'ca2', text: 'Önemli hedeflerim için engellere rağmen harekete geçerim.' },
    { id: 'ca3', text: 'Kısa vadeli rahatlama yerine uzun vadede değer verdiğim şeyi seçebilirim.' },
  ] },
];

/** Yanıtlar (qId→0..6) → her grup için 0-10 puan (yüksek = iyi). */
export function scoreHexGroups(
  scale: HexGroup[],
  answers: Record<string, number>,
): Partial<Record<HexGroupKey, number>> {
  const out: Partial<Record<HexGroupKey, number>> = {};
  for (const g of scale) {
    const vals = g.questions
      .map((q) => answers[q.id])
      .filter((v) => typeof v === 'number' && !Number.isNaN(v)) as number[];
    if (!vals.length) continue;
    const avg = vals.reduce((s, v) => s + v, 0) / vals.length;
    out[g.key] = Math.round((avg / HEX_LIKERT_MAX) * 10);
  }
  return out;
}
