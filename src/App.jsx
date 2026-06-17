import { useState } from 'react'
import MapExplorer from './components/map/MapExplorer.jsx'
import EtudiantDashboard from './components/etudiant/EtudiantDashboard.jsx'
import EtudiantApp from './components/etudiant/EtudiantApp.jsx'

export default function App() {
  const [screen, setScreen] = useState('explorer')
  const [etudiant, setEtudiant] = useState(null)

  if (screen === 'auth') return (
    <EtudiantDashboard
      onBack={() => setScreen('explorer')}
      onConnecte={et => { setEtudiant(et); setScreen('etudiant') }}
    />
  )

  if (screen === 'etudiant') return (
    <EtudiantApp
      etudiant={etudiant}
      onLogout={() => { setEtudiant(null); setScreen('explorer') }}
      onHome={() => setScreen('explorer')}
    />
  )

  return (
    <MapExplorer
      onConnecte={() => setScreen('auth')}
      onPrestataire={() => alert('→ pro')}
    />
  )
}