import { useState } from 'react'
import { CS } from '../../constants.js'
import { fmtDate, bannerGradient, isOffreActive } from '../../utils.js'
import PhotoCarousel from '../ui/PhotoCarousel.jsx'
import StarRating from '../ui/StarRating.jsx'
import AvisOffreBadge from './AvisOffreBadge.jsx'

export default function OffreDetail({ offre, etudiant, isFavori, onToggleFavori, onClose, onQR }) {
  const o = offre
  const photos = (o.photos || []).map(p => p.url || p)
  const active = isOffreActive(o)
  const [showDesc, setShowDesc] = useState(false)

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 500,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'flex-end',
      justifyContent: 'center'
    }} onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'white', borderRadius: '24px 24px 0 0',
          width: '100%', maxWidth: 480,
          maxHeight: '90vh', overflowY: 'auto',
          paddingBottom: 32
        }}>

        {/* Banner / photos */}
        {photos.length > 0 ? (
          <PhotoCarousel photos={photos} height={200} />
        ) : (
          <div style={{
            height: 160,
            background: bannerGradient(o.prestataires?.type_metier),
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 56, borderRadius: '24px 24px 0 0'
          }}>
            {o.image_emoji || '🎯'}
          </div>
        )}

        {/* Contenu */}
        <div style={{ padding: '20px 20px 0' }}>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 900, fontSize: 20, color: CS.text, marginBottom: 4 }}>
                {o.titre}
              </div>
              <div style={{ fontSize: 13, color: CS.muted }}>
                {o.prestataires?.nom}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              {/* Favori */}
              {etudiant && onToggleFavori && (
                <button onClick={onToggleFavori} style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: isFavori ? 'rgba(239,68,68,0.1)' : '#F5F5F5',
                  border: 'none', cursor: 'pointer',
                  fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {isFavori ? '❤️' : '🤍'}
                </button>
              )}
              {/* Fermer */}
              <button onClick={onClose} style={{
                width: 40, height: 40, borderRadius: '50%',
                background: '#F5F5F5', border: 'none',
                cursor: 'pointer', fontSize: 18,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: CS.muted
              }}>✕</button>
            </div>
          </div>

          {/* Badge avis */}
          <div style={{ marginBottom: 12 }}>
            <AvisOffreBadge offreId={o.id} />
          </div>

          {/* Prix */}
          {o.prix_normal && (
            <div style={{
              background: CS.accentSoft, borderRadius: 14,
              padding: '12px 16px', marginBottom: 12,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ fontSize: 11, color: CS.muted, marginBottom: 2 }}>Prix normal</div>
                <div style={{ fontSize: 15, color: CS.muted, textDecoration: 'line-through' }}>
                  {o.prix_normal}€
                </div>
              </div>
              <div style={{ fontSize: 24, color: CS.muted }}>→</div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: CS.accent, fontWeight: 700, marginBottom: 2 }}>
                  -{o.promo_pct}%
                </div>
                <div style={{ fontSize: 22, fontWeight: 900, color: CS.green }}>
                  {Math.round(o.prix_normal * (1 - (o.promo_pct || 0) / 100) * 100) / 100}€
                </div>
              </div>
            </div>
          )}

          {/* Dates */}
          {(o.date_debut || o.date_fin) && (
            <div style={{
              display: 'flex', gap: 8, marginBottom: 12
            }}>
              {o.date_debut && (
                <div style={{
                  flex: 1, background: '#F8F8F8', borderRadius: 12,
                  padding: '8px 12px', fontSize: 12
                }}>
                  <div style={{ color: CS.muted, marginBottom: 2 }}>Début</div>
                  <div style={{ fontWeight: 700, color: CS.text }}>{fmtDate(o.date_debut)}</div>
                </div>
              )}
              {o.date_fin && (
                <div style={{
                  flex: 1, background: '#F8F8F8', borderRadius: 12,
                  padding: '8px 12px', fontSize: 12
                }}>
                  <div style={{ color: CS.muted, marginBottom: 2 }}>Fin</div>
                  <div style={{ fontWeight: 700, color: CS.text }}>{fmtDate(o.date_fin)}</div>
                </div>
              )}
            </div>
          )}

          {/* Description */}
          {o.description && (
            <div style={{ marginBottom: 16 }}>
              <div style={{
                fontSize: 14, color: CS.text, lineHeight: 1.6,
                maxHeight: showDesc ? 'none' : 60, overflow: 'hidden'
              }}>
                {o.description}
              </div>
              {o.description.length > 100 && (
                <button onClick={() => setShowDesc(v => !v)} style={{
                  background: 'none', border: 'none',
                  color: CS.accent, fontSize: 12, fontWeight: 700,
                  cursor: 'pointer', padding: '4px 0', fontFamily: 'inherit'
                }}>
                  {showDesc ? 'Voir moins' : 'Voir plus'}
                </button>
              )}
            </div>
          )}

          {/* Bouton QR */}
          {etudiant && onQR && (
            <button
              onClick={onQR}
              disabled={!active}
              style={{
                width: '100%', padding: '16px 0', borderRadius: 14,
                background: active
                  ? 'linear-gradient(135deg,#0066FF,#3399FF)'
                  : '#E0E0E0',
                color: active ? 'white' : CS.muted,
                border: 'none', fontSize: 15, fontWeight: 700,
                cursor: active ? 'pointer' : 'default',
                fontFamily: 'inherit', marginBottom: 12
              }}>
              {active ? '📱 Afficher mon QR code' : '⏳ Offre non active'}
            </button>
          )}

          {/* Pas connecté */}
          {!etudiant && (
            <div style={{
              background: CS.accentSoft, borderRadius: 14,
              padding: '14px 16px', textAlign: 'center',
              fontSize: 13, color: CS.accent, fontWeight: 600
            }}>
              🎓 Connecte-toi pour profiter de cette offre
            </div>
          )}
        </div>
      </div>
    </div>
  )
}