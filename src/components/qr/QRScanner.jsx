import { useState, useEffect, useRef } from 'react'
import { getC } from '../../constants.js'
import { validateQRData } from '../../utils.js'
import { db } from '../../lib/supabase.js'

export default function QRScanner({ prestataireId, onScanned, onClose }) {
  const C = getC()
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const animRef = useRef(null)
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    startCamera()
    return () => stopCamera()
  }, [])

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
        setScanning(true)
        animRef.current = requestAnimationFrame(scan)
      }
    } catch (e) { setError("Impossible d'accéder à la caméra: " + e.message) }
  }

  const stopCamera = () => {
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
    if (animRef.current) cancelAnimationFrame(animRef.current)
  }

  const scan = () => {
    if (!videoRef.current || !canvasRef.current) return
    const video = videoRef.current
    if (video.readyState !== video.HAVE_ENOUGH_DATA) {
      animRef.current = requestAnimationFrame(scan)
      return
    }
    const canvas = canvasRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const code = window.jsQR && window.jsQR(imageData.data, imageData.width, imageData.height)
    if (code) {
      stopCamera()
      setScanning(false)
      processQR(code.data)
      return
    }
    animRef.current = requestAnimationFrame(scan)
  }

  const processQR = async (data) => {
    const qr = validateQRData(data)
    if (!qr || !qr.valid) { setError(qr?.reason || 'QR code invalide ou non reconnu'); return }

    setSaving(true)
    try {
      const { data: offre, error: offreErr } = await db().from('offres')
        .select('titre,prix,prix_normal,promo_pct,prestataire_id').eq('id', qr.offreId).single()
      if (offreErr) throw new Error('Offre introuvable: ' + offreErr.message)

      const prixNormal = offre?.prix_normal ? parseFloat(offre.prix_normal) : null
      const prixRemise = offre?.prix ? parseFloat(offre.prix)
        : (prixNormal && offre?.promo_pct ? Math.round(prixNormal * (1 - offre.promo_pct / 100) * 100) / 100 : null)

      const { error: insertErr } = await db().from('visites').insert({
        offre_id: qr.offreId,
        prestataire_id: prestataireId,
        etudiant_id: qr.etudiantId === 'anon' ? null : qr.etudiantId,
        etudiant_anon_id: qr.etudiantId === 'anon' ? 'anon' : null,
        points: qr.etudiantId && qr.etudiantId !== 'anon' ? (parseInt(window.SIOK_PARAMS?.points_qrc) || 3) : 0,
        montant_normal: prixNormal,
        montant_remise: prixRemise,
      })
      if (insertErr) throw new Error('Erreur enregistrement: ' + insertErr.message)

      if (qr.etudiantId && qr.etudiantId !== 'anon') {
        try {
          const { data: etList } = await db().from('etudiants').select('id,points').eq('id', qr.etudiantId).limit(1)
          const et = etList && etList.length > 0 ? etList[0] : null
          if (et) {
            await db().from('etudiants').update({ points: (et.points || 0) + (parseInt(window.SIOK_PARAMS?.points_qrc) || 3) }).eq('id', qr.etudiantId)
          }
        } catch (ptEx) { console.warn('Points non crédités:', ptEx.message) }
      }

      setResult({ offre, etudiant_id: qr.etudiantId })
      onScanned && onScanned()
    } catch (e) { setError(e.message) }
    setSaving(false)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 3000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20 }}>

      {/* Header */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '52px 20px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ color: 'white', fontSize: 16, fontWeight: 800 }}>📷 Scanner le QR étudiant</div>
        <button onClick={() => { stopCamera(); onClose() }} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: 36, height: 36, color: 'white', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
      </div>

      {!result && !error && (
        <div style={{ width: '100%', maxWidth: 340, textAlign: 'center' }}>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <video ref={videoRef} style={{ width: 280, height: 280, objectFit: 'cover', borderRadius: 16 }} playsInline muted />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            {/* Viseur */}
            <div style={{ position: 'absolute', inset: 0, border: '3px solid #0066FF', borderRadius: 16, pointerEvents: 'none' }}>
              {[
                { top: -3, left: -3, borderTop: '4px solid #0066FF', borderLeft: '4px solid #0066FF' },
                { top: -3, right: -3, borderTop: '4px solid #0066FF', borderRight: '4px solid #0066FF' },
                { bottom: -3, left: -3, borderBottom: '4px solid #0066FF', borderLeft: '4px solid #0066FF' },
                { bottom: -3, right: -3, borderBottom: '4px solid #0066FF', borderRight: '4px solid #0066FF' },
              ].map((s, i) => (
                <div key={i} style={{ position: 'absolute', width: 20, height: 20, borderRadius: 2, ...s }} />
              ))}
            </div>
          </div>
          {saving && <div style={{ color: 'white', marginTop: 16, fontSize: 14 }}>⏳ Validation en cours…</div>}
          {!saving && <div style={{ color: 'rgba(255,255,255,0.7)', marginTop: 16, fontSize: 13 }}>Place le QR code dans le cadre</div>}
        </div>
      )}

      {result && (
        <div style={{ background: 'white', borderRadius: 20, padding: 28, width: '100%', maxWidth: 340, textAlign: 'center' }}>
          <div style={{ fontSize: 56, marginBottom: 12 }}>✅</div>
          <div style={{ color: '#1A1A2E', fontWeight: 900, fontSize: 20, marginBottom: 8 }}>Visite validée !</div>
          <div style={{ color: '#6B7280', fontSize: 14, marginBottom: 16 }}>
            {result.offre?.titre}
          </div>
          <div style={{ background: '#F0F9FF', borderRadius: 12, padding: '12px 16px', marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ color: '#6B7280', fontSize: 12 }}>Prix normal</div>
                <div style={{ color: '#6B7280', fontSize: 14, textDecoration: 'line-through' }}>
                  {result.offre?.prix_normal ? `${result.offre.prix_normal}€` : '—'}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: '#22C55E', fontSize: 12, fontWeight: 700 }}>-{result.offre?.promo_pct}%</div>
                <div style={{ color: '#22C55E', fontSize: 20, fontWeight: 900 }}>
                  {result.offre?.prix ? `${result.offre.prix}€` : '—'}
                </div>
              </div>
            </div>
          </div>
          <div style={{ color: '#6B7280', fontSize: 12, marginBottom: 20 }}>
            {result.etudiant_id && result.etudiant_id !== 'anon'
              ? `🎓 +${window.SIOK_PARAMS?.points_qrc || 3} points crédités`
              : '👤 Visite anonyme — aucun point'}
          </div>
          <button onClick={onClose} style={{ width: '100%', padding: '14px', borderRadius: 14, border: 'none', background: '#0066FF', color: 'white', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            Terminé
          </button>
        </div>
      )}

      {error && (
        <div style={{ background: 'white', borderRadius: 20, padding: 28, width: '100%', maxWidth: 340, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>❌</div>
          <div style={{ color: '#1A1A2E', fontWeight: 800, fontSize: 18, marginBottom: 8 }}>Erreur</div>
          <div style={{ color: '#6B7280', fontSize: 14, marginBottom: 20 }}>{error}</div>
          <button onClick={() => { setError(''); setScanning(false); startCamera() }} style={{ width: '100%', padding: '14px', borderRadius: 14, border: 'none', background: '#0066FF', color: 'white', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            Réessayer
          </button>
        </div>
      )}
    </div>
  )
}