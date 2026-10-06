// src/components/etudiant/AvatarPicker.jsx
// Composant modal de sélection d'avatar + couleur de fond
// Usage: <AvatarPicker etudiant={etudiant} avatars={avatars} onSave={fn} onClose={fn} />

import { useState } from 'react'

const PALETTE = [
  { hex: '#3B82F6', nom: 'Bleu' },
  { hex: '#8B5CF6', nom: 'Violet' },
  { hex: '#10B981', nom: 'Vert' },
  { hex: '#F59E0B', nom: 'Orange' },
  { hex: '#EF4444', nom: 'Rouge' },
  { hex: '#EC4899', nom: 'Rose' },
  { hex: '#06B6D4', nom: 'Cyan' },
  { hex: '#F97316', nom: 'Orange vif' },
  { hex: '#6366F1', nom: 'Indigo' },
  { hex: '#14B8A6', nom: 'Turquoise' },
  { hex: '#84CC16', nom: 'Vert lime' },
  { hex: '#A855F7', nom: 'Mauve' },
]

// Composant Avatar individuel (cercle coloré + SVG par dessus)
export function AvatarCircle({ avatarId, couleur, size = 40, fichier }) {
  const bg = couleur || '#E5E7EB'
  const svgPath = fichier ? `/avatars/${fichier}` : (avatarId ? `/avatars/${avatarId}.svg` : null)

  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: '50%',
      background: bg,
      overflow: 'hidden',
      flexShrink: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    }}>
      {svgPath ? (
        <img
          src={svgPath}
          alt=""
          style={{ width: '85%', height: '85%', objectFit: 'contain', display: 'block' }}
          onError={e => { e.target.style.display = 'none' }}
        />
      ) : (
        <span style={{ fontSize: size * 0.4, color: '#9CA3AF' }}>👤</span>
      )}
    </div>
  )
}

export default function AvatarPicker({ etudiant, avatars = [], onSave, onClose }) {
  const [selectedId, setSelectedId] = useState(etudiant?.avatar_id || null)
  const [selectedColor, setSelectedColor] = useState(etudiant?.avatar_couleur || PALETTE[0].hex)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const avatarsActifs = avatars.filter(a => a.actif).sort((a, b) => a.ordre - b.ordre)

  const handleSave = async () => {
    if (!selectedId) { setError("Choisis un avatar 🙂"); return }
    setSaving(true)
    setError(null)
    try {
      const ok = await onSave({ avatar_id: selectedId, avatar_couleur: selectedColor })
      if (ok) onClose()
      else setError("Erreur lors de la sauvegarde")
    } catch (e) {
      setError("Erreur lors de la sauvegarde")
    } finally {
      setSaving(false)
    }
  }

  const currentAvatar = avatarsActifs.find(a => a.id === selectedId)

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      zIndex: 4000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center'
    }}>
      <div style={{
        background: 'white', borderRadius: '20px 20px 0 0',
        width: '100%', maxWidth: 480, maxHeight: '90vh',
        display: 'flex', flexDirection: 'column', overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{ padding: '16px 16px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 16, color: '#1A1A2E' }}>Choisir mon avatar</div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: '50%', border: 'none', background: '#F0F0F0', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>

        {/* Prévisualisation */}
        <div style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0, borderBottom: '1px solid #F0F0F0' }}>
          <AvatarCircle
            avatarId={selectedId}
            couleur={selectedColor}
            size={64}
            fichier={currentAvatar?.fichier}
          />
          <div>
            <div style={{ fontWeight: 700, color: '#1A1A2E', fontSize: 15 }}>
              {currentAvatar ? currentAvatar.nom : 'Aucun sélectionné'}
            </div>
            <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>Voici ton avatar</div>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>

          {/* Grille avatars */}
          <div style={{ fontWeight: 700, color: '#374151', fontSize: 13, marginBottom: 10 }}>Ton animal</div>
          {avatarsActifs.length === 0 ? (
            <div style={{ color: '#9CA3AF', fontSize: 13, textAlign: 'center', padding: 20 }}>
              Aucun avatar disponible
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 20 }}>
              {avatarsActifs.map(av => (
                <button
                  key={av.id}
                  onClick={() => setSelectedId(av.id)}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                    padding: 6, borderRadius: 12,
                    border: selectedId === av.id ? '2px solid #0066FF' : '2px solid transparent',
                    background: selectedId === av.id ? '#EBF0FF' : '#F8F8F8',
                    cursor: 'pointer', transition: 'all 0.15s'
                  }}
                >
                  <AvatarCircle
                    avatarId={av.id}
                    couleur={selectedId === av.id ? selectedColor : '#E5E7EB'}
                    size={44}
                    fichier={av.fichier}
                  />
                  <span style={{ fontSize: 9, color: selectedId === av.id ? '#0066FF' : '#9CA3AF', fontWeight: 600, lineHeight: 1.2, textAlign: 'center' }}>
                    {av.nom}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Palette couleurs */}
          <div style={{ fontWeight: 700, color: '#374151', fontSize: 13, marginBottom: 10 }}>Couleur de fond</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
            {PALETTE.map(c => (
              <button
                key={c.hex}
                onClick={() => setSelectedColor(c.hex)}
                title={c.nom}
                style={{
                  width: '100%', aspectRatio: '1',
                  borderRadius: '50%', background: c.hex, border: 'none',
                  cursor: 'pointer',
                  outline: selectedColor === c.hex ? '3px solid #1A1A2E' : '2px solid transparent',
                  outlineOffset: 2,
                  transition: 'outline 0.15s',
                }}
              />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 16px 24px', borderTop: '1px solid #F0F0F0', flexShrink: 0 }}>
          {error && <div style={{ color: '#EF4444', fontSize: 12, marginBottom: 8, textAlign: 'center' }}>{error}</div>}
          <button
            onClick={handleSave}
            disabled={saving || !selectedId}
            style={{
              width: '100%', padding: '14px', borderRadius: 14, border: 'none',
              background: saving || !selectedId ? '#D1D5DB' : '#0066FF',
              color: 'white', fontWeight: 800, fontSize: 15, cursor: saving || !selectedId ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit'
            }}
          >
            {saving ? 'Sauvegarde...' : '✅ Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  )
}
