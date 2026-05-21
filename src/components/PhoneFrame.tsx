import type { ReactNode } from 'react'

type Props = { children: ReactNode; bgColor?: string }

export default function PhoneFrame({ children, bgColor = 'var(--color-grey-light)' }: Props) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-neutral-100 p-6">
      <div
        className="w-[368px] min-h-[800px] rounded-[40px] shadow-xl overflow-hidden relative"
        style={{ background: bgColor }}
      >
        {children}
      </div>
    </div>
  )
}
