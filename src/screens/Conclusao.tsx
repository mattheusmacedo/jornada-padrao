import { X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import PhoneFrame from '../components/PhoneFrame'

export default function Conclusao() {
  const navigate = useNavigate()
  return (
    <PhoneFrame bgColor="var(--color-pink-normal)">
      <div className="relative min-h-[800px] flex flex-col items-center px-6 pt-[24px]">
        <button
          type="button"
          aria-label="Fechar"
          onClick={() => navigate('/')}
          className="absolute top-[24px] right-[24px] text-white"
        >
          <X size={24} strokeWidth={2.5} />
        </button>

        <div className="flex-1 flex flex-col items-center justify-center gap-[40px]">
          {/* TODO: replace with Lottie JSON animation (girl with headphones) */}
          <div className="w-[280px] h-[280px]" />

          <h1
            className="w-[220px] text-center text-white font-medium uppercase text-[22.8px] leading-tight"
            style={{ letterSpacing: '1.42px' }}
          >
            Evento adicionado ao seu perfil!
          </h1>
        </div>
      </div>
    </PhoneFrame>
  )
}
