import { useState, useEffect, useRef } from 'react'
import { CS } from '../../constants.js'
import { db } from '../../lib/supabase.js'
import {
  isOffreVisible, distanceM, bannerGradient,
  fmtDate, getTypeMetier, getCategorieForType, buildCategoriesOffre
} from '../../utils.js'
import { StudentPageShell } from '../ui/PageShells.jsx'
import SIOKLogo from '../ui/SIOKLogo.jsx'
import PhotoCarousel from '../ui/PhotoCarousel.jsx'
import OffreDetail from '../offres/OffreDetail.jsx'
import QRGenerator from '../qr/QRGenerator.jsx'
import MapContainer from '../map/MapContainer.jsx'
import NavFiltres from './NavFiltres.jsx'
import VisiteCard from './VisiteCard.jsx'
import EditProfilEtudiant from './EditProfilEtudiant.jsx'
import MesCadeaux from './MesCadeaux.jsx'
import ModalCadeaux from './ModalCadeaux.jsx'
import ModalSuggestion from './ModalSuggestion.jsx'
import ModalCGU from '../ui/ModalCGU.jsx'
import ChangePassword from '../ui/ChangePassword.jsx'
import ModalPointsCadeaux from '../ui/ModalPointsCadeaux.jsx'
import useImpressionTracker from '../../hooks/useImpressionTracker.js'

