import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import StatusBar from './StatusBar'
import BottomNav from './BottomNav'
import { PhoneFrameChromeContext } from './PhoneFrameChromeContext'

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
  // Screens can flip this via usePhoneFrameChrome() when a takeover overlay
  // (e.g. event-detail morph) is active. While open, the scroll wrapper
  // extends through the BottomNav area and the nav itself fades/slides out
  // so the overlay can own the full phone body.
  const [eventOverlayOpen, setEventOverlayOpen] = useState(false)
  const chrome = useMemo(() => ({ setEventOverlayOpen }), [])

  return (
    <PhoneFrameChromeContext.Provider value={chrome}>
      <div
        className="relative w-full h-screen overflow-hidden"
        style={{ background: bgColor }}
      >
        <div
          className={`absolute top-0 left-0 right-0 overflow-y-auto overflow-x-hidden scrollbar-hide ${noTopInset ? '' : 'pt-[44px]'}`}
          style={{
            bottom: showBottomNav && !eventOverlayOpen ? NAV_RESERVED_HEIGHT : 0,
          }}
        >
          {children}
        </div>
        <StatusBar style={statusBarStyle} />
        {showBottomNav && (
          // Wrapper owns the bottom positioning + the fade/slide. Inner
          // BottomNav's own absolute bottom-0 nests against this wrapper
          // (transform creates a new containing block) so both shift
          // together when the overlay flips eventOverlayOpen on.
          <div
            className={`absolute left-0 right-0 bottom-0 transition-all duration-200 ease-out ${
              eventOverlayOpen
                ? 'pointer-events-none translate-y-4 opacity-0'
                : 'translate-y-0 opacity-100'
            }`}
          >
            <BottomNav />
          </div>
        )}
      </div>
    </PhoneFrameChromeContext.Provider>
  )
}
