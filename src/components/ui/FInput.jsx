import { getC } from '../../constants.js'

export default function FInput({ label, type = 'text', value, onChange, placeholder, hint, disabled, required, prefix }) {
  const C = getC()
  return (
    <div style={{ marginBottom: 14 }}>
      {label && (
        <div style={{ color: C.sub, fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>
          {label}{required && <span style={{ color: C.red, marginLeft: 3 }}>*</span>}
        </div>
      )}
      <div style={{
        display: 'flex', alignItems: 'center',
        background: disabled ? 'rgba(255,255,255,0.03)' : C.card,
        border: `1px solid ${C.border}`,
        borderRadius: 12, overflow: 'hidden',
        opacity: disabled ? 0.6 : 1
      }}>
        {prefix && (
          <span style={{ padding: '0 12px', color: C.muted, fontSize: 14, borderRight: `1px solid ${C.border}`, flexShrink: 0 }}>
            {prefix}
          </span>
        )}
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          style={{
            flex: 1, background: 'transparent', border: 'none', outline: 'none',
            padding: '14px 16px', color: C.text, fontSize: 15, fontFamily: 'inherit'
          }}
        />
      </div>
      {hint && <div style={{ color: C.muted, fontSize: 11, marginTop: 4 }}>{hint}</div>}
    </div>
  )
}