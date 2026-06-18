import { useEffect, useRef } from 'react'
import { CITIES } from '../../constants.js'

export default function LeafletLocator({ lat, lng, onMove, city }) {
  const mapRef = useRef(null)
  const mapObj = useRef(null)
  const markerRef = useRef(null)

  const cityData = CITIES.find(c => c.id === city) || CITIES[0]
  const initLat = lat || cityData.lat
  const initLng = lng || cityData.lng

  useEffect(() => {
    if (mapObj.current || !mapRef.current) return
    if (!window.mapboxgl) return

    mapObj.current = new window.mapboxgl.Map({
      container: mapRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [initLng, initLat],
      zoom: 14,
    })

    const el = document.createElement('div')
    el.style.cssText = 'width:32px;height:32px;border-radius:50%;background:#0066FF;display:flex;align-items:center;justify-content:center;font-size:16px;border:3px solid white;box-shadow:0 2px 8px rgba(0,102,255,0.5);cursor:grab;'
    el.innerHTML = '📍'

    markerRef.current = new window.mapboxgl.Marker({ element: el, draggable: true })
      .setLngLat([initLng, initLat])
      .addTo(mapObj.current)

    markerRef.current.on('dragend', () => {
      const pos = markerRef.current.getLngLat()
      onMove(pos.lat, pos.lng)
    })

    mapObj.current.on('click', e => {
      markerRef.current.setLngLat(e.lngLat)
      onMove(e.lngLat.lat, e.lngLat.lng)
    })

    return () => {
      if (mapObj.current) { mapObj.current.remove(); mapObj.current = null }
    }
  }, [])

  useEffect(() => {
    if (!markerRef.current || !lat || !lng) return
    markerRef.current.setLngLat([lng, lat])
    mapObj.current?.panTo([lng, lat])
  }, [lat, lng])

  return (
    <div
      ref={mapRef}
      style={{ height: 220, width: '100%', borderRadius: 12, overflow: 'hidden', marginTop: 10 }}
    />
  )
}