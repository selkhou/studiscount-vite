import { useState } from 'react'
import { getC } from '../../constants.js'
import { db } from '../../lib/supabase.js'

const MAPBOX_KEY = 'pk.eyJ1Ijoic2Vsa2hvdSIsImEiOiJjbXFmN25neXYwNDl6MnJxeW1wOWdqMXd5In0.BdSsZTjKclMcaBvsSxBAoQ'

export default function EditProfilPrestataire({ prestataire, onSave }) {
  const C = getC()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const F = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const startEdit = () => {
    setForm({
      nom: prestataire?.nom || '',
      telephone: prestataire?.telephone || '',
      adresse: prestataire?.adresse || '',
      siret: prestataire?.siret || '',
      nom_responsable: prestataire?.nom_responsable || '',
    })
    setEditing(true); setMsg('')
  }

  const save = async () => {
    setSaving(true); setMsg('')
    try {
      let lat = prestataire.lat, lng = prestataire.lng
      if (form.adresse && form.adresse !== prestataire.adresse) {
        const addr = encodeURIComponent(`${form.adresse}, ${prestataire.ville || 'Annecy'}, France`)
        const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${addr}.json?access_token=${MAPBOX_KEY}&limit=1&country=fr`)
        const geo = await res.json()
        if (geo.features && geo.features.length > 0) {
          lng = geo.features[0].center[0]
          lat = geo.features[0].center[1]
        }
      }
      const { error } = await db().from('prestataires').update({
        nom: form.nom, telephone: form.telephone, adresse: form.adresse,
        siret: form.siret, nom_responsable: form.nom_responsable, lat, lng,
      }).eq('id', prestataire.id)
      if (error) throw error
      setMsg(lat !== prestataire.lat ? '✅ Profil et localisation mis à jour !' : '✅ Profil mis à jour !')
      setEditing(false)
      if (onSave) onSave({ ...prestataire, ...form, lat, lng })
    } catch (e) { setMsg('❌ ' + e.message) }
    setSaving(false)
  }

  const inp = (k, label, type = 'text') => (
    <div style={{ marginBottom: 10 }}>
      <div style={{ color: C.muted, fontSize: 11, fontWeight: 600, marginBottom: 4 }}>{label}</div>
      <input type={type} value={form[k] || ''} onChange={e => F(k, e.target.value)}
        style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
    </div>
  )

  return (
    <div style={{ padding: '16px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ color: C.text, fontWeight: 700, fontSize: 14 }}>🏪 Mes informations</div>
        <button onClick={editing ? () => setEditing(false) : startEdit} style={{
          padding: '5px 12px', borderRadius: 8, border: `1px solid ${C.border}`,
          background: 'transparent', color: editing ? C.muted : '#4D9EFF',
          fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit'
        }}>
          {editing ? 'Annuler' : '✏️ Modifier'}
        </button>
      </div>

      {!editing && [
        { l: 'Nom', v: prestataire?.nom },
        { l: 'Responsable', v: prestataire?.nom_responsable },
        { l: 'Adresse', v: prestataire?.adresse },
        { l: 'Téléphone', v: prestataire?.telephone },
        { l: 'SIRET', v: prestataire?.siret },
        { l: 'Email', v: prestataire?.email },
      ].map(({ l, v }) => (
        <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${C.border}` }}>
          <span style={{ color: C.muted, fontSize: 13 }}>{l}</span>
          <span style={{ color: C.text, fontSize: 13, fontWeight: 600 }}>{v || '—'}</span>
        </div>
      ))}

      {editing && (
        <div>
          {inp('nom', "Nom de l'établissement")}
          {inp('nom_responsable', 'Nom du responsable')}
          {inp('adresse', 'Adresse')}
          {inp('telephone', 'Téléphone', 'tel')}
          {inp('siret', 'SIRET')}
          {msg && <div style={{ fontSize: 12, color: msg.startsWith('✅') ? '#22C55E' : '#EF4444', marginBottom: 8 }}>{msg}</div>}
          <button onClick={save} disabled={saving} style={{
            width: '100%', padding: '11px', borderRadius: 12, border: 'none',
            background: '#0066FF', color: 'white', fontSize: 13, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'inherit', marginTop: 4
          }}>
            {saving ? '...' : '💾 Enregistrer'}
          </button>
        </div>
      )}
    </div>
  )
}