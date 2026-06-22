import { useState } from 'react'
import { CS } from '../../constants.js'
import { db } from '../../lib/supabase.js'
import { bannerColorSiok } from '../../utils.js'
import StarRating from '../ui/StarRating.jsx'

export default function VisiteCard({ visite: v, type, etudiantId, onUpdated }) {
  const [showAvis, setShowAvis] = useState(false)
  const [avis, setAvis] = useState(v.avis || '')
  const [note, setNote] = useState(v.note || 0)
  const [saving, setSaving] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [plafondMsg, setPlafondMsg] = useState(null)
  const SUPABASE_URL = 'https://ghwozyzlhcmuhneumasv.supabase.co'

  const submitAvis = async () => {
    if (!avis.trim() && !note) return
    setSaving(true)
    try {
      const updateData = { statut_avis: 'en_attente' }
      if (avis.trim()) updateData.avis = avis.trim()
      if (note) updateData.note = note
      const { error: updateErr } = await db().from('visites').update(updateData).eq('id', v.id)
      if (updateErr) throw new Error('Erreur sauvegarde avis : ' + updateErr.message)

      if (note && v.offre_id) {
        const { data: allAvis } = await db().from('visites')
          .select('note').eq('offre_id', v.offre_id).not('note', 'is', null)
        if (allAvis && allAvis.length > 0) {
          const moy = allAvis.reduce((s, a) => s + (a.note || 0), 0) / allAvis.length
          await db().from('offres').update({
            note_moyenne: Math.round(moy * 10) / 10,
            nb_avis: allAvis.length
          }).eq('id', v.offre_id)
        }
      }

      if (!v.avis && !v.note) {
        const { data: et } = await db().from('etudiants').select('points').eq('id', etudiantId).single()
        if (et) {
          // Vérifier le plafond journalier
          const today = new Date(); today.setHours(0,0,0,0)
          const { data: visitesJour } = await db().from('visites')
            .select('points').eq('etudiant_id', etudiantId).gte('created_at', today.toISOString())
          const pointsJour = (visitesJour || []).reduce((s, vj) => s + (vj.points || 0), 0)
          const maxJour = parseInt(window.SIOK_PARAMS?.points_max_jour) || 5
          const plafondAtteint = pointsJour >= maxJour
          const ptsAvis = plafondAtteint ? 0 : (parseInt(window.SIOK_PARAMS?.points_avis) || 2)

          if (!plafondAtteint) {
            const newPts = (et.points || 0) + ptsAvis
            await db().from('etudiants').update({ points: newPts }).eq('id', etudiantId)
            try {
              const s = localStorage.getItem('stu10_etudiant')
              if (s) { const e = JSON.parse(s); e.points = newPts; localStorage.setItem('stu10_etudiant', JSON.stringify(e)) }
            } catch (ex) {}
          }
          await db().from('visites').update({ points: (v.points || 0) + ptsAvis }).eq('id', v.id)
          onUpdated({ ...updateData, points: (v.points || 0) + ptsAvis, note, plafondAtteint, maxJour })
          if (plafondAtteint) setPlafondMsg(`Plafond de ${maxJour} pts/jour atteint — avis enregistré sans points`)
        }
      } else {
        onUpdated({ ...updateData, note })
      }
      setShowAvis(false)
    } catch (e) { console.error(e) }
    setSaving(false)
  }

  const uploadPhoto = async (file) => {
    setUploadingPhoto(true)
    try {
      const path = `visites/${v.id}/${Date.now()}_${file.name.replace(/[^a-z0-9.]/gi, '_')}`
      const { error: upErr } = await db().storage.from('siok-offer-photos').upload(path, file, { contentType: file.type, upsert: false })
      if (upErr) throw upErr
      const photoUrl = `${SUPABASE_URL}/storage/v1/object/public/siok-offer-photos/${path}`
      await db().from('visites').update({ photo_url: photoUrl }).eq('id', v.id)
      onUpdated({ photo_url: photoUrl })
    } catch (e) { console.error(e) }
    setUploadingPhoto(false)
  }

  return (
    <div style={{ background: '#FFFFFF', borderRadius: 16, marginBottom: 12, overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.07)' }}>
      {v.photo_url && (
        <img src={v.photo_url} alt="" onError={e => e.target.style.display = 'none'}
          style={{ width: '100%', height: 120, objectFit: 'cover' }} />
      )}
      <div style={{ padding: '12px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: bannerColorSiok(v.offres?.titre || ''),
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, flexShrink: 0
          }}>
            {type.emoji}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ color: CS.text, fontWeight: 700, fontSize: 14 }}>{v.offres?.titre || 'Offre'}</div>
            <div style={{ color: CS.muted, fontSize: 11, marginTop: 1 }}>
              {new Date(v.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long' })}
              {' à '}
              {new Date(v.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{
              background: 'rgba(0,102,255,0.1)', color: CS.accent,
              fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 20
            }}>
              +{v.points || 0}⭐
            </div>
          </div>
        </div>

        {(v.avis || v.note) && (
          <div style={{ background: '#F8F8F8', borderRadius: 10, padding: '8px 12px', marginBottom: 8 }}>
            {v.note && <div style={{ marginBottom: 4 }}><StarRating value={v.note} readOnly size={14} /></div>}
            {v.avis && <div style={{ fontSize: 13, color: CS.text, fontStyle: 'italic' }}>💬 "{v.avis}"</div>}
          </div>
        )}

        {plafondMsg && (
          <div style={{ background: 'rgba(245,158,11,0.1)', borderRadius: 10, padding: '8px 12px', marginBottom: 8, color: '#F59E0B', fontSize: 12, fontWeight: 600 }}>
            ⚠️ {plafondMsg}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          {!v.avis && (
            <button onClick={() => setShowAvis(v => !v)} style={{
              flex: 1, padding: '8px 0', borderRadius: 10,
              border: '1.5px solid #E8E8E8',
              background: showAvis ? CS.accentSoft : 'transparent',
              color: showAvis ? CS.accent : CS.muted,
              fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit'
            }}>
              {`💬 Avis +${window.SIOK_PARAMS?.points_avis || 2}⭐`}
            </button>
          )}
          {!v.photo_url && (
            <label style={{
              flex: 1, padding: '8px 0', borderRadius: 10,
              border: '1.5px solid #E8E8E8', background: 'transparent',
              color: CS.muted, fontSize: 12, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center', display: 'block'
            }}>
              <input type="file" accept="image/*" style={{ display: 'none' }}
                onChange={e => e.target.files[0] && uploadPhoto(e.target.files[0])} />
              {uploadingPhoto ? '⏳…' : '📸 Photo'}
            </label>
          )}
          {v.avis && v.photo_url && (
            <div style={{ color: '#22C55E', fontSize: 12, fontWeight: 700, padding: '8px 0' }}>
              ✅ Merci pour votre contribution !
            </div>
          )}
        </div>

        {showAvis && !v.avis && (
          <div style={{ marginTop: 8 }}>
            <div style={{ marginBottom: 8 }}>
              <div style={{ color: CS.muted, fontSize: 12, marginBottom: 4 }}>Notez votre expérience</div>
              <StarRating value={note} onChange={setNote} size={28} />
            </div>
            <input
              value={avis} onChange={e => setAvis(e.target.value.slice(0, 120))}
              placeholder="Votre avis en une ligne… (120 caractères max)"
              maxLength={120}
              style={{
                width: '100%', padding: '10px 12px', borderRadius: 10,
                border: '1.5px solid #E8E8E8', fontSize: 13,
                fontFamily: 'inherit', outline: 'none', background: '#FAFAFA'
              }}
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
              <button onClick={submitAvis} disabled={(!avis.trim() && !note) || saving} style={{
                flex: 1, padding: '9px 0', borderRadius: 10, border: 'none',
                background: CS.accent, color: 'white', fontSize: 13, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'inherit',
                opacity: (!avis.trim() && !note) ? 0.4 : 1
              }}>
                {saving ? '…' : `Envoyer +${window.SIOK_PARAMS?.points_avis || 2}⭐`}
              </button>
              <button onClick={() => { setShowAvis(false); setAvis(v.avis || ''); setNote(0) }} style={{
                padding: '9px 14px', borderRadius: 10,
                border: '1.5px solid #E8E8E8', background: 'transparent',
                color: CS.muted, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit'
              }}>
                Annuler
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}