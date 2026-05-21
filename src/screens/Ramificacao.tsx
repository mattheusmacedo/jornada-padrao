import { useState } from 'react'
import { ArrowLeft, MoreVertical } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import PhoneFrame from '../components/PhoneFrame'

type Choice = 'salvos' | 'favoritos'

function Header() {
  const navigate = useNavigate()
  return (
    <header className="relative flex items-center justify-between px-6 pt-6">
      <button type="button" aria-label="Voltar" onClick={() => navigate(-1)} className="text-[var(--color-grey-darker)]">
        <ArrowLeft size={22} strokeWidth={2} />
      </button>
      <h1 className="absolute left-[56px] top-[24px] text-[var(--color-grey-darker)] text-[23.6px] font-medium leading-none">Adicionar à</h1>
      <button type="button" aria-label="Mais opções" className="text-[var(--color-grey-darker)]">
        <MoreVertical size={22} strokeWidth={2} />
      </button>
    </header>
  )
}

function RadioCard({
  title,
  subtitle,
  selected,
  onSelect,
}: {
  title: string
  subtitle: string
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full text-left rounded-[15px] h-[71px] flex items-center gap-[13.5px] px-[14px] shadow-[0_19.7px_9.8px_rgba(90,90,90,0.1)] ${
        selected ? 'bg-[var(--color-orange-light)]' : 'bg-white'
      }`}
    >
      <span
        className={`w-[22px] h-[22px] rounded-full border-[2px] flex items-center justify-center shrink-0 ${
          selected ? 'border-[var(--color-orange-normal)]' : 'border-[var(--color-orange-normal)]'
        }`}
      >
        {selected && <span className="w-[12px] h-[12px] rounded-full bg-[var(--color-orange-normal)]" />}
      </span>
      <div>
        <p className="text-[var(--color-grey-darker)] text-[17.5px] font-medium leading-tight">{title}</p>
        <p className="text-[#6d6d6d] text-[12.5px] leading-tight">{subtitle}</p>
      </div>
    </button>
  )
}

export default function Ramificacao() {
  const [choice, setChoice] = useState<Choice>('salvos')
  const navigate = useNavigate()
  return (
    <PhoneFrame>
      <div className="relative min-h-[800px] bg-white">
        <Header />
        <div className="mt-6 px-[28px] flex flex-col gap-[13.5px]">
          <RadioCard
            title="Shows salvos"
            subtitle="Aqueles que você precisa ir"
            selected={choice === 'salvos'}
            onSelect={() => setChoice('salvos')}
          />
          <RadioCard
            title="Shows favoritos"
            subtitle="Aqueles que mudaram sua vida"
            selected={choice === 'favoritos'}
            onSelect={() => setChoice('favoritos')}
          />
        </div>
        <div className="mt-[60px] flex justify-center">
          {/* TODO: replace with Lottie JSON animation (hand holding phone) */}
          <div className="w-[220px] h-[220px]" />
        </div>
        <div className="absolute bottom-[20px] inset-x-0 flex justify-center">
          <button
            type="button"
            onClick={() => navigate('/conclusao')}
            className="bg-[var(--color-orange-normal)] text-white rounded-[15px] h-[57px] px-[60px] text-[15.8px] font-medium tracking-[1px] uppercase"
          >
            Concluir
          </button>
        </div>
      </div>
    </PhoneFrame>
  )
}
