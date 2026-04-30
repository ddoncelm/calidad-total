import { useState } from 'react'
import PaginaLogin from './pages/Login.jsx'
import PaginaCoordinador from './pages/Coordinador.jsx'
import PaginaParticipante from './pages/Participante.jsx'

export default function App() {
  const [sesion, setSesion] = useState(null)
  if (!sesion) return <PaginaLogin onLogin={setSesion} />
  if (sesion.rol === 'coordinador') return <PaginaCoordinador onLogout={() => setSesion(null)} />
  return <PaginaParticipante sesion={sesion} onLogout={() => setSesion(null)} />
}
