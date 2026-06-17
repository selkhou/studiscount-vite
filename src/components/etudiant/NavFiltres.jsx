import { CS, ICON_STYLE } from '../../constants.js'
import { buildCategoriesOffre, getTypesForCategorie } from '../../utils.js'
import CatIcon from '../ui/CatIcon.jsx'
import IcoBarberPole from '../ui/IcoBarberPole.jsx'

export default function NavFiltres({
  nbOffres, tri, setTri, showReco, setShowReco,
  filterCat, setFilterCat, filterType, setFilterType,
  offres, showPerso, search, setSearch
}) {
  const catsAvec = buildCategoriesOffre().filter(c => offres.some(o => c.types.includes(o.type_offre)))

  const handleCat = (catId) => {
    if (filterCat === catId) { setFilterCat(null); setFilterType(null) }
    else { setFilterCat(catId); setFilterType(null) }
  }

  const allTypes = filterCat
    ? getTypesForCategorie(filterCat).filter(t => offres.some(o => o.type_offre === t.id))
    : []

  const catColors = {
    restauration: '#14B8A6', soins: '#EC4899', loisirs: '#8B5CF6',
    sport: '#1E40AF', services: '#22C55E', sante: '#F59E0B', hebergement: '#3B82F6'
  }

  const PILL = (active) => ({
    display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 5,
    padding: '12px 11px', borderRadius: 50, border: 'none',
    background: active ? 'rgba(0,102,255,0.08)' : '#FFFFFF',
    cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
    boxShadow: active ? '0 2px 6px rgba(0,102,255,0.12)' : '0 1px 4px rgba(0,0,0,0.08)',
    transition: 'all 0.18s', whiteSpace: 'nowrap'
  })

  const PILL2 = () => ({
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
    padding: '6px 4px', borderRadius: 8, border: 'none',
    background: 'transparent', cursor: 'pointer', fontFamily: 'inherit',
    flexShrink: 0, width: 56, transition: 'all 0.18s'
  })

  const modes = [
    { key: 'distance',  label: 'Proche', icon: '🎯' },
    { key: 'remise',    label: 'Éco',    icon: '💶' },
    { key: 'remisePct', label: '% Éco',  icon: '💯' },
    { key: 'pop',       label: 'Pop',    icon: '🔥' },
    { key: 'notes',     label: 'Notés',  icon: '⭐' },
  ]
  const currentIdx = showReco === 'pop' ? 3 : tri === 'notes' ? 4 : tri === 'remisePct' ? 2 : tri === 'remise' ? 1 : 0
  const current = modes[currentIdx]

  const handleCycle = () => {
    if (currentIdx === 0) { setTri('remise'); setShowReco(false) }
    else if (currentIdx === 1) { setTri('remisePct'); setShowReco(false) }
    else if (currentIdx === 2) { setShowReco('pop'); setTri('distance') }
    else if (currentIdx === 3) { setShowReco(false); setTri('notes') }
    else { setShowReco(false); setTri('distance') }
  }

  return (
    <div>
      {/* Ligne 1 — tri + catégories */}
      <div style={{ display: 'flex', gap: 5, overflowX: 'auto', paddingBottom: 6, alignItems: 'center', paddingTop: 4 }}>
        <button onClick={handleCycle} style={PILL(false)}>
          <span style={{ fontSize: 18, lineHeight: 1 }}>{current.icon}</span>
          <span style={{ fontSize: 14, fontWeight: 800, color: tri === 'notes' ? '#F59E0B' : '#374151' }}>
            {current.label}
          </span>
        </button>

        {showPerso && (
          <button onClick={() => setShowReco(showReco === 'perso' ? false : 'perso')} style={PILL(showReco === 'perso')}>
            <span style={{ fontSize: 18, lineHeight: 1 }}>✨</span>
            <span style={{ fontSize: 14, fontWeight: 800, color: showReco === 'perso' ? '#0066FF' : '#374151' }}>
              Pour toi
            </span>
          </button>
        )}

        <div style={{ width: 1, height: 28, background: 'rgba(0,0,0,0.1)', flexShrink: 0, alignSelf: 'center' }} />

        {catsAvec.map(c => {
          const active = filterCat === c.id
          const col = catColors[c.id] || '#374151'
          return (
            <button key={c.id} onClick={() => handleCat(c.id)} style={PILL(active)}>
              <CatIcon catId={c.id} size={22} color={active ? '#0066FF' : col} />
              <span style={{ fontSize: 14, fontWeight: 800, color: active ? '#0066FF' : '#374151' }}>
                {c.label}
              </span>
            </button>
          )
        })}
      </div>

      {/* Ligne 2 — recherche + sous-catégories */}
      <div style={{ display: 'flex', gap: 5, overflowX: 'auto', paddingTop: 4, paddingBottom: 4, alignItems: 'center' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: '#FFFFFF', borderRadius: 50, padding: '6px 12px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)', flexShrink: 0, minWidth: 120
        }}>
          <span style={{ fontSize: 14, color: '#9CA3AF' }}>🔍</span>
          <input
            value={search || ''} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher..."
            style={{
              border: 'none', outline: 'none', fontSize: 13,
              background: 'transparent', width: 90,
              fontFamily: 'inherit', color: '#1A1A2E'
            }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{
              border: 'none', background: 'transparent',
              cursor: 'pointer', color: '#9CA3AF', fontSize: 14, padding: 0, lineHeight: 1
            }}>✕</button>
          )}
        </div>

        {allTypes.map(t => {
          const active = filterType === t.id
          return (
            <button key={t.id} onClick={() => setFilterType(active ? null : t.id)} style={PILL2()}>
              <div style={{
                width: 44, height: 44, borderRadius: '50%',
                background: active ? 'rgba(0,102,255,0.08)' : '#FFFFFF',
                border: active ? '2px solid #4D9EFF' : '2px solid #E5E7EB',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.18s'
              }}>
                {t.id === 'barbier'
                  ? <IcoBarberPole size={26} color={active ? '#0066FF' : '#8B5CF6'} />
                  : <span style={{ fontSize: 24, lineHeight: 1 }}>{t.emoji}</span>
                }
              </div>
              <span style={{
                fontSize: 9, fontWeight: 700,
                color: active ? '#0066FF' : '#374151',
                whiteSpace: 'nowrap', maxWidth: 52,
                overflow: 'hidden', textOverflow: 'ellipsis',
                textAlign: 'center', marginTop: 2
              }}>{t.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}