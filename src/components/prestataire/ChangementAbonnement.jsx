import { useState, useEffect } from 'react'
import { getC } from '../../constants.js'
import { db } from '../../lib/supabase.js'
import { getPlanInfo } from '../../utils.js'

export default function ChangementAbonnement({ plan, prestataireId, planDebut, hasCard, onClose, onChanged }) {
  const C = getC()
  const [selected, setSelected] = useState(plan || 'trial')
  const [saving, setSaving] = useState(false)
  const [historique, setHistorique] = useState([])
  const [showHisto, setShowHisto] = useState(false)

  const t = window.SIOK_TARIFS || {}

  useEffect(() => {
    if (!prestataireId) return
    db().from('abonnements_historique')
      .select('*').eq('prestataire_id', prestataireId)
      .order('created_at', { ascending: false }).limit(10)
      .then(({ data }) => setHistorique(data || []))
  }, [prestataireId])

  const GROUPES = [
    {
      id: 'trial', label: 'Essai gratuit', color: '#22C55E', icon: '🎁',
      features: ['1 offre/mois', '1 photo/offre', 'Gratuit — sans CB'],
      ids: ['trial']
    },
    {
      id: 'base', label: 'Base', color: '#6B7280', icon: '🔧',
      features: ['Offres illimitées', '2 photos/offre', `Commission ${t.base_commission || 15}% par vente`],
      ids: ['base']
    },
    {
      id: 'standard', label: 'Standard', color: '#0066FF', icon: '📊',
      features: ['5 offres/mois', '3 photos/offre', '📊 Stats', `Commission ${t.standard_commission || 9}%`],
      ids: ['standard_monthly', 'standard_annual']
    },
    {
      id: 'premium', label: 'Premium', color: '#7C3AED', icon: '👑',
      features: ['Offres illimitées', '5 photos/offre', '📊 Reporting', `Commission ${t.premium_commission || 5}%`],
      ids: ['premium_monthly', 'premium_annual']
    },
  ]

  const isPlanTrial = p => p === 'trial' || p === 'base'
  const currentIsPayant = plan && !isPlanTrial(plan)
  const needCard = selected !== 'trial' && selected !== 'base' && !hasCard

  const getDateEffet = (planActuel) => {
    if (isPlanTrial(planActuel)) return new Date()
    const debut = planDebut ? new Date(planDebut) : new Date()
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth() + 1, debut.getDate())
  }

  const effectImmédiat = isPlanTrial(plan)
  const dateEffetAffichee = selected !== plan ? getDateEffet(plan) : null

  const handleConfirm = async () => {
    setSaving(true)
    const dateEffet = getDateEffet(plan)
    await db().from('abonnements_historique').insert({
      prestataire_id: prestataireId,
      plan_ancien: plan, plan_nouveau: selected,
      date_changement: new Date().toISOString(),
      date_effet: dateEffet.toISOString(),
    })
    if (effectImmédiat) {
      await db().from('prestataires').update({
        plan: selected, plan_debut: new Date().toISOString(),
      }).eq('id', prestataireId)
    }
    await onChanged(selected, dateEffet, effectImmédiat)
    setSaving(false)
  }

  const opts = g => g.id === 'trial'
    ? [{ id: 'trial', label: 'Essai gratuit', prix: 'Gratuit' }]
    : g.id === 'base'
    ? [{ id: 'base', label: 'Base', prix: `0€ + ${t.base_commission || 15}% commission` }]
    : g.id === 'standard'
    ? [{ id: 'standard_monthly', label: 'Mensuel', prix: `${t.standard_mensuel}€/mois` }, { id: 'standard_annual', label: 'Annuel', prix: `${t.standard_annuel}€/mois` }]
    : [{ id: 'premium_monthly', label: 'Mensuel', prix: `${t.premium_mensuel}€/mois` }, { id: 'premium_annual', label: 'Annuel', prix: `${t.premium_annuel}€/mois` }]

  return (
    <div>
      <div style={{ color: C.text, fontWeight: 700, fontSize: 13, marginBottom: 4 }}>📦 Changer d'abonnement</div>
      <div style={{ color: C.muted, fontSize: 11, marginBottom: 12 }}>
        Plan actuel : <strong style={{ color: C.text }}>{getPlanInfo(plan)?.name || plan}</strong>
      </div>

      {GROUPES.map(g => {
        const trialBlocked = g.id === 'trial' && currentIsPayant
        const groupOpts = opts(g)
        return (
          <div key={g.id} style={{
            background: trialBlocked ? 'rgba(0,0,0,0.03)' : g.ids.includes(selected) ? `${g.color}10` : C.surface,
            border: `1.5px solid ${trialBlocked ? '#E5E7EB' : g.ids.includes(selected) ? g.color : C.border}`,
            borderRadius: 12, padding: '10px 12px', marginBottom: 8, opacity: trialBlocked ? 0.6 : 1
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <span style={{ fontSize: 16 }}>{g.icon}</span>
              <span style={{ color: trialBlocked ? C.muted : g.color, fontWeight: 700, fontSize: 13 }}>{g.label}</span>
              {trialBlocked && <span style={{ fontSize: 10, color: '#EF4444', fontWeight: 600, marginLeft: 4 }}>— Non disponible</span>}
            </div>
            <div style={{ color: C.muted, fontSize: 10, marginBottom: 8 }}>{g.features.join(' · ')}</div>
            {trialBlocked
              ? <div style={{ background: 'rgba(239,68,68,0.08)', borderRadius: 8, padding: '6px 10px', fontSize: 11, color: '#EF4444', fontWeight: 600 }}>
                  ⛔ Vous ne pouvez pas revenir à cette option
                </div>
              : <div style={{ display: 'flex', gap: 6 }}>
                {groupOpts.map(o => (
                  <button key={o.id} onClick={() => setSelected(o.id)} style={{
                    flex: 1, padding: '6px 4px', borderRadius: 8,
                    border: `1.5px solid ${selected === o.id ? g.color : C.border}`,
                    background: selected === o.id ? `${g.color}18` : 'transparent',
                    color: selected === o.id ? g.color : C.muted,
                    fontSize: 10, fontWeight: selected === o.id ? 700 : 400,
                    cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center'
                  }}>
                    <div>{o.label}</div>
                    <div style={{ fontWeight: 700 }}>{o.prix}</div>
                  </button>
                ))}
              </div>
            }
          </div>
        )
      })}

      {dateEffetAffichee && selected !== plan && (
        <div style={{
          background: effectImmédiat ? 'rgba(34,197,94,0.08)' : 'rgba(234,179,8,0.08)',
          border: `1px solid ${effectImmédiat ? 'rgba(34,197,94,0.2)' : 'rgba(234,179,8,0.2)'}`,
          borderRadius: 8, padding: '8px 12px', marginBottom: 8, fontSize: 11,
          color: effectImmédiat ? '#22C55E' : '#eab308'
        }}>
          {effectImmédiat
            ? '✅ Changement immédiat'
            : `📅 Effectif le ${dateEffetAffichee.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}`
          }
        </div>
      )}

      <div style={{ background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.2)', borderRadius: 8, padding: '8px 12px', marginBottom: 8, fontSize: 11, color: '#eab308' }}>
        💳 Paiement en ligne disponible prochainement.
      </div>

      {needCard && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '8px 12px', marginBottom: 8, fontSize: 11, color: '#EF4444' }}>
          💳 Un moyen de paiement est requis pour cette formule.
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <button onClick={handleConfirm}
          disabled={selected === plan || saving || needCard}
          style={{
            flex: 1, padding: '9px 0', borderRadius: 10, border: 'none',
            background: (selected === plan || needCard) ? 'rgba(107,114,128,0.15)' : '#7C3AED',
            color: (selected === plan || needCard) ? '#6b7280' : 'white',
            fontSize: 12, fontWeight: 700,
            cursor: (selected === plan || needCard) ? 'default' : 'pointer',
            fontFamily: 'inherit'
          }}>
          {saving ? '…' : selected === plan ? 'Plan actuel' : needCard ? 'Carte requise' : 'Confirmer le changement'}
        </button>
        <button onClick={onClose} style={{
          padding: '9px 14px', borderRadius: 10,
          border: `1px solid ${C.border}`, background: 'transparent',
          color: C.muted, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit'
        }}>
          Annuler
        </button>
      </div>

      {historique.length > 0 && (
        <div>
          <button onClick={() => setShowHisto(!showHisto)} style={{ background: 'none', border: 'none', color: C.muted, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}>
            {showHisto ? '▲' : '▼'} Historique ({historique.length})
          </button>
          {showHisto && (
            <div style={{ marginTop: 8, borderTop: `1px solid ${C.border}`, paddingTop: 8 }}>
              {historique.map(h => (
                <div key={h.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: `1px solid ${C.border}` }}>
                  <div style={{ color: C.muted, fontSize: 11 }}>{h.plan_ancien} → {h.plan_nouveau}</div>
                  <div style={{ color: C.sub, fontSize: 10, textAlign: 'right' }}>
                    <div>Demandé le {new Date(h.date_changement).toLocaleDateString('fr-FR')}</div>
                    <div>Effectif le {new Date(h.date_effet).toLocaleDateString('fr-FR')}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}