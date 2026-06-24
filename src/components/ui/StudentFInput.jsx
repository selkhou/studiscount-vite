import { useState } from 'react'
import { CS } from '../../constants.js'

export default function StudentFInput({ label, type = 'text', value, onChange, placeholder, hint, disabled, required }) {
  const [showPwd, setShowPwd] = useState(false)
  const isPassword = type === 'password'
  const inputType = isPassword ? (showPwd ? 'text' : 'password') : type

  return (
    <div style={{ marginBottom: 16 }}>
      {label && (
        <div style={{ color: CS.text, fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
          {label}{required && <span style={{ color: CS.accent, marginLeft: 3 }}>*</span>}
        </div>
      )}
      <div style={{ position: 'relative' }}>
        <input
          type={inputType}
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
            padding: isPassword ? '14px 44px 14px 16px' : '14px 16px',
            color: CS.text,
            fontSize: 15,
            fontFamily: 'inherit',
            outline: 'none',
            opacity: disabled ? 0.6 : 1,
            boxSizing: 'border-box',
          }}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPwd(v => !v)}
            style={{
              position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer', padding: 4,
              color: '#9CA3AF', fontSize: 18, lineHeight: 1,
            }}
          >
            {showPwd ? '🙈' : '👁️'}
          </button>
        )}
      </div>
      {hint && <div style={{ color: CS.muted, fontSize: 12, marginTop: 5 }}>{hint}</div>}
    </div>
  )
}