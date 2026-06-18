import { useState, useEffect, useRef, useCallback } from 'react'
import { CS, CITIES } from '../../constants.js'
import { db } from '../../lib/supabase.js'
import {
  isOffreVisible, distanceM, bannerGradient,
  fmtDate, getTypeMetier, getCategorieForType, buildCategoriesOffre
} from '../../utils.js'
import SIOKLogo from '../ui/SIOKLogo.jsx'
import PhotoCarousel from '../ui/PhotoCarousel.jsx'
import MapContainer from './MapContainer.jsx'
import NavFiltres from '../etudiant/NavFiltres.jsx'
import OffreDetail from '../offres/OffreDetail.jsx'
import ModalSuggestion from '../etudiant/ModalSuggestion.jsx'
import ModalPointsCadeaux from '../ui/ModalPointsCadeaux.jsx'
import EtudiantDashboard from '../etudiant/EtudiantDashboard.jsx'
import useImpressionTracker from '../../hooks/useImpressionTracker.js'
import QRGenerator from '../qr/QRGenerator.jsx'

// ── SVG Icons ──────────────────────────────────────────
const IcoListe = ({ active }) => (
  <svg width="26" height="26" viewBox="0 -960 960 960" fill={active ? '#0066FF' : '#C0C0C0'}>
    <path d="M280-600v-80h560v80H280Zm0 160v-80h560v80H280Zm0 160v-80h560v80H280ZM160-600q-17 0-28.5-11.5T120-640q0-17 11.5-28.5T160-680q17 0 28.5 11.5T200-640q0 17-11.5 28.5T160-600Zm0 160q-17 0-28.5-11.5T120-480q0-17 11.5-28.5T160-520q17 0 28.5 11.5T200-480q0 17-11.5 28.5T160-440Zm0 160q-17 0-28.5-11.5T120-320q0-17 11.5-28.5T160-360q17 0 28.5 11.5T200-320q0 17-11.5 28.5T160-280Z" />
  </svg>
)
const IcoCarte = ({ active }) => (
  <svg width="26" height="26" viewBox="0 -960 960 960" fill={active ? '#0066FF' : '#C0C0C0'}>
    <path d="m600-120-240-84-186 72q-20 8-37-4.5T120-170v-560q0-13 7.5-23t20.5-15l212-72 240 84 186-72q20-8 37 4.5t17 33.5v560q0 13-7.5 23T812-192l-212 72Zm-40-98v-468l-160-56v468l160 56Zm80 0 120-40v-474l-120 46v468Zm-440-10 120-46v-468l-120 40v474Zm440-458v468-468Zm-320-56v468-468Z" />
  </svg>
)
const IcoProfil = ({ active }) => (
  <svg width="26" height="26" viewBox="0 -960 960 960" fill={active ? '#0066FF' : '#C0C0C0'}>
    <path d="M367-527q-47-47-47-113t47-113q47-47 113-47t113 47q47 47 47 113t-47 113q-47 47-113 47t-113-47ZM160-160v-112q0-34 17.5-62.5T224-378q62-31 126-46.5T480-440q66 0 130 15.5T736-378q29 15 46.5 43.5T800-272v112H160Z" />
  </svg>
)

