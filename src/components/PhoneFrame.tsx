import type { ReactNode } from 'react'

type Props = { children: ReactNode }

export default function PhoneFrame({ children }: Props) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-neutral-100 p-6">
      <div className="w-[390px] min-h-[780px] bg-white rounded-[40px] shadow-xl overflow-hidden relative">
        {children}
      </div>
    </div>
  )
}
