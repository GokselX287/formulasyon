type Props = {
  label: string;
  children: React.ReactNode;
  hint?: string;
};

export default function Field({ label, children, hint }: Props) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <label style={{
        display: 'block',
        fontSize: '12px',
        fontWeight: 600,
        color: 'var(--ink-soft)',
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        marginBottom: '6px',
      }}>
        {label}
      </label>
      {children}
      {hint && (
        <p style={{ fontSize: '12px', color: 'var(--ink-soft)', marginTop: '4px' }}>{hint}</p>
      )}
    </div>
  );
}
