import { useState } from 'react'
import { getC } from '../../constants.js'
import { getPlanInfo } from '../../utils.js'

export default function FacturePrestataire({ prestataire, visites }) {
  const C = getC()
  const [detailMois, setDetailMois] = useState(null)
  const plan = prestataire?.plan || 'trial'
  const t = window.SIOK_TARIFS || {}

  const commPct = plan === 'base' ? (window.SIOK_PARAMS?.base_commission || 15)
    : (plan || '').includes('standard') ? (window.SIOK_PARAMS?.standard_commission || 9)
    : (plan || '').includes('premium') ? (window.SIOK_PARAMS?.premium_commission || 5) : 0

  const prixAbo = plan === 'standard_monthly' ? (t.standard_mensuel || 49.90)
    : plan === 'standard_annual' ? (t.standard_annuel || 39.90)
    : plan === 'premium_monthly' ? (t.premium_mensuel || 79.90)
    : plan === 'premium_annual' ? (t.premium_annuel || 59.90) : 0

  const now = new Date()
  const moisList = []
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const m = d.getMonth(), y = d.getFullYear()
    const debut = new Date(y, m, 1), fin = new Date(y, m + 1, 0, 23, 59, 59)
    const label = d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })
    const key = `${y}-${m}`
    const vMois = visites.filter(v => { const vd = new Date(v.created_at); return vd >= debut && vd <= fin })
    const ca = vMois.filter(v => v.montant_remise > 0).reduce((s, v) => s + (v.montant_remise || 0), 0)
    const comm = ca * commPct / 100
    const planDebut = prestataire?.plan_debut ? new Date(prestataire.plan_debut) : null
    const aboMois = (planDebut && planDebut > fin) ? 0 : prixAbo
    const total = aboMois + comm
    moisList.push({ label, key, vMois, ca, comm, total, aboMois, nbVentes: vMois.filter(v => v.montant_remise > 0).length, isCurrent: i === 0 })
  }

  return (
    <div style={{ padding: '0 0 16px' }}>
      <div style={{ background: '#000000', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: '14px 18px', marginBottom: 12 }}>
        <div style={{ color: '#FFFFFF', fontWeight: 800, fontSize: 15 }}>💶 Facturation — {prestataire?.nom}</div>
        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 2 }}>
          Plan {getPlanInfo(plan)?.name || plan} · Commission {commPct}%
        </div>
      </div>

      <div style={{ overflowX: 'auto', marginBottom: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: `120px repeat(${moisList.length},minmax(80px,1fr))`, minWidth: 560 }}>
          <div />
          {moisList.map(m => (
            <div key={m.key} style={{ background: '#000000', border: '1px solid rgba(255,255,255,0.1)', padding: '6px 4px', textAlign: 'center' }}>
              <div style={{ color: '#FFFFFF', fontWeight: 700, fontSize: 11 }}>{m.label}</div>
              {m.isCurrent && <div style={{ color: '#4D9EFF', fontSize: 9, fontWeight: 700 }}>EN COURS</div>}
            </div>
          ))}

          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', padding: '8px 10px', color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: 600 }}>Abonnement</div>
          {moisList.map(m => (
            <div key={m.key} style={{ border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)', padding: '8px 4px', textAlign: 'center' }}>
              <div style={{ color: '#FFFFFF', fontWeight: 700, fontSize: 12 }}>{m.aboMois.toFixed(2)} €</div>
            </div>
          ))}

          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', padding: '8px 10px', color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: 600, lineHeight: 1.4 }}>
            Ventes<br />CA remisé<br />Commission
          </div>
          {moisList.map(m => (
            <div key={m.key} style={{ border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)', padding: '8px 4px', textAlign: 'center' }}>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10 }}>{m.nbVentes} vte{m.nbVentes !== 1 ? 's' : ''}</div>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10 }}>{m.ca.toFixed(2)} €</div>
              <div style={{ color: 'rgba(255,165,0,0.8)', fontSize: 10, fontWeight: 700 }}>{m.comm.toFixed(2)} €</div>
            </div>
          ))}

          <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(255,255,255,0.06)', padding: '8px 10px', color: '#F59E0B', fontSize: 11, fontWeight: 800 }}>TOTAL HT</div>
          {moisList.map(m => (
            <div key={m.key} onClick={() => setDetailMois(detailMois?.key === m.key ? null : m)}
              style={{ border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(245,158,11,0.06)', padding: '8px 4px', textAlign: 'center', cursor: 'pointer' }}>
              <div style={{ color: '#F59E0B', fontWeight: 900, fontSize: 13 }}>{m.total.toFixed(2)} €</div>
              <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9 }}>détail →</div>
            </div>
          ))}

          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', padding: '8px 10px', color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: 600 }}>Statut</div>
          {moisList.map(m => (
            <div key={m.key} style={{ border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)', padding: '8px 4px', textAlign: 'center' }}>
              {m.isCurrent
                ? <span style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444', fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 10 }}>🔴 À payer</span>
                : <span style={{ background: 'rgba(34,197,94,0.15)', color: '#22C55E', fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 10 }}>✅ Réglé</span>
              }
            </div>
          ))}
        </div>
      </div>

      {detailMois && (
        <div style={{ background: '#000000', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 14, padding: '14px 18px', marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ color: '#FFFFFF', fontWeight: 800, fontSize: 14 }}>Détail — {detailMois.label}</div>
            <button onClick={() => setDetailMois(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 18 }}>✕</button>
          </div>
          {detailMois.vMois.length === 0
            ? <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, textAlign: 'center', padding: '12px 0' }}>Aucune vente</div>
            : <>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 0, marginBottom: 4 }}>
                {['Date / Offre', 'Montant remisé', 'Commission', 'Facturé'].map(h => (
                  <div key={h} style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: 700, padding: '4px 6px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>{h}</div>
                ))}
              </div>
              {detailMois.vMois.map(v => (
                <div key={v.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ padding: '5px 6px' }}>
                    <div style={{ color: '#FFFFFF', fontSize: 11, fontWeight: 600 }}>{v.offres?.titre || 'Offre'}</div>
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9 }}>{new Date(v.created_at).toLocaleDateString('fr-FR')}</div>
                  </div>
                  <div style={{ padding: '5px 6px', color: 'rgba(255,255,255,0.7)', fontSize: 11, textAlign: 'right' }}>{v.montant_remise ? v.montant_remise.toFixed(2) + ' €' : '—'}</div>
                  <div style={{ padding: '5px 6px', color: 'rgba(255,165,0,0.8)', fontSize: 11, textAlign: 'right' }}>{v.montant_remise ? (v.montant_remise * commPct / 100).toFixed(2) + ' €' : '—'}</div>
                  <div style={{ padding: '5px 6px', color: '#F59E0B', fontSize: 11, fontWeight: 700, textAlign: 'right' }}>{v.montant_remise ? (v.montant_remise * commPct / 100).toFixed(2) + ' €' : '—'}</div>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 6px', borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: 4 }}>
                <span style={{ color: '#FFFFFF', fontWeight: 800, fontSize: 13 }}>Total HT</span>
                <span style={{ color: '#F59E0B', fontWeight: 900, fontSize: 15 }}>{detailMois.total.toFixed(2)} €</span>
              </div>
            </>
          }
        </div>
      )}

      {[
        'Tous les tarifs sont HT.',
        "Tous les abonnements sont mensuels. Le changement d'abonnement devient effectif à la date anniversaire, sauf pour le passage de l'offre Trial/Essai vers une autre formule qui est immédiat.",
        'Le montant dû est exigible le dernier jour du mois par paiement sur STRIPE.',
        "Tout défaut de paiement dans les 2 jours entraîne automatiquement la mise en suspend de toutes les offres du prestataire.",
      ].map((m, i) => (
        <div key={i} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 10, padding: '8px 14px', marginBottom: 6, color: 'rgba(255,255,255,0.4)', fontSize: 10, lineHeight: 1.6 }}>{m}</div>
      ))}
    </div>
  )
}