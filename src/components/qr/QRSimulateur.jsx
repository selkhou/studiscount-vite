import { useState } from 'react'
import { getC } from '../../constants.js'
import { db } from '../../lib/supabase.js'
import { validateQRData } from '../../utils.js'

export default function QRSimulateur({ prestataireId, onScanned, onClose }) {
  const C = getC()
  const [input, setInput] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const simulate = async () => {
    setError(''); setResult(null)
    const qr = validateQRData(input.trim())
    if (!qr || !qr.valid) { setError(qr?.reason || 'QR code invalide'); return }
    setSaving(true)
    try {
      const { data: offre, error: offreErr } = await db().from('offres')
        .select('titre,prix,promo_pct').eq('id', qr.offreId).single()
      if (offreErr) throw new Error('Offre introuvable: ' + offreErr.message)

      const { error: insertErr } = await db().from('visites').insert({
        offre_id: qr.offreId,
        prestataire_id: prestataireId,
        etudiant_id: qr.etudiantId === 'anon' ? null : qr.etudiantId,
        points: qr.etudiantId && qr.etudiantId !== 'anon' ? (parseInt(window.SIOK_PARAMS?.points_qrc) || 3) : 0,
      })
      if (insertErr) throw new Error('Erreur insert: ' + insertErr.message)

      if (qr.etudiantId && qr.etudiantId !== 'anon') {
        const { data: etList } = await db().from('etudiants').select('id,points').eq('id', qr.etudiantId).limit(1)
        const et = etList && etList.length > 0 ? etList[0] : null
        if (et) await db().from('etudiants').update({ points: (et.points || 0) + (parseInt(window.SIOK_PARAMS?.points_qrc) || 3) }).eq('id', qr.etudiantId)
      }

      setResult({ offre, etudiant_id: qr.etudiantId })
      onScanned && onScanned()
    } catch (e) { setError(e.message) }
    setSaving(false)
  }

  return (
    <div style={{ background: C.card, border: '1px solid rgba(234,179,8,0.3)', borderRadius: 16, padding: 16, marginBottom: 16 }}>
      <div style={{ color: '#eab308', fontSize: 12, fontWeight: 700, marginBottom: 10 }}>🧪 Mode test — Simulateur QR</div>
      <div style={{ color: C.muted, fontSize: 11, marginBottom: 10, lineHeight: 1.5 }}>
        Copiez le contenu du QR depuis la console étudiant et collez-le ici pour simuler un scan.
      </div>
      <textarea value={input} onChange={e => setInput(e.target.value)}
        placeholder='{"offreId":"...","etudiantId":"...","ts":...,"token":"..."}'
        rows={3}
        style={{ width: '100%', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 12px', color: C.text, fontSize: 11, fontFamily: 'monospace', outline: 'none', resize: 'vertical', marginBottom: 8 }}
      />
      {error && <div style={{ color: '#ef4444', fontSize: 12, marginBottom: 8 }}>⚠️ {error}</div>}
      {result && (
        <div style={{ background: 'rgba(34,197,94,0.1)', borderRadius: 10, padding: '10px 12px', marginBottom: 8 }}>
          <div style={{ color: '#22c55e', fontWeight: 700, fontSize: 13 }}>✅ Visite validée — {result.offre?.titre}</div>
          <div style={{ color: C.muted, fontSize: 11, marginTop: 2 }}>
            {result.etudiant_id && result.etudiant_id !== 'anon' ? '🎓 +3 points crédités' : '👤 Visite anonyme'}
          </div>
        </div>
      )}
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={simulate} disabled={!input.trim() || saving}
          style={{ flex: 1, padding: '9px 0', borderRadius: 10, border: 'none', background: 'rgba(234,179,8,0.2)', color: '#eab308', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', opacity: !input.trim() ? 0.5 : 1 }}>
          {saving ? 'Validation…' : 'Valider le QR'}
        </button>
        <button onClick={onClose}
          style={{ padding: '9px 14px', borderRadius: 10, border: `1px solid ${C.border}`, background: 'transparent', color: C.muted, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
          Fermer
        </button>
      </div>
    </div>
  )
}