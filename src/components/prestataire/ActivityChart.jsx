import { useState } from 'react'
import { getC } from '../../constants.js'

export default function ActivityChart({ visites, vuesData, impressionsData }) {
  const C = getC()
  const [periode, setPeriode] = useState('mois')
  const now = new Date()

  const getData = () => {
    if (periode === 'jour') {
      return Array.from({ length: 24 }, (_, h) => ({
        label: `${String(h).padStart(2, '0')}h`,
        imp: (impressionsData || []).filter(v => { const d = new Date(v.created_at); return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getHours() === h }).length,
        vues: vuesData.filter(v => { const d = new Date(v.created_at); return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getHours() === h }).length,
        vis: visites.filter(v => { const d = new Date(v.created_at); return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getHours() === h }).length,
      }))
    }
    if (periode === 'semaine') {
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(now); d.setDate(d.getDate() - 6 + i)
        const day = d.getDate(), month = d.getMonth(), year = d.getFullYear()
        return {
          label: d.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit' }),
          vues: vuesData.filter(v => { const vd = new Date(v.created_at); return vd.getDate() === day && vd.getMonth() === month && vd.getFullYear() === year }).length,
          vis: visites.filter(v => { const vd = new Date(v.created_at); return vd.getDate() === day && vd.getMonth() === month && vd.getFullYear() === year }).length,
        }
      })
    }
    if (periode === 'evolution') {
      const result = []
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const m = d.getMonth(), y = d.getFullYear()
        const label = d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })
        const vues = vuesData.filter(v => { const vd = new Date(v.created_at); return vd.getMonth() === m && vd.getFullYear() === y }).length
        const vis = visites.filter(v => { const vd = new Date(v.created_at); return vd.getMonth() === m && vd.getFullYear() === y }).length
        if (vues > 0 || vis > 0 || i === 0) result.push({ label, vues, vis })
      }
      return result
    }
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    return Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1, month = now.getMonth(), year = now.getFullYear()
      return {
        label: String(day).padStart(2, '0'),
        vues: vuesData.filter(v => { const vd = new Date(v.created_at); return vd.getDate() === day && vd.getMonth() === month && vd.getFullYear() === year }).length,
        vis: visites.filter(v => { const vd = new Date(v.created_at); return vd.getDate() === day && vd.getMonth() === month && vd.getFullYear() === year }).length,
      }
    })
  }

  const data = getData()
  const maxVal = Math.max(...data.map(d => (d.vues || 0) + (d.vis || 0)), 1)
  const BAR_H = 80
  const totalVues = data.reduce((s, d) => s + (d.vues || 0), 0)
  const totalVis = data.reduce((s, d) => s + (d.vis || 0), 0)

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: '14px', marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div>
          <div style={{ color: C.text, fontWeight: 700, fontSize: 13 }}>📈 Activité</div>
          <div style={{ color: C.muted, fontSize: 10, marginTop: 2 }}>
            <span style={{ color: '#6B7280' }}>👁️ {totalVues} vues</span>
            <span style={{ color: C.muted }}> · </span>
            <span style={{ color: '#0066FF' }}>✅ {totalVis} visites</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {[{ v: 'jour', l: 'Jour' }, { v: 'semaine', l: 'Sem.' }, { v: 'mois', l: 'Mois' }, { v: 'evolution', l: 'Évol.' }].map(p => (
            <button key={p.v} onClick={() => setPeriode(p.v)} style={{
              padding: '4px 10px', borderRadius: 8, border: 'none',
              background: periode === p.v ? '#0066FF' : 'rgba(0,102,255,0.08)',
              color: periode === p.v ? 'white' : '#0066FF',
              fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit'
            }}>
              {p.l}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 1, alignItems: 'flex-end', height: BAR_H, overflowX: 'auto', paddingBottom: 4 }}>
        {data.map((d, i) => {
          const hVues = (d.vues || 0) / maxVal * BAR_H
          const hVis = (d.vis || 0) / maxVal * BAR_H
          const isToday = (periode === 'mois' && i + 1 === now.getDate()) ||
            (periode === 'semaine' && i === 6) ||
            (periode === 'jour' && i === now.getHours()) ||
            (periode === 'evolution' && i === data.length - 1)
          const barW = periode === 'mois' ? '10px' : periode === 'jour' ? '12px' : periode === 'evolution' ? '32px' : '28px'
          return (
            <div key={i} title={`${d.label}: 👁️ ${d.vues} vues, ✅ ${d.vis} visites`}
              style={{ flex: '0 0 auto', width: barW, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
              {hVues > 0 && <div style={{ width: '100%', height: `${hVues}px`, background: isToday ? '#374151' : '#D1D5DB', transition: 'height 0.3s' }} />}
              {hVis > 0 && <div style={{ width: '100%', height: `${hVis}px`, background: isToday ? '#0066FF' : '#93C5FD', borderRadius: '2px 2px 0 0', transition: 'height 0.3s' }} />}
              {hVues === 0 && hVis === 0 && <div style={{ width: '100%', height: 2, background: C.border }} />}
            </div>
          )
        })}
      </div>

      {(periode === 'semaine' || periode === 'jour' || periode === 'evolution') && (
        <div style={{ display: 'flex', gap: 1, marginTop: 4 }}>
          {data.map((d, i) => (
            <div key={i} style={{ flex: '0 0 auto', width: periode === 'jour' ? '12px' : periode === 'evolution' ? '32px' : '28px', textAlign: 'center' }}>
              <div style={{ color: C.muted, fontSize: 7, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.label}</div>
            </div>
          ))}
        </div>
      )}
      {periode === 'mois' && (
        <div style={{ display: 'flex', gap: 1, marginTop: 4 }}>
          {data.map((d, i) => (
            <div key={i} style={{ flex: '0 0 auto', width: '10px', textAlign: 'center' }}>
              {[0, 6, 13, 20, 27].includes(i) && <div style={{ color: C.muted, fontSize: 7 }}>{d.label}</div>}
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, marginTop: 8, justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: '#D1D5DB' }} />
          <span style={{ color: C.muted, fontSize: 10 }}>Vues</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: '#93C5FD' }} />
          <span style={{ color: C.muted, fontSize: 10 }}>Visites</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: '#0066FF' }} />
          <span style={{ color: C.muted, fontSize: 10 }}>Auj. / Courant</span>
        </div>
      </div>
    </div>
  )
}