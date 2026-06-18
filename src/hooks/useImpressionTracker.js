import { useRef, useEffect } from 'react'
import { db } from '../lib/supabase.js'

const _impressionsSeen = new Set()

async function trackImpression(offreId, etudiantId) {
  const key = `imp_${offreId}_${etudiantId || 'anon'}`
  if (_impressionsSeen.has(key)) return
  _impressionsSeen.add(key)
  try {
    await db().from('impressions_offres').insert({
      offre_id: offreId,
      etudiant_id: etudiantId || null,
    })
  } catch (e) {}
}

export default function useImpressionTracker(offreId, etudiantId) {
  const ref = useRef(null)
  useEffect(() => {
    if (!offreId || !ref.current) return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            trackImpression(offreId, etudiantId)
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.5 }
    )
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [offreId])
  return ref
}