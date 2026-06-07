type Props = {
  title: string;
  children: React.ReactNode;
};

export default function Section({ title, children }: Props) {
  return (
    <section style={{
      background: 'var(--surface)',
      border: '1px solid var(--line)',
      borderRadius: '8px',
      padding: '24px',
      marginBottom: '20px',
    }}>
      <h2 style={{ fontSize: '15px', marginBottom: '20px', color: 'var(--ink)' }}>{title}</h2>
      {children}
    </section>
  );
}
