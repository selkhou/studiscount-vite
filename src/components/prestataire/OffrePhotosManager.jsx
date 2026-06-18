import { useState } from 'react'
import { getC } from '../../constants.js'
import { db } from '../../lib/supabase.js'


const SUPABASE_URL = 'https://ghwozyzlhcmuhneumasv.supabase.co'
export default function OffrePhotosManager({ offreId, photos, onUpdate }) {
  const C = getC()
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const MAX = 5
  const list = Array.isArray(photos) ? photos : []

  const compressAndUpload = file => new Promise((resolve, reject) => {
    const img = new Image()
    const reader = new FileReader()
    reader.onload = e => { img.src = e.target.result }
    img.onload = () => {
      const MAX_PX = 1200
      let w = img.width, h = img.height
      if (w > MAX_PX) { h = Math.round(h * MAX_PX / w); w = MAX_PX }
      if (h > MAX_PX) { w = Math.round(w * MAX_PX / h); h = MAX_PX }
      const canvas = document.createElement('canvas')
      canvas.width = w; canvas.height = h
      canvas.getContext('2d').drawImage(img, 0, 0, w, h)
      canvas.toBlob(blob => {
        if (!blob) return reject(new Error('Compression échouée'))
        resolve(blob)
      }, 'image/jpeg', 0.82)
    }
    img.onerror = () => reject(new Error('Image invalide'))
    reader.readAsDataURL(file)
  })

  const handleFiles = async files => {
    setError(''); setUploading(true)
    try {
      let current = [...list]
      for (const file of Array.from(files)) {
        if (current.length >= MAX) { setError(`Maximum ${MAX} photos`); break }
        if (!file.type.startsWith('image/')) continue
        const blob = await compressAndUpload(file)
        const path = `${offreId || 'new'}/${Date.now()}_${file.name.replace(/[^a-z0-9.]/gi, '_')}`
        const { error: upErr } = await db().storage.from('siok-offer-photos').upload(path, blob, { contentType: 'image/jpeg', upsert: false })
        if (upErr) throw new Error(upErr.message)
        const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/siok-offer-photos/${path}`
        current.push({ url: publicUrl, path, ordre: current.length })
      }
      current = current.map((p, i) => ({ ...p, ordre: i }))
      if (offreId) await db().from('offres').update({ photos: current }).eq('id', offreId)
      onUpdate(current)
    } catch (e) { setError(e.message) }
    setUploading(false)
  }

  const remove = async idx => {
    if (!window.confirm('Supprimer cette photo ?')) return
    setUploading(true)
    try {
      const p = list[idx]
      if (p.path) await db().storage.from('siok-offer-photos').remove([p.path])
      const next = list.filter((_, i) => i !== idx).map((x, i) => ({ ...x, ordre: i }))
      if (offreId) await db().from('offres').update({ photos: next }).eq('id', offreId)
      onUpdate(next)
    } catch (e) { setError(e.message) }
    setUploading(false)
  }

  const move = async (idx, dir) => {
    const next = [...list]
    const swap = idx + dir
    if (swap < 0 || swap >= next.length) return
    ;[next[idx], next[swap]] = [next[swap], next[idx]]
    const reindexed = next.map((x, i) => ({ ...x, ordre: i }))
    if (offreId) await db().from('offres').update({ photos: reindexed }).eq('id', offreId)
    onUpdate(reindexed)
  }

  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ color: C.sub, fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>
        📸 Photos de l'offre ({list.length}/{MAX})
      </div>

      {list.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
          {list.map((p, i) => (
            <div key={p.url} style={{ display: 'flex', alignItems: 'center', gap: 8, background: C.surface, borderRadius: 10, padding: 6, border: `1px solid ${C.border}` }}>
              <img src={p.url} alt="" onError={e => e.target.style.display = 'none'}
                style={{ width: 64, height: 46, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />
              <div style={{ flex: 1, color: C.sub, fontSize: 11 }}>
                {i === 0 ? '⭐ Principale' : `Photo ${i + 1}`}
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <button onClick={() => move(i, -1)} disabled={i === 0 || uploading}
                  style={{ width: 26, height: 26, borderRadius: 6, border: `1px solid ${C.border}`, background: 'transparent', color: C.sub, cursor: 'pointer', fontSize: 12, opacity: i === 0 ? 0.3 : 1 }}>↑</button>
                <button onClick={() => move(i, 1)} disabled={i === list.length - 1 || uploading}
                  style={{ width: 26, height: 26, borderRadius: 6, border: `1px solid ${C.border}`, background: 'transparent', color: C.sub, cursor: 'pointer', fontSize: 12, opacity: i === list.length - 1 ? 0.3 : 1 }}>↓</button>
                <button onClick={() => remove(i)} disabled={uploading}
                  style={{ width: 26, height: 26, borderRadius: 6, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', color: '#ef4444', cursor: 'pointer', fontSize: 12 }}>✕</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {list.length < MAX && (
        <label style={{ display: 'block', border: `2px dashed ${C.accent}`, borderRadius: 12, padding: '14px 0', textAlign: 'center', cursor: 'pointer', background: 'rgba(0,102,255,0.04)' }}>
          <input type="file" accept="image/*" multiple style={{ display: 'none' }}
            onChange={e => handleFiles(e.target.files)} />
          <div style={{ fontSize: 24, marginBottom: 4 }}>📷</div>
          <div style={{ color: C.accent, fontWeight: 700, fontSize: 12 }}>
            {uploading ? 'Envoi…' : 'Ajouter des photos'}
          </div>
          <div style={{ color: C.muted, fontSize: 10, marginTop: 2 }}>
            JPG, PNG · {MAX - list.length} restant{MAX - list.length > 1 ? 's' : ''}
          </div>
        </label>
      )}

      {error && <div style={{ color: '#ef4444', fontSize: 11, marginTop: 4 }}>⚠️ {error}</div>}
    </div>
  )
}