import { createContext, useContext } from 'react'

// Lets a screen tell PhoneFrame that a full-screen overlay is active, so the
// frame can release BottomNav space and let the overlay own the viewport.
// Today this is used by the RAYE event-detail overlay launched from Perfil /
// Explorar; extend the surface if other screens need similar takeovers.
type PhoneFrameChromeContextValue = {
  setEventOverlayOpen: (open: boolean) => void
}

export const PhoneFrameChromeContext = createContext<PhoneFrameChromeContextValue | null>(null)

const NOOP_CHROME: PhoneFrameChromeContextValue = {
  setEventOverlayOpen: () => {},
}

export function usePhoneFrameChrome(): PhoneFrameChromeContextValue {
  return useContext(PhoneFrameChromeContext) ?? NOOP_CHROME
}
