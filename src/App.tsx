import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Perfil from './screens/Perfil'
import Explorar from './screens/Explorar'
import Evento from './screens/Evento'
import Ramificacao from './screens/Ramificacao'
import Conclusao from './screens/Conclusao'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Perfil />} />
        <Route path="/explorar" element={<Explorar />} />
        <Route path="/evento" element={<Evento />} />
        <Route path="/ramificacao" element={<Ramificacao />} />
        <Route path="/conclusao" element={<Conclusao />} />
      </Routes>
    </BrowserRouter>
  )
}
