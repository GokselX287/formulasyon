type Item = { id: number; content: string; category: string };

type Props = {
  values: Item[];
  controlStrategies: Item[];
};

const QUADRANTS = [
  {
    key: 'top-left',
    title: 'Deger-temelli ic deneyim',
    style: { gridColumn: '1', gridRow: '1', borderRight: '1px solid var(--line-strong)', borderBottom: '1px solid var(--line-strong)' },
    filter: (items: Item[]) => items.filter((i) => i.category === 'value'),
    labelStyle: { color: 'var(--accent-deep)' },
  },
  {
    key: 'top-right',
    title: 'Deger-temelli eylem',
    style: { gridColumn: '2', gridRow: '1', borderBottom: '1px solid var(--line-strong)' },
    filter: (items: Item[]) => items.filter((i) => i.category === 'value'),
    labelStyle: { color: 'var(--accent-deep)' },
  },
  {
    key: 'bottom-left',
    title: 'Kontrol-temelli ic deneyim',
    style: { gridColumn: '1', gridRow: '2', borderRight: '1px solid var(--line-strong)' },
    filter: (items: Item[]) => items.filter((i) => i.category === 'control_strategy'),
    labelStyle: { color: 'var(--ink-soft)' },
  },
  {
    key: 'bottom-right',
    title: 'Kontrol-temelli eylem',
    style: { gridColumn: '2', gridRow: '2' },
    filter: (items: Item[]) => items.filter((i) => i.category === 'control_strategy'),
    labelStyle: { color: 'var(--ink-soft)' },
  },
];

export default function MatrixGrid({ values, controlStrategies }: Props) {
  const allItems = [...values, ...controlStrategies];

  return (
    <div style={{ position: 'relative' }}>
      {/* Axis labels */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '11px', color: 'var(--ink-soft)' }}>
        <span>ic deneyim</span>
        <span>davranis</span>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gridTemplateRows: '1fr 1fr',
        border: '1px solid var(--line-strong)',
        borderRadius: '8px',
        overflow: 'hidden',
        minHeight: '200px',
      }}>
        {QUADRANTS.map((q) => {
          const items = q.filter(allItems);
          return (
            <div
              key={q.key}
              style={{
                ...q.style,
                padding: '12px',
                background: 'var(--surface)',
              }}
            >
              <p style={{
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '8px',
                ...q.labelStyle,
              }}>
                {q.title}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {items.map((item) => (
                  <span
                    key={item.id}
                    style={{
                      fontSize: '12px',
                      padding: '2px 8px',
                      background: 'var(--accent-soft)',
                      border: '1px solid var(--line)',
                      borderRadius: '6px',
                      color: 'var(--accent-deep)',
                    }}
                  >
                    {item.content}
                  </span>
                ))}
                {items.length === 0 && (
                  <span style={{ fontSize: '12px', color: 'var(--line-strong)' }}>—</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Y-axis label */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '11px', color: 'var(--ink-soft)' }}>
        <span style={{ writingMode: 'horizontal-tb' }}>deger (ust) / kacinma (alt)</span>
      </div>
    </div>
  );
}
