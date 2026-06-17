import { useState } from 'react'

export default function PhotoCarousel({ photos, height = 160, emoji = '🎁', gradient = 'linear-gradient(135deg,#14B8A6,#0066FF)' }) {
  const [idx, setIdx] = useState(0)

  if (!photos || photos.length === 0) {
    return (
      <div style={{
        height, background: gradient,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 48, flexShrink: 0
      }}>
        {emoji}
      </div>
    )
  }

  return (
    <div style={{ position: 'relative', height, flexShrink: 0, overflow: 'hidden' }}>
      <img
        src={photos[idx]}
        alt=""
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />
      {photos.length > 1 && (
        <>
          <button
            onClick={() => setIdx(i => (i - 1 + photos.length) % photos.length)}
            style={{
              position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
              background: 'rgba(0,0,0,0.4)', border: 'none', borderRadius: '50%',
              width: 28, height: 28, color: 'white', cursor: 'pointer', fontSize: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>‹</button>
          <button
            onClick={() => setIdx(i => (i + 1) % photos.length)}
            style={{
              position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
              background: 'rgba(0,0,0,0.4)', border: 'none', borderRadius: '50%',
              width: 28, height: 28, color: 'white', cursor: 'pointer', fontSize: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>›</button>
          <div style={{
            position: 'absolute', bottom: 6, left: 0, right: 0,
            display: 'flex', justifyContent: 'center', gap: 4
          }}>
            {photos.map((_, i) => (
              <div key={i} onClick={() => setIdx(i)} style={{
                width: i === idx ? 16 : 6, height: 6,
                borderRadius: 3, cursor: 'pointer',
                background: i === idx ? 'white' : 'rgba(255,255,255,0.5)',
                transition: 'all 0.2s'
              }} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}