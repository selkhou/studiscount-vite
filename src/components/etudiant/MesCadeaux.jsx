import { useState, useEffect } from 'react'
import { CS } from '../../constants.js'
import { db } from '../../lib/supabase.js'

const SEUILS = [
  { pts: 250, montant: 10, label: 'Bon cadeau 10€' },
  { pts: 500, montant: 40, label: 'Bon cadeau 40€' },
  { pts: 750, montant: 70, label: 'Bon cadeau 70€' },
]

export default function MesCadeaux({ etudiant, totalPoints, onPointsUpdate }) {
  const [partenaires, setPartenaires] = useState([])
  const [bons, setBons] = useState([])
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState('seuils')
  const [selectedSeuil, setSelectedSeuil] = useState(null)
  const [selectedPartenaire, setSelectedPartenaire] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    (async () => {
      const { data: p } = await db().from('partenaires_cadeaux').select('*').eq('actif', true).order('nom')
      const { data: b } = await db().from('bons_cadeaux')
        .select('*,partenaires_cadeaux(nom,emoji)')
        .eq('etudiant_id', etudiant.id)
        .order('created_at', { ascending: false })
      setPartenaires(p || [])
      setBons(b || [])
      setLoading(false)
    })()
  }, [])

  const genCode = () => 'STU-' + Math.random().toString(36).substr(2, 4).toUpperCase() + '-' + Math.random().toString(36).substr(2, 4).toUpperCase()

  const demanderCadeau = async () => {
    if (!selectedSeuil || !selectedPartenaire) return
    setSubmitting(true); setError('')
    try {
      const code = genCode()
      const { error: e } = await db().from('bons_cadeaux').insert({
        etudiant_id: etudiant.id,
        partenaire_id: selectedPartenaire.id,
        montant: selectedSeuil.montant,
        points_utilises: selectedSeuil.pts,
        code, statut: 'en_attente'
      })
      if (e) throw e
      setBons(prev => [{ code, montant: selectedSeuil.montant, statut: 'en_attente', partenaires_cadeaux: selectedPartenaire, created_at: new Date().toISOString() }, ...prev])
      setStep('succes')
    } catch (e) { setError('Erreur lors de la demande. Réessaie.') }
    setSubmitting(false)
  }

  if (loading) return <div style={{ textAlign: 'center', padding: '40px 0', color: '#9CA3AF', fontSize: 13 }}>Chargement…</div>

  return (
    <div>
      {/* Mes bons */}
      {bons.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ color: '#1A1A2E', fontWeight: 700, fontSize: 14, marginBottom: 10 }}>Mes bons cadeaux</div>
          {bons.map(b => (
            <div key={b.code} style={{
              background: '#FFFFFF', borderRadius: 12, padding: '12px 14px',
              marginBottom: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#1A1A2E' }}>
                  {b.partenaires_cadeaux?.emoji} {b.partenaires_cadeaux?.nom} — {b.montant}€
                </div>
                <div style={{ fontFamily: 'monospace', fontSize: 12, color: '#0066FF', fontWeight: 700, marginTop: 2 }}>{b.code}</div>
                <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{new Date(b.created_at).toLocaleDateString('fr-FR')}</div>
              </div>
              <div style={{
                background: b.statut === 'validé' ? '#22C55E' : b.statut === 'en_attente' ? '#F59E0B' : '#EF4444',
                color: 'white', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20
              }}>
                {b.statut === 'validé' ? '✅ Validé' : b.statut === 'en_attente' ? '⏳ En attente' : '❌ Refusé'}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Seuils */}
      {step === 'seuils' && (
        <div>
          <div style={{ color: '#1A1A2E', fontWeight: 700, fontSize: 14, marginBottom: 6 }}>🎁 Réclamer un bon cadeau</div>
          <div style={{ color: '#9CA3AF', fontSize: 12, marginBottom: 14 }}>
            Vous avez <span style={{ color: '#F59E0B', fontWeight: 800 }}>{totalPoints} pts</span>
          </div>
          {SEUILS.map(s => {
            const ok = totalPoints >= s.pts
            return (
              <div key={s.pts}
                onClick={ok ? () => { setSelectedSeuil(s); setStep('partenaires') } : undefined}
                style={{
                  background: ok ? '#FFFFFF' : '#F8F8F8', borderRadius: 14,
                  padding: '14px 16px', marginBottom: 10,
                  border: `1.5px solid ${ok ? '#0066FF' : '#E5E7EB'}`,
                  cursor: ok ? 'pointer' : 'default', opacity: ok ? 1 : 0.5,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 15, color: ok ? '#1A1A2E' : '#9CA3AF' }}>{s.label}</div>
                  <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>{s.pts} points requis</div>
                </div>
                {ok
                  ? <div style={{ color: '#0066FF', fontWeight: 800, fontSize: 13 }}>Choisir →</div>
                  : <div style={{ color: '#9CA3AF', fontSize: 12 }}>-{s.pts - totalPoints} pts</div>
                }
              </div>
            )
          })}
        </div>
      )}

      {/* Partenaires */}
      {step === 'partenaires' && (
        <div>
          <button onClick={() => setStep('seuils')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: 13, marginBottom: 12, padding: 0 }}>← Retour</button>
          <div style={{ color: '#1A1A2E', fontWeight: 700, fontSize: 14, marginBottom: 6 }}>Choisir un partenaire</div>
          <div style={{ color: '#9CA3AF', fontSize: 12, marginBottom: 14 }}>
            Pour votre bon cadeau de <span style={{ color: '#F59E0B', fontWeight: 800 }}>{selectedSeuil?.montant}€</span>
          </div>
          {partenaires.length === 0
            ? <div style={{ textAlign: 'center', padding: '20px 0', color: '#9CA3AF', fontSize: 13 }}>Aucun partenaire disponible</div>
            : <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {partenaires.map(p => (
                <button key={p.id} onClick={() => { setSelectedPartenaire(p); setStep('confirm') }}
                  style={{
                    background: '#FFFFFF', border: '1.5px solid #E5E7EB', borderRadius: 14,
                    padding: '16px 10px', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center'
                  }}>
                  <div style={{ fontSize: 32, marginBottom: 6 }}>{p.emoji || '🎁'}</div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#1A1A2E' }}>{p.nom}</div>
                </button>
              ))}
            </div>
          }
        </div>
      )}

      {/* Confirmation */}
      {step === 'confirm' && (
        <div style={{ textAlign: 'center' }}>
          <button onClick={() => setStep('partenaires')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: 13, marginBottom: 16, display: 'block' }}>← Retour</button>
          <div style={{ fontSize: 48, marginBottom: 8 }}>{selectedPartenaire?.emoji || '🎁'}</div>
          <div style={{ fontWeight: 800, fontSize: 18, color: '#1A1A2E', marginBottom: 4 }}>{selectedPartenaire?.nom}</div>
          <div style={{ color: '#F59E0B', fontWeight: 900, fontSize: 24, marginBottom: 8 }}>Bon cadeau {selectedSeuil?.montant}€</div>
          <div style={{ background: 'rgba(239,68,68,0.06)', borderRadius: 12, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: '#EF4444' }}>
            ⚠️ Cette demande utilisera <strong>{selectedSeuil?.pts} points</strong>. Les points seront déduits après validation.
          </div>
          {error && <div style={{ color: '#EF4444', fontSize: 12, marginBottom: 8 }}>{error}</div>}
          <button onClick={demanderCadeau} disabled={submitting} style={{
            width: '100%', padding: '14px', borderRadius: 14, border: 'none',
            background: 'linear-gradient(135deg,#0066FF,#3399FF)', color: 'white',
            fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit'
          }}>
            {submitting ? '...' : 'Confirmer ma demande 🎁'}
          </button>
        </div>
      )}

      {/* Succès */}
      {step === 'succes' && (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ fontSize: 56, marginBottom: 12 }}>🎉</div>
          <div style={{ fontWeight: 800, fontSize: 18, color: '#1A1A2E', marginBottom: 8 }}>Demande envoyée !</div>
          <div style={{ color: '#6B7280', fontSize: 13, marginBottom: 16, lineHeight: 1.6 }}>
            Ton bon cadeau est en attente de validation.<br />Tu recevras ton code une fois validé.
          </div>
          <button onClick={() => setStep('seuils')} style={{
            padding: '10px 20px', borderRadius: 12, border: '1.5px solid #E5E7EB',
            background: 'white', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13
          }}>
            Voir mes bons cadeaux
          </button>
        </div>
      )}
    </div>
  )
}