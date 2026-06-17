import { CS } from '../../constants.js'
import IndicatifSelect from './IndicatifSelect.jsx'

export default function TelInput({ label, value, onChange, indicatif, onIndicatifChange, disabled, required }) {
  return (
    <div style={{ marginBottom: 16 }}>
      {label && (
        <div style={{ color: CS.text, fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
          {label}{required && <span style={{ color: CS.accent, marginLeft: 3 }}>*</span>}
        </div>
      )}
      <div style={{
        display: 'flex', alignItems: 'stretch',
        background: disabled ? '#F8F8F8' : '#FFFFFF',
        border: '1.5px solid',
        borderColor: disabled ? '#E8E8E8' : '#E0E0E0',
        borderRadius: 12,
        opacity: disabled ? 0.6 : 1,
        position: 'relative'
      }}>
        <IndicatifSelect value={indicatif} onChange={onIndicatifChange} />
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          type="tel"
          disabled={disabled}
          placeholder="06 12 34 56 78"
          style={{
            flex: 1, background: 'transparent', border: 'none',
            outline: 'none', padding: '14px',
            color: CS.text, fontSize: 15, fontFamily: 'inherit'
          }}
        />
      </div>
    </div>
  )
}