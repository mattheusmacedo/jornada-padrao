import type { ReactNode } from 'react'
import StatusBar from './StatusBar'
import BottomNav from './BottomNav'

type Props = {
  children: ReactNode
  bgColor?: string
  statusBarStyle?: 'dark' | 'light'
  showBottomNav?: boolean
}

const BOTTOM_NAV_HEIGHT = 88

export default function PhoneFrame({
  children,
  bgColor = 'var(--color-grey-light)',
  statusBarStyle = 'dark',
  showBottomNav = false,
}: Props) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-neutral-100 p-6">
      <div
        className="relative w-[368px] h-[800px] rounded-[40px] shadow-xl overflow-hidden"
        style={{ background: bgColor }}
      >
        {/* Scrollable content area — bounded by BottomNav when shown so last items aren't hidden */}
        <div
          className="absolute top-0 left-0 right-0 overflow-y-auto overflow-x-hidden scrollbar-hide"
          style={{ bottom: showBottomNav ? BOTTOM_NAV_HEIGHT : 0 }}
        >
          {children}
        </div>
        <StatusBar style={statusBarStyle} />
        {showBottomNav && <BottomNav />}
      </div>
    </div>
  )
}
