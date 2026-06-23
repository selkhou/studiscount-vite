import { useState } from 'react'
import { getC, CITIES } from '../../constants.js'
import { db } from '../../lib/supabase.js'
import { getTypesMetier, planFin } from '../../utils.js'
import { PrestPageShell } from '../ui/PageShells.jsx'
import Btn from '../ui/Btn.jsx'
import ModalCGU from '../ui/ModalCGU.jsx'
import LeafletLocator from '../map/LeafletLocator.jsx'

export default function PrestataireRegister({ onSuccess, onBack }) {
  const C = getC()
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [geoLoading, setGeoLoading] = useState(false)
  const [otpData, setOtpData] = useState(null)
  const [otpCode, setOtpCode] = useState('')
  const [otpLoading, setOtpLoading] = useState(false)
  const [otpError, setOtpError] = useState('')
  const [otpResent, setOtpResent] = useState(false)
  const [form, setForm] = useState({
    email: '', password: '', nom_responsable: '', telephone: '',
    nom: '', type_metier: 'restaurant', siret: '',
    adresse: '', ville: 'annecy', lat: null, lng: null,
    plan: 'trial', cgu: false, showCGU: false,
  })
  const F = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const inp = (label, key, placeholder, type = 'text', required = false) => (
    <div style={{ marginBottom: 14 }}>
      <div style={{ color: C.sub, fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 5 }}>
        {label}{required && <span style={{ color: '#ef4444', marginLeft: 3 }}>*</span>}
      </div>
      <input type={type} value={form[key] || ''} onChange={e => F(key, e.target.value)} placeholder={placeholder}
        style={{ width: '100%', background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '12px 14px', color: C.text, fontSize: 14, fontFamily: 'inherit', outline: 'none' }} />
    </div>
  )

  const geocode = async () => {
    if (!form.adresse) return
    setGeoLoading(true)
    try {
      const cityData = CITIES.find(c => c.id === form.ville) || CITIES[0]
      const q = encodeURIComponent(`${form.adresse}, ${cityData.name}, France`)
      const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${q}&limit=1`)
      const data = await r.json()
      if (data && data[0]) { F('lat', parseFloat(data[0].lat)); F('lng', parseFloat(data[0].lon)) }
    } catch (e) {}
    setGeoLoading(false)
  }

  const geolocate = () => {
    navigator.geolocation?.getCurrentPosition(p => {
      F('lat', p.coords.latitude); F('lng', p.coords.longitude)
    })
  }

  const submit = async () => {
    setSaving(true); setError('')
    try {
      const { data: authData, error: authErr } = await db().auth.signUp({
        email: form.email, password: form.password,
        options: { emailRedirectTo: window.location.href }
      })
      if (authErr) throw authErr
      const authId = authData.user?.id
      if (!authId) throw new Error('Erreur création compte')

      // Ne pas insérer en base avant validation OTP
      setOtpData({ email: form.email, user: authData.user, authId, form: { ...form } })
    } catch (e) { setError(e.message) }
    } catch (e) { setError(e.message) }
    setSaving(false)
  }

  const GROUPES = [
    {
      id: 'base', label: 'Base', color: '#6B7280', icon: '🔧',
      features: [`${window.SIOK_TARIFS?.base_commission || 15}% commission/vente`, 'Offres illimitées', 'Photos', 'Email support'],
      monthly: { id: 'base_monthly', price: 0 }, annual: { id: 'base_annual', price: 0 },
    },
    {
      id: 'standard', label: 'Standard', color: '#0066FF', icon: '📊',
      features: [`${window.SIOK_TARIFS?.standard_commission || 9}% commission/vente`, `${window.SIOK_TARIFS?.standard_mensuel || 49.90}€/mois`, '📊 Stats', 'Support prioritaire'],
      monthly: { id: 'standard_monthly', price: window.SIOK_TARIFS?.standard_mensuel || 49.90 },
      annual: { id: 'standard_annual', price: window.SIOK_TARIFS?.standard_annuel || 39.90 },
    },
    {
      id: 'premium', label: 'Premium', color: '#7C3AED', icon: '👑',
      features: [`${window.SIOK_TARIFS?.premium_commission || 5}% commission/vente`, `${window.SIOK_TARIFS?.premium_mensuel || 79.90}€/mois`, '📊 Stats', '🤖 IA', 'Support VIP'],
      monthly: { id: 'premium_monthly', price: window.SIOK_TARIFS?.premium_mensuel || 79.90 },
      annual: { id: 'premium_annual', price: window.SIOK_TARIFS?.premium_annuel || 59.90 },
    },
  ]

  const progressBar = (
    <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
      {[1, 2, 3].map(s => (
        <div key={s} style={{ flex: 1, height: 4, borderRadius: 2, background: s <= step ? '#0066FF' : 'rgba(255,255,255,0.1)' }} />
      ))}
    </div>
  )

  const handleOtpVerify = async () => {
    setOtpError('')
    if (otpCode.length < 6) { setOtpError('Saisis le code à 6 chiffres reçu par email'); return }
    setOtpLoading(true)
    try {
      const { error: e } = await db().auth.verifyOtp({ email: otpData.email, token: otpCode, type: 'signup' })
      if (e) { setOtpError(e.message); setOtpLoading(false); return }

      // OTP validé — on insère maintenant le prestataire en base
      const f = otpData.form
      const debut = new Date()
      const fin = planFin(f.plan)

      const { error: dbErr } = await db().from('prestataires').insert({
        auth_id: otpData.authId, nom: f.nom, type_metier: f.type_metier,
        siret: f.siret || null, nom_responsable: f.nom_responsable || null,
        email: f.email, telephone: f.telephone || null,
        adresse: f.adresse || null,
        ville: CITIES.find(c => c.id === f.ville)?.name || f.ville,
        lat: f.lat || null, lng: f.lng || null,
        plan: f.plan, plan_debut: debut.toISOString(),
        plan_fin: fin?.toISOString() || null,
      })
      if (dbErr) { setOtpError(dbErr.message); setOtpLoading(false); return }

      onSuccess(otpData.user)
    } catch (e) { setOtpError(e.message) }
    setOtpLoading(false)
  }

  const handleOtpResend = async () => {
    try {
      await db().auth.resend({ email: otpData.email, type: 'signup' })
      setOtpResent(true); setTimeout(() => setOtpResent(false), 5000)
    } catch (e) { setOtpError(e.message) }
  }

  // Écran OTP après inscription
  if (otpData) return (
    <PrestPageShell onBack={() => setOtpData(null)} backLabel="← Retour">
      <div style={{ padding: '32px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📧</div>
          <div style={{ color: C.text, fontSize: 20, fontWeight: 800, marginBottom: 4 }}>Vérifie ton email</div>
          <div style={{ color: C.muted, fontSize: 13, lineHeight: 1.6 }}>
            Un code de vérification a été envoyé à<br />
            <span style={{ color: '#0066FF', fontWeight: 700 }}>{otpData.email}</span>
          </div>
        </div>
        <div style={{ marginBottom: 14 }}>
          <div style={{ color: C.sub, fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 5 }}>Code de vérification</div>
          <input type="number" value={otpCode} onChange={e => setOtpCode(e.target.value.slice(0, 6))}
            placeholder="123456"
            style={{ width: '100%', background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '12px 14px', color: C.text, fontSize: 20, fontFamily: 'inherit', outline: 'none', textAlign: 'center', letterSpacing: 8, boxSizing: 'border-box' }} />
        </div>
        {otpError && <div style={{ background: 'rgba(239,68,68,0.1)', borderRadius: 8, padding: '10px 12px', marginBottom: 14, color: '#ef4444', fontSize: 13 }}>⚠️ {otpError}</div>}
        {otpResent && <div style={{ background: 'rgba(34,197,94,0.1)', borderRadius: 8, padding: '10px 12px', marginBottom: 14, color: '#22C55E', fontSize: 13 }}>✅ Code renvoyé !</div>}
        <Btn onClick={handleOtpVerify} loading={otpLoading}>Valider mon compte →</Btn>
        <div style={{ textAlign: 'center', marginTop: 14 }}>
          <button onClick={handleOtpResend} style={{ background: 'none', border: 'none', color: C.muted, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline' }}>
            Renvoyer le code
          </button>
        </div>
      </div>
    </PrestPageShell>
  )

  if (step === 1) return (
    <PrestPageShell onBack={onBack} backLabel="Retour">
      <div style={{ padding: '20px' }}>
        {progressBar}
        <div style={{ color: C.text, fontSize: 20, fontWeight: 800, marginBottom: 4 }}>Créer mon compte</div>
        <div style={{ color: C.muted, fontSize: 13, marginBottom: 20 }}>Étape 1 / 3 — Informations de connexion</div>
        {inp('Email *', 'email', 'votre@email.com', 'email', true)}
        {inp('Mot de passe *', 'password', 'Min. 8 caractères', 'password', true)}
        {inp('Nom du responsable', 'nom_responsable', 'Jean Dupont')}
        {inp('Téléphone', 'telephone', '+33450...')}
        {error && <div style={{ background: 'rgba(239,68,68,0.1)', borderRadius: 8, padding: '10px 12px', marginBottom: 14, color: '#ef4444', fontSize: 13 }}>⚠️ {error}</div>}
        <Btn onClick={() => {
          if (!form.email || !form.password) return setError('Email et mot de passe obligatoires')
          if (form.password.length < 8) return setError('Mot de passe : 8 caractères minimum')
          setError(''); setStep(2)
        }}>Étape suivante →</Btn>
      </div>
    </PrestPageShell>
  )

  if (step === 2) return (
    <PrestPageShell onBack={() => { setStep(1); setError('') }} backLabel="← Étape 1">
      <div style={{ padding: '20px' }}>
        {progressBar}
        <div style={{ color: C.text, fontSize: 20, fontWeight: 800, marginBottom: 4 }}>Votre enseigne</div>
        <div style={{ color: C.muted, fontSize: 13, marginBottom: 20 }}>Étape 2 / 3 — Informations de votre établissement</div>
        {inp("Nom de l'enseigne *", 'nom', 'Ex: Danzo Barber…', 'text', true)}
        {inp('SIRET', 'siret', '14 chiffres')}

        <div style={{ marginBottom: 14 }}>
          <div style={{ color: C.sub, fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Type de métier *</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {getTypesMetier().map(t => (
              <button key={t.id} onClick={() => F('type_metier', t.id)} style={{
                padding: '8px 14px', borderRadius: 10,
                border: `1px solid ${form.type_metier === t.id ? 'rgba(0,102,255,0.5)' : C.border}`,
                background: form.type_metier === t.id ? 'rgba(0,102,255,0.12)' : 'transparent',
                color: form.type_metier === t.id ? '#0066FF' : C.muted,
                fontSize: 13, fontWeight: form.type_metier === t.id ? 700 : 400,
                cursor: 'pointer', fontFamily: 'inherit'
              }}>
                {t.emoji} {t.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <div style={{ color: C.sub, fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Ville *</div>
          <select value={form.ville} onChange={e => F('ville', e.target.value)}
            style={{ width: '100%', background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '12px 14px', color: C.text, fontSize: 14, fontFamily: 'inherit', outline: 'none' }}>
            {CITIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div style={{ marginBottom: 6 }}>
          <div style={{ color: C.sub, fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Adresse</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={form.adresse || ''} onChange={e => F('adresse', e.target.value)} placeholder="12 Rue de la Gare"
              style={{ flex: 1, background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '12px 14px', color: C.text, fontSize: 14, fontFamily: 'inherit', outline: 'none' }} />
            <button onClick={geocode} disabled={geoLoading} style={{
              padding: '0 14px', borderRadius: 10, border: `1px solid ${C.border}`,
              background: 'rgba(0,102,255,0.1)', color: '#0066FF',
              fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap'
            }}>
              {geoLoading ? '…' : '🔍 Chercher'}
            </button>
          </div>
        </div>
        <button onClick={geolocate} style={{
          width: '100%', padding: '10px', borderRadius: 10,
          border: `1px solid ${C.border}`, background: 'transparent',
          color: C.muted, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 8
        }}>
          📍 Utiliser ma position actuelle
        </button>

        <LeafletLocator lat={form.lat} lng={form.lng} city={form.ville}
          onMove={(lat, lng) => { F('lat', lat); F('lng', lng) }} />
        {form.lat && (
          <div style={{ color: C.muted, fontSize: 11, marginTop: 4, textAlign: 'center' }}>
            📍 {form.lat.toFixed(5)}, {form.lng.toFixed(5)}
          </div>
        )}

        <div style={{ marginTop: 14 }}>
          {error && <div style={{ background: 'rgba(239,68,68,0.1)', borderRadius: 8, padding: '10px 12px', marginBottom: 14, color: '#ef4444', fontSize: 13 }}>⚠️ {error}</div>}
          <Btn onClick={() => {
            if (!form.nom) return setError("Le nom de l'enseigne est obligatoire")
            setError(''); setStep(3)
          }}>Étape suivante →</Btn>
        </div>
      </div>
    </PrestPageShell>
  )

  return (
    <PrestPageShell onBack={() => { setStep(2); setError('') }} backLabel="← Étape 2">
      <div style={{ padding: '20px' }}>
        {progressBar}
        <div style={{ color: C.text, fontSize: 20, fontWeight: 800, marginBottom: 4 }}>Choisissez votre plan</div>
        <div style={{ color: C.muted, fontSize: 13, marginBottom: 16 }}>Étape 3 / 3 — Abonnement</div>

        <button onClick={() => F('plan', 'trial')} style={{
          width: '100%', padding: '12px 16px', borderRadius: 14,
          border: `2px solid ${form.plan === 'trial' ? '#22C55E' : C.border}`,
          background: form.plan === 'trial' ? 'rgba(34,197,94,0.08)' : 'transparent',
          cursor: 'pointer', fontFamily: 'inherit', marginBottom: 12,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <div style={{ textAlign: 'left' }}>
            <div style={{ color: '#22C55E', fontWeight: 800, fontSize: 15 }}>🎁 Essai gratuit</div>
            <div style={{ color: C.muted, fontSize: 12, marginTop: 2 }}>1 offre · 1 photo · sans CB</div>
          </div>
          {form.plan === 'trial' && (
            <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#22C55E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'white', fontSize: 13 }}>✓</span>
            </div>
          )}
        </button>

        {GROUPES.map(g => {
          const isSelectedMonthly = form.plan === g.monthly.id
          const isSelectedAnnual = form.plan === g.annual.id
          const isSelected = isSelectedMonthly || isSelectedAnnual
          return (
            <div key={g.id} style={{
              background: C.card, borderRadius: 16, marginBottom: 12, overflow: 'hidden',
              border: `2px solid ${isSelected ? g.color : C.border}`, transition: 'all 0.2s'
            }}>
              <div style={{ background: isSelected ? `${g.color}12` : 'transparent', padding: '12px 16px', borderBottom: `1px solid ${C.border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 20 }}>{g.icon}</span>
                    <div>
                      <div style={{ color: g.color, fontWeight: 800, fontSize: 15 }}>{g.label}</div>
                      <div style={{ display: 'flex', gap: 6, marginTop: 3, flexWrap: 'wrap' }}>
                        {g.features.map(f => (
                          <span key={f} style={{ color: C.sub, fontSize: 10 }}>
                            <span style={{ color: g.color, fontSize: 9 }}>✓</span> {f}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  {isSelected && (
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: g.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ color: 'white', fontSize: 13 }}>✓</span>
                    </div>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex' }}>
                <button onClick={() => F('plan', g.monthly.id)} style={{
                  flex: 1, padding: '12px 10px',
                  background: isSelectedMonthly ? `${g.color}10` : 'transparent',
                  border: 'none', borderRight: `1px solid ${C.border}`,
                  cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center'
                }}>
                  <div style={{ color: isSelectedMonthly ? g.color : C.text, fontWeight: 800, fontSize: 16 }}>{g.monthly.price}€</div>
                  <div style={{ color: C.muted, fontSize: 10 }}>/ mois · Mensuel</div>
                </button>
                <button onClick={() => F('plan', g.annual.id)} style={{
                  flex: 1, padding: '12px 10px',
                  background: isSelectedAnnual ? `${g.color}10` : 'transparent',
                  border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center', position: 'relative'
                }}>
                  <div style={{ position: 'absolute', top: -1, right: 6, background: g.color, color: 'white', fontSize: 8, fontWeight: 700, padding: '1px 6px', borderRadius: '0 0 6px 6px' }}>
                    -{Math.round((1 - g.annual.price / (g.monthly.price || 1)) * 100)}%
                  </div>
                  <div style={{ color: isSelectedAnnual ? g.color : C.text, fontWeight: 800, fontSize: 16 }}>{g.annual.price}€</div>
                  <div style={{ color: C.muted, fontSize: 10 }}>/ mois · Annuel</div>
                </button>
              </div>
            </div>
          )
        })}

        <div style={{ background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.2)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: '#eab308' }}>
          💳 Paiement en ligne disponible prochainement.
        </div>

        <div style={{ background: 'rgba(0,102,255,0.04)', border: '1px solid rgba(0,102,255,0.15)', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <input type="checkbox" id="cgu_consent" checked={form.cgu || false} onChange={e => F('cgu', e.target.checked)}
              style={{ width: 18, height: 18, marginTop: 2, cursor: 'pointer', accentColor: '#0066FF', flexShrink: 0 }} />
            <label htmlFor="cgu_consent" style={{ color: C.text, fontSize: 12, lineHeight: 1.5, cursor: 'pointer' }}>
              J'ai lu et j'accepte les{' '}
              <button onClick={() => F('showCGU', true)} type="button" style={{ background: 'none', border: 'none', color: '#0066FF', fontSize: 12, fontWeight: 700, cursor: 'pointer', padding: 0, textDecoration: 'underline', fontFamily: 'inherit' }}>
                Conditions Générales d'Utilisation
              </button>
              {' '}de StuDiscount.
            </label>
          </div>
        </div>

        {form.showCGU && <ModalCGU onClose={() => F('showCGU', false)} />}

        {error && <div style={{ background: 'rgba(239,68,68,0.1)', borderRadius: 8, padding: '10px 12px', marginBottom: 14, color: '#ef4444', fontSize: 13 }}>⚠️ {error}</div>}
        {!form.cgu && <div style={{ color: '#9CA3AF', fontSize: 11, marginBottom: 8, textAlign: 'center' }}>Vous devez accepter les CGU pour créer votre compte</div>}
        <Btn onClick={submit} loading={saving} disabled={!form.cgu}>Créer mon compte prestataire →</Btn>
      </div>
    </PrestPageShell>
  )
}