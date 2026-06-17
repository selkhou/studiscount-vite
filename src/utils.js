import { db } from './lib/supabase.js'
import {
  TYPES_METIER_FALLBACK,
  CATEGORIES_OFFRE_META,
  VISIBILITE_ANTICIPEE_H,
} from './constants.js'

// ── Types métier ───────────────────────────────────────
export function buildCategoriesOffre() {
  return CATEGORIES_OFFRE_META.map(cat => ({
    ...cat,
    types: (window.SIOK_TYPES || TYPES_METIER_FALLBACK)
      .filter(t => t.groupe === cat.id)
      .map(t => t.id),
  }))
}

export let CATEGORIES_OFFRE = buildCategoriesOffre()

export async function loadTypesMetier() {
  try {
    const { data } = await db().from('types_metier').select('*').eq('actif', true).order('ordre')
    if (data && data.length > 0) {
      window.SIOK_TYPES = data
      CATEGORIES_OFFRE = buildCategoriesOffre()
    }
  } catch (e) {
    console.warn('types_metier non chargés, liste statique utilisée')
  }
}

export function getTypesMetier() {
  return window.SIOK_TYPES || TYPES_METIER_FALLBACK
}

export function getCategorieForType(typeId) {
  const t = (window.SIOK_TYPES || TYPES_METIER_FALLBACK).find(x => x.id === typeId)
  if (t?.groupe) return CATEGORIES_OFFRE_META.find(c => c.id === t.groupe) || null
  return CATEGORIES_OFFRE.find(c => c.types.includes(typeId)) || null
}

export function getTypesForCategorie(catId) {
  return (window.SIOK_TYPES || TYPES_METIER_FALLBACK).filter(t => t.groupe === catId)
}

export function getTypeMetier(typeId) {
  return (
    (window.SIOK_TYPES || TYPES_METIER_FALLBACK).find(t => t.id === typeId) ||
    { id: typeId, label: typeId, emoji: '🎯', color: '#0066FF' }
  )
}

// ── Paramètres depuis Supabase ─────────────────────────
export async function loadParams() {
  try {
    const { data } = await db().from('parametres').select('cle,valeur')
    if (data) {
      data.forEach(p => {
        try { window.SIOK_PARAMS[p.cle] = JSON.parse(p.valeur) }
        catch (e) { window.SIOK_PARAMS[p.cle] = p.valeur }
      })
    }
  } catch (e) {
    console.warn('loadParams:', e.message)
  }
}

export async function loadTarifs() {
  try {
    const { data } = await db()
      .from('parametres')
      .select('cle,valeur')
      .in('cle', [
        'base_mensuel_prix', 'base_annuel_prix',
        'standard_mensuel_prix', 'standard_annuel_prix',
        'premium_mensuel_prix', 'premium_annuel_prix',
      ])
    if (data) {
      data.forEach(p => {
        const k = p.cle.replace('_prix', '')
        if (window.SIOK_TARIFS[k] !== undefined)
          window.SIOK_TARIFS[k] = parseFloat(p.valeur)
      })
    }
  } catch (e) {}
}

