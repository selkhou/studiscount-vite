import { CS, getC } from '../../constants.js'
import SIOKLogo from './SIOKLogo.jsx'

export function StudentPageShell({ onBack, backLabel, topSlot, children, noPad, stickyHeader = true }) {
  return (
    <div style={{ minHeight: '100vh', background: CS.bg, display: 'flex', flexDirection: 'column' }}>
      <div style={{
        background: '#FFFFFF',
        boxShadow: '0 1px 0 rgba(0,0,0,0.08)',
        padding: '52px 20px 14px',
        flexShrink: 0,
        ...(stickyHeader ? { position: 'sticky', top: 0, zIndex: 100 } : {})
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: topSlot ? 10 : 0 }}>
          {onBack ? (
            <button onClick={onBack} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'transparent', border: 'none',
              color: CS.text, fontSize: 14, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit', padding: '4px 0'
            }}>
              <span style={{ fontSize: 22, lineHeight: 1 }}>←</span>
              {backLabel && <span style={{ fontSize: 13, color: CS.muted }}>{backLabel}</span>}
            </button>
          ) : <div />}
          <SIOKLogo size="sm" />
        </div>
        {topSlot}
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: noPad ? '0' : '0 0 80px' }}>
        {children}
      </div>
    </div>
  )
}

export function PrestPageShell({ onBack, backLabel, topSlot, children, onHome, bgColor, headerColor }) {
  const C = getC()
  const bg = bgColor || C.bg
  const hdr = headerColor || C.surface
  return (
    <div style={{ minHeight: '100vh', background: bg, display: 'flex', flexDirection: 'column' }}>
      <div style={{
        background: hdr,
        borderBottom: `1px solid ${C.border}`,
        padding: '52px 20px 14px',
        flexShrink: 0,
        position: 'sticky', top: 0, zIndex: 100
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: topSlot ? 10 : 0 }}>
          {onBack ? (
            <button onClick={onBack} style={{
              background: 'transparent', border: 'none',
              color: C.muted, cursor: 'pointer',
              fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', gap: 6, fontSize: 13
            }}>
              <span style={{ fontSize: 18 }}>←</span>{backLabel}
            </button>
          ) : <div />}
          <SIOKLogo size="sm" />
          {onHome && (
            <button onClick={onHome} style={{
              background: 'transparent', border: 'none',
              color: C.muted, cursor: 'pointer',
              fontFamily: 'inherit', fontSize: 12
            }}>🏠</button>
          )}
        </div>
        {topSlot}
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 0 80px' }}>
        {children}
      </div>
    </div>
  )
}