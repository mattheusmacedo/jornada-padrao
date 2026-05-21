import { X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import PhoneFrame from '../components/PhoneFrame'
import pessoa from '../assets/conclusao/pessoa.png'
import mao from '../assets/conclusao/mao.png'

export default function Conclusao() {
  const navigate = useNavigate()
  return (
    <PhoneFrame>
      <div className="relative min-h-[800px] bg-[var(--color-pink-normal)]">
        <button
          type="button"
          aria-label="Fechar"
          onClick={() => navigate('/')}
          className="absolute top-[24px] right-[24px] text-white"
        >
          <X size={24} strokeWidth={2.5} />
        </button>

        <div className="relative mt-[180px] flex justify-center">
          <div className="relative w-[223px] h-[213px]">
            <img src={pessoa} alt="" className="absolute inset-0 w-full h-full object-contain" />
            <img
              src={mao}
              alt=""
              className="absolute"
              style={{
                width: '57px',
                height: '77px',
                left: '16px',
                top: '94px',
                transform: 'rotate(18.51deg)',
              }}
            />
          </div>
        </div>

        <h1
          className="mt-[60px] mx-auto w-[200px] text-center text-white font-medium uppercase text-[22.8px] leading-tight"
          style={{ letterSpacing: '1.42px' }}
        >
          Evento adicionado ao seu perfil!
        </h1>
      </div>
    </PhoneFrame>
  )
}
