import { getAllTags, createTag, getSetting, setSetting } from '@/lib/queries';
import { NextRequest } from 'next/server';

const SEED_TAGS = [
  ["ana_sikayetler", "Depresyon"], ["ana_sikayetler", "Sosyal Kaygı"],
  ["ana_sikayetler", "Uyku Sorunları"], ["ana_sikayetler", "İştahsızlık"],
  ["ana_sikayetler", "Panik Atak"], ["ana_sikayetler", "Yas"],
  ["yonlendirme_nedeni", "Aile yönlendirmesi"], ["yonlendirme_nedeni", "Hekim yönlendirmesi"],
  ["predispozan", "Çocuklukta ihmal"], ["predispozan", "Aile geçmişi"],
  ["presipitan", "İş kaybı"], ["presipitan", "Ayrılık"], ["presipitan", "Taşınma"],
  ["perpetuan", "Kaçınma davranışı"], ["perpetuan", "Ruminasyon"],
  ["protektif", "Sosyal destek"], ["protektif", "Egzersiz alışkanlığı"],
  ["temel_inanclar", "Yetersizim"], ["temel_inanclar", "Sevilmezim"],
  ["ara_inanclar", "Mükemmel olmalıyım"], ["ara_inanclar", "Onaylanmalıyım"],
  ["basa_cikma", "Aşırı çalışma"], ["basa_cikma", "Kontrol etme"],
  ["otomatik_dusunceler", "Başaramayacağım"], ["otomatik_dusunceler", "Beni yargılıyorlar"],
  ["duygu_bedensel", "Çarpıntı"], ["duygu_bedensel", "Göğüste sıkışma"], ["duygu_bedensel", "Anksiyete"],
  ["davranislar", "Sosyal geri çekilme"], ["davranislar", "Erteleme"],
];

export async function GET() {
  // Seed on first call
  const initialized = getSetting('tags_seeded');
  if (!initialized) {
    SEED_TAGS.forEach(([category, label], i) => {
      createTag({ id: `t_seed_${i}`, category, label, count: 0 });
    });
    setSetting('tags_seeded', '1');
  }
  return Response.json(getAllTags());
}

export async function POST(request: NextRequest) {
  const data = await request.json();
  createTag(data);
  return Response.json({ ok: true });
}