// ── TopOffresParCategorie ──────────────────────────────
function TopOffresParCategorie({ offres, userLocation, onSelect }) {
  const catsAvec = buildCategoriesOffre().filter(c => offres.some(o => c.types.includes(o.type_offre)))
  if (catsAvec.length === 0) return null
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ color: CS.text, fontWeight: 800, fontSize: 15, marginBottom: 10, letterSpacing: -0.3 }}>
        🔥 Meilleures offres du moment
      </div>
      {catsAvec.map(cat => {
        const catOffres = offres
          .filter(o => cat.types.includes(o.type_offre))
          .sort((a, b) => ((b.nb_avis || 0) * 2 + (b.note_moyenne || 0)) - ((a.nb_avis || 0) * 2 + (a.note_moyenne || 0)))
          .slice(0, 3)
        if (catOffres.length === 0) return null
        return (
          <div key={cat.id} style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <span style={{ fontSize: 16 }}>{cat.emoji}</span>
              <span style={{ color: cat.color, fontWeight: 700, fontSize: 13 }}>{cat.label}</span>
            </div>
            <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
              {catOffres.map(o => {
                const dist = userLocation && o.lat
                  ? `${(distanceM(userLocation.lat, userLocation.lng, o.lat, o.lng) / 1000).toFixed(1)}km` : ''
                return (
                  <div key={o.id} onClick={() => onSelect(o)}
                    style={{ flexShrink: 0, width: 140, background: '#FFFFFF', borderRadius: 16, overflow: 'hidden', cursor: 'pointer', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
                    <div style={{ height: 72, background: bannerGradient(o.type_offre), position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {o.photos && o.photos.length > 0
                        ? <img src={o.photos[0].url} alt="" onError={e => e.target.style.display = 'none'} style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} />
                        : <span style={{ fontSize: 28 }}>{cat.emoji}</span>
                      }
                      <div style={{ position: 'absolute', top: 6, right: 6, background: 'white', color: cat.color, fontSize: 11, fontWeight: 900, padding: '2px 8px', borderRadius: 12 }}>
                        -{o.promo_pct}%
                      </div>
                    </div>
                    <div style={{ padding: '8px 10px' }}>
                      <div style={{ color: CS.text, fontWeight: 700, fontSize: 12, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.titre}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        {o.prix && <span style={{ color: cat.color, fontWeight: 800, fontSize: 12 }}>{o.prix}€</span>}
                        {dist && <span style={{ color: CS.muted, fontSize: 10 }}>📍 {dist}</span>}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Tracker vues ──────────────────────────────────────
const _vuesSeen = new Set()
async function trackVue(offreId, etudiantId) {
  const key = `${offreId}_${etudiantId || 'anon'}`
  if (_vuesSeen.has(key)) return
  _vuesSeen.add(key)
  try { await db().from('vues_offres').insert({ offre_id: offreId, etudiant_id: etudiantId || null }) }
  catch (e) { }
}

// ── OffreTile avec impression tracker ─────────────────
function OffreTile({ o, onSelect, onFavoriClick }) {
  const impRef = useImpressionTracker(o.id, null)
  const type = getTypeMetier(o.type_offre)
  return (
    <div ref={impRef}
      onClick={() => { if (window.LANDING_MODE) return; onSelect(o) }}
      style={{ background: '#FFFFFF', borderRadius: 16, overflow: 'hidden', cursor: window.LANDING_MODE ? 'default' : 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.07)', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {window.LANDING_MODE && <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.01)', zIndex: 10, cursor: 'default' }} />}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <PhotoCarousel photos={o.photos} height={120} emoji={type.emoji} gradient={bannerGradient(o.type_offre)} />
        <div style={{ position: 'absolute', top: 8, right: 8, background: '#EF4444', color: 'white', fontSize: 12, fontWeight: 900, padding: '3px 10px', borderRadius: 50, zIndex: 3 }}>
          -{o.promo_pct}%
        </div>
        <button onClick={e => { e.stopPropagation(); onFavoriClick() }}
          style={{ position: 'absolute', top: 8, left: 8, width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.9)', border: '1.5px solid rgba(0,0,0,0.25)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, zIndex: 3 }}>
          🤍
        </button>
      </div>
      <div style={{ padding: '8px 10px 10px', flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
        <div style={{ color: '#1A1A2E', fontWeight: 800, fontSize: 13, lineHeight: 1.3 }}>{o.titre}</div>
        <div style={{ color: '#9CA3AF', fontSize: 11 }}>{o.prestataire_nom}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2, flexWrap: 'wrap' }}>
          {o.prix && <span style={{ color: '#22C55E', fontWeight: 900, fontSize: 14 }}>{parseFloat(o.prix).toFixed(2)}€</span>}
          {o.prix_normal && <span style={{ color: '#C0C0C0', fontSize: 11, textDecoration: 'line-through' }}>{parseFloat(o.prix_normal).toFixed(2)}€</span>}
        </div>
        {o.note_moyenne > 0 && <div style={{ color: '#F59E0B', fontSize: 11, fontWeight: 700 }}>★ {parseFloat(o.note_moyenne).toFixed(1)} <span style={{ color: '#9CA3AF', fontWeight: 400, fontSize: 10 }}>({o.nb_avis || 0} avis)</span></div>}
        {o.date_fin && <div style={{ color: '#EF4444', fontSize: 10, fontWeight: 700 }}>⏰ {fmtDate(o.date_fin)}</div>}
      </div>
    </div>
  )
}

// ── useOffres ─────────────────────────────────────────
function useOffres(city, userLocation) {
  const [offres, setOffres] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const cityData = CITIES.find(c => c.id === city) || CITIES[0]
      const [{ data: offresData }, { data: prestData }] = await Promise.all([
        db().from('offres').select('*').eq('active', true).gt('promo_pct', 0).order('created_at', { ascending: false }),
        db().from('prestataires').select('id,nom,adresse,ville,telephone,lat,lng,type_metier,photos,statut'),
      ])
      const prestMap = {}
        ; (prestData || []).forEach(p => { prestMap[p.id] = p })
      if (offresData) {
        const enriched = offresData
          .filter(o => isOffreVisible(o))
          .map(o => {
            const p = prestMap[o.prestataire_id] || {}
            return {
              ...o, lat: p.lat || null, lng: p.lng || null,
              prestataire_nom: p.nom || '', adresse: p.adresse || '',
              ville: p.ville || '', telephone: p.telephone || '',
              type_offre: o.type_offre || p.type_metier || 'autre',
              prestataire_statut: p.statut || 'actif'
            }
          })
          .filter(o => {
            if (o.prestataire_statut === 'suspendu') return false
            if (!o.lat || !o.lng) return false
            return distanceM(cityData.lat, cityData.lng, o.lat, o.lng) < 25000
          })
          .sort((a, b) => {
            if (!userLocation) return 0
            return distanceM(userLocation.lat, userLocation.lng, a.lat, a.lng) -
              distanceM(userLocation.lat, userLocation.lng, b.lat, b.lng)
          })
        setOffres(enriched)
      }
    } catch (e) { console.error('useOffres:', e) }
    setLoading(false)
  }, [city])

  useEffect(() => { load() }, [load])
  return { offres, loading, reload: load }
}

// ── MapExplorer ───────────────────────────────────────
export default function MapExplorer({ onConnecte, onPrestataire }) {
  const [userLocation, setUserLocation] = useState(null)
  const [city, setCity] = useState('annecy')
  const [viewMode, setViewMode] = useState('list')
  const [filterCat, setFilterCat] = useState(null)
  const [filterType, setFilterType] = useState(null)
  const [tri, setTri] = useState('distance')
  const [selected, setSelected] = useState(null)
  const [showChoixProfil, setShowChoixProfil] = useState(false)
  const [showFavoriMsg, setShowFavoriMsg] = useState(false)
  const [showSuggestion, setShowSuggestion] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const [showReco, setShowReco] = useState(false)
  const [search, setSearch] = useState('')
  const [showQR, setShowQR] = useState(false)
  const [qrOffre, setQrOffre] = useState(null)
  // Landing mode
  const [landingBanner, setLandingBanner] = useState(window.LANDING_MODE || false)
  const [landingStep, setLandingStep] = useState('choix')
  const [landingPrenom, setLandingPrenom] = useState('')
  const [landingEmail, setLandingEmail] = useState('')
  const [landingLoading, setLandingLoading] = useState(false)
  const [landingErr, setLandingErr] = useState('')
  const listRef = useRef(null)
  const { offres, loading } = useOffres(city, userLocation)

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      p => setUserLocation({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => { }
    )
    if (window.LANDING_MODE) {
      db().auth.signOut().then(() => { })
      db().from('scans_landing').insert({ reponse: 'scan' }).then(() => { })
    }
  }, [])

  const filtered = offres.filter(o => {
    if (!o.active) return false
    if (filterType) return o.type_offre === filterType
    if (filterCat) {
      const cat = buildCategoriesOffre().find(c => c.id === filterCat)
      if (cat && !cat.types.includes(o.type_offre)) return false
    }
    if (search && search.trim()) {
      const q = search.trim().toLowerCase()
      const type = getTypeMetier(o.type_offre)
      const cat = getCategorieForType(o.type_offre)
      return (o.titre || '').toLowerCase().includes(q) ||
        (o.prestataire_nom || '').toLowerCase().includes(q) ||
        (type?.label || '').toLowerCase().includes(q) ||
        (cat?.label || '').toLowerCase().includes(q)
    }
    return true
  }).sort((a, b) => {
    if (tri === 'remise' || tri === 'remisePct') return (b.promo_pct || 0) - (a.promo_pct || 0)
    if (tri === 'notes') return (b.note_moyenne || 0) - (a.note_moyenne || 0)
    if (!userLocation) return 0
    return distanceM(userLocation.lat, userLocation.lng, a.lat || 0, a.lng || 0) -
      distanceM(userLocation.lat, userLocation.lng, b.lat || 0, b.lng || 0)
  })

  return (
    <div style={{ minHeight: '100vh', background: window.SIOK_PARAMS?.fond_couleur || '#F5F5F5', display: 'flex', flexDirection: 'column', isolation: 'isolate' }}>

      {/* Header */}
      <div style={{ background: '#FFFFFF', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ padding: '12px 10px 10px' }}>
          <NavFiltres
            nbOffres={filtered.filter(o => o.active !== false).length}
            tri={tri} setTri={setTri}
            showReco={showReco} setShowReco={setShowReco}
            filterCat={filterCat} setFilterCat={setFilterCat}
            filterType={filterType} setFilterType={setFilterType}
            offres={offres} showPerso={false}
            search={search} setSearch={setSearch}
          />
        </div>
      </div>

      {/* Contenu */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Carte */}
        {viewMode === 'map' && window.LANDING_MODE && (
          <div style={{ position: 'fixed', top: 120, left: 0, right: 0, bottom: 64, zIndex: 1 }}>
            <MapContainer offres={filtered} selected={null}
              onSelect={() => { }}
              city={city} userLocation={userLocation} />
          </div>
        )}

        {viewMode === 'map' && window.LANDING_MODE && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, padding: 32, background: '#F8FAFC' }}>
            <div style={{ fontSize: 48 }}>🗺️</div>
            <div style={{ color: '#6B7280', fontSize: 14, fontWeight: 600, textAlign: 'center' }}>La carte est disponible<br />après inscription</div>
          </div>
        )}

        <div ref={listRef} style={{ display: viewMode === 'list' ? 'flex' : 'none', flexDirection: 'column', flex: 1, overflowY: 'auto', paddingBottom: 90 }}>

          {loading && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: CS.muted }}>
              <div style={{ width: 32, height: 32, border: '3px solid #E8E8E8', borderTopColor: CS.accent, borderRadius: '50%', margin: '0 auto 12px', animation: 'spin 0.8s linear infinite' }} />
              Chargement des offres…
            </div>
          )}

          {!loading && viewMode === 'list' && (
            <div style={{ padding: '12px 16px 0' }}>

              {/* Compteur */}
              {!showReco && filtered.length > 0 && (
                <div style={{ marginBottom: 12, paddingLeft: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#1A1A2E', background: 'rgba(255,255,255,0.85)', padding: '2px 10px', borderRadius: 20 }}>
                    {filtered.length} offre{filtered.length > 1 ? 's' : ''} disponible{filtered.length > 1 ? 's' : ''}
                  </span>
                </div>
              )}

              {/* Reco Pop */}
              {showReco === 'pop' && (
                <TopOffresParCategorie offres={offres} userLocation={userLocation}
                  onSelect={o => { if (window.LANDING_MODE) return; setSelected(o); setShowReco(false) }} />
              )}

              {/* Vide */}
              {!showReco && filtered.length === 0 && (
                <div style={{ textAlign: 'center', padding: '48px 20px', color: CS.muted }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>🎯</div>
                  <div style={{ color: CS.text, fontWeight: 700, fontSize: 15, marginBottom: 6 }}>Aucune offre disponible</div>
                  <div style={{ fontSize: 13 }}>Essayez une autre ville</div>
                </div>
              )}

              {/* Grille 2 colonnes */}
              {!showReco && filtered.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, paddingBottom: 8 }}>
                  {filtered.map(o => (
                    <OffreTile
                      key={o.id}
                      o={o}
                      onSelect={o => { setSelected(o); trackVue(o.id, null) }}
                      onFavoriClick={() => { setShowFavoriMsg(true); setTimeout(() => setShowFavoriMsg(false), 3000) }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal détail offre */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 2850, background: '#F5F5F5', overflowY: 'auto', display: 'flex', flexDirection: 'column', paddingBottom: 64 }}>
          <OffreDetail offre={selected} etudiant={null} isFavori={false}
            onToggleFavori={() => !window.LANDING_MODE && setShowLogin(true)}
            onClose={() => setSelected(null)}
            onQR={() => { setQrOffre(selected); setShowQR(true) }}
          />
        </div>
      )}

      {/* QR Generator */}
      {showQR && qrOffre && (
        <QRGenerator offre={qrOffre} etudiant={null} onClose={() => { setShowQR(false); setQrOffre(null) }} />
      )}

      {/* Toast favori */}
      {showFavoriMsg && (
        <div style={{ position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)', background: '#1A1A2E', color: 'white', padding: '10px 20px', borderRadius: 50, fontSize: 13, fontWeight: 600, zIndex: 5000, boxShadow: '0 4px 16px rgba(0,0,0,0.3)', whiteSpace: 'nowrap' }}>
          🔒 Connectez-vous pour ajouter en favori
        </div>
      )}

      {/* FAB Remonter */}
      {viewMode === 'list' && (
        <button onClick={() => { if (listRef.current) listRef.current.scrollTop = 0 }}
          style={{ position: 'fixed', bottom: 132, right: 16, width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.97)', border: '2px solid #D1D5DB', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 150, boxShadow: '0 3px 10px rgba(0,0,0,0.15)' }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M10 16V4M10 4L5 9M10 4L15 9" stroke="#374151" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}

      {/* FAB Idée — masqué en mode landing */}
      {viewMode === 'list' && !window.LANDING_MODE && (
        <button onClick={() => setShowSuggestion(true)}
          style={{ position: 'fixed', bottom: 76, right: 16, width: 48, height: 48, borderRadius: '50%', background: '#0066FF', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 150, boxShadow: '0 4px 16px rgba(0,102,255,0.4)' }}>
          <svg width="24" height="24" viewBox="0 -960 960 960" fill="white">
            <path d="M480-80q-33 0-56.5-23.5T400-160h160q0 33-23.5 56.5T480-80ZM320-200v-80h320v80H320Zm10-120q-69-41-109.5-110T180-580q0-125 87.5-212.5T480-880q125 0 212.5 87.5T780-580q0 78-40.5 147T630-320H330Z" />
          </svg>
        </button>
      )}

      {showSuggestion && <ModalSuggestion nom={null} type="etudiant_anon" onClose={() => setShowSuggestion(false)} />}

      {/* Modal points cadeaux */}
      {showModal && (
        <ModalPointsCadeaux
          onClose={() => setShowModal(false)}
          onConnecte={() => { setShowModal(false); setShowLogin(true) }}
        />
      )}

      {/* Login overlay */}
      {showLogin && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 2900, background: '#F5F5F5', overflowY: 'auto' }}>
          <EtudiantDashboard
            onBack={() => setShowLogin(false)}
            onConnecte={(et) => { setShowLogin(false); onConnecte(et) }}
          />
        </div>
      )}

      {/* Bandeau landing */}
      {landingBanner && (
        <div style={{ position: 'fixed', bottom: 64, left: 0, right: 0, zIndex: 3050, background: '#FFFFFF', boxShadow: '0 -4px 24px rgba(0,0,0,0.15)', borderTop: '1px solid #E5E7EB', padding: '12px 16px' }}>
          {landingStep === 'choix' && (
            <div>
              <div style={{ textAlign: 'center', marginBottom: 10 }}>
                <span style={{ fontFamily: 'Arial Black,sans-serif', fontWeight: 900, fontSize: 16, color: '#0066FF' }}>Stu</span>
                <span style={{ fontFamily: 'Arial Black,sans-serif', fontWeight: 900, fontSize: 16, color: '#F59E0B' }}>Discount</span>
                <span style={{ color: '#6B7280', fontSize: 12, marginLeft: 6 }}>
                  {`disponible le ${window.SIOK_PARAMS?.date_lancement || '1er juillet 2026'}`}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <button onClick={() => setLandingStep('form')}
                  style={{ width: '100%', padding: '12px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#0066FF,#3399FF)', color: 'white', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 3px 12px rgba(0,102,255,0.3)' }}>
                  🎁 Je crée mon compte et gagne 50 pts ⭐
                </button>
                <button onClick={async () => {
                  await db().from('scans_landing').insert({ reponse: 'oui' })
                  setLandingStep('merci_oui')
                  setTimeout(() => setLandingBanner(false), 3000)
                }}
                  style={{ width: '100%', padding: '11px', borderRadius: 12, border: '1.5px solid #0066FF', background: 'white', color: '#0066FF', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                  👍 Intéressé·e, je m'inscrirai plus tard
                </button>
                <button onClick={async () => {
                  await db().from('scans_landing').insert({ reponse: 'non' })
                  setLandingBanner(false)
                }}
                  style={{ width: '100%', padding: '10px', borderRadius: 12, border: 'none', background: 'transparent', color: '#9CA3AF', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Pas intéressé·e
                </button>
              </div>
            </div>
          )}

          {landingStep === 'form' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <button onClick={() => setLandingStep('choix')} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 18, color: '#9CA3AF' }}>←</button>
                <div style={{ fontWeight: 800, fontSize: 14, color: '#1A1A2E' }}>🎁 50 points ⭐ offerts au lancement</div>
              </div>
              {landingErr && <div style={{ color: '#EF4444', fontSize: 12, marginBottom: 8 }}>{landingErr}</div>}
              <input value={landingPrenom} onChange={e => setLandingPrenom(e.target.value)}
                placeholder="Ton prénom"
                style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #E5E7EB', fontSize: 13, fontFamily: 'inherit', outline: 'none', marginBottom: 8 }} />
              <input value={landingEmail} onChange={e => setLandingEmail(e.target.value)}
                placeholder="Ton email" type="email"
                style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #E5E7EB', fontSize: 13, fontFamily: 'inherit', outline: 'none', marginBottom: 8 }} />
              <button disabled={landingLoading} onClick={async () => {
                if (!landingPrenom.trim()) { setLandingErr('Prénom requis'); return }
                if (!landingEmail.includes('@')) { setLandingErr('Email invalide'); return }
                setLandingLoading(true); setLandingErr('')
                try {
                  const { data: existing } = await db().from('etudiants').select('id').eq('email', landingEmail.trim().toLowerCase()).limit(1)
                  let etId = null
                  if (existing && existing.length > 0) {
                    etId = existing[0].id
                  } else {
                    const { error } = await db().from('etudiants').insert({
                      prenom: landingPrenom.trim(),
                      email: landingEmail.trim().toLowerCase(),
                      points: 50, pre_inscrit: true,
                      created_at: new Date().toISOString()
                    })
                    if (error) throw error
                    const { data: fetched } = await db().from('etudiants').select('id').eq('email', landingEmail.trim().toLowerCase()).limit(1)
                    etId = fetched && fetched.length > 0 ? fetched[0].id : null
                  }
                  await db().from('scans_landing').insert({ reponse: 'inscrit', etudiant_id: etId })
                  setLandingStep('merci_inscrit')
                  setTimeout(() => setLandingBanner(false), 5000)
                } catch (e) { setLandingErr('Erreur, réessaie dans un instant.') }
                setLandingLoading(false)
              }}
                style={{ width: '100%', padding: '12px', borderRadius: 12, border: 'none', background: landingLoading ? '#D1D5DB' : 'linear-gradient(135deg,#0066FF,#3399FF)', color: 'white', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
                {landingLoading ? '...' : 'Je m\'inscris — gratuit 🚀'}
              </button>
            </div>
          )}

          {landingStep === 'merci_inscrit' && (
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <div style={{ fontSize: 32, marginBottom: 4 }}>🎉</div>
              <div style={{ fontWeight: 800, fontSize: 15, color: '#1A1A2E', marginBottom: 4 }}>C'est fait ! 50 pts ⭐ t'attendent</div>
              <div style={{ fontSize: 12, color: '#6B7280' }}>{`Connecte-toi le ${window.SIOK_PARAMS?.date_lancement || '1er juillet 2026'} avec cet email`}</div>
            </div>
          )}

          {landingStep === 'merci_oui' && (
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <div style={{ fontSize: 32, marginBottom: 4 }}>👍</div>
              <div style={{ fontWeight: 800, fontSize: 15, color: '#1A1A2E' }}>{`Super ! On se retrouve le ${window.SIOK_PARAMS?.date_lancement || '1er juillet 2026'}`}</div>
            </div>
          )}
        </div>
      )}

      {/* Bottom bar */}
      <div className="siok-bottom-bar" style={{ zIndex: 3100 }}>
        <button className="siok-bottom-btn active"
        onClick={() => setViewMode(viewMode === 'list' ? 'map' : 'list')}>
          {viewMode === 'list' ? <IcoListe active={true} /> : <IcoCarte active={true} />}
          <span style={{ color: window.LANDING_MODE ? '#9CA3AF' : '#0066FF' }}>{viewMode === 'list' ? 'Liste' : 'Carte'}</span>
        </button>
        <button className="siok-bottom-btn" style={{ flex: 1.2 }} onClick={() => setShowModal(true)}>
          <SIOKLogo size="sm" />
          <span style={{ fontSize: 9, color: '#9CA3AF', marginTop: 1 }}>StuD</span>
        </button>
        <button className="siok-bottom-btn"
          onClick={() => { if (window.LANDING_MODE) return; setShowChoixProfil(true) }}
          style={{ opacity: window.LANDING_MODE ? 0.35 : 1, cursor: window.LANDING_MODE ? 'default' : 'pointer' }}>
          <IcoProfil active={false} />
          <span style={{ color: window.LANDING_MODE ? '#9CA3AF' : 'inherit' }}>Compte</span>
        </button>
      </div>

      {/* Modal choix profil */}
      {showChoixProfil && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 2850, display: 'flex', alignItems: 'flex-end', paddingBottom: 64 }}
          onClick={() => setShowChoixProfil(false)}>
          <div style={{ background: 'white', borderRadius: '24px 24px 0 0', padding: '28px 24px 40px', width: '100%' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#1A1A2E' }}>Qui êtes-vous ?</div>
              <div style={{ fontSize: 13, color: '#9CA3AF', marginTop: 4 }}>Choisissez votre profil</div>
            </div>
            <button onClick={() => { setShowChoixProfil(false); setShowLogin(true) }}
              style={{ width: '100%', padding: '16px', borderRadius: 16, border: '2px solid #0066FF', background: '#EBF0FF', cursor: 'pointer', fontFamily: 'inherit', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 14 }}>
              <svg width="32" height="32" viewBox="0 -960 960 960" fill="#0066FF">
                <path d="M367-527q-47-47-47-113t47-113q47-47 113-47t113 47q47 47 47 113t-47 113q-47 47-113 47t-113-47ZM160-160v-112q0-34 17.5-62.5T224-378q62-31 126-46.5T480-440q66 0 130 15.5T736-378q29 15 46.5 43.5T800-272v112H160Z" />
              </svg>
              <div style={{ textAlign: 'left' }}>
                <div style={{ color: '#0066FF', fontWeight: 800, fontSize: 15 }}>👨‍🎓 Je suis étudiant</div>
                <div style={{ color: '#9CA3AF', fontSize: 12 }}>Accède aux réductions exclusives</div>
              </div>
            </button>
            <button onClick={() => { setShowChoixProfil(false); onPrestataire() }}
              style={{ width: '100%', padding: '16px', borderRadius: 16, border: '2px solid #22C55E', background: '#F0FFF4', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 14 }}>
              <svg width="32" height="32" viewBox="0 -960 960 960" fill="#22C55E">
                <path d="M160-120v-480l320-240 320 240v480H560v-280H400v280H160Z" />
              </svg>
              <div style={{ textAlign: 'left' }}>
                <div style={{ color: '#22C55E', fontWeight: 800, fontSize: 15 }}>💼 Je suis professionnel</div>
                <div style={{ color: '#9CA3AF', fontSize: 12 }}>Publie tes offres et attire des étudiants</div>
              </div>
            </button>
            <button onClick={() => setShowChoixProfil(false)}
              style={{ width: '100%', marginTop: 12, padding: '12px', borderRadius: 12, border: '1px solid #E5E7EB', background: 'transparent', color: '#9CA3AF', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  )
}