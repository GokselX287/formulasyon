export default function ProfilLoading() {
  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      background: 'var(--bg, #f5f4f0)',
      animation: 'pulse 1.5s ease-in-out infinite',
    }}>
      {/* Sidebar skeleton */}
      <div style={{
        width: 280,
        flexShrink: 0,
        borderRight: '1px solid var(--line, #e2ddd5)',
        background: 'var(--surface, #fff)',
        padding: '32px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
      }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--line, #e2ddd5)' }} />
        <div style={{ height: 16, width: '70%', borderRadius: 6, background: 'var(--line, #e2ddd5)' }} />
        <div style={{ height: 12, width: '50%', borderRadius: 6, background: 'var(--line, #e2ddd5)' }} />
        <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1,2,3,4,5].map(i => (
            <div key={i} style={{ height: 10, width: `${60 + i * 5}%`, borderRadius: 6, background: 'var(--line, #e2ddd5)' }} />
          ))}
        </div>
      </div>
      {/* Main skeleton */}
      <div style={{ flex: 1, padding: '48px 56px', display: 'flex', flexDirection: 'column', gap: 32 }}>
        <div style={{ height: 28, width: '40%', borderRadius: 6, background: 'var(--line, #e2ddd5)' }} />
        <div style={{ height: 14, width: '60%', borderRadius: 6, background: 'var(--line, #e2ddd5)' }} />
        <div style={{ height: 200, borderRadius: 12, background: 'var(--line, #e2ddd5)', opacity: 0.5 }} />
        <div style={{ height: 160, borderRadius: 12, background: 'var(--line, #e2ddd5)', opacity: 0.4 }} />
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }`}</style>
    </div>
  );
}
