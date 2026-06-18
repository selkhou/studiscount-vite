import { useState, useEffect, useRef } from 'react'
import { getC } from '../../constants.js'
import { validateQRData } from '../../utils.js'
import { db } from '../../lib/supabase.js'

export default function QRScanner({ prestataireId, onScanned, onClose }) {
  const C = getC()
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const rafRef = useRef(null)
  const [status, setStatus] = useState('init') // init | scanning | success | error
  const [message, setMessage] = useState('')
  const [result, setResult] = useState(null)

  useEffect(() => {
    startCamera()
    return () => stopCamera()
  }, [])

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
        setStatus('scanning')
        rafRef.current = requestAnimationFrame(scanFrame)
      }
    } catch (e) {
      setStatus('error')
      setMessage('Caméra inaccessible — autorise l\'accès dans ton navigateur')
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
  }

  function scanFrame() {
    if (!videoRef.current || !canvasRef.current) return
    const video = videoRef.current
    const canvas = canvasRef.current
    if (video.readyState !== video.HAVE_ENOUGH_DATA) {
      rafRef.current = requestAnimationFrame(scanFrame)
      return
    }
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

    if (window.jsQR) {
      console.log('jsQR disponible')
      const code = window.jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert'
      })
      if (code) {
        handleQRCode(code.data)
        return
      }
    }
    rafRef.current = requestAnimationFrame(scanFrame)
  }

  async function handleQRCode(data) {
    stopCamera()
    setStatus('success')

    const validation = validateQRData(data)
    if (!validation.valid) {
      setStatus('error')
      setMessage(
        validation.reason === 'expired'
          ? 'QR Code expiré — demande à l\'étudiant d\'en générer un nouveau'
          : 'QR Code invalide'
      )
      return
    }

    try {
      // Valider la visite en DB
      const { data: visiteData } = await db()
        .from('visites')
        .update({
          statut: 'validee',
          date_visite: new Date().toISOString(),
          prestataire_id: prestataireId
        })
        .eq('offre_id', validation.offreId)
        .eq('etudiant_id', validation.etudiantId)
        .eq('statut', 'en_attente')
        .select('*, offres(titre, promo_pct, prix_normal), etudiants(prenom, nom)')
        .single()

      if (visiteData) {
        setResult(visiteData)
        onScanned && onScanned(visiteData)
      } else {
        setStatus('error')
        setMessage('Visite introuvable ou déjà validée')
      }
    } catch (e) {
      setStatus('error')
      setMessage('Erreur lors de la validation')
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 600,
      background: '#000000',
      display: 'flex', flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{
        padding: '52px 20px 16px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <div style={{ color: 'white', fontSize: 16, fontWeight: 800 }}>
          Scanner QR Code
        </div>
        <button onClick={() => { stopCamera(); onClose() }} style={{
          background: 'rgba(255,255,255,0.15)', border: 'none',
          borderRadius: '50%', width: 36, height: 36,
          color: 'white', cursor: 'pointer', fontSize: 18,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>✕</button>
      </div>

      {/* Caméra */}
      {(status === 'scanning' || status === 'init') && (
        <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <video
            ref={videoRef}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            playsInline
            muted
          />
          <canvas ref={canvasRef} style={{ display: 'none' }} />

          {/* Viseur */}
          <div style={{
            position: 'absolute',
            width: 220, height: 220,
            border: '3px solid #0066FF',
            borderRadius: 16,
            boxShadow: '0 0 0 1000px rgba(0,0,0,0.5)'
          }}>
            {/* Coins */}
            {[
              { top: -3, left: -3, borderTop: '4px solid #0066FF', borderLeft: '4px solid #0066FF' },
              { top: -3, right: -3, borderTop: '4px solid #0066FF', borderRight: '4px solid #0066FF' },
              { bottom: -3, left: -3, borderBottom: '4px solid #0066FF', borderLeft: '4px solid #0066FF' },
              { bottom: -3, right: -3, borderBottom: '4px solid #0066FF', borderRight: '4px solid #0066FF' },
            ].map((s, i) => (
              <div key={i} style={{ position: 'absolute', width: 20, height: 20, borderRadius: 2, ...s }} />
            ))}
          </div>

          <div style={{
            position: 'absolute', bottom: 40,
            color: 'white', fontSize: 13, textAlign: 'center',
            background: 'rgba(0,0,0,0.5)', padding: '8px 16px', borderRadius: 20
          }}>
            Place le QR code dans le cadre
          </div>
        </div>
      )}

      {/* Succès */}
      {status === 'success' && result && (
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: 32, textAlign: 'center'
        }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
          <div style={{ color: 'white', fontSize: 20, fontWeight: 900, marginBottom: 8 }}>
            Visite validée !
          </div>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, marginBottom: 24 }}>
            {result.etudiants?.prenom} {result.etudiants?.nom}
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.1)', borderRadius: 16,
            padding: '16px 24px', marginBottom: 24, width: '100%'
          }}>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, marginBottom: 4 }}>Offre</div>
            <div style={{ color: 'white', fontWeight: 700, fontSize: 15, marginBottom: 12 }}>
              {result.offres?.titre}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ textAlign: 'left' }}>
                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>Prix normal</div>
                <div style={{ color: 'white', fontSize: 14, textDecoration: 'line-through' }}>
                  {result.montant_normal}€
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: '#22C55E', fontSize: 11, fontWeight: 700 }}>
                  -{result.offres?.promo_pct}%
                </div>
                <div style={{ color: '#22C55E', fontSize: 20, fontWeight: 900 }}>
                  {result.montant_remise}€
                </div>
              </div>
            </div>
          </div>

          <button onClick={onClose} style={{
            background: '#0066FF', color: 'white',
            border: 'none', borderRadius: 14,
            padding: '14px 32px', fontSize: 15, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'inherit', width: '100%'
          }}>
            Terminé
          </button>
        </div>
      )}

      {/* Erreur */}
      {status === 'error' && (
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: 32, textAlign: 'center'
        }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>❌</div>
          <div style={{ color: 'white', fontSize: 18, fontWeight: 800, marginBottom: 8 }}>
            Erreur
          </div>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, marginBottom: 24 }}>
            {message}
          </div>
          <button onClick={() => { setStatus('init'); setMessage(''); startCamera() }} style={{
            background: '#0066FF', color: 'white',
            border: 'none', borderRadius: 14,
            padding: '14px 32px', fontSize: 15, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'inherit', width: '100%'
          }}>
            Réessayer
          </button>
        </div>
      )}
    </div>
  )
}