// ── Formatage ──────────────────────────────────────────
export function fmt(ms) {
  if (ms <= 0) return '00:00'
  const m = Math.floor(ms / 60000), s = Math.floor((ms % 60000) / 1000)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function fmtDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

export function fmtDateLong(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
}

// ── Offres ─────────────────────────────────────────────
export function isOffreVisible(offre) {
  if (!offre.active) return false
  const now = new Date()
  if (!offre.date_debut && !offre.date_fin) return true
  if (offre.date_fin && new Date(offre.date_fin) < now) return false
  if (offre.date_debut) {
    const debut = new Date(offre.date_debut)
    const visibleDepuis = new Date(debut.getTime() - VISIBILITE_ANTICIPEE_H() * 60 * 60 * 1000)
    if (now < visibleDepuis) return false
  }
  return true
}

export function isOffreActive(offre) {
  if (!offre.active) return false
  const now = new Date()
  if (!offre.date_debut && !offre.date_fin) return true
  if (offre.date_fin && new Date(offre.date_fin) < now) return false
  if (offre.date_debut && new Date(offre.date_debut) > now) return false
  return true
}

// ── Couleurs ───────────────────────────────────────────
export function bannerColorSiok(str) {
  let h = 0
  for (let i = 0; i < (str || '').length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0
  const hues = [200, 220, 240, 260, 180, 210, 230, 250]
  return `hsl(${hues[h % hues.length]},55%,88%)`
}

export function bannerGradient(typeId) {
  const cat = getCategorieForType(typeId)
  if (cat) {
    const palettes = {
      restauration: ['#FF6B35', '#FF9A5C'],
      soins:        ['#E91E8C', '#FF6BB5'],
      loisirs:      ['#7C3AED', '#A855F7'],
      sport:        ['#22C55E', '#4ADE80'],
      services:     ['#0066FF', '#3399FF'],
      sante:        ['#06B6D4', '#22D3EE'],
      hebergement:  ['#F59E0B', '#FCD34D'],
    }
    const p = palettes[cat.id] || ['#0066FF', '#3399FF']
    return `linear-gradient(135deg,${p[0]},${p[1]})`
  }
  return 'linear-gradient(135deg,#0066FF,#3399FF)'
}

// ── Géographie ─────────────────────────────────────────
export function distanceM(lat1, lng1, lat2, lng2) {
  const R = 6371000
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// ── QR ─────────────────────────────────────────────────
export function genQRToken(offreId, etudiantId, ts) {
  return btoa(`${offreId}|${etudiantId}|${ts}`).replace(/=/g, '')
}

export function genQRData(offreId, etudiantId) {
  const ts = Date.now()
  const token = genQRToken(offreId, etudiantId, ts)
  return JSON.stringify({ offreId, etudiantId, ts, token })
}

export function validateQRData(data) {
  try {
    const { offreId, etudiantId, ts, token } = JSON.parse(data)
    const expected = genQRToken(offreId, etudiantId, ts)
    const age = Date.now() - ts
    if (token !== expected) return { valid: false, reason: 'token_invalid' }
    if (age > 5 * 60 * 1000) return { valid: false, reason: 'expired' }
    return { valid: true, offreId, etudiantId, ts }
  } catch (e) {
    return { valid: false, reason: 'parse_error' }
  }
}

// ── OffreEditor ────────────────────────────────────────
export function toLocalDateTimeInput(d) {
  const dt = new Date(d)
  dt.setMinutes(dt.getMinutes() - dt.getTimezoneOffset())
  return dt.toISOString().slice(0, 16)
}

export function defaultDebut() {
  return toLocalDateTimeInput(new Date())
}

export function defaultFin() {
  const d = new Date()
  d.setDate(d.getDate() + (window.SIOK_PARAMS?.duree_max_offre_jours || 7))
  return toLocalDateTimeInput(d)
}

export function maxFin(debut) {
  if (!debut) return ''
  const d = new Date(debut)
  d.setDate(d.getDate() + (window.SIOK_PARAMS?.duree_max_offre_jours || 7))
  return toLocalDateTimeInput(d)
}

export function prixRemise(prixNormal, pct) {
  return Math.round(prixNormal * (1 - pct / 100) * 100) / 100
}

// ── Plans abonnement ───────────────────────────────────
export function getSiokPlans() {
  const t = window.SIOK_TARIFS
  return [
    {
      id: 'trial', group: 'trial', name: 'Essai', billing: 'gratuit',
      price: 0, duration: 1, label: 'Gratuit — 1 mois', commission: null,
      features: ['1 mois offert', '1 offre maximum', '1 photo par offre', 'Support email', 'Sans CB requise'],
      color: '#22C55E', hasStats: false, hasIA: false,
    },
    {
      id: 'base_monthly', group: 'base', name: 'Base', billing: 'mensuel',
      price: t.base_mensuel, duration: 1, label: 'Gratuit', commission: t.base_commission,
      features: [`Commission ${t.base_commission}% par vente`, 'Offres illimitées', 'Photos par offre', 'Support email'],
      color: '#6B7280', hasStats: false, hasIA: false,
    },
    {
      id: 'base_annual', group: 'base', name: 'Base', billing: 'annuel',
      price: t.base_annuel, duration: 12, label: 'Gratuit', commission: t.base_commission,
      features: [`Commission ${t.base_commission}% par vente`, 'Offres illimitées', 'Photos par offre', 'Support email'],
      color: '#6B7280', hasStats: false, hasIA: false,
    },
    {
      id: 'standard_monthly', group: 'standard', name: 'Standard', billing: 'mensuel',
      price: t.standard_mensuel, duration: 1, label: `${t.standard_mensuel}€/mois`,
      commission: t.standard_commission,
      features: [`Commission ${t.standard_commission}% par vente`, `${t.standard_mensuel}€/mois`, '📊 Statistiques complètes', 'Support prioritaire'],
      color: '#0066FF', hasStats: true, hasIA: false,
    },
    {
      id: 'standard_annual', group: 'standard', name: 'Standard', billing: 'annuel',
      price: t.standard_annuel, duration: 12, label: `${t.standard_annuel}€/mois`,
      sublabel: `${(t.standard_annuel * 12).toFixed(2)}€/an`, commission: t.standard_commission,
      features: [`Commission ${t.standard_commission}% par vente`, `${t.standard_annuel}€/mois`, '📊 Statistiques complètes', 'Support prioritaire', 'Économie vs mensuel'],
      color: '#0066FF', hasStats: true, hasIA: false, best: true,
    },
    {
      id: 'premium_monthly', group: 'premium', name: 'Premium', billing: 'mensuel',
      price: t.premium_mensuel, duration: 1, label: `${t.premium_mensuel}€/mois`,
      commission: t.premium_commission,
      features: [`Commission ${t.premium_commission}% par vente`, `${t.premium_mensuel}€/mois`, '📊 Statistiques complètes', '🤖 Conseil IA', 'Support VIP'],
      color: '#7C3AED', hasStats: true, hasIA: true,
    },
    {
      id: 'premium_annual', group: 'premium', name: 'Premium', billing: 'annuel',
      price: t.premium_annuel, duration: 12, label: `${t.premium_annuel}€/mois`,
      sublabel: `${(t.premium_annuel * 12).toFixed(2)}€/an`, commission: t.premium_commission,
      features: [`Commission ${t.premium_commission}% par vente`, `${t.premium_annuel}€/mois`, '📊 Statistiques complètes', '🤖 Conseil IA', 'Support VIP', 'Meilleur tarif'],
      color: '#7C3AED', hasStats: true, hasIA: true, best: false,
    },
  ]
}

export function getPlanInfo(planId) {
  const plans = getSiokPlans()
  return plans.find(p => p.id === planId) || plans.find(p => p.group === planId) || plans[0]
}

export const SIOK_PLANS = getSiokPlans()

export function planHasStats(planId) { return getPlanInfo(planId)?.hasStats || false }
export function planHasIA(planId) { return getPlanInfo(planId)?.hasIA || false }

export function planMaxOffres(planId) {
  const g = getPlanInfo(planId)?.group || 'base'
  if (g === 'premium') return Infinity
  if (g === 'standard') return 5
  if (planId === 'trial') return 1
  return 2
}

export function planMaxPhotos(planId) {
  const g = getPlanInfo(planId)?.group || 'base'
  if (g === 'premium') return 5
  if (g === 'standard') return 3
  return 1
}

export function planFin(planId) {
  const now = new Date()
  const plan = SIOK_PLANS.find(p => p.id === planId)
  if (!plan) return null
  const fin = new Date(now)
  fin.setMonth(fin.getMonth() + plan.duration)
  return fin
}

export function planLabel(planId, planFinDate) {
  if (!planId || planId === 'trial') return '🎁 Essai gratuit'
  const p = SIOK_PLANS.find(pl => pl.id === planId)
  const label = p ? p.name : planId
  if (planFinDate) {
    const fin = new Date(planFinDate)
    const jours = Math.ceil((fin - new Date()) / (1000 * 60 * 60 * 24))
    if (jours < 0) return `⚠️ ${label} — Expiré`
    if (jours <= 7) return `⚠️ ${label} — ${jours}j restants`
    return `⚡ ${label} — jusqu'au ${fin.toLocaleDateString('fr-FR')}`
  }
  return `⚡ ${label}`
}