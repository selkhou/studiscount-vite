import { ICON_STYLE } from '../../constants.js'
import { buildCategoriesOffre } from '../../utils.js'

const SvgResto = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 -960 960 960" fill={color}>
    <path d="M280-80v-366q-51-14-85.5-56T160-600v-280h80v280h40v-280h80v280h40v-280h80v280q0 56-34.5 98T360-446v366h-80Zm400 0v-320H560v-280q0-83 58.5-141.5T760-880v800h-80Z"/>
  </svg>
)
const SvgSoins = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 -960 960 960" fill={color}>
    <path d="M640-40q-17 0-28.5-11.5T600-80q0-17 11.5-28.5T640-120h120v-40H640q-17 0-28.5-11.5T600-200q0-17 11.5-28.5T640-240h120v-40H640q-17 0-28.5-11.5T600-320q0-17 11.5-28.5T640-360h120v-40H640q-17 0-28.5-11.5T600-440q0-17 11.5-28.5T640-480h120v-40H640q-17 0-28.5-11.5T600-560q0-17 11.5-28.5T640-600h120v-40H640q-17 0-28.5-11.5T600-680q0-17 11.5-28.5T640-720h160q33 0 56.5 23.5T880-640v520q0 33-23.5 56.5T800-40H640ZM433-425q47-65 47-155t-47-155q-47-65-113-65t-113 65q-47 65-47 155t47 155q47 65 113 65t113-65ZM320-40q-48 0-79-35.5T217-159l16-141q-68-33-110.5-108.5T80-580q0-125 70-212.5T320-880q100 0 170 87.5T560-580q0 96-42.5 171.5T407-300l16 141q7 48-24 83.5T320-40Z"/>
  </svg>
)
const SvgLoisirs = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 -960 960 960" fill={color}>
    <path d="m80-80 200-560 360 360L80-80Zm132-132 282-100-182-182-100 282Zm370-246-42-42 224-224q32-32 77-32t77 32l24 24-42 42-24-24q-14-14-35-14t-35 14L582-458ZM422-618l-42-42 24-24q14-14 14-34t-14-34l-26-26 42-42 26 26q32 32 32 76t-32 76l-24 24Zm80 80-42-42 144-144q14-14 14-35t-14-35l-64-64 42-42 64 64q32 32 32 77t-32 77L502-538Zm160 160-42-42 64-64q32-32 77-32t77 32l64 64-42 42-64-64q-14-14-35-14t-35 14l-64 64ZM212-212Z"/>
  </svg>
)
const SvgSport = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 -960 960 960" fill={color}>
    <path d="M480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm200-500 54-18 16-54q-32-48-77-82.5T574-786l-54 38v56l160 112Zm-400 0 160-112v-56l-54-38q-54 17-99 51.5T210-652l16 54 54 18Zm-42 308 46-4 30-54-58-174-56-20-40 30q0 65 18 118.5T238-272Zm293 108q25-4 49-12l28-60-26-44H378l-26 44 28 60q24 8 49 12t51 4q26 0 51-4ZM390-360h180l56-160-146-102-144 102 54 160Zm332 88q42-50 60-103.5T800-494l-40-28-56 18-58 174 30 54 46 4Z"/>
  </svg>
)
const SvgServices = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 -960 960 960" fill={color}>
    <path d="M756-120 537-339l84-84 219 219-84 84Zm-552 0-84-84 276-276-68-68-28 28-51-51v82l-28 28-121-121 28-28h82l-50-50 142-142q20-20 43-29t47-9q24 0 47 9t43 29l-92 92 50 50-28 28 68 68 90-90q-4-11-6.5-23t-2.5-24q0-59 40.5-99.5T701-841q15 0 28.5 3t27.5 9l-99 99 72 72 99-99q7 14 9.5 27.5T841-701q0 59-40.5 99.5T701-561q-12 0-24-2t-23-7L204-120Z"/>
  </svg>
)
const SvgSante = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 -960 960 960" fill={color}>
    <path d="M540-80q-108 0-184-76t-76-184v-23q-86-14-143-80.5T80-600v-240h120v-40h80v160h-80v-40h-40v160q0 66 47 113t113 47q66 0 113-47t47-113v-160h-40v40h-80v-160h80v40h120v240q0 90-57 156.5T360-363v23q0 75 52.5 127.5T540-160q75 0 127.5-52.5T720-340v-67q-35-12-57.5-43T640-520q0-50 35-85t85-35q50 0 85 35t35 85q0 39-22.5 70T800-407v67q0 108-76 184T540-80Z"/>
  </svg>
)
const SvgHebergement = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 -960 960 960" fill={color}>
    <path d="M240-200h120v-240h240v240h120v-360L480-740 240-560v360Zm-80 80v-480l320-240 320 240v480H520v-240h-80v240H160Zm320-350Z"/>
  </svg>
)

const CAT_SVG = {
  restauration: SvgResto, soins: SvgSoins, loisirs: SvgLoisirs,
  sport: SvgSport, services: SvgServices, sante: SvgSante, hebergement: SvgHebergement
}

export default function CatIcon({ catId, size = 26, color = '#374151' }) {
  if (ICON_STYLE === 'svg') {
    const Comp = CAT_SVG[catId]
    if (Comp) return <Comp size={size} color={color} />
  }
  const cat = buildCategoriesOffre().find(c => c.id === catId)
  return <span style={{ fontSize: size, lineHeight: 1 }}>{cat?.emoji || '🎯'}</span>
}