import { useState } from 'react'
import { getC, PROMO_PCTS } from '../../constants.js'
import { db } from '../../lib/supabase.js'
import {
  getTypesMetier, toLocalDateTimeInput, defaultDebut,
  defaultFin, maxFin, prixRemise
} from '../../utils.js'
import { PrestPageShell } from '../ui/PageShells.jsx'
import FInput from '../ui/FInput.jsx'
import Btn from '../ui/Btn.jsx'
import OffrePhotosManager from './OffrePhotosManager.jsx'

export default function OffreEditor({ offre, prestataireId, onBack, onSaved }) {
  const C = getC()
  const isNew = !offre
  const [form, setForm] = useState({
    titre: offre?.titre || '',
    description: offre?.description || '',
    type_offre: offre?.type_offre || '',
    prix_normal: offre?.prix_normal || '',
    mode_remise: offre?.mode_remise || 'pct',
    promo_pct: offre?.promo_pct || 10,
    prix: offre?.prix || '',
    menu_url: offre?.menu_url || '',
    date_debut: offre?.date_debut ? toLocalDateTimeInput(offre.date_debut) : defaultDebut(),
    date_fin: offre?.date_fin ? toLocalDateTimeInput(offre.date_fin) : defaultFin(),
  })
  const [photos, setPhotos] = useState(Array.isArray(offre?.photos) ? offre.photos : [])
  const [savedId, setSavedId] = useState(offre?.id || null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [typeSearch, setTypeSearch] = useState('')

  const F = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const prixCalcule = form.mode_remise === 'pct'
    ? prixRemise(form.prix_normal, form.promo_pct)
    : (form.prix ? parseFloat(form.prix) : null)

  const handleDateFin = v => {
    const max = maxFin(form.date_debut)
    if (max && v > max) { setError('La durée maximum est 1 semaine.'); F('date_fin', max) }
    else { setError(''); F('date_fin', v) }
  }

  const handleDateDebut = v => {
    F('date_debut', v)
    const d = new Date(v); d.setHours(d.getHours() + 2)
    F('date_fin', toLocalDateTimeInput(d))
  }

  const save = async () => {
    if (!form.titre) return setError('Le titre est obligatoire')
    if (!form.type_offre) return setError("Le type d'offre est obligatoire")
    if (!form.date_debut || !form.date_fin) return setError('Les dates sont obligatoires')
    const debut = new Date(form.date_debut)
    const fin = new Date(form.date_fin)
    if (fin <= debut) return setError('La date de fin doit être après la date de début')
    const diffDays = (fin - debut) / (1000 * 60 * 60 * 24)
    const maxJours = window.SIOK_PARAMS?.duree_max_offre_jours || 7
    if (diffDays > maxJours) return setError(`La durée ne peut pas dépasser ${maxJours} jour${maxJours > 1 ? 's' : ''}`)

    setSaving(true); setError('')
    try {
      const prixFinal = form.mode_remise === 'pct'
        ? prixRemise(form.prix_normal, form.promo_pct)
        : (form.prix ? parseFloat(form.prix) : null)

      const payload = {
        titre: form.titre, description: form.description || null,
        type_offre: form.type_offre,
        prix_normal: form.prix_normal ? parseFloat(form.prix_normal) : null,
        mode_remise: form.mode_remise, promo_pct: form.promo_pct,
        prix: prixFinal, menu_url: form.menu_url || null,
        date_debut: debut.toISOString(), date_fin: fin.toISOString(),
        permanente: false, active: true,
        prestataire_id: prestataireId, photos,
      }
      if (isNew) {
        const { data: inserted, error: err } = await db().from('offres').insert(payload).select('id').single()
        if (err) throw err
        setSavedId(inserted.id)
      } else {
        const { error: err } = await db().from('offres').update(payload).eq('id', offre.id)
        if (err) throw err
      }
      onSaved()
    } catch (e) { setError(e.message) }
    setSaving(false)
  }

  const allTypes = getTypesMetier()
  const filteredTypes = typeSearch
    ? allTypes.filter(t => t.label.toLowerCase().includes(typeSearch.toLowerCase()))
    : allTypes
  const selectedType = allTypes.find(t => t.id === form.type_offre)

  return (
    <PrestPageShell onBack={onBack} backLabel="← Mes offres">
      <div style={{ padding: '20px' }}>
        <div style={{ color: C.text, fontSize: 20, fontWeight: 800, marginBottom: 16 }}>
          {isNew ? 'Nouvelle offre' : "Modifier l'offre"}
        </div>

        <FInput label="Titre de l'offre" value={form.titre} onChange={v => F('titre', v)}
          placeholder="Ex: Coupe étudiant, Repas du jour…" required />
        <FInput label="Description (optionnel)" value={form.description} onChange={v => F('description', v)}
          placeholder="Décrivez votre offre…" />
        <FInput label="URL détail (optionnel)" value={form.menu_url} onChange={v => F('menu_url', v)}
          placeholder="https://…" />

        {/* Type d'offre */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ color: C.sub, fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>
            Type d'offre * {selectedType && <span style={{ color: C.accent }}>{selectedType.emoji} {selectedType.label}</span>}
          </div>
          <input value={typeSearch} onChange={e => setTypeSearch(e.target.value)}
            placeholder="🔍 Rechercher un type…"
            style={{ width: '100%', background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 14px', color: C.text, fontSize: 13, fontFamily: 'inherit', outline: 'none', marginBottom: 8 }} />
          <div style={{ maxHeight: 180, overflowY: 'auto', background: C.surface, borderRadius: 10, border: `1px solid ${C.border}` }}>
            {filteredTypes.map(t => (
              <button key={t.id} onClick={() => { F('type_offre', t.id); setTypeSearch('') }}
                style={{
                  width: '100%', padding: '9px 14px',
                  background: form.type_offre === t.id ? 'rgba(0,102,255,0.12)' : 'transparent',
                  border: 'none', borderBottom: `1px solid ${C.border}`,
                  color: form.type_offre === t.id ? C.accent : C.text,
                  fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
                  textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8,
                  fontWeight: form.type_offre === t.id ? 700 : 400
                }}>
                <span style={{ fontSize: 16 }}>{t.emoji}</span>
                <span style={{ flex: 1 }}>{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        <FInput label="Prix normal (€)" type="number" value={form.prix_normal}
          onChange={v => F('prix_normal', v)} placeholder="Ex: 20.00" />

        {/* Mode remise */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ color: C.sub, fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Type de remise *</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            {[{ v: 'pct', l: '% de remise' }, { v: 'fixe', l: 'Prix fixe remisé' }].map(opt => (
              <button key={opt.v} onClick={() => F('mode_remise', opt.v)} style={{
                flex: 1, padding: '10px 0', borderRadius: 10,
                border: `1px solid ${form.mode_remise === opt.v ? C.accent : C.border}`,
                background: form.mode_remise === opt.v ? C.accentSoft : 'transparent',
                color: form.mode_remise === opt.v ? C.accent : C.muted,
                fontSize: 12, fontWeight: form.mode_remise === opt.v ? 700 : 400,
                cursor: 'pointer', fontFamily: 'inherit'
              }}>
                {opt.l}
              </button>
            ))}
          </div>

          {form.mode_remise === 'pct' && (
            <div>
              <div style={{ color: C.sub, fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>
                % de remise <span style={{ color: C.accent }}>(-{form.promo_pct}%)</span>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                {PROMO_PCTS.map(p => (
                  <button key={p} onClick={() => F('promo_pct', p)} style={{
                    padding: '7px 12px', borderRadius: 10,
                    border: `1px solid ${form.promo_pct === p ? C.accent : C.border}`,
                    background: form.promo_pct === p ? C.accentSoft : 'transparent',
                    color: form.promo_pct === p ? C.accent : C.muted,
                    fontSize: 12, fontWeight: form.promo_pct === p ? 700 : 400,
                    cursor: 'pointer', fontFamily: 'inherit'
                  }}>
                    -{p}%
                  </button>
                ))}
              </div>
            </div>
          )}

          {form.mode_remise === 'fixe' && (
            <FInput label="Prix remisé (€)" type="number" value={form.prix}
              onChange={v => F('prix', v)} placeholder="Ex: 15.00" />
          )}

          {form.prix_normal && prixCalcule !== null && (
            <div style={{ background: 'rgba(0,102,255,0.08)', border: '1px solid rgba(0,102,255,0.2)', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ color: C.muted, fontSize: 13, textDecoration: 'line-through' }}>{parseFloat(form.prix_normal).toFixed(2)}€</div>
              <div style={{ color: C.accent, fontWeight: 900, fontSize: 18 }}>{prixCalcule.toFixed(2)}€</div>
              {form.mode_remise === 'pct' && (
                <div style={{ background: C.accent, color: 'white', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>-{form.promo_pct}%</div>
              )}
            </div>
          )}
        </div>

        {/* Dates */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ color: C.sub, fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>
            Période de l'offre * <span style={{ color: C.muted, fontWeight: 400, fontSize: 10 }}>(max 1 semaine)</span>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <div style={{ color: C.muted, fontSize: 11, marginBottom: 4 }}>Début</div>
              <input type="datetime-local" value={form.date_debut} onChange={e => handleDateDebut(e.target.value)}
                style={{ width: '100%', background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 12px', color: C.text, fontSize: 12, fontFamily: 'inherit', outline: 'none' }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: C.muted, fontSize: 11, marginBottom: 4 }}>Fin</div>
              <input type="datetime-local" value={form.date_fin}
                min={form.date_debut} max={maxFin(form.date_debut)}
                onChange={e => handleDateFin(e.target.value)}
                style={{ width: '100%', background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 12px', color: C.text, fontSize: 12, fontFamily: 'inherit', outline: 'none' }} />
            </div>
          </div>
        </div>

        <OffrePhotosManager offreId={savedId} photos={photos} onUpdate={setPhotos} />

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', borderRadius: 10, padding: '10px 14px', marginBottom: 14, color: '#ef4444', fontSize: 13 }}>
            ⚠️ {error}
          </div>
        )}

        <Btn onClick={save} loading={saving}>
          {isNew ? "Créer l'offre" : 'Sauvegarder les modifications'}
        </Btn>
      </div>
    </PrestPageShell>
  )
}