import { useState, useRef } from 'react'

export default function PhotoCarousel({ photos, height = 160, emoji = '🎁', gradient = 'linear-gradient(135deg,#14B8A6,#0066FF)' }) {
  const [idx, setIdx] = useState(0)
  const touchStartX = useRef(null)

  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX }
  const onTouchEnd = (e) => {
    if (touchStartX.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (dx < -40 && idx < photos.length - 1) setIdx(i => i + 1)
    if (dx > 40 && idx > 0) setIdx(i => i - 1)
    touchStartX.current = null
  }

  const hasPhotos = photos && photos.length > 0

  return (
    <div
      style={{ position: 'relative', height, overflow: 'hidden', borderRadius: '20px 20px 0 0', background: gradient, userSelect: 'none' }}
      onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      {hasPhotos
        ? <img src={photos[idx].url || photos[idx]} alt="" onError={e => e.target.style.display = 'none'}
            style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0, transition: 'opacity 0.2s' }} />
        : <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 64, filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.15))' }}>{emoji}</span>
          </div>
      }
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom,transparent 40%,rgba(0,0,0,0.45))', pointerEvents: 'none' }} />
      {hasPhotos && photos.length > 1 && idx > 0 && (
        <button onClick={e => { e.stopPropagation(); setIdx(i => i - 1) }}
          style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.85)', border: 'none', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>‹</button>
      )}
      {hasPhotos && photos.length > 1 && idx < photos.length - 1 && (
        <button onClick={e => { e.stopPropagation(); setIdx(i => i + 1) }}
          style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.85)', border: 'none', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>›</button>
      )}
      {hasPhotos && photos.length > 1 && (
        <div style={{ position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 5, zIndex: 2 }}>
          {photos.map((_, i) => (
            <div key={i} onClick={e => { e.stopPropagation(); setIdx(i) }}
              style={{ width: i === idx ? 16 : 6, height: 6, borderRadius: 3, background: i === idx ? 'white' : 'rgba(255,255,255,0.5)', transition: 'all 0.2s', cursor: 'pointer' }} />
          ))}
        </div>
      )}
    </div>
  )
}