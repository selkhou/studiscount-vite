import { useState, useEffect, useRef } from 'react'
import { CS } from '../../constants.js'
import { genQRData, fmt } from '../../utils.js'

const QR_DURATION = 4 * 60 * 1000

export default function QRGenerator({ offre, etudiant, onClose }) {
  const [qrUrl, setQrUrl] = useState(null)
  const [timeLeft, setTimeLeft] = useState(QR_DURATION)
  const [loading, setLoading] = useState(true)
  const intervalRef = useRef(null)
  const startRef = useRef(Date.now())

  useEffect(() => {
    generateQR()
    return () => clearInterval(intervalRef.current)
  }, [])

  async function generateQR() {
    setLoading(true)
    try {
      const qrData = genQRData(offre.id, etudiant?.id || 'anon')
      const url = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrData)}`
      setQrUrl(url)

      startRef.current = Date.now()
      intervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startRef.current
        const left = Math.max(0, QR_DURATION - elapsed)
        setTimeLeft(left)
        if (left === 0) clearInterval(intervalRef.current)
      }, 1000)
    } catch (e) {
      console.error('Erreur génération QR:', e)
    }
    setLoading(false)
  }

  const expired = timeLeft === 0
  const progress = (timeLeft / QR_DURATION) * 100

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 3000,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20
    }}>
      <div style={{
        background: 'white', borderRadius: 24,
        padding: 28, width: '100%', maxWidth: 340,
        textAlign: 'center'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: CS.text }}>
            Mon QR Code
          </div>
          <button onClick={onClose} style={{
            background: '#F5F5F5', border: 'none', borderRadius: '50%',
            width: 32, height: 32, cursor: 'pointer', fontSize: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>✕</button>
        </div>

        {/* Offre */}
        <div style={{
          background: CS.accentSoft, borderRadius: 12,
          padding: '8px 14px', marginBottom: 20, fontSize: 13
        }}>
          <span style={{ fontWeight: 700, color: CS.accent }}>
            {offre.image_emoji} {offre.titre}
          </span>
          <span style={{ color: CS.muted }}> — {offre.prestataires?.nom}</span>
        </div>

        {/* QR */}
        {loading && (
          <div style={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center', color: CS.muted }}>
            Génération...
          </div>
        )}

        {!loading && qrUrl && !expired && (
          <>
            <img
              src={qrUrl}
              alt="QR Code"
              style={{ width: 250, height: 250, borderRadius: 12, marginBottom: 16 }}
              onLoad={() => console.log('QR chargé')}
              onError={() => console.error('QR erreur chargement')}
            />

            {/* Progress bar */}
            <div style={{
              height: 6, background: '#F0F0F0',
              borderRadius: 3, marginBottom: 8, overflow: 'hidden'
            }}>
              <div style={{
                height: '100%', borderRadius: 3,
                background: timeLeft > 60000 ? CS.green : CS.red,
                width: `${progress}%`,
                transition: 'width 1s linear'
              }} />
            </div>

            <div style={{ fontSize: 13, color: timeLeft > 60000 ? CS.muted : CS.red, fontWeight: 600 }}>
              ⏱ Valide encore {fmt(timeLeft)}
            </div>
          </>
        )}

        {!loading && expired && (
          <div style={{ padding: '40px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⏰</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: CS.text, marginBottom: 8 }}>
              QR Code expiré
            </div>
            <div style={{ fontSize: 13, color: CS.muted, marginBottom: 20 }}>
              Génère un nouveau QR code
            </div>
            <button onClick={() => { setTimeLeft(QR_DURATION); generateQR() }} style={{
              background: CS.accent, color: 'white',
              border: 'none', borderRadius: 12,
              padding: '12px 24px', fontSize: 14, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit'
            }}>
              Nouveau QR
            </button>
          </div>
        )}

        {!expired && !loading && (
          <div style={{
            marginTop: 16, padding: '10px 14px',
            background: '#F8F8F8', borderRadius: 12,
            fontSize: 12, color: CS.muted, lineHeight: 1.5
          }}>
            Montre ce QR code au commerçant pour valider ta remise
          </div>
        )}
      </div>
    </div>
  )
}