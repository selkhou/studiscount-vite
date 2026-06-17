import { CS } from '../../constants.js'
import { bannerGradient } from '../../utils.js'
import PhotoCarousel from '../ui/PhotoCarousel.jsx'

export default function OffreCard({ offre, isSelected, onClick, etudiantId }) {
  const o = offre
  const photos = (o.photos || []).map(p => p.url || p)

  return (
    <div
      onClick={onClick}
      className="siok-card"
      style={{
        background: 'white', borderRadius: 16,
        marginBottom: 12, overflow: 'hidden',
        boxShadow: isSelected
          ? '0 0 0 2px #0066FF, 0 4px 16px rgba(0,102,255,0.15)'
          : '0 2px 8px rgba(0,0,0,0.07)',
        cursor: 'pointer'
      }}>

      {/* Banner / photos */}
      {photos.length > 0 ? (
        <PhotoCarousel photos={photos} height={120} />
      ) : (
        <div style={{
          height: 100,
          background: bannerGradient(o.prestataires?.type_metier),
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 40
        }}>
          {o.image_emoji || '🎯'}
        </div>
      )}

      {/* Infos */}
      <div style={{ padding: '10px 14px 12px' }}>
        <div style={{ fontWeight: 800, fontSize: 15, color: CS.text, marginBottom: 2 }}>
          {o.titre}
        </div>
        <div style={{ fontSize: 12, color: CS.muted, marginBottom: 6 }}>
          {o.prestataires?.nom}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {o.promo_pct && (
            <span style={{
              background: 'rgba(0,102,255,0.08)',
              color: CS.accent, fontSize: 12, fontWeight: 700,
              padding: '2px 8px', borderRadius: 20
            }}>
              -{o.promo_pct}%
            </span>
          )}
          {o.prix_normal && (
            <span style={{ fontSize: 12, color: CS.muted }}>
              <span style={{ textDecoration: 'line-through' }}>{o.prix_normal}€</span>
              {' → '}
              <span style={{ color: CS.green, fontWeight: 700 }}>
                {o.prix || Math.round(o.prix_normal * (1 - (o.promo_pct || 0) / 100) * 100) / 100}€
              </span>
            </span>
          )}
          {o.nb_avis > 0 && (
            <span style={{ fontSize: 11, color: CS.muted }}>
              ⭐ {o.note_moyenne?.toFixed(1)} ({o.nb_avis})
            </span>
          )}
        </div>
      </div>
    </div>
  )
}