// ── SVG Icons ─────────────────────────────────────────
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
                      <div style={{ position: 'absolute', top: 6, right: 6, background: 'white', color: cat.color, fontSize: 11, fontWeight: 900, padding: '2px 8px', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.15)' }}>
                        -{o.promo_pct}%
                      </div>
                    </div>
                    <div style={{ padding: '8px 10px' }}>
                      <div style={{ color: CS.text, fontWeight: 700, fontSize: 12, lineHeight: 1.3, marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.titre}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        {o.prix && <span style={{ color: cat.color, fontWeight: 800, fontSize: 12 }}>{o.prix}€</span>}
                        {dist && <span style={{ color: CS.muted, fontSize: 10 }}>📍 {dist}</span>}
                      </div>
                      {o.note_moyenne > 0 && (
                        <div style={{ color: '#F59E0B', fontSize: 11, fontWeight: 700, marginTop: 2 }}>
                          ★ {parseFloat(o.note_moyenne).toFixed(1)} <span style={{ color: CS.muted, fontWeight: 400, fontSize: 10 }}>({o.nb_avis || 0} avis)</span>
                        </div>
                      )}
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

// ── RecommandationsPerso ───────────────────────────────
function RecommandationsPerso({ offres, etudiant, visites, vues }) {
  const scoreParType = {}
  vues.forEach(v => {
    const offre = offres.find(o => o.id === v.offre_id)
    if (offre?.type_offre) scoreParType[offre.type_offre] = (scoreParType[offre.type_offre] || 0) + 1
  })
  visites.forEach(v => {
    const offre = offres.find(o => o.id === v.offre_id)
    if (offre?.type_offre) scoreParType[offre.type_offre] = (scoreParType[offre.type_offre] || 0) + 3
  })
  const offresVues = new Set(vues.map(v => v.offre_id))
  const offresVisitees = new Set(visites.map(v => v.offre_id))
  const scored = offres
    .filter(o => o.active && !offresVisitees.has(o.id))
    .map(o => ({
      ...o,
      score: (scoreParType[o.type_offre] || 0) * 10 + (o.promo_pct || 0) + (o.note_moyenne || 0) * 5
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
  if (scored.length === 0) return null
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ color: CS.text, fontWeight: 800, fontSize: 15, marginBottom: 10, letterSpacing: -0.3 }}>
        ✨ Recommandé pour toi
      </div>
      <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
        {scored.map(o => {
          const cat = getCategorieForType(o.type_offre)
          return (
            <div key={o.id} style={{ flexShrink: 0, width: 140, background: '#FFFFFF', borderRadius: 16, overflow: 'hidden', cursor: 'pointer', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', border: `1.5px solid ${cat?.color || CS.accent}22` }}>
              <div style={{ height: 72, background: bannerGradient(o.type_offre), position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {o.photos && o.photos.length > 0
                  ? <img src={o.photos[0].url} alt="" onError={e => e.target.style.display = 'none'} style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} />
                  : <span style={{ fontSize: 28 }}>{cat?.emoji || '🎯'}</span>
                }
                <div style={{ position: 'absolute', top: 6, right: 6, background: 'white', color: cat?.color || CS.accent, fontSize: 11, fontWeight: 900, padding: '2px 8px', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.15)' }}>
                  -{o.promo_pct}%
                </div>
                {offresVues.has(o.id) && <div style={{ position: 'absolute', bottom: 4, left: 6, background: 'rgba(0,0,0,0.5)', color: 'white', fontSize: 9, padding: '1px 6px', borderRadius: 8 }}>Déjà vu</div>}
              </div>
              <div style={{ padding: '8px 10px' }}>
                <div style={{ color: CS.text, fontWeight: 700, fontSize: 12, lineHeight: 1.3, marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.titre}</div>
                {o.prix && <span style={{ color: cat?.color || CS.accent, fontWeight: 800, fontSize: 12 }}>{o.prix}€</span>}
              </div>
            </div>
          )
        })}
      </div>
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

// ── useOffres ─────────────────────────────────────────
function useOffres(city, userLocation) {
  const [offres, setOffres] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetch() {
      setLoading(true)
      try {
        const cities = [
          { id: 'annecy', name: 'Annecy' }, { id: 'paris', name: 'Paris' },
          { id: 'lyon', name: 'Lyon' }, { id: 'bordeaux', name: 'Bordeaux' },
          { id: 'nice', name: 'Nice' }, { id: 'toulouse', name: 'Toulouse' },
          { id: 'grenoble', name: 'Grenoble' }, { id: 'chambery', name: 'Chambéry' },
          { id: 'marseille', name: 'Marseille' }, { id: 'nantes', name: 'Nantes' },
          { id: 'geneve', name: 'Genève' },
        ]
        const cityData = cities.find(c => c.id === city) || cities[0]
        const { data } = await db()
          .from('offres')
          .select('*, prestataires(id, nom, type_metier, statut, lat, lng, ville)')
          .eq('active', true)
        const filtrees = (data || []).filter(o =>
          o.prestataires?.ville?.toLowerCase() === cityData.name.toLowerCase()
        )
        const visibles = filtrees.filter(isOffreVisible)
        const enrichies = visibles.map(o => ({
          ...o,
          lat: o.prestataires?.lat,
          lng: o.prestataires?.lng,
          prestataire_nom: o.prestataires?.nom,
          type_offre: o.type_offre || o.prestataires?.type_metier,
        }))
        if (userLocation) {
          enrichies.sort((a, b) =>
            distanceM(userLocation.lat, userLocation.lng, a.lat || 0, a.lng || 0) -
            distanceM(userLocation.lat, userLocation.lng, b.lat || 0, b.lng || 0)
          )
        }
        setOffres(enrichies)
      } catch (e) { console.warn('Erreur offres:', e.message) }
      setLoading(false)
    }
    fetch()
  }, [city, userLocation])

  return { offres, loading }
}
function OffreTile({ o, isFav, etudiantId, onSelect, onToggleFavori }) {
  const impRef = useImpressionTracker(o.id, etudiantId)
  const type = getTypeMetier(o.type_offre)
  return (
    <div ref={impRef}
      onClick={() => onSelect(o)}
      style={{ background: '#FFFFFF', borderRadius: 16, overflow: 'hidden', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.07)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <PhotoCarousel photos={o.photos} height={120} emoji={type.emoji} gradient={bannerGradient(o.type_offre)} />
        <div style={{ position: 'absolute', top: 8, right: 8, background: '#EF4444', color: 'white', fontSize: 12, fontWeight: 900, padding: '3px 10px', borderRadius: 50, zIndex: 3 }}>
          -{o.promo_pct}%
        </div>
        <button onClick={e => { e.stopPropagation(); onToggleFavori(o) }}
          style={{ position: 'absolute', top: 8, left: 8, width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.9)', border: '1.5px solid rgba(0,0,0,0.25)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, zIndex: 3 }}>
          {isFav ? '❤️' : '🤍'}
        </button>
      </div>
      <div style={{ padding: '8px 10px 10px', flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
        <div style={{ color: CS.text, fontWeight: 800, fontSize: 13, lineHeight: 1.3 }}>{o.titre}</div>
        <div style={{ color: CS.muted, fontSize: 11 }}>{o.prestataire_nom}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2, flexWrap: 'wrap' }}>
          {o.prix && <span style={{ color: '#22C55E', fontWeight: 900, fontSize: 14 }}>{parseFloat(o.prix).toFixed(2)}€</span>}
          {o.prix_normal && <span style={{ color: '#C0C0C0', fontSize: 11, textDecoration: 'line-through' }}>{parseFloat(o.prix_normal).toFixed(2)}€</span>}
        </div>
        {o.note_moyenne > 0 && (
          <div style={{ color: '#F59E0B', fontSize: 11, fontWeight: 700 }}>
            ★ {parseFloat(o.note_moyenne).toFixed(1)} <span style={{ color: '#9CA3AF', fontWeight: 400, fontSize: 10 }}>({o.nb_avis || 0} avis)</span>
          </div>
        )}
        {o.date_fin && <div style={{ color: '#EF4444', fontSize: 10, fontWeight: 700 }}>⏰ {fmtDate(o.date_fin)}</div>}
      </div>
    </div>
  )
}

function BonsCadeauxEtudiant({ etudiantId }) {
  const [bons, setBons] = useState([])
  const [loading, setLoading] = useState(true)
  const [showQR, setShowQR] = useState(null)

  useEffect(() => {
    if (!etudiantId) return
    db().from('bons_cadeaux')
      .select('*,partenaires_cadeaux(nom,emoji)')
      .eq('etudiant_id', etudiantId)
      .order('created_at', { ascending: false })
      .then(({ data }) => { setBons(data || []); setLoading(false) })
  }, [etudiantId])

  if (loading) return <div style={{ textAlign: 'center', padding: 32, color: '#9CA3AF' }}>Chargement…</div>

  if (bons.length === 0) return (
    <div style={{ textAlign: 'center', padding: '48px 20px', color: '#9CA3AF' }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>🎟️</div>
      <div style={{ color: '#1A1A2E', fontWeight: 700, marginBottom: 6 }}>Aucun bon cadeau</div>
      <div style={{ fontSize: 13 }}>Réclamez votre premier bon depuis Mes points</div>
    </div>
  )

  return (
    <div style={{ padding: 16 }}>
      {bons.map(b => (
        <div key={b.id} style={{ background: '#FFFFFF', borderRadius: 16, padding: '14px 16px', marginBottom: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, color: '#1A1A2E' }}>
                {b.partenaires_cadeaux?.emoji} {b.partenaires_cadeaux?.nom}
              </div>
              <div style={{ color: '#22C55E', fontWeight: 900, fontSize: 18 }}>{b.montant}€</div>
              <div style={{ color: '#9CA3AF', fontSize: 11, marginTop: 2 }}>
                {new Date(b.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
              </div>
            </div>
            <div style={{
              background: b.statut === 'valide' ? 'rgba(34,197,94,0.1)' : b.statut === 'en_attente' ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)',
              color: b.statut === 'valide' ? '#22C55E' : b.statut === 'en_attente' ? '#F59E0B' : '#EF4444',
              fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20
            }}>
              {b.statut === 'valide' ? '✅ Validé' : b.statut === 'en_attente' ? '⏳ En attente' : '❌ Refusé'}
            </div>
          </div>

          {b.statut === 'valide' && (
            <div>
              <div style={{ fontFamily: 'monospace', fontSize: 16, color: '#0066FF', fontWeight: 900, letterSpacing: 2, textAlign: 'center', padding: '8px', background: '#F0F6FF', borderRadius: 10, marginBottom: 8 }}>
                {b.code}
              </div>
              <button onClick={() => setShowQR(showQR === b.id ? null : b.id)}
                style={{ width: '100%', padding: '10px', borderRadius: 10, border: '1.5px solid #0066FF', background: showQR === b.id ? '#0066FF' : 'white', color: showQR === b.id ? 'white' : '#0066FF', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                {showQR === b.id ? '▲ Masquer le QR' : '📱 Afficher le QR code'}
              </button>
              {showQR === b.id && (
                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(b.code)}&bgcolor=ffffff&color=000000&margin=2`}
                    alt="QR code bon cadeau"
                    style={{ width: 200, height: 200, borderRadius: 12 }}
                  />
                  <div style={{ color: '#9CA3AF', fontSize: 11, marginTop: 8 }}>Présentez ce QR chez {b.partenaires_cadeaux?.nom}</div>
                </div>
              )}
            </div>
          )}

          {b.statut === 'en_attente' && (
            <div style={{ background: 'rgba(245,158,11,0.08)', borderRadius: 10, padding: '8px 12px', fontSize: 12, color: '#F59E0B' }}>
              ⏳ En attente de validation par l'équipe StuDiscount
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
// ── EtudiantApp ───────────────────────────────────────
export default function EtudiantApp({ etudiant, onLogout, onHome }) {
  const [tab, setTab] = useState('offres')
  const [viewMode, setViewMode] = useState('list')
  const [userLocation, setUserLocation] = useState(null)
  const [city] = useState('annecy')
  const [filterCat, setFilterCat] = useState(null)
  const [filterType, setFilterType] = useState(null)
  const [tri, setTri] = useState('distance')
  const [selected, setSelected] = useState(null)
  const [showProfile, setShowProfile] = useState(false)
  const [showChangePwd, setShowChangePwd] = useState(false)
  const [profileTab, setProfileTab] = useState('Détails')
  const [showSuggestion, setShowSuggestion] = useState(false)
  const [showCadeaux, setShowCadeaux] = useState(false)
  const [showCGUEtudiant, setShowCGUEtudiant] = useState(false)
  const [search, setSearch] = useState('')
  const [fondPerso, setFondPerso] = useState(() => {
    try { return localStorage.getItem('stu10_fond_etudiant') || null } catch (e) { return null }
  })
  const [showReco, setShowReco] = useState(false)
  const [favIds, setFavIds] = useState(new Set())
  const [showQR, setShowQR] = useState(false)
  const [qrOffre, setQrOffre] = useState(null)
  const [visites, setVisites] = useState([])
  const [vuesEtudiant, setVuesEtudiant] = useState([])
  const [drillKpi, setDrillKpi] = useState(null)
  const { offres, loading } = useOffres(city, userLocation)
  const [showModal, setShowModal] = useState(false)
  const [showMesBons, setShowMesBons] = useState(false)

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      p => setUserLocation({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => { }
    )
    loadFavoris()
    loadVisites()
    loadVuesEtudiant()
  }, [])

  useEffect(() => {
    if (profileTab === 'Mes points') loadVisites()
  }, [profileTab])

  const loadVisites = async () => {
    if (!etudiant) return
    const { data } = await db().from('visites')
      .select('id,offre_id,points,avis,note,photo_url,statut_avis,created_at,montant_remise,montant_normal,offres(titre,prix,promo_pct,type_offre)')
      .eq('etudiant_id', etudiant.id)
      .order('created_at', { ascending: false })
      .limit(50)
    if (data) setVisites(data)
  }

  const loadVuesEtudiant = async () => {
    if (!etudiant?.id) return
    try {
      const { data } = await db().from('vues_offres').select('offre_id').eq('etudiant_id', etudiant.id)
      if (data) setVuesEtudiant(data)
    } catch (e) { }
  }

  const loadFavoris = async () => {
    if (!etudiant) return
    try {
      const { data } = await db().from('favoris').select('offre_id').eq('etudiant_id', etudiant.id)
      if (data) setFavIds(new Set(data.map(f => f.offre_id)))
    } catch (e) { }
  }

  const toggleFavori = async (offre) => {
    if (!etudiant) return
    const isFav = favIds.has(offre.id)
    if (isFav) {
      await db().from('favoris').delete().eq('etudiant_id', etudiant.id).eq('offre_id', offre.id)
      setFavIds(s => { const n = new Set(s); n.delete(offre.id); return n })
    } else {
      await db().from('favoris').insert({ etudiant_id: etudiant.id, offre_id: offre.id })
      setFavIds(s => new Set([...s, offre.id]))
    }
  }

  const filtered = offres.filter(o => {
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

  const offresAffichees = tab === 'favoris' ? offres.filter(o => favIds.has(o.id)) : filtered

  const totalPoints = (() => {
    try {
      const s = localStorage.getItem('stu10_etudiant')
      if (s) { const e = JSON.parse(s); return e.points || 0 }
    } catch (ex) { }
    return etudiant?.points || 0
  })()

  return (
    <div style={{ minHeight: '100vh', background: fondPerso || window.SIOK_PARAMS?.fond_couleur || '#F5F5F5', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{ background: '#FFFFFF', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', padding: '12px 12px 10px', position: 'sticky', top: 0, zIndex: 100 }}>
        {tab === 'offres' && (
          <NavFiltres
            nbOffres={filtered.filter(o => o.active !== false).length}
            tri={tri} setTri={setTri}
            showReco={showReco} setShowReco={setShowReco}
            filterCat={filterCat} setFilterCat={setFilterCat}
            filterType={filterType} setFilterType={setFilterType}
            offres={offres} showPerso={true}
            search={search} setSearch={setSearch}
          />
        )}
      </div>

      {/* Drill KPI Favoris */}
      {drillKpi === 'favoris' && (
        <div style={{ background: '#FFFFFF', borderRadius: 16, margin: '8px 16px 0', padding: 16, border: `1px solid ${CS.border}`, zIndex: 40, position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ color: CS.text, fontWeight: 700, fontSize: 14 }}>❤️ Mes favoris ({favIds.size})</div>
            <button onClick={() => setDrillKpi(null)} style={{ padding: '3px 10px', borderRadius: 8, border: `1px solid ${CS.border}`, background: 'transparent', color: CS.muted, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>✕</button>
          </div>
          {offres.filter(o => favIds.has(o.id)).map(o => {
            const cat = getCategorieForType(o.type_offre)
            return (
              <div key={o.id} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${CS.border}` }}>
                <span style={{ fontSize: 18 }}>{cat?.emoji || '🎯'}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ color: CS.text, fontWeight: 600, fontSize: 13 }}>{o.titre}</div>
                  <div style={{ color: CS.muted, fontSize: 11 }}>{o.prestataire_nom}</div>
                </div>
                <span style={{ color: '#EF4444', fontWeight: 800, fontSize: 13 }}>-{o.promo_pct}%</span>
              </div>
            )
          })}
          {favIds.size === 0 && <div style={{ color: CS.muted, fontSize: 13, textAlign: 'center', padding: '12px 0' }}>Aucun favori — cliquez sur ❤️ dans une offre</div>}
        </div>
      )}

      {/* Drill KPI Points */}
      {drillKpi === 'points' && (
        <div style={{ background: '#FFFFFF', borderRadius: 16, margin: '8px 16px 0', padding: 16, border: `1px solid ${CS.border}`, zIndex: 40, position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ color: CS.text, fontWeight: 700, fontSize: 14 }}>⭐ Mes points ({totalPoints})</div>
            <button onClick={() => setDrillKpi(null)} style={{ padding: '3px 10px', borderRadius: 8, border: `1px solid ${CS.border}`, background: 'transparent', color: CS.muted, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>✕</button>
          </div>
          <div style={{ background: 'rgba(245,158,11,0.08)', borderRadius: 12, padding: '10px 14px', marginBottom: 8 }}>
            <div style={{ color: '#F59E0B', fontWeight: 900, fontSize: 24 }}>{totalPoints} ⭐</div>
            <div style={{ color: CS.muted, fontSize: 12, marginTop: 2 }}>
              +{window.SIOK_PARAMS?.points_qrc || 3} par visite · +{window.SIOK_PARAMS?.points_avis || 2} avis
            </div>
          </div>
          {visites.slice(0, 8).map(v => (
            <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: `1px solid ${CS.border}` }}>
              <div>
                <div style={{ color: CS.text, fontWeight: 600, fontSize: 12 }}>{v.offres?.titre || 'Offre'}</div>
                <div style={{ color: CS.muted, fontSize: 10 }}>{new Date(v.created_at).toLocaleDateString('fr-FR')}</div>
              </div>
              <span style={{ color: '#F59E0B', fontWeight: 700 }}>+{v.points || 0}⭐</span>
            </div>
          ))}
        </div>
      )}

      {/* Contenu */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Carte plein écran */}
        {viewMode === 'map' && (
          <div style={{ position: 'fixed', top: 120, left: 0, right: 0, bottom: 64, zIndex: 1 }}>
            <MapContainer
              offres={offresAffichees} selected={selected}
              onSelect={setSelected} city={city} userLocation={userLocation}
            />
          </div>
        )}

        <div data-ea-list style={{ display: viewMode === 'list' || tab !== 'offres' ? 'flex' : 'none', flexDirection: 'column', flex: 1, overflowY: 'auto', paddingBottom: 20 }}>

          {/* Loading */}
          {loading && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: CS.muted }}>
              <div style={{ width: 32, height: 32, border: '3px solid #E8E8E8', borderTopColor: CS.accent, borderRadius: '50%', margin: '0 auto 12px', animation: 'spin 0.8s linear infinite' }} />
              Chargement…
            </div>
          )}

          {/* Liste offres */}
          {!loading && viewMode === 'list' && (tab === 'offres' || tab === 'favoris') && !drillKpi && (
            <div style={{ padding: '12px 16px 0' }}>

              {/* Recommandations Populaires */}
              {tab === 'offres' && showReco === 'pop' && (
                <TopOffresParCategorie offres={offres} userLocation={userLocation}
                  onSelect={o => { setSelected(o); setShowReco(false) }} />
              )}
              {/* Recommandations Pour toi */}
              {tab === 'offres' && showReco === 'perso' && (
                <RecommandationsPerso offres={offres} etudiant={etudiant} visites={visites} vues={vuesEtudiant} />
              )}

              {/* Compteur */}
              {!showReco && tab === 'offres' && offresAffichees.length > 0 && (
                <div style={{ marginBottom: 12, paddingLeft: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#1A1A2E', background: 'rgba(255,255,255,0.85)', padding: '2px 10px', borderRadius: 20 }}>
                    {offresAffichees.length} offre{offresAffichees.length > 1 ? 's' : ''} disponible{offresAffichees.length > 1 ? 's' : ''}
                  </span>
                </div>
              )}

              {/* Vide */}
              {!showReco && offresAffichees.length === 0 && (
                <div style={{ textAlign: 'center', padding: '48px 20px', color: CS.muted }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>{tab === 'favoris' ? '❤️' : '🎯'}</div>
                  <div style={{ color: CS.text, fontWeight: 700, fontSize: 15, marginBottom: 6 }}>
                    {tab === 'favoris' ? 'Aucun favori' : 'Aucune offre disponible'}
                  </div>
                  <div style={{ fontSize: 13 }}>{tab === 'favoris' ? 'Sauvegardez des offres depuis la liste' : 'Essayez une autre ville'}</div>
                </div>
              )}

              {/* Grille 2 colonnes */}
              {!showReco && offresAffichees.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, paddingBottom: 8 }}>
                  {offresAffichees.map(o => (
                    <OffreTile
                      key={o.id}
                      o={o}
                      isFav={favIds.has(o.id)}
                      etudiantId={etudiant?.id}
                      onSelect={o => { setSelected(o); trackVue(o.id, etudiant?.id || null) }}
                      onToggleFavori={toggleFavori}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Onglet Visites */}
          {tab === 'visites' && (
            <div style={{ padding: '0 16px' }}>
              <div style={{ background: CS.accentSoft, borderRadius: 12, padding: '12px 16px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ color: CS.text, fontWeight: 800, fontSize: 16 }}>⭐ {totalPoints} points</div>
                  <div style={{ color: CS.muted, fontSize: 12, marginTop: 2 }}>
                    {visites.length} visite{visites.length > 1 ? 's' : ''} enregistrée{visites.length > 1 ? 's' : ''}
                  </div>
                </div>
                <div style={{ fontSize: 32 }}>🏆</div>
              </div>
              {visites.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px 0', color: CS.muted }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
                  <div style={{ color: CS.text, fontWeight: 700, marginBottom: 6 }}>Aucune visite</div>
                  <div style={{ fontSize: 13 }}>Scannez un QR chez un prestataire</div>
                </div>
              )}
              {visites.map(v => {
                const type = getTypeMetier(v.offres?.type_offre || 'autre')
                return (
                  <VisiteCard key={v.id} visite={v} type={type} etudiantId={etudiant?.id}
                    onUpdated={updated => setVisites(vs => vs.map(x => x.id === v.id ? { ...x, ...updated } : x))}
                  />
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal détail offre */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 2850, background: '#F5F5F5', overflowY: 'auto', display: 'flex', flexDirection: 'column', paddingBottom: 64 }}>
          <OffreDetail
            offre={selected} etudiant={etudiant}
            isFavori={favIds.has(selected.id)}
            onToggleFavori={() => toggleFavori(selected)}
            onClose={() => setSelected(null)}
            onQR={() => { setQrOffre(selected); setShowQR(true) }}
          />
        </div>
      )}

      {/* QR Generator */}
      {showQR && qrOffre && (
        <QRGenerator offre={qrOffre} etudiant={etudiant} onClose={() => { setShowQR(false); setQrOffre(null) }} />
      )}

      {/* Modal cadeaux */}
      {showCadeaux && (
        <ModalCadeaux etudiant={etudiant} totalPoints={totalPoints}
          onClose={() => setShowCadeaux(false)}
          onPointsDeduits={() => loadVisites()} />
      )}
      {/* Mes bons cadeaux */}
      {showMesBons && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 3200, background: '#F5F5F5', overflowY: 'auto', paddingBottom: 80 }}>
          <div style={{ background: '#FFFFFF', padding: '52px 16px 16px', borderBottom: '1px solid #E5E7EB', position: 'sticky', top: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button onClick={() => setShowMesBons(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#374151' }}>←</button>
              <div style={{ color: '#1A1A2E', fontWeight: 800, fontSize: 16 }}>🎟️ Mes bons cadeaux</div>
            </div>
          </div>
          <BonsCadeauxEtudiant etudiantId={etudiant?.id} />
        </div>
      )}

      {/* Changement mot de passe */}
      {showChangePwd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 5000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: '#FFFFFF', borderRadius: 20, padding: 24, width: '100%', maxWidth: 400 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontWeight: 800, fontSize: 16, color: '#1A1A2E' }}>🔒 Changer mon mot de passe</div>
              <button onClick={() => setShowChangePwd(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#9CA3AF' }}>✕</button>
            </div>
            <ChangePassword onClose={() => setShowChangePwd(false)} />
          </div>
        </div>
      )}

      {/* FAB Remonter */}
      <button onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); const el = document.querySelector('[data-ea-list]'); if (el) el.scrollTop = 0 }}
        style={{ position: 'fixed', bottom: 132, right: 16, width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.97)', border: '2px solid #D1D5DB', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 150, boxShadow: '0 3px 10px rgba(0,0,0,0.15)' }}>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M10 16V4M10 4L5 9M10 4L15 9" stroke="#374151" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* FAB Idée */}
      {viewMode === 'list' && tab === 'offres' && (
        <button onClick={() => setShowSuggestion(true)}
          style={{ position: 'fixed', bottom: 76, right: 16, width: 48, height: 48, borderRadius: '50%', background: '#0066FF', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 150, boxShadow: '0 4px 16px rgba(0,102,255,0.4)' }}>
          <svg width="24" height="24" viewBox="0 -960 960 960" fill="white">
            <path d="M480-80q-33 0-56.5-23.5T400-160h160q0 33-23.5 56.5T480-80ZM320-200v-80h320v80H320Zm10-120q-69-41-109.5-110T180-580q0-125 87.5-212.5T480-880q125 0 212.5 87.5T780-580q0 78-40.5 147T630-320H330Z" />
          </svg>
        </button>
      )}

      {/* Suggestion */}
      {showSuggestion && <ModalSuggestion nom={etudiant?.prenom} type="etudiant" onClose={() => setShowSuggestion(false)} />}

      {/* Profil fullscreen */}
      {showProfile && (
        <div style={{ position: 'fixed', inset: 0, background: '#F5F5F5', zIndex: 2900, display: 'flex', flexDirection: 'column', paddingBottom: 64 }}>
          <div style={{ background: '#FFFFFF', padding: '16px 16px 0', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontWeight: 900, fontSize: 18, color: '#1A1A2E' }}>Mon compte</div>
              <button onClick={() => setShowProfile(false)} style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', background: '#F0F0F0', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>
            <div style={{ display: 'flex', gap: 0, overflowX: 'auto', borderBottom: '2px solid #F0F0F0' }}>
              {['Détails', 'Favoris', 'Historique', 'Mes points', '🎁 Cadeaux'].map(t => (
                <button key={t} onClick={() => setProfileTab(t)} style={{ padding: '8px 16px', border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: profileTab === t ? 800 : 500, color: profileTab === t ? '#0066FF' : '#9CA3AF', borderBottom: profileTab === t ? '3px solid #0066FF' : '3px solid transparent', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
            {profileTab === 'Détails' && (
              <div style={{ background: '#FFFFFF', borderRadius: 16, padding: 16 }}>
                <EditProfilEtudiant etudiant={etudiant} fondPerso={fondPerso} setFondPerso={setFondPerso}
                  onSave={async data => {
                    const { error } = await db().from('etudiants').update(data).eq('id', etudiant.id)
                    if (!error) {
                      try {
                        const s = localStorage.getItem('stu10_etudiant')
                        if (s) { const e = JSON.parse(s); Object.assign(e, data); localStorage.setItem('stu10_etudiant', JSON.stringify(e)) }
                      } catch (ex) { }
                    }
                    return !error
                  }}
                />
                <button onClick={() => { setShowProfile(false); setShowChangePwd(true) }}
                  style={{ width: '100%', marginTop: 12, padding: '12px', borderRadius: 12, border: '1.5px solid #E0E0E0', background: 'transparent', color: '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                  🔒 Changer mon mot de passe
                </button>
                <button onClick={() => setShowCGUEtudiant(true)}
                  style={{ width: '100%', marginTop: 8, padding: '10px', borderRadius: 12, border: '1px solid #E5E7EB', background: 'transparent', color: '#9CA3AF', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                  📋 Conditions Générales d'Utilisation
                </button>
                {showCGUEtudiant && <ModalCGU onClose={() => setShowCGUEtudiant(false)} defaultTab="etudiant" hidePresta />}
                <button onClick={() => { setShowProfile(false); onLogout() }}
                  style={{ width: '100%', marginTop: 8, padding: '12px', borderRadius: 12, border: 'none', background: 'rgba(239,68,68,0.08)', color: '#EF4444', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Déconnexion
                </button>
              </div>
            )}

            {profileTab === 'Favoris' && (
              <div>
                {favIds.size === 0
                  ? <div style={{ textAlign: 'center', padding: '40px 0', color: '#9CA3AF' }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>🤍</div>
                    <div style={{ fontWeight: 700, color: '#1A1A2E', marginBottom: 6 }}>Aucun favori</div>
                    <div style={{ fontSize: 13 }}>Appuyez sur 🤍 sur une offre</div>
                  </div>
                  : offres.filter(o => favIds.has(o.id)).map(o => {
                    const type = getTypeMetier(o.type_offre)
                    return (
                      <div key={o.id} onClick={() => { setSelected(o); setShowProfile(false) }}
                        style={{ background: '#FFFFFF', borderRadius: 16, marginBottom: 12, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', cursor: 'pointer' }}>
                        <PhotoCarousel photos={o.photos} height={140} emoji={type.emoji} gradient={bannerGradient(o.type_offre)} />
                        <div style={{ padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ color: '#1A1A2E', fontWeight: 700, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.titre}</div>
                            <div style={{ color: '#9CA3AF', fontSize: 12 }}>{o.prestataire_nom}</div>
                          </div>
                          <div style={{ background: '#EF4444', color: 'white', fontWeight: 900, fontSize: 14, padding: '4px 12px', borderRadius: 20, flexShrink: 0 }}>-{o.promo_pct}%</div>
                        </div>
                      </div>
                    )
                  })
                }
              </div>
            )}

            {profileTab === 'Historique' && (
              <div>
                {visites.length === 0
                  ? <div style={{ textAlign: 'center', padding: '40px 0', color: '#9CA3AF' }}>Aucune visite enregistrée</div>
                  : visites.map(v => {
                    const type = getTypeMetier(v.offres?.type_offre || 'autre')
                    return (
                      <VisiteCard key={v.id} visite={v} type={type} etudiantId={etudiant?.id}
                        onUpdated={updated => setVisites(vs => vs.map(x => x.id === v.id ? { ...x, ...updated } : x))}
                      />
                    )
                  })
                }
              </div>
            )}

            {profileTab === '🎁 Cadeaux' && (
              <MesCadeaux etudiant={etudiant} totalPoints={totalPoints} onPointsUpdate={() => { }} />
            )}

            {profileTab === 'Mes points' && (
              <div>
                <div style={{ background: 'linear-gradient(135deg,#F59E0B,#FBBF24)', borderRadius: 16, padding: '20px', marginBottom: 16, textAlign: 'center' }}>
                  <div style={{ color: 'white', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Total accumulé</div>
                  <div style={{ color: 'white', fontWeight: 900, fontSize: 48, lineHeight: 1 }}>{totalPoints}</div>
                  <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 4 }}>points ⭐</div>
                </div>
                <button onClick={() => setShowMesBons(true)}
                  style={{ width: '100%', marginBottom: 8, padding: '12px', borderRadius: 12, border: '1.5px solid #F59E0B', background: 'white', color: '#F59E0B', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                  🎟️ Mes bons cadeaux
                </button>
                {totalPoints >= 250 && (
                  <button onClick={() => { setShowProfile(false); setShowCadeaux(true) }}
                    style={{ width: '100%', marginBottom: 12, padding: '12px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#F59E0B,#FBBF24)', color: 'white', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
                    🎁 Réclamer un bon cadeau
                  </button>
                )}
                <button onClick={loadVisites} style={{ width: '100%', marginBottom: 12, padding: '8px', borderRadius: 10, border: '1px solid #E5E7EB', background: '#F8F8F8', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, color: '#6B7280' }}>
                  🔄 Actualiser
                </button>
                {visites.map(v => (
                  <div key={v.id} style={{ background: '#FFFFFF', borderRadius: 10, padding: '10px 14px', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                    <div>
                      <div style={{ color: '#1A1A2E', fontSize: 13, fontWeight: 600 }}>{v.offres?.titre || 'Offre'}</div>
                      <div style={{ color: '#9CA3AF', fontSize: 11 }}>{new Date(v.created_at).toLocaleDateString('fr-FR')}</div>
                    </div>
                    <div style={{ color: '#F59E0B', fontWeight: 900, fontSize: 16 }}>+{v.points || 0} ⭐</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bottom bar */}
      <div className="siok-bottom-bar" style={{ zIndex: 3100 }}>
        <button className="siok-bottom-btn" onClick={() => { setViewMode(viewMode === 'list' ? 'map' : 'list'); setTab('offres'); setShowProfile(false) }}>
          {viewMode === 'list' ? <IcoListe active={true} /> : <IcoCarte active={true} />}
          <span style={{ color: '#0066FF' }}>{viewMode === 'list' ? 'Liste' : 'Carte'}</span>
        </button>
        <button className="siok-bottom-btn" style={{ flex: 1.2 }} onClick={() => setShowModal(true)}>
          <SIOKLogo size="sm" />
          <span style={{ fontSize: 9, color: '#9CA3AF', marginTop: 1 }}>StuD</span>
        </button>
        <button className="siok-bottom-btn" onClick={() => { setShowProfile(!showProfile); setProfileTab('Détails') }}>
          <IcoProfil active={true} />
          <span style={{ color: '#0066FF', fontSize: 10, fontWeight: 700, maxWidth: 60, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {etudiant?.prenom || 'Compte'}
          </span>
        </button>
      </div>
      {showModal && (
        <ModalPointsCadeaux
          onClose={() => setShowModal(false)}
          onConnecte={() => setShowModal(false)}
        />
      )}
    </div>
  )
}