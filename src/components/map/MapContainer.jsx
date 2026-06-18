import { useEffect, useRef } from 'react'
import { CITIES } from '../../constants.js'

export default function MapContainer({ offres, selected, onSelect, city, userLocation }) {
  const mapRef = useRef(null)
  const mapInstance = useRef(null)
  const markersRef = useRef([])

  const cityData = CITIES.find(c => c.id === city) || CITIES[0]

  useEffect(() => {
    if (!window.mapboxgl) return
    if (mapInstance.current) return
    if (!mapRef.current) return

    const map = new window.mapboxgl.Map({
      container: mapRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [cityData.lng, cityData.lat],
      zoom: cityData.zoom,
    })

    map.addControl(new window.mapboxgl.NavigationControl(), 'top-right')
    mapInstance.current = map

    return () => {
      map.remove()
      mapInstance.current = null
    }
  }, [])

  useEffect(() => {
    if (!mapInstance.current || !offres) return

    markersRef.current.forEach(m => m.remove())
    markersRef.current = []

    offres.forEach(offre => {
      if (!offre.lat || !offre.lng) return

      const el = document.createElement('div')
      el.style.cssText = [
        'width:36px', 'height:36px', 'border-radius:50%',
        `background:${selected?.id === offre.id ? '#0066FF' : '#FFFFFF'}`,
        `border:2px solid ${selected?.id === offre.id ? '#0066FF' : '#E0E0E0'}`,
        'display:flex', 'align-items:center', 'justify-content:center',
        'font-size:18px', 'cursor:pointer',
        'box-shadow:0 2px 8px rgba(0,0,0,0.15)',
      ].join(';')
     //  el.textContent = offre.image_emoji || '🎯'
      const type = window.SIOK_TYPES
  ? (window.SIOK_TYPES.find(t => t.id === offre.type_offre) || { emoji: '🎯' })
  : { emoji: offre.image_emoji || '🎯' }
el.textContent = type.emoji
      el.addEventListener('click', () => onSelect && onSelect(offre))

      const marker = new window.mapboxgl.Marker({ element: el })
        .setLngLat([offre.lng, offre.lat])
        .addTo(mapInstance.current)

      markersRef.current.push(marker)
    })
  }, [offres, selected])

  useEffect(() => {
    if (!mapInstance.current || !userLocation) return
    mapInstance.current.flyTo({
      center: [userLocation.lng, userLocation.lat],
      zoom: cityData.zoom,
      duration: 1000
    })
  }, [userLocation])

  return (
    <div
      ref={mapRef}
      style={{
        width: '100%',
        height: '100%',
        minHeight: 400,
        position: 'relative'
      }}
    />
  )
}