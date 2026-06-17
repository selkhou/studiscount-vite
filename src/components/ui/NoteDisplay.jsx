import { CS } from '../../constants.js'

export default function NoteDisplay({ note, nbAvis, small }) {
  if (!note && !nbAvis) return null

  const stars = Math.round(note || 0)

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: small ? 4 : 6 }}>
      <div style={{ display: 'flex', gap: 2 }}>
        {[1, 2, 3, 4, 5].map(i => (
          <span key={i} style={{
            fontSize: small ? 11 : 14,
            color: i <= stars ? '#F59E0B' : '#D1D5DB'
          }}>★</span>
        ))}
      </div>
      {note && (
        <span style={{
          fontSize: small ? 11 : 13,
          fontWeight: 700,
          color: CS.text
        }}>
          {Number(note).toFixed(1)}
        </span>
      )}
      {nbAvis > 0 && (
        <span style={{
          fontSize: small ? 10 : 12,
          color: CS.muted
        }}>
          ({nbAvis} avis)
        </span>
      )}
    </div>
  )
}