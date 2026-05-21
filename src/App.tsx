import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import PhoneFrame from './components/PhoneFrame'
import Perfil from './screens/Perfil'
import Explorar from './screens/Explorar'
import Evento from './screens/Evento'
import Ramificacao from './screens/Ramificacao'
import Conclusao from './screens/Conclusao'

function AnimatedRoutes() {
  const location = useLocation()
  const isConclusao = location.pathname === '/conclusao'
  return (
    <PhoneFrame bgColor={isConclusao ? 'var(--color-pink-normal)' : undefined}>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Perfil />} />
          <Route path="/explorar" element={<Explorar />} />
          <Route path="/evento" element={<Evento />} />
          <Route path="/ramificacao" element={<Ramificacao />} />
          <Route path="/conclusao" element={<Conclusao />} />
        </Routes>
      </AnimatePresence>
    </PhoneFrame>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AnimatedRoutes />
    </BrowserRouter>
  )
}
