// ── Design tokens Dark (prestataire) ──────────────────
export const getC = () => ({
  bg: window.SIOK_PARAMS?.fond_couleur_presta || '#0C0D0F',
  surface: '#15171A', card: '#1C1F23',
  border: 'rgba(255,255,255,0.09)',
  accent: '#4D9EFF', accentSoft: 'rgba(0,102,255,0.15)', accentGlow: 'rgba(0,102,255,0.35)',
  gold: '#F5A623', green: '#22C55E', greenSoft: 'rgba(34,197,94,0.15)',
  red: '#EF4444', text: '#FFFFFF', muted: '#C0C8D4', sub: '#8B97A8',
})
export const C = getC()

// ── Design tokens Light (étudiant) ────────────────────
export const CS = {
  bg: '#F5F4F0', surface: '#FFFFFF', card: '#FFFFFF',
  border: 'rgba(0,0,0,0.06)',
  accent: '#0066FF', accentSoft: 'rgba(0,102,255,0.08)', accentGlow: 'rgba(0,102,255,0.28)',
  gold: '#F59E0B', green: '#22C55E', greenSoft: 'rgba(34,197,94,0.1)',
  red: '#EF4444', text: '#1A1A2E', muted: '#6B7280', sub: '#9CA3AF',
  shadow: '0 2px 12px rgba(0,0,0,0.06)', shadowMd: '0 8px 28px rgba(0,0,0,0.10)',
  catColors: {
    restauration: '#EF4444', soins: '#E91E8C', loisirs: '#7C3AED',
    sport: '#22C55E', services: '#0066FF', sante: '#06B6D4', hebergement: '#F59E0B',
  },
}

// ── Villes ─────────────────────────────────────────────
export const CITIES = [
  { id: 'annecy',    name: 'Annecy',    lat: 45.8992, lng: 6.1294,  zoom: 15 },
  { id: 'paris',     name: 'Paris',     lat: 48.8566, lng: 2.3522,  zoom: 14 },
  { id: 'lyon',      name: 'Lyon',      lat: 45.7640, lng: 4.8357,  zoom: 14 },
  { id: 'bordeaux',  name: 'Bordeaux',  lat: 44.8378, lng: -0.5792, zoom: 14 },
  { id: 'nice',      name: 'Nice',      lat: 43.7102, lng: 7.2620,  zoom: 14 },
  { id: 'toulouse',  name: 'Toulouse',  lat: 43.6047, lng: 1.4442,  zoom: 14 },
  { id: 'grenoble',  name: 'Grenoble',  lat: 45.1885, lng: 5.7245,  zoom: 14 },
  { id: 'chambery',  name: 'Chambéry',  lat: 45.5646, lng: 5.9178,  zoom: 14 },
  { id: 'marseille', name: 'Marseille', lat: 43.2965, lng: 5.3698,  zoom: 14 },
  { id: 'nantes',    name: 'Nantes',    lat: 47.2184, lng: -1.5536, zoom: 14 },
  { id: 'geneve',    name: 'Genève',    lat: 46.2044, lng: 6.1432,  zoom: 14 },
]

// ── Types métier fallback ──────────────────────────────
export const TYPES_METIER_FALLBACK = [
  { id: 'restaurant', label: 'Restaurant', emoji: '🧑‍🍳', color: '#EF4444', groupe: 'restauration' },
  { id: 'onglerie',   label: 'Onglerie',   emoji: '💅',   color: '#EC4899', groupe: 'soins' },
  { id: 'barbier',    label: 'Barbier',    emoji: '💈',   color: '#8B5CF6', groupe: 'soins' },
  { id: 'autre',      label: 'Autre',      emoji: '🎯',   color: '#0066FF', groupe: 'services' },
]

// ── Catégories ─────────────────────────────────────────
export const CATEGORIES_OFFRE_META = [
  { id: 'restauration', label: 'Resto',       emoji: '🍴', color: '#14B8A6' },
  { id: 'soins',        label: 'Soins',       emoji: '💋', color: '#EF4444' },
  { id: 'loisirs',      label: 'Loisirs',     emoji: '🎉', color: '#8B5CF6' },
  { id: 'sport',        label: 'Sport',       emoji: '🏃', color: '#EF4444' },
  { id: 'services',     label: 'Services',    emoji: '🛠️', color: '#22C55E' },
  { id: 'sante',        label: 'Santé',       emoji: '🩺', color: '#F59E0B' },
  { id: 'hebergement',  label: 'Hébergement', emoji: '🏠', color: '#3B82F6' },
]

export const PROMO_PCTS = [5, 10, 15, 20, 25, 30, 40, 50]

export const INDICATIFS = [
  { code: '+33', flag: '🇫🇷', label: 'France' },
  { code: '+41', flag: '🇨🇭', label: 'Suisse' },
  { code: '+32', flag: '🇧🇪', label: 'Belgique' },
  { code: '+39', flag: '🇮🇹', label: 'Italie' },
  { code: '+34', flag: '🇪🇸', label: 'Espagne' },
  { code: '+49', flag: '🇩🇪', label: 'Allemagne' },
]

export const ICON_STYLE = 'svg'

// ── Globals initialisés au démarrage ──────────────────
window.SIOK_TARIFS = window.SIOK_TARIFS || {
  base_mensuel: 0, base_annuel: 0, base_commission: 15,
  standard_mensuel: 49.90, standard_annuel: 39.90, standard_commission: 9,
  premium_mensuel: 79.90, premium_annuel: 59.90, premium_commission: 5,
}

window.SIOK_PARAMS = window.SIOK_PARAMS || {
  test_mode: true,
  visibilite_anticipee_h: 24,
  duree_max_offre_jours: 7,
}

try {
  const _f = localStorage.getItem('stu10_fond_etudiant')
  if (_f) window.__stu10_fond = _f
} catch (e) {}

window.LANDING_MODE = new URLSearchParams(window.location.search).get('landing') === '1'

export const TEST_MODE = () =>
  window.SIOK_PARAMS.test_mode === true || window.SIOK_PARAMS.test_mode === 'true'

export const VISIBILITE_ANTICIPEE_H = () =>
  window.SIOK_PARAMS?.visibilite_anticipee_h || 24