import { Compass, Calendar, MapPin, User, Plus } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion as fmotion } from 'framer-motion'
import { pressButton, pressTransition } from '../motion/variants'
import { motion as motionTokens } from '../motion/tokens'

type NavKey = 'explorar' | 'eventos' | 'mapa' | 'perfil'

const ROUTE_BY_KEY: Record<NavKey, string> = {
  explorar: '/explorar',
  eventos: '/eventos',
  mapa: '/mapa',
  perfil: '/',
}

const PINK = '#E8176B'
const GREY = '#B6B6B6'

const colorTransition = {
  duration: motionTokens.duration.reveal / 1000,
  ease: motionTokens.easing.out,
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
    <nav className="absolute bottom-0 inset-x-0 h-[86px] bg-white shadow-[0_-2.94px_7.84px_0_rgba(157,178,214,0.13)]">
      {/* Positioning lives on a plain wrapper so the FAB's centering
          transform (-translate-x-1/2) isn't clobbered by Framer Motion's
          inline whileTap transform. The button only owns motion + visuals. */}
      <div className="absolute left-1/2 -translate-x-1/2 -top-[22px] z-10">
        <fmotion.button
          type="button"
          aria-label="Criar"
          whileTap={pressButton}
          transition={pressTransition}
          className="w-[56px] h-[56px] rounded-full bg-[var(--color-pink-normal)] text-white flex items-center justify-center shadow-[0_6px_14px_rgba(232,23,107,0.4)]"
        >
          <Plus size={28} strokeWidth={2.5} />
        </fmotion.button>
      </div>

      <div className="grid grid-cols-4 h-full">
        {items.map(({ key, label, Icon, enabled }, idx) => {
          const isActive = key === active
          const padCls = idx === 1 ? 'pr-7' : idx === 2 ? 'pl-7' : ''
          return (
            <fmotion.button
              key={key}
              type="button"
              onClick={() => enabled && navigate(ROUTE_BY_KEY[key])}
              whileTap={pressButton}
              transition={pressTransition}
              className={`flex flex-col items-center justify-center gap-1 h-full w-full pb-[10px] ${padCls}`}
            >
              <fmotion.span
                animate={{ color: isActive ? PINK : GREY }}
                transition={colorTransition}
                className="flex flex-col items-center gap-1"
              >
                <Icon size={22} strokeWidth={2} color="currentColor" />
                <span className="text-[11.7px]">{label}</span>
              </fmotion.span>
            </fmotion.button>
          )
        })}
      </div>

      <div className="absolute bottom-[4px] left-1/2 -translate-x-1/2 h-[5px] w-[131px] rounded-full bg-[var(--color-grey-light-active)]" />
    </nav>
  )
}
