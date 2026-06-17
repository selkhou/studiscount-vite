export default function SIOKLogo({ size = 'md' }) {
  const cfg = {
    sm: { s: 22, gap: 1 },
    md: { s: 32, gap: 2 },
    lg: { s: 48, gap: 3 }
  }[size] || { s: 32, gap: 2 }

  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: cfg.gap, flexShrink: 0, lineHeight: 1 }}>
      <span style={{ fontFamily: 'Arial Black,sans-serif', fontWeight: 900, fontSize: cfg.s, color: '#0066FF', letterSpacing: -1, lineHeight: 1 }}>Stu</span>
      <span style={{ fontFamily: 'Arial Black,sans-serif', fontWeight: 900, fontSize: cfg.s, color: '#F59E0B', letterSpacing: -1, lineHeight: 1 }}>Discount</span>
    </div>
  )
}