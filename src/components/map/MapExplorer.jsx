import { useState, useEffect, useRef } from 'react'
import { CS, CITIES } from '../../constants.js'
import { db } from '../../lib/supabase.js'
import { isOffreVisible, distanceM, bannerGradient } from '../../utils.js'
import SIOKLogo from '../ui/SIOKLogo.jsx'
import MapContainer from './MapContainer.jsx'

function useOffres(city, userLocation) {
  const [offres, setOffres] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetch() {
      setLoading(true)
      try {
        const cityData = CITIES.find(c => c.id === city) || CITIES[0]
        const { data } = await db()
          .from('offres')
          .select('*, prestataires(id, nom, type_metier, statut, lat, lng, ville)')
          .eq('active', true)

        // Filtre ville côté JS
        const filtrees = (data || []).filter(o =>
          o.prestataires?.ville?.toLowerCase() === cityData.name.toLowerCase()
        )
        const visibles = filtrees.filter(isOffreVisible)
        const enrichies = visibles.map(o => ({
          ...o,
          lat: o.prestataires?.lat,
          lng: o.prestataires?.lng,
        }))
        if (userLocation) {
          enrichies.sort((a, b) =>
            distanceM(userLocation.lat, userLocation.lng, a.lat, a.lng) -
            distanceM(userLocation.lat, userLocation.lng, b.lat, b.lng)
          )
        }
        setOffres(enrichies)
      } catch (e) {
        console.warn('Erreur chargement offres:', e.message)
      }
      setLoading(false)
    }
    fetch()
  }, [city, userLocation])

  return { offres, loading }
}
  
