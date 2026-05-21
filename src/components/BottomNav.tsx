import { Compass, Calendar, MapPin, User, Plus } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'

type NavKey = 'explorar' | 'eventos' | 'mapa' | 'perfil'

const ROUTE_BY_KEY: Record<NavKey, string> = {
  explorar: '/explorar',
  eventos: '/eventos',
  mapa: '/mapa',
  perfil: '/',
}

function keyForPath(path: string): NavKey {
  if (path.startsWith('/explorar')) return 'explorar'
  if (path.startsWith('/eventos')) return 'eventos'
  if (path.startsWith('/mapa')) return 'mapa'
  return 'perfil'
}

export default function BottomNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const active = keyForPath(pathname)

  const items: { key: NavKey; label: string; Icon: typeof Compass; enabled: boolean }[] = [
    { key: 'explorar', label: 'Explorar', Icon: Compass, enabled: true },
    { key: 'eventos', label: 'Eventos', Icon: Calendar, enabled: false },
    { key: 'mapa', label: 'Mapa', Icon: MapPin, enabled: false },
    { key: 'perfil', label: 'Perfil', Icon: User, enabled: true },
  ]

  return (
    <nav className="absolute bottom-0 inset-x-0 h-[88px] bg-white">
      <button
        type="button"
        aria-label="Criar"
        className="absolute left-1/2 -translate-x-1/2 -top-[22px] w-[56px] h-[56px] rounded-full bg-[var(--color-pink-normal)] text-white flex items-center justify-center shadow-[0_6px_14px_rgba(232,23,107,0.4)]"
      >
        <Plus size={28} strokeWidth={2.5} />
      </button>

      <div className="grid grid-cols-4 h-[68px] pt-3">
        {items.map(({ key, label, Icon, enabled }, idx) => {
          const isActive = key === active
          const color = isActive ? 'var(--color-pink-normal)' : 'var(--color-grey-normal)'
          const padCls = idx === 1 ? 'pr-7' : idx === 2 ? 'pl-7' : ''
          return (
            <button
              key={key}
              type="button"
              onClick={() => enabled && navigate(ROUTE_BY_KEY[key])}
              className={`flex flex-col items-center gap-1 ${padCls}`}
            >
              <Icon size={22} strokeWidth={2} color={color} />
              <span className="text-[11.7px]" style={{ color }}>{label}</span>
            </button>
          )
        })}
      </div>

      <div className="absolute bottom-[6px] left-1/2 -translate-x-1/2 h-[5px] w-[131px] rounded-full bg-[var(--color-grey-light-active)]" />
    </nav>
  )
}
