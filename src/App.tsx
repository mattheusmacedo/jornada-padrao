import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import PhoneFrame from './components/PhoneFrame'
import Perfil from './screens/Perfil'
import Explorar from './screens/Explorar'
import Evento from './screens/Evento'

// Heavy screens are code-split. Conclusao + Ramificacao pull in three.js,
// GLTFLoader, MeshoptDecoder, and the AlphaVideo / state-machine plumbing
// (Conclusao via MusicNotesOverlay, Ramificacao via the radio illustration
// pipeline). MotionDocs is large standalone. Sandboxes are dev/handoff
// surfaces that pull in three.js for previews. Keeping all of them out of
// the initial bundle lets first paint of /perfil and /explorar stay light.
const Ramificacao = lazy(() => import('./screens/Ramificacao'))
const Conclusao = lazy(() => import('./screens/Conclusao'))
const MotionDocs = lazy(() => import('./screens/MotionDocs'))
const BurstSandbox = lazy(() => import('./screens/BurstSandbox'))
const ModelSandbox = lazy(() => import('./screens/ModelSandbox'))

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
        <Suspense fallback={null}>
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Perfil />} />
            <Route path="/explorar" element={<Explorar />} />
            <Route path="/evento" element={<Evento />} />
            <Route path="/ramificacao" element={<Ramificacao />} />
            <Route path="/conclusao" element={<Conclusao />} />
          </Routes>
        </Suspense>
      </AnimatePresence>
    </PhoneFrame>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={null}>
        <Routes>
          <Route path="/motion-docs" element={<MotionDocs />} />
          <Route path="/burst-sandbox" element={<BurstSandbox />} />
          <Route path="/model-sandbox" element={<ModelSandbox />} />
          <Route path="/*" element={<AnimatedPhoneRoutes />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
