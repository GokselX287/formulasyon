export default function BriefingLoading() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg, #EFEDE8)',
      display: 'flex',
      flexDirection: 'column',
      animation: 'pulse 1.5s ease-in-out infinite',
    }}>
      {/* Strip skeleton */}
      <div style={{
        height: 65,
        borderBottom: '1px solid var(--line, rgba(14,15,18,0.10))',
        background: 'var(--bg, #EFEDE8)',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '0 28px',
      }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--line, rgba(14,15,18,0.10))' }} />
        <div style={{ height: 14, width: 160, borderRadius: 6, background: 'var(--line, rgba(14,15,18,0.10))' }} />
        <div style={{ marginLeft: 'auto', height: 36, width: 120, borderRadius: 999, background: 'var(--line, rgba(14,15,18,0.10))' }} />
      </div>
      {/* Content skeleton */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 28px', width: '100%', display: 'flex', flexDirection: 'column', gap: 28 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 18 }}>
          <div style={{ height: 120, borderRadius: 18, background: 'var(--paper, #FAF8F5)' }} />
          <div style={{ height: 120, borderRadius: 18, background: 'var(--paper, #FAF8F5)' }} />
        </div>
        <div style={{ height: 90, borderRadius: 8, background: 'var(--paper, #FAF8F5)' }} />
        <div style={{ height: 80, background: 'var(--paper, #FAF8F5)', borderRadius: 8 }} />
        <div style={{ height: 56, borderRadius: 8, background: 'var(--paper, #FAF8F5)' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1,2,3,4].map(i => (
            <div key={i} style={{ height: 44, borderRadius: 8, background: 'var(--paper, #FAF8F5)', opacity: 1 - i * 0.15 }} />
          ))}
        </div>
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.55} }`}</style>
    </div>
  );
}
