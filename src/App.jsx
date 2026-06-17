import { useState } from 'react'
import MapExplorer from './components/map/MapExplorer.jsx'
import OffreDetail from './components/offres/OffreDetail.jsx'
import QRGenerator from './components/qr/QRGenerator.jsx'
import QRScanner from './components/qr/QRScanner.jsx'

const OFFRE_TEST = {
  id: 'b1000000-0000-0000-0000-000000000007',
  titre: 'Fondue savoyarde duo',
  image_emoji: '🫕',
  prix_normal: 20,
  promo_pct: 20,
  active: true,
  prestataire_id: 'a1000000-0000-0000-0000-000000000003',
  photos: [],
  prestataires: { nom: 'Le Clocher', type_metier: 'restaurant' }
}

const ETUDIANT_TEST = {
  id: 'c1000000-0000-0000-0000-000000000001',
  prenom: 'Test',
  nom: 'Etudiant'
}

export default function App() {
  const [vue, setVue] = useState('map')

  return (
    <>
      {vue === 'map' && (
        <MapExplorer
          onConnecte={() => alert('→ étudiant')}
          onPrestataire={() => alert('→ pro')}
        />
      )}

      {vue === 'qr-gen' && (
        <QRGenerator
          offre={OFFRE_TEST}
          etudiant={ETUDIANT_TEST}
          onClose={() => setVue('map')}
        />
      )}

      {vue === 'qr-scan' && (
        <QRScanner
          prestataireId="a1000000-0000-0000-0000-000000000003"
          onScanned={v => { alert('Validé ! ' + JSON.stringify(v)); setVue('map') }}
          onClose={() => setVue('map')}
        />
      )}

      {/* Boutons test */}
      <div style={{
        position: 'fixed', top: 20, right: 20, zIndex: 999,
        display: 'flex', flexDirection: 'column', gap: 8
      }}>
        <button onClick={() => setVue('qr-gen')} style={{
          background: '#0066FF', color: 'white', border: 'none',
          borderRadius: 20, padding: '8px 14px',
          fontWeight: 700, cursor: 'pointer', fontSize: 12
        }}>📱 QR Generator</button>
        <button onClick={() => setVue('qr-scan')} style={{
          background: '#1C1F23', color: 'white', border: 'none',
          borderRadius: 20, padding: '8px 14px',
          fontWeight: 700, cursor: 'pointer', fontSize: 12
        }}>📷 QR Scanner</button>
      </div>
    </>
  )
}