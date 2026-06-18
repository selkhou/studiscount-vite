import { useState, useRef } from 'react'
import { getC } from '../../constants.js'
import { db } from '../../lib/supabase.js'

const SUPABASE_URL = 'https://ghwozyzlhcmuhneumasv.supabase.co'
const SUPABASE_KEY = window.SUPABASE_KEY
const PK_STRIPE = 'pk_test_51TjGVAHjmfGtupgKsbm9qvZnWJDVQxg8vNRNqpOsI0URSvitZhbpFRu5BGTdxOmH3A6RiF84yYMho1InDxSZR6XS00vMbqUqpT'

export default function StripeSetupCard({ prestataire, onUpdated }) {
  const C = getC()
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [cardElement, setCardElement] = useState(null)
  const [stripe, setStripe] = useState(null)
  const cardRef = useRef(null)

  const callFn = async (name, body) => {
    const r = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      },
      body: JSON.stringify(body),
    })
    const d = await r.json()
    if (!r.ok) throw new Error(d.error || 'Erreur serveur')
    return d
  }

  const openForm = async () => {
    setLoading(true); setMsg('')
    try {
      const stripeObj = window.Stripe(PK_STRIPE)
      setStripe(stripeObj)

      let customerId = prestataire.stripe_customer_id
      if (!customerId) {
        const { customer_id } = await callFn('create-stripe-customer', {
          prestataire_id: prestataire.id,
          email: prestataire.email,
          nom: prestataire.nom,
        })
        customerId = customer_id
        await db().from('prestataires').update({ stripe_customer_id: customerId }).eq('id', prestataire.id)
        if (onUpdated) onUpdated({ stripe_customer_id: customerId })
      }

      const { client_secret } = await callFn('create-setup-intent', { customer_id: customerId })
      setShowForm({ client_secret, customerId })

      setTimeout(() => {
        if (!cardRef.current) return
        const elements = stripeObj.elements()
        const card = elements.create('card', {
          hidePostalCode: true,
          style: {
            base: { fontSize: '14px', color: '#FFFFFF', fontFamily: 'inherit', '::placeholder': { color: 'rgba(255,255,255,0.4)' } },
            invalid: { color: '#EF4444' }
          },
        })
        card.mount(cardRef.current)
        setCardElement(card)
      }, 100)
    } catch (e) { setMsg('❌ ' + e.message) }
    setLoading(false)
  }

  const confirmCard = async () => {
    if (!stripe || !cardElement || !showForm) return
    setLoading(true); setMsg('')
    try {
      const { error, setupIntent } = await stripe.confirmCardSetup(showForm.client_secret, {
        payment_method: { card: cardElement },
      })
      if (error) throw new Error(error.message)
      await db().from('prestataires').update({ stripe_payment_method_id: setupIntent.payment_method }).eq('id', prestataire.id)
      if (onUpdated) onUpdated({ stripe_payment_method_id: setupIntent.payment_method })
      setMsg('✅ Carte enregistrée avec succès !')
      setShowForm(false)
      setCardElement(null)
    } catch (e) { setMsg('❌ ' + e.message) }
    setLoading(false)
  }

  const hasCard = prestataire?.stripe_payment_method_id

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 16, marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: hasCard ? 8 : 0 }}>
        <div>
          <div style={{ color: C.text, fontWeight: 700, fontSize: 13 }}>💳 Moyen de paiement</div>
          {hasCard
            ? <div style={{ color: '#22C55E', fontSize: 12, marginTop: 2 }}>✅ Carte enregistrée</div>
            : <div style={{ color: '#F59E0B', fontSize: 12, marginTop: 2 }}>⚠️ Aucune carte — requis pour la facturation</div>
          }
        </div>
        {!showForm && (
          <button onClick={openForm} disabled={loading} style={{
            padding: '6px 14px', borderRadius: 8, border: 'none',
            background: '#0066FF', color: 'white', fontSize: 12, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'inherit'
          }}>
            {loading ? '...' : (hasCard ? 'Modifier' : 'Enregistrer')}
          </button>
        )}
      </div>

      {showForm && (
        <div style={{ marginTop: 12 }}>
          <div style={{ color: C.muted, fontSize: 11, marginBottom: 8 }}>Saisissez vos coordonnées bancaires (sécurisé par Stripe)</div>
          <div ref={cardRef} style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid ${C.border}`, borderRadius: 10, padding: '12px 14px', marginBottom: 12 }} />
          {msg && <div style={{ fontSize: 12, color: msg.startsWith('✅') ? '#22C55E' : '#EF4444', marginBottom: 8 }}>{msg}</div>}
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={confirmCard} disabled={loading} style={{
              flex: 1, padding: '10px', borderRadius: 10, border: 'none',
              background: '#0066FF', color: 'white', fontSize: 13, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit'
            }}>
              {loading ? 'Enregistrement...' : '✓ Confirmer la carte'}
            </button>
            <button onClick={() => { setShowForm(false); setCardElement(null); setMsg('') }} style={{
              padding: '10px 14px', borderRadius: 10,
              border: `1px solid ${C.border}`, background: 'transparent',
              color: C.muted, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit'
            }}>
              Annuler
            </button>
          </div>
        </div>
      )}
      {!showForm && msg && <div style={{ fontSize: 12, color: msg.startsWith('✅') ? '#22C55E' : '#EF4444', marginTop: 8 }}>{msg}</div>}
    </div>
  )
}