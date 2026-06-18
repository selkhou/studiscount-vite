import { useState } from 'react'

export default function ConseilIA({ offres, visites, vuesData, prestataire }) {
  const [loading, setLoading] = useState(false)
  const [conseil, setConseil] = useState(null)
  const [error, setError] = useState('')

  const analyser = async () => {
    setLoading(true); setError(''); setConseil(null)
    try {
      const statsOffres = offres.map(o => ({
        titre: o.titre, type: o.type_offre,
        prix: o.prix, prix_normal: o.prix_normal, promo_pct: o.promo_pct,
        vues: vuesData.filter(v => v.offre_id === o.id).length,
        visites: visites.filter(v => v.offre_id === o.id).length,
        note: o.note_moyenne,
      }))

      const parHeure = Array.from({ length: 24 }, (_, h) => ({
        heure: h, visites: visites.filter(v => new Date(v.created_at).getHours() === h).length,
      }))
      const parJour = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map((j, i) => ({
        jour: j, visites: visites.filter(v => new Date(v.created_at).getDay() === i).length,
      }))

      const prompt = `Tu es un expert en marketing pour les commerces locaux ciblant les étudiants.
Voici les données de performance de "${prestataire.nom}" (${prestataire.type_metier}, ${prestataire.ville}) :

OFFRES :
${JSON.stringify(statsOffres, null, 2)}

VISITES PAR HEURE :
${parHeure.filter(h => h.visites > 0).map(h => `${h.heure}h: ${h.visites}`).join(', ') || 'Pas encore de données'}

VISITES PAR JOUR :
${parJour.map(j => `${j.jour}: ${j.visites}`).join(', ')}

TOTAL : ${visites.length} visites, ${vuesData.length} vues

Fournis une analyse concise en JSON avec exactement cette structure :
{
  "meilleure_offre": {"titre": "...", "raison": "...", "taux_conversion": "...%"},
  "meilleur_moment": {"jour": "...", "heure": "...", "conseil": "..."},
  "chiffrage": {"ca_estime": "...€", "methode": "..."},
  "recommandations": ["conseil 1", "conseil 2", "conseil 3"]
}
Réponds UNIQUEMENT avec le JSON, sans texte avant ou après.`

      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 1000,
          messages: [{ role: 'user', content: prompt }]
        })
      })
      const data = await resp.json()
      const text = data.content?.[0]?.text || ''
      const clean = text.replace(/```json|```/g, '').trim()
      const parsed = JSON.parse(clean)
      setConseil(parsed)
    } catch (e) { setError('Analyse impossible : ' + e.message) }
    setLoading(false)
  }

  return (
    <div style={{ background: '#000000', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: 16, marginTop: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <div style={{ color: '#FFFFFF', fontWeight: 800, fontSize: 15 }}>🤖 Conseil <span style={{ color: '#F59E0B' }}>IA</span></div>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 2 }}>Analyse personnalisée de vos performances</div>
        </div>
        <button onClick={analyser} disabled={loading || visites.length === 0} style={{
          padding: '8px 16px', borderRadius: 12, border: 'none',
          background: '#7C3AED', color: 'white', fontSize: 12, fontWeight: 700,
          cursor: loading || visites.length === 0 ? 'default' : 'pointer',
          fontFamily: 'inherit', opacity: visites.length === 0 ? 0.5 : 1
        }}>
          {loading ? '⏳ Analyse…' : '✨ Analyser'}
        </button>
      </div>

      {visites.length === 0 && (
        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, textAlign: 'center', padding: '8px 0' }}>
          Pas encore assez de données. Attendez vos premières visites.
        </div>
      )}

      {error && (
        <div style={{ color: '#ef4444', fontSize: 12, background: 'rgba(239,68,68,0.08)', borderRadius: 8, padding: '8px 12px' }}>
          {error}
        </div>
      )}

      {conseil && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ background: '#111111', borderRadius: 12, padding: '12px 14px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ color: '#22C55E', fontWeight: 700, fontSize: 12, marginBottom: 4 }}>🏆 Meilleure offre</div>
            <div style={{ color: '#FFFFFF', fontWeight: 700, fontSize: 14 }}>{conseil.meilleure_offre?.titre}</div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 2 }}>{conseil.meilleure_offre?.raison}</div>
            <div style={{ color: '#22C55E', fontSize: 11, fontWeight: 700, marginTop: 4 }}>
              Taux de conversion : {conseil.meilleure_offre?.taux_conversion}
            </div>
          </div>

          <div style={{ background: '#111111', borderRadius: 12, padding: '12px 14px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ color: '#0066FF', fontWeight: 700, fontSize: 12, marginBottom: 4 }}>⏰ Meilleur moment</div>
            <div style={{ color: '#FFFFFF', fontWeight: 700, fontSize: 14 }}>
              {conseil.meilleur_moment?.jour} à {conseil.meilleur_moment?.heure}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 2 }}>{conseil.meilleur_moment?.conseil}</div>
          </div>

          <div style={{ background: '#111111', borderRadius: 12, padding: '12px 14px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ color: '#F59E0B', fontWeight: 700, fontSize: 12, marginBottom: 4 }}>💶 Chiffrage estimé</div>
            <div style={{ color: '#F59E0B', fontWeight: 900, fontSize: 20 }}>{conseil.chiffrage?.ca_estime}</div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 2 }}>{conseil.chiffrage?.methode}</div>
          </div>

          <div style={{ background: '#111111', borderRadius: 12, padding: '12px 14px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ color: '#7C3AED', fontWeight: 700, fontSize: 12, marginBottom: 8 }}>💡 Recommandations</div>
            {conseil.recommandations?.map((r, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'flex-start' }}>
                <span style={{ color: '#7C3AED', fontWeight: 700, fontSize: 12, flexShrink: 0 }}>{i + 1}.</span>
                <span style={{ color: '#FFFFFF', fontSize: 12, lineHeight: 1.5 }}>{r}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}