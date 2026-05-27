import type { ReactNode } from 'react'
import StatusBar from './StatusBar'
import BottomNav from './BottomNav'

type Props = {
  children: ReactNode
  bgColor?: string
  statusBarStyle?: 'dark' | 'light'
  showBottomNav?: boolean
  /** When true, the inner scroll wrapper starts at viewport y=0 (no 44px
   *  status-bar inset). Use for screens whose top content extends under the
   *  status bar — e.g. a full-bleed hero — so the destination box of a
   *  layoutId morph is at its true viewport position without negative-margin
   *  hacks. The StatusBar still renders on top via its absolute overlay. */
  noTopInset?: boolean
}

// Nav body is 86px; the FAB lifts ~22px above the body. Reserving the full
// 108px ensures scrolled content stops at the FAB's top edge so the lifted
// half of the FAB never has scrolling content visible around it.
const NAV_RESERVED_HEIGHT = 86 + 22

export default function PhoneFrame({
  children,
  bgColor = 'var(--color-grey-light)',
  statusBarStyle = 'dark',
  showBottomNav = false,
  noTopInset = false,
}: Props) {
  return (
    <div
      className="relative w-full h-screen overflow-hidden"
      style={{ background: bgColor }}
    >
      <div
        className={`absolute top-0 left-0 right-0 overflow-y-auto overflow-x-hidden scrollbar-hide ${noTopInset ? '' : 'pt-[44px]'}`}
        style={{ bottom: showBottomNav ? NAV_RESERVED_HEIGHT : 0 }}
      >
        {children}
      </div>
      <StatusBar style={statusBarStyle} />
      {showBottomNav && <BottomNav />}
    </div>
  )
}
