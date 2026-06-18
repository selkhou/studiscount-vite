import { useState } from 'react'
import { CS } from '../../constants.js'
import { db } from '../../lib/supabase.js'
import StarRating from '../ui/StarRating.jsx'
import StudentBtn from '../ui/StudentBtn.jsx'

export default function ModalSuggestion({ nom, type, onClose }) {
  const [commentaire, setCommentaire] = useState('')
  const [note, setNote] = useState(0)
  const [nomSaisi, setNomSaisi] = useState(nom || '')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const envoyer = async () => {
    if (!commentaire.trim()) return setError('Merci d\'écrire votre suggestion')
    if (!note) return setError('Merci de donner une note')
    setSaving(true); setError('')
    try {
      console.log('note envoyée:', note)
      const { error: e } = await db().from('suggestions').insert({
        nom: nomSaisi.trim() || null,
        type,
        commentaire: commentaire.trim().slice(0, 200),
        note,
      })
      if (e) throw new Error(e.message)
      setSuccess(true)
      setTimeout(() => onClose(), 2000)
    } catch (e) { setError(e.message) }
    setSaving(false)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
      zIndex: 4000, display: 'flex', flexDirection: 'column',
      justifyContent: 'flex-end', paddingBottom: 70
    }} onClick={onClose}>
      <div style={{
        background: '#FFFFFF', borderRadius: '24px 24px 0 0',
        width: '100%', maxWidth: 480, alignSelf: 'center',
        display: 'flex', flexDirection: 'column', maxHeight: '75vh'
      }} onClick={e => e.stopPropagation()}>

        <div style={{ padding: '16px 24px 0', flexShrink: 0, display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: '50%', border: 'none',
            background: '#F0F0F0', cursor: 'pointer', fontSize: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700
          }}>✕</button>
        </div>

        <div style={{ overflowY: 'auto', padding: '8px 24px 40px', flex: 1 }}>
          {success ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: 52, marginBottom: 12 }}>🎉</div>
              <div style={{ color: '#22C55E', fontWeight: 800, fontSize: 18 }}>Merci pour votre suggestion !</div>
              <div style={{ color: CS.muted, fontSize: 13, marginTop: 6 }}>Elle a bien été enregistrée.</div>
            </div>
          ) : (
            <>
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>💡</div>
                <div style={{ color: CS.text, fontSize: 18, fontWeight: 900, marginBottom: 4 }}>Votre idée</div>
                <div style={{ color: CS.muted, fontSize: 13 }}>Aidez-nous à améliorer StuDiscount</div>
              </div>

              {!nom && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ color: CS.text, fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Votre prénom (optionnel)</div>
                  <input value={nomSaisi} onChange={e => setNomSaisi(e.target.value)} placeholder="Anonyme"
                    style={{
                      width: '100%', padding: '11px 14px', borderRadius: 12,
                      border: '1.5px solid #E0E0E0', fontSize: 14,
                      fontFamily: 'inherit', outline: 'none', background: '#FAFAFA'
                    }} />
                </div>
              )}

              <div style={{ marginBottom: 14 }}>
                <div style={{ color: CS.text, fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
                  Votre suggestion <span style={{ color: CS.accent }}>*</span>
                </div>
                <textarea value={commentaire} onChange={e => setCommentaire(e.target.value.slice(0, 200))}
                  placeholder="Décrivez votre idée en quelques mots…" rows={3}
                  style={{
                    width: '100%', padding: '11px 14px', borderRadius: 12,
                    border: '1.5px solid #E0E0E0', fontSize: 14,
                    fontFamily: 'inherit', outline: 'none', background: '#FAFAFA', resize: 'none'
                  }} />
                <div style={{ color: CS.muted, fontSize: 11, textAlign: 'right', marginTop: 3 }}>{commentaire.length}/200</div>
              </div>

              <div style={{ marginBottom: 18 }}>
                <div style={{ color: CS.text, fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
                  Note globale <span style={{ color: CS.accent }}>*</span>
                </div>
                <StarRating value={note} onChange={setNote} size={32} />
              </div>

              {error && (
                <div style={{ background: '#FFF0F0', borderRadius: 10, padding: '8px 12px', marginBottom: 12, color: '#ef4444', fontSize: 13 }}>
                  ⚠️ {error}
                </div>
              )}

              <StudentBtn onClick={envoyer} loading={saving} disabled={!commentaire.trim() || !note}>
                Envoyer ma suggestion →
              </StudentBtn>
            </>
          )}
        </div>
      </div>
    </div>
  )
}