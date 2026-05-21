import type { ReactNode } from 'react'

type Props = { children: ReactNode }

export default function PhoneFrame({ children }: Props) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-neutral-100 p-6">
      <div className="w-[368px] min-h-[800px] bg-[var(--color-grey-light)] rounded-[40px] shadow-xl overflow-hidden relative">
        {children}
      </div>
    </div>
  )
}
