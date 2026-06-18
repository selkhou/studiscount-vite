import { useState } from 'react'
import ModalSuggestion from '../etudiant/ModalSuggestion.jsx'

export default function BoutonSuggestion({ nom, type }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button onClick={() => setOpen(true)} title="Donnez votre avis"
        style={{ width: 32, height: 32, borderRadius: 10, border: '1.5px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.1)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
        💡
      </button>
      {open && <ModalSuggestion nom={nom} type={type} onClose={() => setOpen(false)} />}
    </>
  )
}