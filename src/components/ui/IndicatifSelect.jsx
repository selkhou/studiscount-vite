import { useState } from 'react'
import { CS, INDICATIFS } from '../../constants.js'

export default function IndicatifSelect({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const sel = INDICATIFS.find(i => i.code === value) || INDICATIFS[0]

  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        style={{
          padding: '0 12px', height: '100%', minHeight: 50,
          background: 'transparent', border: 'none',
          borderRight: '1.5px solid #E8E8E8',
          color: '#6B7280', fontSize: 13, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 4,
          fontFamily: 'inherit', whiteSpace: 'nowrap'
        }}>
        {sel.flag} {sel.code} <span style={{ fontSize: 9 }}>▾</span>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0,
          background: '#FFFFFF', border: '1.5px solid #E8E8E8',
          borderRadius: 12, zIndex: 9999, minWidth: 180,
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)', overflow: 'hidden'
        }}>
          {INDICATIFS.map(ind => (
            <button
              key={ind.code}
              type="button"
              onClick={() => { onChange(ind.code); setOpen(false) }}
              style={{
                width: '100%', padding: '11px 14px',
                background: ind.code === value ? 'rgba(0,102,255,0.05)' : '#FFFFFF',
                border: 'none', borderBottom: '1px solid #F0F0F0',
                color: ind.code === value ? CS.accent : '#1F1F1F',
                fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
                textAlign: 'left', display: 'flex', gap: 8, alignItems: 'center',
                fontWeight: ind.code === value ? 700 : 400
              }}>
              <span>{ind.flag}</span>
              <span style={{ flex: 1 }}>{ind.label}</span>
              <span style={{ color: '#9CA3AF' }}>{ind.code}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}