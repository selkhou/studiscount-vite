import { useState, useEffect, useRef } from 'react'
import { CS } from '../../constants.js'
import { genQRData } from '../../utils.js'
import { db } from '../../lib/supabase.js'

export default function QRGenerator({ offre, etudiant, onClose }) {
  const [qrUrl, setQrUrl] = useState('')
  const [expiry, setExpiry] = useState(null)
  const [timeLeft, setTimeLeft] = useState(4 * 60 * 1000)
  const [validated, setValidated] = useState(false)
  const [qrData, setQrData] = useState(null)

  useEffect(() => {
    const data = genQRData(offre.id, etudiant?.id || 'anon')
    const parsed = JSON.parse(data)
    setQrData(parsed)
    const encoded = encodeURIComponent(data)
    setQrUrl(`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encoded}&bgcolor=ffffff&color=000000&margin=2`)
    setExpiry(parsed.exp)

    // Timer décompte
    const interval = setInterval(() => {
      const left = parsed.exp - Date.now()
      setTimeLeft(Math.max(0, left))
      if (left <= 0) clearInterval(interval)
    }, 1000)

    // Polling validation toutes les 5 secondes
    const pollInterval = setInterval(async () => {
      if (Date.now() > parsed.exp) return
      try {
        let query = db().from('visites')
          .select('id')
          .eq('offre_id', offre.id)
          .gte('created_at', new Date(parsed.ts).toISOString())
          .lte('created_at', new Date(parsed.exp).toISOString())

        if (etudiant?.id) {
          query = query.eq('etudiant_id', etudiant.id)
        } else {
          query = query.is('etudiant_id', null).eq('etudiant_anon_id', 'anon')
        }

        const { data: visits } = await query.limit(1)
        if (visits && visits.length > 0) {
          setValidated(true)
          clearInterval(pollInterval)
          clearInterval(interval)
        }
      } catch (e) {}
    }, 5000)

    return () => { clearInterval(interval); clearInterval(pollInterval) }
  }, [offre.id])

  const mins = Math.floor(timeLeft / 60000)
  const secs = Math.floor((timeLeft % 60000) / 1000)
  const isExpired = timeLeft <= 0
  const isWarning = timeLeft < 30 * 1000

  // Écran validé
  if (validated) return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#FFFFFF', borderRadius: 24, padding: '36px 28px', width: '100%', maxWidth: 340, textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
        <div style={{ color: '#22C55E', fontWeight: 900, fontSize: 20, marginBottom: 8 }}>Visite validée !</div>
        <div style={{ color: '#1F1F1F', fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{offre.titre}</div>
        <div style={{ color: '#6B7280', fontSize: 13, marginBottom: 16 }}>{offre.prestataires?.nom || offre.prestataire_nom}</div>
        {etudiant
          ? <div style={{ background: 'rgba(34,197,94,0.1)', borderRadius: 12, padding: '10px 16px', marginBottom: 20, color: '#22C55E', fontWeight: 700, fontSize: 14 }}>
            🎯 +{window.SIOK_PARAMS?.points_qrc || 3} points crédités sur votre compte !
          </div>
          : <div style={{ background: '#F0F6FF', borderRadius: 12, padding: '10px 16px', marginBottom: 20, color: '#0066FF', fontSize: 13 }}>
            Créez un compte pour gagner des points à chaque visite 🎁
          </div>
        }
        <button onClick={onClose}
          style={{ width: '100%', padding: '14px 0', borderRadius: 14, border: 'none', background: '#0066FF', color: 'white', fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
          Fermer
        </button>
      </div>
    </div>
  )

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#FFFFFF', borderRadius: 24, padding: '28px 24px', width: '100%', maxWidth: 360, textAlign: 'center', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, width: 32, height: 32, borderRadius: '50%', background: '#F0F0F0', border: 'none', cursor: 'pointer', fontSize: 16 }}>✕</button>

        <div style={{ fontSize: 32, marginBottom: 8 }}>📱</div>
        <div style={{ color: '#1F1F1F', fontSize: 18, fontWeight: 900, marginBottom: 4, letterSpacing: -0.3 }}>{offre.titre}</div>
        <div style={{ color: '#6B7280', fontSize: 13, marginBottom: 16 }}>{offre.prestataires?.nom || offre.prestataire_nom}</div>

        {/* QR Code */}
        {!isExpired ? (
          <div style={{ background: '#F8F8F8', borderRadius: 16, padding: 16, marginBottom: 16, display: 'inline-block' }}>
            {qrUrl && <img src={qrUrl} alt="QR" width={220} height={220} style={{ borderRadius: 8, display: 'block' }} />}
          </div>
        ) : (
          <div style={{ background: '#FFF0F0', borderRadius: 16, padding: 32, marginBottom: 16 }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>⏰</div>
            <div style={{ color: '#EF4444', fontWeight: 700 }}>QR code expiré</div>
            <div style={{ color: '#6B7280', fontSize: 12, marginTop: 6 }}>Générez-en un nouveau ci-dessous</div>
          </div>
        )}

        {/* Timer */}
        <div style={{ background: isExpired ? '#FFF0F0' : isWarning ? '#FFF8F0' : '#F0F6FF', borderRadius: 12, padding: '10px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ color: isExpired ? '#EF4444' : isWarning ? '#EF4444' : '#0066FF', fontSize: 13, fontWeight: 600 }}>
            {isExpired ? 'Expiré' : '⏱️ Valide encore'}
          </span>
          <span style={{ color: isExpired ? '#EF4444' : isWarning ? '#EF4444' : '#0066FF', fontWeight: 900, fontSize: 20, fontFamily: 'monospace' }}>
            {isExpired ? '00:00' : `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`}
          </span>
        </div>

        <div style={{ color: '#6B7280', fontSize: 12, lineHeight: 1.6, marginBottom: 16 }}>
          Montrez ce QR code au prestataire qui le scannera pour valider votre visite.
          {etudiant && <span style={{ color: '#22C55E', fontWeight: 600 }}><br />+{window.SIOK_PARAMS?.points_qrc || 3} points crédités après scan !</span>}
          {!etudiant && <span style={{ color: '#EF4444' }}><br />Créez un compte pour gagner des points.</span>}
        </div>

        {isExpired && (
          <button onClick={() => {
            const data = genQRData(offre.id, etudiant?.id || 'anon')
            const parsed = JSON.parse(data)
            setQrData(parsed)
            const encoded = encodeURIComponent(data)
            setQrUrl(`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encoded}&bgcolor=ffffff&color=000000&margin=2`)
            setExpiry(parsed.exp)
            setTimeLeft(4 * 60 * 1000)
          }} style={{ width: '100%', padding: '12px 0', borderRadius: 12, border: 'none', background: CS.accent, color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            🔄 Générer un nouveau QR code
          </button>
        )}
      </div>
    </div>
  )
}