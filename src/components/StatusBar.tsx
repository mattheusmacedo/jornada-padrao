import { Signal, Wifi, BatteryFull } from 'lucide-react'

type Props = { style?: 'dark' | 'light' }

export default function StatusBar({ style = 'dark' }: Props) {
  const color = style === 'light' ? '#FFFFFF' : 'var(--color-grey-darker)'
  return (
    <div
      className="absolute top-0 inset-x-0 h-[44px] flex items-center justify-between px-[24px] z-40 pointer-events-none"
      style={{ color }}
    >
      <span className="text-[14.8px] font-semibold tracking-[-0.3px]">9:41</span>
      <div className="flex items-center gap-[6px]">
        <Signal size={14} strokeWidth={2.5} />
        <Wifi size={14} strokeWidth={2.5} />
        <BatteryFull size={22} strokeWidth={2} />
      </div>
    </div>
  )
}
