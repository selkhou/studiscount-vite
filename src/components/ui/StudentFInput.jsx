import { CS } from '../../constants.js'

export default function StudentFInput({ label, type = 'text', value, onChange, placeholder, hint, disabled, required }) {
  return (
    <div style={{ marginBottom: 16 }}>
      {label && (
        <div style={{ color: CS.text, fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
          {label}{required && <span style={{ color: CS.accent, marginLeft: 3 }}>*</span>}
        </div>
      )}
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        style={{
          width: '100%',
          background: disabled ? '#F8F8F8' : '#FFFFFF',
          border: '1.5px solid',
          borderColor: disabled ? '#E8E8E8' : '#E0E0E0',
          borderRadius: 12,
          padding: '14px 16px',
          color: CS.text,
          fontSize: 15,
          fontFamily: 'inherit',
          outline: 'none',
          opacity: disabled ? 0.6 : 1
        }}
      />
      {hint && <div style={{ color: CS.muted, fontSize: 12, marginTop: 5 }}>{hint}</div>}
    </div>
  )
}