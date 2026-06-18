import { useState, useEffect } from 'react'
import { db } from '../../lib/supabase.js'

const PALIERS = [
  { pts: 250, montant: 10, label: 'Bon cadeau 10€' },
  { pts: 500, montant: 40, label: 'Bon cadeau 40€' },
  { pts: 750, montant: 70, label: 'Bon cadeau 70€' },
]

export default function ModalCadeaux({ etudiant, totalPoints, onClose, onPointsDeduits }) {
  const [partenaires, setPartenaires] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(false)
  const [bonCode, setBonCode] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    db().from('partenaires_cadeaux').select('*').eq('actif', true).order('nom')
      .then(({ data }) => { if (data) setPartenaires(data) })
  }, [])

  const palierDispo = (p) => totalPoints >= p.pts

  const genCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let code = 'STU-'
    for (let i = 0; i < 8; i++) {
      if (i === 4) code += '-'
      code += chars[Math.floor(Math.random() * chars.length)]
    }
    return code
  }
const reclamer = async () => {
  console.log('reclamer appelé', selected, etudiant?.id)
  if (!selected) return setError('Choisissez un partenaire et un palier')
  setLoading(true); setError('')
  try {
    const code = genCode()
    const { error: e } = await db().from('bons_cadeaux').insert({
      etudiant_id: etudiant.id,
      partenaire_id: selected.partenaire.id,
      montant: selected.palier.montant,
      points_utilises: selected.palier.pts,
      code, statut: 'en_attente',
    })
    console.log('résultat insert:', e)
    if (e) { console.error('ERREUR INSERT:', e); throw new Error(e.message) }

    // Déduire les points
    const newPoints = Math.max(0, (etudiant.points || 0) - selected.palier.pts)
    await db().from('etudiants').update({ points: newPoints }).eq('id', etudiant.id)

    // Mettre à jour le localStorage
    try {
      const s = localStorage.getItem('stu10_etudiant')
      if (s) {
        const et = JSON.parse(s)
        et.points = newPoints
        localStorage.setItem('stu10_etudiant', JSON.stringify(et))
      }
    } catch (ex) {}

    setBonCode(code)
    setStep('succes')
    if (onPointsDeduits) onPointsDeduits(newPoints)
  } catch (e) { setError(e.message) }
  setLoading(false)
}
  

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
      zIndex: 2900, display: 'flex', flexDirection: 'column',
      justifyContent: 'flex-end', paddingBottom: 64
    }} onClick={onClose}>
      <div style={{
        background: '#FFFFFF', borderRadius: '24px 24px 0 0',
        width: '100%', maxWidth: 480, alignSelf: 'center',
        display: 'flex', flexDirection: 'column', maxHeight: '85vh'
      }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: '20px 24px 0', flexShrink: 0, position: 'relative' }}>
          <button onClick={onClose} style={{
            position: 'absolute', top: 16, right: 16,
            width: 32, height: 32, borderRadius: '50%',
            border: 'none', background: '#F0F0F0', cursor: 'pointer', fontSize: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>✕</button>
          <div style={{ fontWeight: 900, fontSize: 18, color: '#1A1A2E', marginBottom: 4 }}>🎁 Mes cadeaux</div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'linear-gradient(135deg,#F59E0B,#FBBF24)',
            borderRadius: 50, padding: '4px 14px', marginBottom: 12
          }}>
            <span style={{ color: 'white', fontWeight: 900, fontSize: 16 }}>{totalPoints} ⭐</span>
            <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>points disponibles</span>
          </div>
        </div>

        <div style={{ overflowY: 'auto', padding: '8px 24px 24px', flex: 1 }}>
          {bonCode ? (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
              <div style={{ fontWeight: 900, fontSize: 18, color: '#1A1A2E', marginBottom: 8 }}>Demande envoyée !</div>
              <div style={{ background: '#F0F6FF', borderRadius: 14, padding: '16px', marginBottom: 12 }}>
                <div style={{ color: '#6B7280', fontSize: 12, marginBottom: 6 }}>Ton code de bon cadeau</div>
                <div style={{ fontFamily: 'monospace', fontWeight: 900, fontSize: 22, color: '#0066FF', letterSpacing: 2 }}>{bonCode}</div>
                <div style={{ color: '#6B7280', fontSize: 11, marginTop: 8, lineHeight: 1.5 }}>
                  Présente ce code à l'admin pour validation.<br />Tes points seront déduits après validation.
                </div>
              </div>
              <div style={{ background: '#FEF3C7', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: '#92400E' }}>
                ⏳ En attente de validation
              </div>
            </div>
          ) : (
            <>
              {/* Paliers */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#1A1A2E', marginBottom: 10 }}>Choisis ton bon cadeau</div>
                {PALIERS.map(p => {
                  const dispo = palierDispo(p)
                  const sel = selected?.palier?.pts === p.pts
                  return (
                    <div key={p.pts}
                      onClick={() => dispo && setSelected(s => s?.palier?.pts === p.pts ? null : { ...s, palier: p })}
                      style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '12px 14px', borderRadius: 12, marginBottom: 8,
                        cursor: dispo ? 'pointer' : 'not-allowed',
                        background: sel ? 'rgba(0,102,255,0.06)' : '#F8F8F8',
                        border: `1.5px solid ${sel ? '#0066FF' : dispo ? '#E5E7EB' : '#F0F0F0'}`,
                        opacity: dispo ? 1 : 0.45, transition: 'all 0.15s'
                      }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: '#1A1A2E' }}>{p.label}</div>
                        <div style={{ color: '#9CA3AF', fontSize: 12 }}>{p.pts} points requis</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {!dispo && <span style={{ fontSize: 11, color: '#9CA3AF' }}>il manque {p.pts - totalPoints} pts</span>}
                        <div style={{
                          width: 22, height: 22, borderRadius: '50%',
                          border: `2px solid ${sel ? '#0066FF' : '#D1D5DB'}`,
                          background: sel ? '#0066FF' : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                          {sel && <span style={{ color: 'white', fontSize: 12 }}>✓</span>}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Partenaires */}
              {selected?.palier && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#1A1A2E', marginBottom: 10 }}>Choisis un partenaire</div>
                  {partenaires.length === 0
                    ? <div style={{ color: '#9CA3AF', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>Aucun partenaire disponible</div>
                    : <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {partenaires.map(p => {
                        const sel = selected?.partenaire?.id === p.id
                        return (
                          <div key={p.id}
                            onClick={() => setSelected(s => ({ ...s, partenaire: sel ? null : p }))}
                            style={{
                              padding: '12px', borderRadius: 12, textAlign: 'center', cursor: 'pointer',
                              background: sel ? 'rgba(0,102,255,0.06)' : '#F8F8F8',
                              border: `1.5px solid ${sel ? '#0066FF' : '#E5E7EB'}`,
                              transition: 'all 0.15s'
                            }}>
                            <div style={{ fontSize: 28, marginBottom: 4 }}>{p.emoji}</div>
                            <div style={{ fontWeight: 700, fontSize: 12, color: sel ? '#0066FF' : '#1A1A2E' }}>{p.nom}</div>
                          </div>
                        )
                      })}
                    </div>
                  }
                </div>
              )}

              {error && <div style={{ color: '#EF4444', fontSize: 12, marginBottom: 8, textAlign: 'center' }}>{error}</div>}

              <button onClick={reclamer}
                disabled={!selected?.palier || !selected?.partenaire || loading}
                style={{
                  width: '100%', padding: '14px', borderRadius: 14, border: 'none',
                  background: selected?.palier && selected?.partenaire
                    ? 'linear-gradient(135deg,#0066FF,#3399FF)' : '#E5E7EB',
                  color: selected?.palier && selected?.partenaire ? 'white' : '#9CA3AF',
                  fontSize: 14, fontWeight: 800,
                  cursor: selected?.palier && selected?.partenaire ? 'pointer' : 'default',
                  fontFamily: 'inherit'
                }}>
                {loading ? '...' : '🎁 Réclamer mon bon cadeau'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}