import { getClient } from '@/lib/queries';
import { currentOwnerIdRSC } from '@/lib/tenant';
import { notFound } from 'next/navigation';
import ClientFileChrome from '@/components/ClientFileChrome';

export default async function ClientLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const uid = await currentOwnerIdRSC();
  const client = uid ? getClient(parseInt(id), uid) : null;
  if (!client) notFound();

  return (
    <ClientFileChrome id={id} alias={client.alias} age={client.age}>
      {children}
    </ClientFileChrome>
  );
}
