import { useState, useEffect } from 'react'
import { CS } from '../../constants.js'
import { db } from '../../lib/supabase.js'
import { bannerGradient, isOffreActive } from '../../utils.js'
import PhotoCarousel from '../ui/PhotoCarousel.jsx'

// ── AvisOffre ──────────────────────────────────────────
function AvisOffre({ offreId }) {
  const [avis, setAvis] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!offreId) return
    db().from('visites')
      .select('id,note,avis,photo_url,created_at,etudiants(prenom)')
      .eq('offre_id', offreId)
      .eq('statut_avis', 'validé')
      .not('avis', 'is', null)
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => { setAvis(data || []); setLoading(false) })
  }, [offreId])

  return (
    <div>
      {loading && <div style={{ textAlign: 'center', padding: '20px 0', color: '#9CA3AF', fontSize: 13 }}>Chargement…</div>}
      {!loading && avis.length === 0 && <div style={{ color: '#9CA3AF', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>Aucun avis pour le moment</div>}
      {avis.map(v => (
        <div key={v.id} style={{ background: '#FFFFFF', borderRadius: 12, padding: '12px 14px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <div style={{ fontWeight: 700, color: CS.text, fontSize: 13 }}>{v.etudiants?.prenom || 'Étudiant'}</div>
            <div style={{ display: 'flex', gap: 2 }}>
              {[1, 2, 3, 4, 5].map(i => (
                <span key={i} style={{ fontSize: 14, color: i <= (v.note || 0) ? '#F59E0B' : '#E5E7EB' }}>★</span>
              ))}
            </div>
          </div>
          {v.avis && <div style={{ color: '#374151', fontSize: 13, lineHeight: 1.5, marginBottom: v.photo_url ? 8 : 0 }}>{v.avis}</div>}
          {v.photo_url && <img src={v.photo_url} alt="photo" style={{ width: '100%', maxHeight: 180, objectFit: 'cover', borderRadius: 8, marginTop: 4 }} />}
          <div style={{ color: CS.muted, fontSize: 11, marginTop: 6 }}>{new Date(v.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
        </div>
      ))}
    </div>
  )
}

// ── AvisOffreBadge ─────────────────────────────────────
function AvisOffreBadge({ offreId }) {
  const [total, setTotal] = useState(0)
  const [noteMoy, setNoteMoy] = useState(0)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!offreId) return
    db().from('visites').select('id,note')
      .eq('offre_id', offreId).eq('statut_avis', 'validé').not('avis', 'is', null)
      .then(({ data }) => {
        setTotal(data?.length || 0)
        if (data && data.length > 0) {
          const avecNote = data.filter(v => v.note > 0)
          setNoteMoy(avecNote.length > 0 ? avecNote.reduce((s, v) => s + (v.note || 0), 0) / avecNote.length : 0)
        }
      })
  }, [offreId])

  if (total === 0) return null

  return (
    <>
      <button onClick={() => setOpen(!open)}
        style={{ position: 'absolute', bottom: 12, right: 12, background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(8px)', color: 'white', fontSize: 13, fontWeight: 800, padding: '6px 12px', borderRadius: 20, zIndex: 10, display: 'flex', alignItems: 'center', gap: 5, border: 'none', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
        <span>⭐</span>
        <span>{noteMoy > 0 ? parseFloat(noteMoy).toFixed(1) : '—'}</span>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>({total})</span>
      </button>
      {open && (
        <div style={{ position: 'fixed', bottom: 64, left: 0, right: 0, zIndex: 4000, background: '#FFFFFF', borderRadius: '20px 20px 0 0', boxShadow: '0 -8px 32px rgba(0,0,0,0.15)', maxHeight: '55vh', overflowY: 'auto', paddingBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 16px 8px', borderBottom: '1px solid #F0F0F0', position: 'sticky', top: 0, background: '#FFFFFF', zIndex: 1 }}>
            <div style={{ color: '#1A1A2E', fontWeight: 800, fontSize: 15 }}>💬 Avis étudiants</div>
            <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', fontSize: 20, padding: 4 }}>✕</button>
          </div>
          <div style={{ padding: '0 16px 24px' }}>
            <AvisOffre offreId={offreId} />
          </div>
        </div>
      )}
      {open && <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 3999 }} />}
    </>
  )
}

// ── NoteDisplay ────────────────────────────────────────
function NoteDisplay({ note, nbAvis }) {
  if (!note && !nbAvis) return null
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <span style={{ color: '#F5A623', fontSize: 13 }}>★</span>
      <span style={{ color: CS.text, fontWeight: 700, fontSize: 13 }}>{note ? parseFloat(note).toFixed(1) : '—'}</span>
      {nbAvis > 0 && <span style={{ color: CS.muted, fontSize: 11 }}>({nbAvis} avis)</span>}
    </div>
  )
}

// ── OffreDetail ────────────────────────────────────────
export default function OffreDetail({ offre, etudiant, isFavori, onToggleFavori, onClose, onQR }) {
  const type = { emoji: offre.image_emoji || '🎯' }

  return (
    <div style={{ animation: 'slideDown 0.2s ease' }}>
      {/* Bannière */}
      <div style={{ position: 'relative' }}>
        <PhotoCarousel photos={offre.photos} height={280} emoji={type.emoji} gradient={bannerGradient(offre.type_offre)} />
        <button onClick={onClose}
          style={{ position: 'absolute', top: 12, right: 12, width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.9)', border: 'none', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>✕</button>
        <div style={{ position: 'absolute', top: 12, left: 12, background: '#EF4444', color: 'white', fontSize: 13, fontWeight: 900, padding: '4px 12px', borderRadius: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.15)', zIndex: 10 }}>
          -{offre.promo_pct}%
        </div>
        <AvisOffreBadge offreId={offre.id} />
      </div>

      <div style={{ padding: '14px 16px 16px' }}>
        {/* Titre + prix */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4, gap: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ color: CS.text, fontWeight: 900, fontSize: 17, letterSpacing: -0.3, marginBottom: 2 }}>{offre.titre}</div>
            <div style={{ color: CS.muted, fontSize: 13 }}>
              {offre.prestataires?.nom || offre.prestataire_nom}
              {(offre.adresse) && ` · ${offre.adresse}`}
            </div>
            {offre.lat && offre.lng && (
              <a href={`https://maps.google.com/maps?q=${offre.lat},${offre.lng}`} target="_blank" rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 6, padding: '5px 12px', borderRadius: 20, background: 'rgba(0,102,255,0.08)', color: '#0066FF', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
                🗺️ Voir sur la carte
              </a>
            )}
          </div>
          {(offre.prix_normal || offre.prix) && (
            <div style={{ background: CS.accentSoft, borderRadius: 12, padding: '8px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, flexShrink: 0 }}>
              {offre.prix_normal && <div style={{ color: CS.muted, fontSize: 11, textDecoration: 'line-through' }}>{parseFloat(offre.prix_normal).toFixed(2)}€</div>}
              {offre.prix && <div style={{ color: CS.accent, fontWeight: 900, fontSize: 20, lineHeight: 1 }}>{parseFloat(offre.prix).toFixed(2)}€</div>}
              <div style={{ background: '#EF4444', color: 'white', fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 20 }}>-{offre.promo_pct || 0}%</div>
            </div>
          )}
          <NoteDisplay note={offre.note_moyenne} nbAvis={offre.nb_avis} />
        </div>

        {/* Dates */}
        {(offre.date_debut || offre.date_fin) && (
          <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
            {offre.date_debut && new Date(offre.date_debut) > new Date() && (
              <div style={{ background: 'rgba(249,115,22,0.1)', borderRadius: 8, padding: '4px 10px', fontSize: 11, color: '#EF4444', fontWeight: 700 }}>
                🔜 Démarre le {new Date(offre.date_debut).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })} à {new Date(offre.date_debut).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </div>
            )}
            {offre.date_debut && new Date(offre.date_debut) <= new Date() && (
              <div style={{ background: 'rgba(34,197,94,0.1)', borderRadius: 8, padding: '4px 10px', fontSize: 11, color: '#22C55E', fontWeight: 700 }}>
                ✅ Depuis {new Date(offre.date_debut).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })} {new Date(offre.date_debut).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </div>
            )}
            {offre.date_fin && (
              <div style={{ background: '#FFF8F0', borderRadius: 8, padding: '4px 10px', fontSize: 11, color: '#EF4444', fontWeight: 700 }}>
                ⏰ Jusqu'au {new Date(offre.date_fin).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })} à {new Date(offre.date_fin).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </div>
            )}
          </div>
        )}

        {/* Description */}
        {offre.description && (
          <div style={{ color: CS.text, fontSize: 13, lineHeight: 1.6, padding: '10px 12px', background: '#F8F8F8', borderRadius: 10, marginBottom: 12 }}>
            {offre.description}
          </div>
        )}

        {/* Bouton QR — seulement si connecté */}
        {etudiant && (
          <button onClick={onQR}
            style={{ width: '100%', padding: '14px 0', borderRadius: 14, border: 'none', background: CS.accent, color: 'white', fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 10, boxShadow: `0 4px 14px ${CS.accentGlow}`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <span style={{ fontSize: 20 }}>📱</span>
            Générer mon QR code pour validation par le commerçant
          </button>
        )}

        {/* Explication */}
        <div style={{ background: '#F0F6FF', border: '1px solid rgba(0,102,255,0.15)', borderRadius: 14, padding: '12px 14px', marginBottom: 12 }}>
          <div style={{ color: CS.accent, fontWeight: 700, fontSize: 13, marginBottom: 8 }}>🎓 Comment bénéficier de cette offre ?</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              { icon: '🪪', text: 'Montrez votre carte étudiante ou d\'identité au prestataire' },
              { icon: '📱', text: 'Générez votre QR code et faites-le scanner' },
              { icon: '💰', text: 'Payez directement au prestataire au prix remisé' },
            ].map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 16 }}>{s.icon}</span>
                <span style={{ color: CS.text, fontSize: 12, lineHeight: 1.5 }}>{s.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Lien menu */}
        {offre.menu_url && (
          <a href={offre.menu_url} target="_blank" rel="noopener"
            style={{ display: 'block', textAlign: 'center', padding: '10px 0', borderRadius: 12, background: '#F8F8F8', color: CS.text, fontSize: 13, fontWeight: 700, textDecoration: 'none', marginBottom: 10 }}>
            📋 Voir le détail de l'offre →
          </a>
        )}

        {/* Pas connecté */}
       
        {!etudiant && (
  <button
    onClick={onToggleFavori}
    style={{ width: '100%', background: CS.accentSoft, borderRadius: 14, padding: '14px 16px', textAlign: 'center', fontSize: 13, color: CS.accent, fontWeight: 600, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
    🎓 Connecte-toi pour profiter de cette offre
  </button>
)}
      </div>
    </div>
  )
}