export default function MapExplorer({ onConnecte, onPrestataire }) {
  const [city, setCity] = useState('annecy')
  const [viewMode, setViewMode] = useState('list')
  const [selected, setSelected] = useState(null)
  const [userLocation, setUserLocation] = useState(null)
  const [showCityPicker, setShowCityPicker] = useState(false)
  const { offres, loading } = useOffres(city, userLocation)
  const selectedRef = useRef(null)

  const cityData = CITIES.find(c => c.id === city) || CITIES[0]

  function geolocate() {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      pos => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {}
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: window.SIOK_PARAMS?.fond_couleur || '#F5F5F5',
      display: 'flex', flexDirection: 'column',
      isolation: 'isolate'
    }}>

      {/* Header */}
      <div style={{
        background: 'rgba(255,255,255,0.97)',
        backdropFilter: 'blur(20px)',
        padding: '52px 16px 12px',
        position: 'sticky', top: 0, zIndex: 200,
        borderBottom: '1px solid rgba(0,0,0,0.06)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <SIOKLogo size="sm" />

          {/* Sélecteur ville */}
          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowCityPicker(v => !v)} style={{
              display: 'flex', alignItems: 'center', gap: 4,
              background: CS.accentSoft, border: 'none',
              borderRadius: 20, padding: '6px 12px',
              color: CS.accent, fontSize: 13, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit'
            }}>
              📍 {cityData.name} <span style={{ fontSize: 9 }}>▾</span>
            </button>
            {showCityPicker && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 6px)', right: 0,
                background: 'white', borderRadius: 14,
                boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                border: '1px solid rgba(0,0,0,0.06)',
                zIndex: 999, minWidth: 160, overflow: 'hidden'
              }}>
                {CITIES.map(c => (
                  <button key={c.id} onClick={() => { setCity(c.id); setShowCityPicker(false) }}
                    style={{
                      width: '100%', padding: '11px 16px',
                      background: c.id === city ? CS.accentSoft : 'white',
                      border: 'none', borderBottom: '1px solid #F0F0F0',
                      color: c.id === city ? CS.accent : CS.text,
                      fontSize: 13, fontWeight: c.id === city ? 700 : 400,
                      cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left'
                    }}>
                    {c.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Bouton connexion */}
          <button onClick={onConnecte} style={{
            background: CS.accent, color: 'white', border: 'none',
            borderRadius: 20, padding: '7px 14px',
            fontSize: 12, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'inherit'
          }}>
            Connexion
          </button>
        </div>

        {/* Toggle liste / carte */}
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
          {['list', 'map'].map(mode => (
            <button key={mode} onClick={() => setViewMode(mode)} style={{
              padding: '6px 18px', borderRadius: 20, border: 'none',
              background: viewMode === mode ? CS.accent : '#F0F0F0',
              color: viewMode === mode ? 'white' : CS.muted,
              fontSize: 12, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit'
            }}>
              {mode === 'list' ? '☰ Liste' : '🗺 Carte'}
            </button>
          ))}
          <button onClick={geolocate} style={{
            padding: '6px 12px', borderRadius: 20,
            border: '1px solid #E0E0E0', background: 'white',
            fontSize: 12, cursor: 'pointer'
          }}>📍</button>
        </div>
      </div>

{/* Vue carte */}
      {viewMode === 'map' && (
        <div style={{ flex: 1, height: 'calc(100vh - 120px)', minHeight: 400 }}>
          <MapContainer
            offres={offres}
            selected={selected}
            onSelect={setSelected}
            city={city}
            userLocation={userLocation}
          />
        </div>
      )}


      {/* Vue liste */}
      {viewMode === 'list' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px 100px' }}>
          {loading && (
            <div style={{ textAlign: 'center', padding: 40, color: CS.muted }}>
              Chargement...
            </div>
          )}
          {!loading && offres.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: CS.muted }}>
              Aucune offre disponible à {cityData.name}
            </div>
          )}
          {offres.map(o => (
            <div key={o.id}
              ref={selected?.id === o.id ? selectedRef : null}
              onClick={() => setSelected(o)}
              className="siok-card"
              style={{
                background: 'white', borderRadius: 16,
                marginBottom: 12, overflow: 'hidden',
                boxShadow: selected?.id === o.id
                  ? '0 0 0 2px #0066FF, 0 4px 16px rgba(0,102,255,0.15)'
                  : '0 2px 8px rgba(0,0,0,0.07)',
                cursor: 'pointer'
              }}>

              {/* Banner */}
              <div style={{
                height: 80,
                background: bannerGradient(o.prestataires?.type_metier),
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 36
              }}>
                {o.image_emoji || '🎯'}
              </div>

              {/* Infos */}
              <div style={{ padding: '10px 14px 12px' }}>
                <div style={{ fontWeight: 800, fontSize: 15, color: CS.text, marginBottom: 2 }}>
                  {o.titre}
                </div>
                <div style={{ fontSize: 12, color: CS.muted }}>
                  {o.prestataires?.nom}
                </div>
                {o.promo_pct && (
                  <div style={{
                    display: 'inline-block', marginTop: 6,
                    background: 'rgba(0,102,255,0.08)',
                    color: CS.accent, fontSize: 12, fontWeight: 700,
                    padding: '2px 8px', borderRadius: 20
                  }}>
                    -{o.promo_pct}%
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bottom bar */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'rgba(255,255,255,0.98)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(0,0,0,0.06)',
        padding: '12px 20px 24px',
        display: 'flex', gap: 10, zIndex: 300
      }}>
        <button onClick={onConnecte} style={{
          flex: 1, padding: '14px 0', borderRadius: 14,
          background: CS.accent, color: 'white',
          border: 'none', fontSize: 14, fontWeight: 700,
          cursor: 'pointer', fontFamily: 'inherit'
        }}>
          🎓 Espace étudiant
        </button>
        <button onClick={onPrestataire} style={{
          flex: 1, padding: '14px 0', borderRadius: 14,
          background: '#F0F0F0', color: CS.text,
          border: 'none', fontSize: 14, fontWeight: 700,
          cursor: 'pointer', fontFamily: 'inherit'
        }}>
          🏪 Espace pro
        </button>
      </div>
    </div>
  )
}