import { useState, useEffect } from 'react'
import { CS } from '../../constants.js'
import { db } from '../../lib/supabase.js'

export default function AvisOffreBadge({ offreId }) {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    if (!offreId) return
    async function load() {
      try {
        const { data } = await db()
          .from('visites')
          .select('note, statut_avis')
          .eq('offre_id', offreId)
          .eq('statut_avis', 'valide')
          .not('note', 'is', null)
        if (data && data.length > 0) {
          const moyenne = data.reduce((s, v) => s + v.note, 0) / data.length
          setStats({ moyenne: moyenne.toFixed(1), nb: data.length })
        }
      } catch (e) {}
    }
    load()
  }, [offreId])

  if (!stats) return null

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      background: 'rgba(245,158,11,0.1)',
      color: '#F59E0B', fontSize: 11, fontWeight: 700,
      padding: '2px 8px', borderRadius: 20
    }}>
      ⭐ {stats.moyenne} ({stats.nb} avis)
    </span>
  )
}