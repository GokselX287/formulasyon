'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

// Eski client-file kabuğu (üst bar + sol sekme şeridi). Yeni "Klinik Editöryel
// Dosya" tam-ekran alt-ekranları (ör. /anamnez) bu kabuğu atlar — kendi shell'i var.
const FULLSCREEN_SUFFIXES = ['/anamnez', '/cocuk'];

const TABS = [
  { slug: '01-profil', label: '01 Profil' },
  { slug: '02-sorun-hedef', label: '02 Sorun & Hedef' },
  { slug: '03-bariyerler', label: '03 Bariyerler' },
  { slug: '04-esneklik', label: '04 Esneklik' },
  { slug: '05-degerler', label: '05 Degerler' },
  { slug: '06-guclu-yanlar', label: '06 Guclu Yanlar' },
  { slug: '07-hikaye', label: '07 Hikaye' },
  { slug: '08-mudahaleler', label: '08 Mudahaleler' },
  { slug: '09-iliski', label: '09 Iliski' },
  { slug: '10-boylamsal', label: '10 Boylamsal' },
];

export default function ClientFileChrome({
  id, alias, age, children,
}: {
  id: string;
  alias: string;
  age?: number | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname() ?? '';
  const fullscreen = FULLSCREEN_SUFFIXES.some((s) => pathname.endsWith(s));

  if (fullscreen) return <>{children}</>;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{ borderBottom: '1px solid var(--line)', background: 'var(--surface)', padding: '12px 32px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <Link href="/" style={{ color: 'var(--ink-soft)', fontSize: '13px', textDecoration: 'none' }}>← Danisanlar</Link>
        <span style={{ color: 'var(--line-strong)' }}>|</span>
        <span style={{ fontFamily: 'var(--font-fraunces), serif', fontSize: '18px' }}>{alias}</span>
        {age && <span style={{ fontSize: '13px', color: 'var(--ink-soft)' }}>{age} yas</span>}
      </header>

      <div style={{ display: 'flex', flex: 1 }}>
        <nav style={{ width: '180px', flexShrink: 0, borderRight: '1px solid var(--line)', background: 'var(--surface)', padding: '16px 0' }}>
          {TABS.map((tab) => (
            <Link key={tab.slug} href={`/clients/${id}/${tab.slug}`} style={{ display: 'block', padding: '9px 20px', fontSize: '13px', color: 'var(--ink-soft)', textDecoration: 'none', borderLeft: '2px solid transparent' }} className="tab-link">
              {tab.label}
            </Link>
          ))}
        </nav>

        <main style={{ flex: 1, padding: '32px', overflow: 'auto' }}>
          {children}
        </main>
      </div>

      <style>{`.tab-link:hover { color: var(--ink); background: var(--accent-soft); }`}</style>
    </div>
  );
}
