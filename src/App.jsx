import MapExplorer from './components/map/MapExplorer.jsx'

export default function App() {
  return (
    <MapExplorer
      onConnecte={() => alert('→ espace étudiant')}
      onPrestataire={() => alert('→ espace pro')}
    />
  )
}