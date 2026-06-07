import { redirect } from 'next/navigation';

// Eski "sade danışan dosyası" (10 sekmeli düzenleme formu) kaldırıldı.
// Asıl arayüz: zengin rapor /profil/[id] (+ düzenleme FormulasyonV2 üzerinden).
// Anamnez/Çocuk alt-rotaları ayrı route segmentlerinde — bu yönlendirmeden etkilenmez.
export default async function TabPage({
  params,
}: {
  params: Promise<{ id: string; tab: string }>;
}) {
  const { id } = await params;
  redirect(`/profil/${id}`);
}
