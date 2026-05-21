import type { ReactNode } from 'react'
import StatusBar from './StatusBar'
import BottomNav from './BottomNav'

type Props = {
  children: ReactNode
  bgColor?: string
  statusBarStyle?: 'dark' | 'light'
  showBottomNav?: boolean
}

const BOTTOM_NAV_HEIGHT = 86

export default function PhoneFrame({
  children,
  bgColor = 'var(--color-grey-light)',
  statusBarStyle = 'dark',
  showBottomNav = false,
}: Props) {
  return (
    <div
      className="relative w-full h-screen overflow-hidden"
      style={{ background: bgColor }}
    >
      <div
        className="absolute top-0 left-0 right-0 overflow-y-auto overflow-x-hidden scrollbar-hide pt-[44px]"
        style={{ bottom: showBottomNav ? BOTTOM_NAV_HEIGHT : 0 }}
      >
        {children}
      </div>
      <StatusBar style={statusBarStyle} />
      {showBottomNav && <BottomNav />}
    </div>
  )
}
