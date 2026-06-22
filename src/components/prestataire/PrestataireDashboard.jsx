import React, { useState, useEffect, useRef } from 'react'
import { getC } from '../../constants.js'
import { db } from '../../lib/supabase.js'
import {
  getTypeMetier, isOffreActive, fmtDate,
  planHasStats, planHasIA, planMaxOffres, getPlanInfo, planLabel
} from '../../utils.js'
import { loadParams } from '../../utils.js'
import { PrestPageShell } from '../ui/PageShells.jsx'
import Btn from '../ui/Btn.jsx'
import ModalCGU from '../ui/ModalCGU.jsx'
import ChangePassword from '../ui/ChangePassword.jsx'
import QRScanner from '../qr/QRScanner.jsx'
import OffreEditor from './OffreEditor.jsx'
import StripeSetupCard from './StripeSetupCard.jsx'
import ChangementAbonnement from './ChangementAbonnement.jsx'
import EditProfilPrestataire from './EditProfilPrestataire.jsx'
import ActivityChart from './ActivityChart.jsx'
import FacturePrestataire from './FacturePrestataire.jsx'
import ConseilIA from './ConseilIA.jsx' // conservé pour usage futur
import BoutonSuggestion from '../ui/BoutonSuggestion.jsx'

export default function PrestataireDashboard({ user, onLogout, onHome }) {
  const C = getC()
  const [active, setActive] = useState(null)
  const [offres, setOffres] = useState([])
  const [visites, setVisites] = useState([])
  const [vuesMap, setVuesMap] = useState({})
  const [vuesData, setVuesData] = useState([])
  const [impressionsMap, setImpressionsMap] = useState({})
  const [impressionsData, setImpressionsData] = useState([])
  const [view, setView] = useState('dashboard')
  const [showChangePwd, setShowChangePwd] = useState(false)
  const [showCGUPresta, setShowCGUPresta] = useState(false)
  const [editingOffre, setEditingOffre] = useState(null)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [dashTab, setDashTab] = useState('offres')
  const [activeKpi, setActiveKpi] = useState(null)
  const [bgColor, setBgColor] = useState(window.SIOK_PARAMS?.fond_couleur_presta || '#0C0D0F')
  const [headerColor, setHeaderColor] = useState(window.SIOK_PARAMS?.fond_header_presta || null)
  const activeRef = useRef(null)
  const [offreAvis, setOffreAvis] = useState(null)

  useEffect(() => { activeRef.current = active }, [active])

  useEffect(() => {
    loadParams().then(() => {
      setBgColor(window.SIOK_PARAMS?.fond_couleur_presta || '#0C0D0F')
      setHeaderColor(window.SIOK_PARAMS?.fond_header_presta || null)
    })
    loadPrestataires()
    const onFocus = () => {
      const a = activeRef.current
      if (a) { loadVisitesPrest(a.id); loadVues(a.id) }
    }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [])

  const loadPrestataires = async () => {
    setLoading(true)
    try {
      const { data } = await db().from('prestataires').select('*').eq('auth_id', user.id)
      if (data && data.length > 0) {
        setActive(data[0])
        await loadOffres(data[0].id)
        await loadVisitesPrest(data[0].id)
        await loadVues(data[0].id)
      }
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const loadOffres = async prestId => {
    const { data } = await db().from('offres')
      .select('*, visites(id,note,avis,photo_url,statut_avis,created_at,etudiants(prenom))')
      .eq('prestataire_id', prestId)
      .order('created_at', { ascending: false })
    setOffres(data || [])
  }

  const loadVisitesPrest = async prestId => {
    const { data } = await db().from('visites')
      .select('id,prestataire_id,offre_id,montant_remise,montant_normal,created_at,etudiant_id,etudiant_anon_id,avis,note,photo_url,statut_avis,offres(titre,type_offre,promo_pct,prix)')
      .eq('prestataire_id', prestId)
      .order('created_at', { ascending: false }).limit(200)
    if (data) setVisites(data)
  }

  const loadVues = async prestId => {
    if (!prestId) return
    const { data: offresData } = await db().from('offres').select('id').eq('prestataire_id', prestId)
    if (!offresData || offresData.length === 0) return
    const ids = offresData.map(o => o.id)
    const [{ data: vuesRaw }, { data: impRaw }] = await Promise.all([
      db().from('vues_offres').select('offre_id,created_at').in('offre_id', ids).order('created_at', { ascending: false }).limit(2000),
      db().from('impressions_offres').select('offre_id,created_at').in('offre_id', ids).order('created_at', { ascending: false }).limit(5000),
    ])
    if (vuesRaw) {
      const map = {}; vuesRaw.forEach(v => { map[v.offre_id] = (map[v.offre_id] || 0) + 1 })
      setVuesMap(map); setVuesData(vuesRaw)
    }
    if (impRaw) {
      const map = {}; impRaw.forEach(v => { map[v.offre_id] = (map[v.offre_id] || 0) + 1 })
      setImpressionsMap(map); setImpressionsData(impRaw)
    }
  }

  const toggleOffre = async offre => {
    const next = !offre.active
    await db().from('offres').update({ active: next }).eq('id', offre.id)
    setOffres(os => os.map(o => o.id === offre.id ? { ...o, active: next } : o))
    setToast({ msg: next ? 'Offre activée ✅' : 'Offre désactivée', type: next ? 'success' : 'info' })
    setTimeout(() => setToast(null), 2500)
  }

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 2500)
  }

  if (loading) return (
    <div style={{ background: bgColor || C.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted }}>
      Chargement…
    </div>
  )

  if (active?.statut === 'suspendu') return (
    <div style={{ background: C.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: C.card, border: '1px solid rgba(239,68,68,0.3)', borderRadius: 20, padding: 32, maxWidth: 400, textAlign: 'center' }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>⛔</div>
        <div style={{ color: '#EF4444', fontWeight: 900, fontSize: 20, marginBottom: 8 }}>Compte suspendu</div>
        <div style={{ color: C.muted, fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>
          Votre compte a été suspendu.
          {active.motif_suspension && <><br />Motif : <strong style={{ color: C.text }}>{active.motif_suspension}</strong></>}
        </div>
        <button onClick={onLogout} style={{ padding: '10px 20px', borderRadius: 12, border: 'none', background: 'rgba(239,68,68,0.1)', color: '#EF4444', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
          Se déconnecter
        </button>
      </div>
    </div>
  )

  if (!active) return (
    <PrestPageShell onBack={onLogout} backLabel="Déconnexion" bgColor={bgColor} headerColor={headerColor}>
      <div style={{ padding: 24, textAlign: 'center', color: C.muted }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🏪</div>
        <div style={{ color: C.text, fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Aucun profil prestataire</div>
        <div style={{ fontSize: 13, marginBottom: 24 }}>Contactez l'administrateur StuDiscount.</div>
        <Btn variant="outline" onClick={onLogout}>Se déconnecter</Btn>
      </div>


    </PrestPageShell>
  )

  if (view === 'scanner') return (
    <QRScanner
      prestataireId={active.id}
      onScanned={async () => {
        await loadOffres(active.id)
        await loadVisitesPrest(active.id)
        await loadVues(active.id)
        showToast('✅ Visite validée !')
      }}
      onClose={() => setView('dashboard')}
    />
  )

  if (view === 'edit-offre' || view === 'new-offre') return (
    <OffreEditor
      offre={editingOffre}
      prestataireId={active.id}
      onBack={() => { setView('dashboard'); setEditingOffre(null) }}
      onSaved={async () => {
        await loadOffres(active.id)
        setView('dashboard'); setEditingOffre(null)
        showToast('Offre sauvegardée ✅')
      }}
    />
  )

  const type = getTypeMetier(active.type_metier)

  return (
    <PrestPageShell
      onBack={dashTab === 'offres' ? onLogout : () => setDashTab('offres')}
      backLabel={dashTab === 'offres' ? 'Déconnexion' : '← Offres'}
      onHome={onHome} bgColor={bgColor} headerColor={headerColor}
      topSlot={
        <div>
          {toast && (
            <div style={{ background: toast.type === 'success' ? 'rgba(34,197,94,0.15)' : 'rgba(0,102,255,0.1)', border: `1px solid ${toast.type === 'success' ? 'rgba(34,197,94,0.4)' : C.accent}`, borderRadius: 10, padding: '8px 14px', marginBottom: 8, color: toast.type === 'success' ? '#22c55e' : C.accent, fontSize: 13, fontWeight: 600 }}>
              {toast.msg}
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ fontSize: 28 }}>{type.emoji}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <div style={{ color: C.text, fontWeight: 800, fontSize: 16 }}>{active.nom}</div>
                <div style={{
                  background: active.plan?.includes('premium') ? 'rgba(124,58,237,0.15)' :
                    active.plan?.includes('standard') ? 'rgba(0,102,255,0.15)' :
                      active.plan === 'trial' ? 'rgba(34,197,94,0.15)' : 'rgba(107,114,128,0.15)',
                  color: active.plan?.includes('premium') ? '#7C3AED' :
                    active.plan?.includes('standard') ? '#0066FF' :
                      active.plan === 'trial' ? '#22C55E' : '#6B7280',
                  fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                  whiteSpace: 'nowrap'
                }}>
                  {active.plan === 'trial' ? '🎁 Essai' :
                    active.plan?.includes('standard') ? '📊 Standard' :
                      active.plan?.includes('premium') ? '👑 Premium' : '🔧 Base'}
                  {active.plan_fin && ` · ${new Date(active.plan_fin) < new Date() ? '⚠️ Expiré' : `fin ${new Date(active.plan_fin).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}`}`}
                </div>
              </div>
              <div style={{ color: C.muted, fontSize: 12 }}>{type.label} · {active.ville}</div>
            </div>
            <BoutonSuggestion nom={active.nom} type="prestataire" />

          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { v: 'offres', l: '🎯 Offres' },
              { v: 'stats', l: '📊 Stats', locked: !planHasStats(active?.plan) },
              { v: 'facture', l: '💶 Facture' },
              { v: 'profil', l: '👤 Profil' }
            ].map(t => (
              <button key={t.v} onClick={() => !t.locked && setDashTab(t.v)} style={{
                flex: 1, padding: '9px 0', borderRadius: 10,
                border: `1px solid ${dashTab === t.v ? C.accent : C.border}`,
                background: dashTab === t.v ? C.accentSoft : t.locked ? 'rgba(107,114,128,0.05)' : 'transparent',
                color: dashTab === t.v ? C.accent : C.muted,
                fontSize: 11, fontWeight: dashTab === t.v ? 700 : 400,
                cursor: t.locked ? 'default' : 'pointer', fontFamily: 'inherit', opacity: t.locked ? 0.5 : 1
              }}>
                {t.locked ? '🔒 ' : ''}{t.l}
              </button>
            ))}
          </div>
        </div>
      }
    >
      <div style={{ padding: '16px 20px' }}>

        {/* Onglet Offres */}
        {dashTab === 'offres' && (
          <div>
            <button onClick={() => setView('scanner')} style={{
              width: '100%', padding: '16px', borderRadius: 14, border: 'none',
              background: 'linear-gradient(135deg,#22C55E,#16A34A)', color: 'white',
              fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
              marginBottom: 12, boxShadow: '0 4px 16px rgba(34,197,94,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10
            }}>
              <span style={{ fontSize: 22 }}>📷</span>
              <span>Scanner le QR code étudiant</span>
            </button>

            {(() => {
              const nbActives = offres.filter(o => isOffreActive(o)).length
              const maxO = planMaxOffres(active?.plan)
              const blocked = nbActives >= maxO
              return (
                <button onClick={() => { if (!blocked) { setEditingOffre(null); setView('new-offre') } }}
                  style={{
                    width: '100%', padding: '12px', borderRadius: 14, border: 'none', marginBottom: 16,
                    background: blocked ? 'rgba(107,114,128,0.15)' : 'linear-gradient(135deg,#0066FF,#3399FF)',
                    color: blocked ? '#6b7280' : 'white', fontSize: 13, fontWeight: 700,
                    cursor: blocked ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                    boxShadow: blocked ? 'none' : '0 3px 12px rgba(0,102,255,0.3)'
                  }}>
                  {blocked ? `🔒 Limite atteinte (${nbActives}/${maxO})` : '+ Nouvelle offre'}
                </button>
              )
            })()}

            {offres.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: C.muted }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🎯</div>
                <div style={{ color: C.text, fontWeight: 700, marginBottom: 6 }}>Aucune offre</div>
                <div style={{ fontSize: 13 }}>Créez votre première offre promotionnelle</div>
              </div>
            )}

            {offres.map(o => {
              const ot = getTypeMetier(o.type_offre)
              const nbVues = vuesMap[o.id] || 0
              const nbVisites = visites.filter(v => v.offre_id === o.id).length
              const conv = nbVues > 0 ? Math.round(nbVisites / nbVues * 100) : 0
              return (
                <div key={o.id} style={{ background: C.card, border: `1px solid ${o.active ? 'rgba(34,197,94,0.3)' : C.border}`, borderRadius: 14, padding: '14px 16px', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <span style={{ fontSize: 24 }}>{ot.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: C.text, fontWeight: 700, fontSize: 15 }}>{o.titre}</div>
                      <div style={{ color: C.muted, fontSize: 12 }}>{o.prix_normal ? `${o.prix_normal}€ · ` : ''}{o.permanente ? 'Permanente' : 'Temporaire'}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ color: C.muted, fontWeight: 700, fontSize: 12 }}>{nbVues}</div>
                        <div style={{ color: C.muted, fontSize: 8 }}>vues</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ color: '#0066FF', fontWeight: 800, fontSize: 13 }}>{nbVisites}</div>
                        <div style={{ color: C.muted, fontSize: 8 }}>visit.</div>
                      </div>
                      {nbVues > 0 && (
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ color: '#22c55e', fontWeight: 700, fontSize: 11 }}>{conv}%</div>
                          <div style={{ color: C.muted, fontSize: 8 }}>conv.</div>
                        </div>
                      )}
                    </div>
                    <div style={{ background: isOffreActive(o) ? 'rgba(34,197,94,0.15)' : 'rgba(107,114,128,0.15)', color: isOffreActive(o) ? '#22c55e' : '#6b7280', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>
                      {isOffreActive(o) ? 'Active' : 'Expirée'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <div style={{ background: C.accentSoft, color: C.accent, fontWeight: 900, fontSize: 16, padding: '4px 14px', borderRadius: 20 }}>-{o.promo_pct}%</div>
                    {!o.permanente && o.date_fin && <div style={{ color: C.muted, fontSize: 11 }}>⏰ jusqu'au {fmtDate(o.date_fin)}</div>}
                    {(() => {
                      const avisOffre = (o.visites || []).filter(v => v.statut_avis === 'validé' && v.avis)
                      const noteMoy = avisOffre.filter(v => v.note > 0).reduce((s, v, _, a) => s + v.note / a.length, 0)
                      return avisOffre.length > 0 ? (
                        <div onClick={() => setOffreAvis(o)} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: 0, marginLeft: 'auto' }}>
                          <span style={{ color: '#F59E0B', fontWeight: 800, fontSize: 13 }}>★ {noteMoy.toFixed(1)}</span>
                          <span style={{ color: C.muted, fontSize: 11 }}>{avisOffre.length} avis ›</span>
                        </div>
                      ) : null
                    })()}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => toggleOffre(o)} style={{
                      flex: 1, padding: '8px 0', borderRadius: 10,
                      border: `1px solid ${o.active ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)'}`,
                      background: o.active ? 'rgba(239,68,68,0.06)' : 'rgba(34,197,94,0.06)',
                      color: o.active ? '#ef4444' : '#22c55e',
                      fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit'
                    }}>
                      {o.active ? 'Désactiver' : 'Activer'}
                    </button>
                    <button onClick={() => { setEditingOffre(o); setView('edit-offre') }} style={{
                      flex: 1, padding: '8px 0', borderRadius: 10,
                      border: `1px solid ${C.border}`, background: 'transparent',
                      color: C.sub, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit'
                    }}>
                      ✏️ Modifier
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Onglet Stats */}
        {dashTab === 'stats' && (
          <div>
            {!planHasStats(active?.plan) && (
              <div style={{ background: 'linear-gradient(135deg,rgba(0,102,255,0.08),rgba(124,58,237,0.08))', border: '1px solid rgba(0,102,255,0.2)', borderRadius: 16, padding: '24px 20px', textAlign: 'center', marginBottom: 16 }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>
                <div style={{ color: C.text, fontWeight: 800, fontSize: 16, marginBottom: 6 }}>Statistiques disponibles en Standard</div>
                <div style={{ color: C.muted, fontSize: 13, marginBottom: 16, lineHeight: 1.6 }}>Passez en plan Standard pour accéder aux statistiques détaillées.</div>
              </div>
            )}
            {planHasStats(active?.plan) && (
              <>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
                  <button onClick={async () => { await loadVisitesPrest(active.id); await loadVues(active.id) }}
                    style={{ padding: '7px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#FFFFFF', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>
                    🔄 Actualiser
                  </button>
                </div>

                {/* KPIs 5 colonnes cliquables */}
                {(() => {
                  const nbOffresTotal = offres.length
                  const nbOffresActives = offres.filter(o => isOffreActive(o)).length
                  const kpis = [
                    { id: 'impr', l: 'Impr.', v: Object.values(impressionsMap).reduce((s, n) => s + n, 0), color: '#9CA3AF' },
                    { id: 'vues', l: 'Vues', v: Object.values(vuesMap).reduce((s, n) => s + n, 0), color: '#6B7280' },
                    { id: 'honorees', l: 'Honorées', v: visites.length, color: '#22C55E' },
                    { id: 'ca', l: 'CA €', v: visites.reduce((s, v) => s + (v.montant_remise || 0), 0).toFixed(0) + '€', color: '#F59E0B' },
                    { id: 'offres', l: 'Offres', v: `${nbOffresTotal}`, sub: `${nbOffresActives} active${nbOffresActives !== 1 ? 's' : ''}`, color: '#0066FF' },
                  ]
                  return (
                    <>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
                        {kpis.map(k => (
                          <div key={k.id} onClick={() => setActiveKpi(activeKpi === k.id ? null : k.id)}
                            style={{ background: activeKpi === k.id ? 'rgba(255,255,255,0.08)' : '#000000', border: activeKpi === k.id ? `1px solid ${k.color}` : '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '10px 6px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.15s' }}>
                            <div style={{ color: k.color, fontWeight: 800, fontSize: 18 }}>{k.v}</div>
                            {k.sub && <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 8, marginTop: 1 }}>{k.sub}</div>}
                            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 9, marginTop: 1 }}>{k.l}</div>
                          </div>
                        ))}
                      </div>

                      {/* Panneau détail KPI */}
                      {/* Panneau détail KPI — graphe barres style admin */}
                      {activeKpi && activeKpi !== 'offres' && (() => {
                        const now = new Date()
                        const parMois = Array.from({ length: 6 }, (_, i) => {
                          const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
                          const fin = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59)
                          const m = d.getMonth(), y = d.getFullYear()
                          const label = d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })
                          let nb = 0
                          if (activeKpi === 'impr') nb = (impressionsData || []).filter(v => { const vd = new Date(v.created_at); return vd.getMonth() === m && vd.getFullYear() === y }).length
                          if (activeKpi === 'vues') nb = vuesData.filter(v => { const vd = new Date(v.created_at); return vd.getMonth() === m && vd.getFullYear() === y }).length
                          if (activeKpi === 'honorees') nb = visites.filter(v => { const vd = new Date(v.created_at); return vd >= d && vd <= fin }).length
                          if (activeKpi === 'ca') nb = visites.filter(v => { const vd = new Date(v.created_at); return vd >= d && vd <= fin }).reduce((s, v) => s + (v.montant_remise || 0), 0)
                          return { label, nb, isCurrent: i === 0 }
                        })
                        const total = parMois.reduce((s, m) => s + m.nb, 0)
                        const maxM = Math.max(...parMois.map(m => m.nb), 1)
                        const color = activeKpi === 'impr' ? '#9CA3AF' : activeKpi === 'vues' ? '#6B7280' : activeKpi === 'honorees' ? '#22C55E' : '#F59E0B'
                        const titles = { impr: 'Impressions', vues: 'Vues', honorees: 'Visites honorées', ca: 'CA généré' }
                        const isCurrency = activeKpi === 'ca'
                        const fmt = v => isCurrency ? v.toFixed(2) + ' €' : v
                        return (
                          <div style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid rgba(255,255,255,0.1)`, borderRadius: 12, padding: '12px 14px', marginBottom: 12 }}>
                            <div style={{ color: '#FFFFFF', fontWeight: 700, fontSize: 12, marginBottom: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span>{titles[activeKpi]} — 6 derniers mois</span>
                              <span style={{ color: '#4D9EFF', fontSize: 10, fontWeight: 700 }}>EN COURS : {fmt(parMois[0].nb)}</span>
                            </div>
                            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginBottom: 12 }}>Total : {fmt(total)}</div>
                            {/* Graphe barres */}
                            <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 60, marginBottom: 12 }}>
                              {/* Barre TOTAL */}
                              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: 700 }}>{fmt(total)}</div>
                                <div style={{ width: '100%', background: 'rgba(255,255,255,0.3)', borderRadius: '3px 3px 0 0', height: '50px' }} />
                                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9 }}>TOTAL</div>
                              </div>
                              {parMois.map((m, i) => (
                                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                                  <div style={{ color: m.isCurrent ? '#4D9EFF' : 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: 700 }}>{fmt(m.nb)}</div>
                                  <div style={{ width: '100%', background: m.isCurrent ? '#4D9EFF' : color, borderRadius: '3px 3px 0 0', height: `${Math.max(3, m.nb / maxM * 50)}px` }} />
                                  <div style={{ color: m.isCurrent ? '#4D9EFF' : 'rgba(255,255,255,0.4)', fontSize: 9 }}>{m.label}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      })()}

                      {activeKpi === 'offres' && (
                        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '12px 14px', marginBottom: 12 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                            <div style={{ color: '#FFFFFF', fontWeight: 700, fontSize: 12 }}>🎯 Mes offres ({nbOffresTotal})</div>
                            <span style={{ color: '#22C55E', fontSize: 11, fontWeight: 700 }}>{nbOffresActives} active{nbOffresActives !== 1 ? 's' : ''}</span>
                          </div>
                          {offres.length === 0
                            ? <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, textAlign: 'center', padding: '12px 0' }}>Aucune offre</div>
                            : offres.map(o => (
                              <div key={o.id} onClick={() => { setActiveKpi(null); setDashTab('offres') }}
                                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }}>
                                <div>
                                  <div style={{ color: '#FFFFFF', fontSize: 12, fontWeight: 600 }}>{o.titre}</div>
                                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>{o.type_offre} · {o.promo_pct ? `-${o.promo_pct}%` : ''}</div>
                                </div>
                                <span style={{ background: isOffreActive(o) ? 'rgba(34,197,94,0.15)' : 'rgba(107,114,128,0.15)', color: isOffreActive(o) ? '#22C55E' : '#6B7280', fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 10 }}>
                                  {isOffreActive(o) ? 'Active' : 'Inactive'}
                                </span>
                              </div>
                            ))
                          }
                        </div>
                      )}
                    </>
                  )
                })()}

                {/* Historique mensuel */}
                {(() => {
                  const moisList = []
                  const now = new Date()
                  for (let i = 0; i < 6; i++) {
                    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
                    const m = d.getMonth(), y = d.getFullYear()
                    const label = d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })
                    const imp = (impressionsData || []).filter(v => { const vd = new Date(v.created_at); return vd.getMonth() === m && vd.getFullYear() === y }).length
                    const vues = vuesData.filter(v => { const vd = new Date(v.created_at); return vd.getMonth() === m && vd.getFullYear() === y }).length
                    const visAnon = visites.filter(v => { const vd = new Date(v.created_at); return vd.getMonth() === m && vd.getFullYear() === y && v.etudiant_anon_id }).length
                    const visCompte = visites.filter(v => { const vd = new Date(v.created_at); return vd.getMonth() === m && vd.getFullYear() === y && !v.etudiant_anon_id }).length
                    moisList.push({ label, imp, vues, visAnon, visCompte, isCurrent: i === 0 })
                  }
                  return (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ color: '#FFFFFF', fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Historique mensuel</div>
                      <div style={{ overflowX: 'auto', paddingBottom: 4 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: `80px repeat(6,minmax(52px,1fr))`, minWidth: 400 }}>
                          <div />
                          {moisList.map(m => (
                            <div key={m.label} style={{ textAlign: 'center', padding: '4px 2px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                              <div style={{ color: m.isCurrent ? '#4D9EFF' : '#FFFFFF', fontSize: 10, fontWeight: 700 }}>{m.label}</div>
                              {m.isCurrent && <div style={{ color: '#4D9EFF', fontSize: 8 }}>EN COURS</div>}
                            </div>
                          ))}
                          {[
                            { label: '👁️ Impr.', key: 'imp' },
                            { label: '👁️ Vues', key: 'vues' },
                            { label: '€ Anon.', key: 'visAnon' },
                            { label: '€ Compte', key: 'visCompte' },
                          ].map(row => (
                            <React.Fragment key={row.label}>
                              <div style={{ fontSize: 10, color: '#FFFFFF', fontWeight: 700, display: 'flex', alignItems: 'center', height: 32, paddingRight: 4 }}>{row.label}</div>
                              {moisList.map((m, i) => (
                                <div key={i} style={{ height: 32, background: '#000000', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '2px' }}>
                                  <span style={{ color: '#FFFFFF', fontWeight: 800, fontSize: 13 }}>{m[row.key]}</span>
                                </div>
                              ))}
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    </div>
                  )
                })()}

                <ActivityChart visites={visites} vuesData={vuesData} impressionsData={impressionsData} />

                {visites.length > 0 && (
                  <>
                    <div style={{ color: C.sub, fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', margin: '12px 0 8px' }}>Dernières visites</div>
                    {visites.slice(0, 10).map(v => (
                      <div key={v.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 14px', marginBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ color: C.text, fontSize: 13, fontWeight: 600 }}>{v.offres?.titre || 'Offre'}</div>
                          <div style={{ color: C.muted, fontSize: 11 }}>
                            {new Date(v.created_at).toLocaleDateString('fr-FR')} · {new Date(v.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                        <span style={{ background: v.etudiant_anon_id ? 'rgba(107,114,128,0.1)' : 'rgba(34,197,94,0.1)', color: v.etudiant_anon_id ? '#6b7280' : '#22c55e', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>
                          {v.etudiant_anon_id ? 'Anonyme' : '🎓 Connecté'}
                        </span>
                      </div>
                    ))}
                  </>
                )}

                {/* IA — bientôt disponible */}
                <div style={{ background: '#000000', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: '16px 20px', marginTop: 12, textAlign: 'center' }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>🤖</div>
                  <div style={{ color: '#FFFFFF', fontWeight: 700, fontSize: 14, marginBottom: 4 }}>IA — <span style={{ color: '#F59E0B' }}>Bientôt disponible</span></div>
                  <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, lineHeight: 1.6 }}>Analyse automatique de vos meilleures offres et recommandations personnalisées.</div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Onglet Facture */}
        {dashTab === 'facture' && <FacturePrestataire prestataire={active} visites={visites} />}

        {/* Onglet Profil */}
        {dashTab === 'profil' && (
          <div>
            <div style={{ background: 'linear-gradient(135deg,rgba(0,102,255,0.15),rgba(0,102,255,0.05))', border: '1px solid rgba(0,102,255,0.25)', borderRadius: 16, padding: 16, marginBottom: 12 }}>
              <div style={{ color: '#FFFFFF', fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Abonnement actuel</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <div style={{ color: '#FFFFFF', fontWeight: 800, fontSize: 16 }}>{planLabel(active.plan, active.plan_fin)}</div>
                <button onClick={() => setShowChangePwd(showChangePwd === 'plan' ? false : 'plan')} style={{ padding: '6px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.3)', background: 'transparent', color: '#FFFFFF', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                  📦 Changer
                </button>
              </div>
              {active.plan_fin && <div style={{ color: '#FFFFFF', fontSize: 12 }}>Expire le {new Date(active.plan_fin).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</div>}
            </div>

            {showChangePwd === 'plan' && (
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 14, marginBottom: 12 }}>
                <ChangementAbonnement
                  plan={active?.plan} prestataireId={active?.id}
                  planDebut={active?.plan_debut} hasCard={!!active?.stripe_payment_method_id}
                  onClose={() => setShowChangePwd(false)}
                  onChanged={async (newPlan, dateEffet, immédiat) => {
                    if (immédiat) {
                      await db().from('prestataires').update({ plan: newPlan, plan_debut: new Date().toISOString() }).eq('id', active.id)
                      setActive({ ...active, plan: newPlan, plan_debut: new Date().toISOString() })
                    }
                    await loadOffres(active.id)
                    setShowChangePwd(false)
                    showToast(immédiat ? '✅ Abonnement mis à jour' : `✅ Changement enregistré — effectif le ${dateEffet?.toLocaleDateString('fr-FR')}`)
                  }}
                />
              </div>
            )}

            {showChangePwd === 'pwd' && (
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 14, marginBottom: 12 }}>
                <ChangePassword onClose={() => setShowChangePwd(false)} />
              </div>
            )}

            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 16, marginBottom: 12 }}>
              <EditProfilPrestataire prestataire={active} onSave={updated => setActive(updated)} />
            </div>

            <StripeSetupCard prestataire={active} onUpdated={updates => setActive(a => ({ ...a, ...updates }))} />

            {!showChangePwd && (
              <button onClick={() => setShowChangePwd('pwd')} style={{ width: '100%', padding: '9px 0', borderRadius: 10, border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#FFFFFF', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 8 }}>
                🔒 Changer mon mot de passe
              </button>
            )}
            <button onClick={() => setShowCGUPresta(true)} style={{ width: '100%', padding: '9px 0', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'rgba(255,255,255,0.5)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 8 }}>
              📋 Conditions Générales d'Utilisation
            </button>
            {showCGUPresta && <ModalCGU onClose={() => setShowCGUPresta(false)} defaultTab="prestataire" />}
            <Btn variant="outline" onClick={onLogout}>Se déconnecter</Btn>
          </div>
        )}
      </div>
      {offreAvis && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 2900, background: C.bg, overflowY: 'auto', paddingBottom: 80 }}>
          <div style={{ background: C.card, padding: '52px 16px 16px', borderBottom: `1px solid ${C.border}`, position: 'sticky', top: 0, zIndex: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button onClick={() => setOffreAvis(null)} style={{ background: 'none', border: 'none', color: C.text, cursor: 'pointer', fontSize: 18 }}>←</button>
              <div>
                <div style={{ color: C.text, fontWeight: 800, fontSize: 15 }}>{offreAvis.titre}</div>
                <div style={{ color: C.muted, fontSize: 12 }}>Avis étudiants</div>
              </div>
            </div>
          </div>
          <div style={{ padding: '16px' }}>
            {(offreAvis.visites || []).filter(v => v.statut_avis === 'validé' && v.avis).map(v => (
              <div key={v.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: '12px 14px', marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <div style={{ color: C.text, fontWeight: 700, fontSize: 13 }}>{v.etudiants?.prenom || 'Étudiant'}</div>
                  <div style={{ display: 'flex', gap: 2 }}>
                    {[1, 2, 3, 4, 5].map(i => (
                      <span key={i} style={{ fontSize: 14, color: i <= (v.note || 0) ? '#F59E0B' : '#333' }}>★</span>
                    ))}
                  </div>
                </div>
                <div style={{ color: C.text, fontSize: 13, lineHeight: 1.5, marginBottom: v.photo_url ? 8 : 0 }}>{v.avis}</div>
                {v.photo_url && (
                  <img src={v.photo_url} alt="photo" style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 10, marginTop: 6 }} />
                )}
                <div style={{ color: C.muted, fontSize: 11, marginTop: 6 }}>
                  {new Date(v.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                </div>
              </div>
            ))}
            {(offreAvis.visites || []).filter(v => v.statut_avis === 'validé' && v.avis).length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 0', color: C.muted }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>💬</div>
                <div style={{ color: C.text, fontWeight: 700 }}>Aucun avis pour le moment</div>
              </div>
            )}
          </div>
        </div>
      )}
    </PrestPageShell>
  )
}