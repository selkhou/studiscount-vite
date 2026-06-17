import { useState } from 'react'
import { CS } from '../../constants.js'
import StudentBtn from './StudentBtn.jsx'

const CGU_ETUDIANT = `
**Conditions d'utilisation — Étudiant**

1. L'application StuDiscount est réservée aux étudiants munis d'une carte étudiant valide.

2. Les offres sont proposées par des commerçants partenaires et peuvent être modifiées ou retirées à tout moment.

3. Le QR code généré est personnel et ne peut être partagé. Toute utilisation frauduleuse entraînera la suspension du compte.

4. Les points accumulés sont valables 12 mois et ne sont pas convertibles en argent.

5. StuDiscount se réserve le droit de suspendre tout compte en cas d'abus.
`

const CGU_PRESTATAIRE = `
**Conditions d'utilisation — Prestataire**

1. En tant que commerçant partenaire, vous vous engagez à honorer les offres publiées sur la plateforme.

2. La commission est prélevée sur chaque vente validée par QR code selon votre plan d'abonnement.

3. Les offres doivent être conformes à la législation en vigueur et ne pas induire le client en erreur.

4. StuDiscount se réserve le droit de retirer toute offre non conforme sans préavis.

5. Le paiement de la commission est automatique via le moyen de paiement enregistré.
`

export default function ModalCGU({ onClose, defaultTab = 'etudiant', hidePresta = false }) {
  const [tab, setTab] = useState(defaultTab)

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 700,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center'
    }} onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'white', borderRadius: '24px 24px 0 0',
          width: '100%', maxWidth: 480,
          maxHeight: '85vh', display: 'flex', flexDirection: 'column'
        }}>

        {/* Header */}
        <div style={{
          padding: '20px 20px 0',
          borderBottom: '1px solid #F0F0F0',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: CS.text }}>
              Conditions d'utilisation
            </div>
            <button onClick={onClose} style={{
              background: '#F5F5F5', border: 'none', borderRadius: '50%',
              width: 32, height: 32, cursor: 'pointer', fontSize: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>✕</button>
          </div>

          {!hidePresta && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {['etudiant', 'prestataire'].map(t => (
                <button key={t} onClick={() => setTab(t)} style={{
                  padding: '6px 16px', borderRadius: 20, border: 'none',
                  background: tab === t ? CS.accent : '#F0F0F0',
                  color: tab === t ? 'white' : CS.muted,
                  fontSize: 12, fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'inherit'
                }}>
                  {t === 'etudiant' ? '🎓 Étudiant' : '🏪 Prestataire'}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Contenu */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          <div style={{
            fontSize: 13, color: CS.text, lineHeight: 1.8,
            whiteSpace: 'pre-line'
          }}>
            {tab === 'etudiant' ? CGU_ETUDIANT : CGU_PRESTATAIRE}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 20px 32px', flexShrink: 0 }}>
          <StudentBtn onClick={onClose}>J'ai compris</StudentBtn>
        </div>
      </div>
    </div>
  )
}