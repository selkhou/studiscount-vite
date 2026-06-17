import { useState, useEffect, useRef } from 'react'
import { CS } from '../../constants.js'
import { db } from '../../lib/supabase.js'
import {
  isOffreVisible, distanceM, bannerGradient, bannerColorSiok,
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

// ── Tracker de vues ────────────────────────────────
const _vuesSeen = new Set()
async function trackVue(offreId, etudiantId) {
  const key = `${offreId}_${etudiantId || 'anon'}`
  if (_vuesSeen.has(key)) return
  _vuesSeen.add(key)
  try {
    await db().from('vues_offres').insert({ offre_id: offreId, etudiant_id: etudiantId || null })
  } catch (e) {}
}

// ── Hook offres ────────────────────────────────────
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
  const [showCGU, setShowCGU] = useState(false)
  const [search, setSearch] = useState('')
  const [fondPerso, setFondPerso] = useState(() => {
    try { return localStorage.getItem('stu10_fond_etudiant') || null } catch (e) { return null }
  })
  const [showReco, setShowReco] = useState(false)
  const [favIds, setFavIds] = useState(new Set())
  const [showQR, setShowQR] = useState(false)
  const [qrOffre, setQrOffre] = useState(null)
  const [visites, setVisites] = useState([])
  const { offres, loading } = useOffres(city, userLocation)

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      p => setUserLocation({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => {}
    )
    loadFavoris()
    loadVisites()
  }, [])

  useEffect(() => {
    if (profileTab === 'Mes points') loadVisites()
  }, [profileTab])

  const loadVisites = async () => {
    if (!etudiant) return
    const { data } = await db().from('visites')
      .select('id,offre_id,points,avis,note,photo_url,statut_avis,created_at,montant_remise,montant_normal,prestataires(nom),offres(titre,prix_normal,promo_pct,type_offre)')
      .eq('etudiant_id', etudiant.id)
      .order('created_at', { ascending: false })
      .limit(50)
    if (data) setVisites(data)
  }

  const loadFavoris = async () => {
    if (!etudiant) return
    try {
      const { data } = await db().from('favoris').select('offre_id').eq('etudiant_id', etudiant.id)
      if (data) setFavIds(new Set(data.map(f => f.offre_id)))
    } catch (e) {}
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
    } catch (ex) {}
    return etudiant?.points || 0
  })()

  return (
    <div style={{
      minHeight: '100vh',
      background: fondPerso || window.SIOK_PARAMS?.fond_couleur || '#F5F5F5',
      display: 'flex', flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{
        background: '#FFFFFF', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        padding: '12px 12px 10px', position: 'sticky', top: 0, zIndex: 100
      }}>
        {tab === 'offres' && (
          <NavFiltres
            nbOffres={filtered.length}
            tri={tri} setTri={setTri}
            showReco={showReco} setShowReco={setShowReco}
            filterCat={filterCat} setFilterCat={setFilterCat}
            filterType={filterType} setFilterType={setFilterType}
            offres={offres} showPerso={true}
            search={search} setSearch={setSearch}
          />
        )}
      </div>

      {/* Contenu */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Carte */}
        {viewMode === 'map' && (
          <div style={{ position: 'fixed', top: 120, left: 0, right: 0, bottom: 80, zIndex: 1 }}>
            <MapContainer
              offres={offresAffichees} selected={selected}
              onSelect={setSelected} city={city} userLocation={userLocation}
            />
          </div>
        )}

        {/* Liste */}
        <div style={{
          display: viewMode === 'list' || tab !== 'offres' ? 'flex' : 'none',
          flexDirection: 'column', flex: 1, overflowY: 'auto', paddingBottom: 80
        }}>
          {loading && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: CS.muted }}>
              <div style={{
                width: 32, height: 32, border: '3px solid #E8E8E8',
                borderTopColor: CS.accent, borderRadius: '50%',
                margin: '0 auto 12px', animation: 'spin 0.8s linear infinite'
              }} />
              Chargement…
            </div>
          )}

          {/* Liste offres */}
          {!loading && viewMode === 'list' && (tab === 'offres' || tab === 'favoris') && (
            <div style={{ padding: '12px 16px 0' }}>
              {offresAffichees.length === 0 && (
                <div style={{ textAlign: 'center', padding: '48px 20px', color: CS.muted }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>{tab === 'favoris' ? '❤️' : '🎯'}</div>
                  <div style={{ color: CS.text, fontWeight: 700, fontSize: 15, marginBottom: 6 }}>
                    {tab === 'favoris' ? 'Aucun favori' : 'Aucune offre disponible'}
                  </div>
                  <div style={{ fontSize: 13 }}>
                    {tab === 'favoris' ? 'Sauvegardez des offres depuis la liste' : 'Essayez une autre ville'}
                  </div>
                </div>
              )}
              {offresAffichees.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, paddingBottom: 8 }}>
                  {offresAffichees.map(o => {
                    const type = getTypeMetier(o.type_offre)
                    const isFav = favIds.has(o.id)
                    return (
                      <div key={o.id}
                        onClick={() => { setSelected(o); trackVue(o.id, etudiant?.id || null) }}
                        style={{
                          background: '#FFFFFF', borderRadius: 16, overflow: 'hidden',
                          cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
                          display: 'flex', flexDirection: 'column'
                        }}>
                        <div style={{ position: 'relative', flexShrink: 0 }}>
                          <PhotoCarousel photos={o.photos} height={120} emoji={type.emoji} gradient={bannerGradient(o.type_offre)} />
                          <div style={{
                            position: 'absolute', top: 8, right: 8,
                            background: '#EF4444', color: 'white',
                            fontSize: 12, fontWeight: 900, padding: '3px 10px', borderRadius: 50, zIndex: 3
                          }}>
                            -{o.promo_pct}%
                          </div>
                          <button onClick={e => { e.stopPropagation(); toggleFavori(o) }}
                            style={{
                              position: 'absolute', top: 8, left: 8,
                              width: 28, height: 28, borderRadius: '50%',
                              background: 'rgba(255,255,255,0.9)',
                              border: '1.5px solid rgba(0,0,0,0.25)',
                              cursor: 'pointer', display: 'flex',
                              alignItems: 'center', justifyContent: 'center',
                              fontSize: 13, zIndex: 3
                            }}>
                            {isFav ? '❤️' : '🤍'}
                          </button>
                        </div>
                        <div style={{ padding: '8px 10px 10px', flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
                          <div style={{ color: CS.text, fontWeight: 800, fontSize: 13, lineHeight: 1.3 }}>{o.titre}</div>
                          <div style={{ color: CS.muted, fontSize: 11 }}>{o.prestataire_nom}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2, flexWrap: 'wrap' }}>
                            {o.prix_normal && <span style={{ color: '#22C55E', fontWeight: 900, fontSize: 14 }}>
                              {(o.prix_normal * (1 - (o.promo_pct || 0) / 100)).toFixed(2)}€
                            </span>}
                            {o.prix_normal && <span style={{ color: '#C0C0C0', fontSize: 11, textDecoration: 'line-through' }}>
                              {parseFloat(o.prix_normal).toFixed(2)}€
                            </span>}
                          </div>
                          {o.note_moyenne > 0 && (
                            <div style={{ color: '#F59E0B', fontSize: 11, fontWeight: 700 }}>
                              ★ {parseFloat(o.note_moyenne).toFixed(1)}
                              <span style={{ color: '#9CA3AF', fontWeight: 400, fontSize: 10 }}> ({o.nb_avis || 0})</span>
                            </div>
                          )}
                          {o.date_fin && (
                            <div style={{ color: '#EF4444', fontSize: 10, fontWeight: 700 }}>⏰ {fmtDate(o.date_fin)}</div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Onglet Visites */}
          {tab === 'visites' && (
            <div style={{ padding: '0 16px' }}>
              <div style={{
                background: CS.accentSoft, borderRadius: 12, padding: '12px 16px',
                marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
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
        <div style={{
          position: 'fixed', inset: 0, zIndex: 2850,
          background: '#F5F5F5', overflowY: 'auto',
          display: 'flex', flexDirection: 'column', paddingBottom: 64
        }}>
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
        <QRGenerator
          offre={qrOffre} etudiant={etudiant}
          onClose={() => { setShowQR(false); setQrOffre(null) }}
        />
      )}

      {/* Modal cadeaux */}
      {showCadeaux && (
        <ModalCadeaux
          etudiant={etudiant} totalPoints={totalPoints}
          onClose={() => setShowCadeaux(false)}
          onPointsDeduits={() => loadVisites()}
        />
      )}

      {/* Modal changement mdp */}
      {showChangePwd && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          zIndex: 5000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24
        }}>
          <div style={{ background: '#FFFFFF', borderRadius: 20, padding: 24, width: '100%', maxWidth: 400 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontWeight: 800, fontSize: 16, color: '#1A1A2E' }}>🔒 Changer mon mot de passe</div>
              <button onClick={() => setShowChangePwd(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#9CA3AF' }}>✕</button>
            </div>
            <ChangePassword onClose={() => setShowChangePwd(false)} />
          </div>
        </div>
      )}

      {/* Suggestion */}
      {showSuggestion && (
        <ModalSuggestion nom={etudiant?.prenom} type="etudiant" onClose={() => setShowSuggestion(false)} />
      )}

      {/* Profil fullscreen */}
      {showProfile && (
        <div style={{
          position: 'fixed', inset: 0, background: '#F5F5F5',
          zIndex: 2900, display: 'flex', flexDirection: 'column', paddingBottom: 64
        }}>
          <div style={{ background: '#FFFFFF', padding: '16px 16px 0', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontWeight: 900, fontSize: 18, color: '#1A1A2E' }}>Mon compte</div>
              <button onClick={() => setShowProfile(false)} style={{
                width: 32, height: 32, borderRadius: '50%', border: 'none',
                background: '#F0F0F0', cursor: 'pointer', fontSize: 16,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>✕</button>
            </div>
            <div style={{ display: 'flex', gap: 0, overflowX: 'auto', borderBottom: '2px solid #F0F0F0' }}>
              {['Détails', 'Favoris', 'Historique', 'Mes points', '🎁 Cadeaux'].map(t => (
                <button key={t} onClick={() => setProfileTab(t)} style={{
                  padding: '8px 16px', border: 'none', background: 'transparent',
                  cursor: 'pointer', fontFamily: 'inherit', fontSize: 13,
                  fontWeight: profileTab === t ? 800 : 500,
                  color: profileTab === t ? '#0066FF' : '#9CA3AF',
                  borderBottom: profileTab === t ? '3px solid #0066FF' : '3px solid transparent',
                  whiteSpace: 'nowrap', flexShrink: 0
                }}>{t}</button>
              ))}
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
            {profileTab === 'Détails' && (
              <div style={{ background: '#FFFFFF', borderRadius: 16, padding: 16 }}>
                <EditProfilEtudiant
                  etudiant={etudiant} fondPerso={fondPerso} setFondPerso={setFondPerso}
                  onSave={async data => {
                    const { error } = await db().from('etudiants').update(data).eq('id', etudiant.id)
                    if (!error) {
                      try {
                        const s = localStorage.getItem('stu10_etudiant')
                        if (s) { const e = JSON.parse(s); Object.assign(e, data); localStorage.setItem('stu10_etudiant', JSON.stringify(e)) }
                      } catch (ex) {}
                    }
                    return !error
                  }}
                />
                <button onClick={() => { setShowProfile(false); setShowChangePwd(true) }}
                  style={{
                    width: '100%', marginTop: 12, padding: '12px', borderRadius: 12,
                    border: '1.5px solid #E0E0E0', background: 'transparent',
                    color: '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit'
                  }}>
                  🔒 Changer mon mot de passe
                </button>
                <button onClick={() => setShowCGU(true)}
                  style={{
                    width: '100%', marginTop: 8, padding: '10px', borderRadius: 12,
                    border: '1px solid #E5E7EB', background: 'transparent',
                    color: '#9CA3AF', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit'
                  }}>
                  📋 Conditions Générales d'Utilisation
                </button>
                {showCGU && <ModalCGU onClose={() => setShowCGU(false)} defaultTab="etudiant" hidePresta />}
                <button onClick={() => { setShowProfile(false); onLogout() }}
                  style={{
                    width: '100%', marginTop: 8, padding: '12px', borderRadius: 12,
                    border: 'none', background: 'rgba(239,68,68,0.08)',
                    color: '#EF4444', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit'
                  }}>
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
                        style={{
                          background: '#FFFFFF', borderRadius: 16, marginBottom: 12,
                          overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', cursor: 'pointer'
                        }}>
                        <PhotoCarousel photos={o.photos} height={140} emoji={type.emoji} gradient={bannerGradient(o.type_offre)} />
                        <div style={{ padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ color: '#1A1A2E', fontWeight: 700, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.titre}</div>
                            <div style={{ color: '#9CA3AF', fontSize: 12 }}>{o.prestataire_nom}</div>
                          </div>
                          <div style={{ background: '#EF4444', color: 'white', fontWeight: 900, fontSize: 14, padding: '4px 12px', borderRadius: 20, flexShrink: 0 }}>
                            -{o.promo_pct}%
                          </div>
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

            {profileTab === 'Mes points' && (
              <div>
                <div style={{
                  background: 'linear-gradient(135deg,#F59E0B,#FBBF24)',
                  borderRadius: 16, padding: '20px', marginBottom: 16, textAlign: 'center'
                }}>
                  <div style={{ color: 'white', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Total accumulé</div>
                  <div style={{ color: 'white', fontWeight: 900, fontSize: 48, lineHeight: 1 }}>{totalPoints}</div>
                  <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 4 }}>points ⭐</div>
                </div>
                {totalPoints >= 250 && (
                  <button onClick={() => { setShowProfile(false); setShowCadeaux(true) }}
                    style={{
                      width: '100%', marginBottom: 12, padding: '12px', borderRadius: 12, border: 'none',
                      background: 'linear-gradient(135deg,#F59E0B,#FBBF24)',
                      color: 'white', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit'
                    }}>
                    🎁 Réclamer un bon cadeau
                  </button>
                )}
                <button onClick={loadVisites} style={{
                  width: '100%', marginBottom: 12, padding: '8px', borderRadius: 10,
                  border: '1px solid #E5E7EB', background: '#F8F8F8',
                  cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, color: '#6B7280'
                }}>
                  🔄 Actualiser
                </button>
                {visites.map(v => (
                  <div key={v.id} style={{
                    background: '#FFFFFF', borderRadius: 10, padding: '10px 14px',
                    marginBottom: 8, display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
                  }}>
                    <div>
                      <div style={{ color: '#1A1A2E', fontSize: 13, fontWeight: 600 }}>{v.offres?.titre || 'Offre'}</div>
                      <div style={{ color: '#9CA3AF', fontSize: 11 }}>{new Date(v.created_at).toLocaleDateString('fr-FR')}</div>
                    </div>
                    <div style={{ color: '#F59E0B', fontWeight: 900, fontSize: 16 }}>+{v.points || 0} ⭐</div>
                  </div>
                ))}
              </div>
            )}

            {profileTab === '🎁 Cadeaux' && (
              <MesCadeaux etudiant={etudiant} totalPoints={totalPoints} onPointsUpdate={() => {}} />
            )}
          </div>
        </div>
      )}

      {/* FAB Suggestion */}
      {viewMode === 'list' && tab === 'offres' && (
        <button onClick={() => setShowSuggestion(true)} style={{
          position: 'fixed', bottom: 76, right: 16,
          width: 48, height: 48, borderRadius: '50%',
          background: '#0066FF', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 150, boxShadow: '0 4px 16px rgba(0,102,255,0.4)',
          fontSize: 24
        }}>💡</button>
      )}

      {/* Bottom bar */}
      <div className="siok-bottom-bar" style={{ zIndex: 3100 }}>
        <button className="siok-bottom-btn" onClick={() => { setViewMode(viewMode === 'list' ? 'map' : 'list'); setTab('offres'); setShowProfile(false) }}>
          <span style={{ fontSize: 24 }}>{viewMode === 'list' ? '🗺' : '☰'}</span>
          <span style={{ color: '#0066FF', fontSize: 10, fontWeight: 700 }}>{viewMode === 'list' ? 'Carte' : 'Liste'}</span>
        </button>
        <button className="siok-bottom-btn" onClick={() => { setTab('visites'); setShowProfile(false) }} style={{ flex: 1 }}>
          <span style={{ fontSize: 24 }}>🏷</span>
          <span style={{ color: tab === 'visites' ? '#0066FF' : '#C0C0C0', fontSize: 10, fontWeight: 700 }}>Mes visites</span>
        </button>
        <button className="siok-bottom-btn" onClick={() => setShowCadeaux(true)} style={{ flex: 1.2 }}>
          <SIOKLogo size="sm" />
          <span style={{ fontSize: 9, color: '#9CA3AF', marginTop: 1 }}>StuD</span>
        </button>
        <button className="siok-bottom-btn" onClick={() => { setShowProfile(!showProfile); setProfileTab('Détails') }}>
          <span style={{ fontSize: 24 }}>👤</span>
          <span style={{ color: '#0066FF', fontSize: 10, fontWeight: 700, maxWidth: 60, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {etudiant?.prenom || 'Compte'}
          </span>
        </button>
      </div>
    </div>
  )
}