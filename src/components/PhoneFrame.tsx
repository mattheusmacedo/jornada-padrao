import type { ReactNode } from 'react'
import StatusBar from './StatusBar'
import BottomNav from './BottomNav'

type Props = {
  children: ReactNode
  bgColor?: string
  statusBarStyle?: 'dark' | 'light'
  showBottomNav?: boolean
}

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
        {/* Scrollable content area — screens render here. Status bar and bottom nav overlay. */}
        <div className="absolute inset-0 overflow-y-auto overflow-x-hidden">
          {children}
        </div>
        <StatusBar style={statusBarStyle} />
        {showBottomNav && <BottomNav />}
      </div>
    </div>
  )
}
