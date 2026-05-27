import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import PhoneFrame from './components/PhoneFrame'
import Perfil from './screens/Perfil'
import Explorar from './screens/Explorar'
import Evento from './screens/Evento'
import Ramificacao from './screens/Ramificacao'
import Conclusao from './screens/Conclusao'
import MotionDocs from './screens/MotionDocs'

const ROUTES_WITH_NAV = new Set(['/', '/explorar'])

function AnimatedPhoneRoutes() {
  const location = useLocation()
  const path = location.pathname
  const isConclusao = path === '/conclusao'
  const isEvento = path === '/evento'
  const isExplorar = path === '/explorar'

  const bgColor = isConclusao
    ? 'var(--color-pink-normal)'
    : isEvento || isExplorar
      ? '#FFFFFF'
      : 'var(--color-grey-light)'
  const statusBarStyle: 'dark' | 'light' = isConclusao || isEvento ? 'light' : 'dark'
  const showBottomNav = ROUTES_WITH_NAV.has(path)

  return (
    <PhoneFrame
      bgColor={bgColor}
      statusBarStyle={statusBarStyle}
      showBottomNav={showBottomNav}
      noTopInset={isEvento}
    >
      {/* mode="popLayout" keeps the exiting page mounted briefly so shared-
          element morphs (layoutId-tagged) can measure both source and
          destination positions for the cross-route interpolation. */}
      <AnimatePresence mode="popLayout">
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
      <Routes>
        <Route path="/motion-docs" element={<MotionDocs />} />
        <Route path="/*" element={<AnimatedPhoneRoutes />} />
      </Routes>
    </BrowserRouter>
  )
}
