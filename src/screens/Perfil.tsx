import { useState } from 'react'
import { ArrowLeft, MoreVertical, Pencil, MessageCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import PhoneFrame from '../components/PhoneFrame'
import BottomNav from '../components/BottomNav'
import EventCard from '../components/EventCard'
import avatar from '../assets/perfil/avatar-quinn.png'
import eventRaye from '../assets/perfil/event-raye.png'
import eventLuan from '../assets/perfil/event-luan-santana.png'

function Header() {
  const navigate = useNavigate()
  return (
    <header className="flex items-center justify-between px-6 pt-6">
      <button type="button" aria-label="Voltar" onClick={() => navigate(-1)} className="w-[22px] h-[22px] text-[var(--color-grey-darker)]">
        <ArrowLeft size={22} strokeWidth={2} />
      </button>
      <button type="button" aria-label="Mais opções" className="w-[22px] h-[22px] text-[var(--color-grey-darker)]">
        <MoreVertical size={22} strokeWidth={2} />
      </button>
    </header>
  )
}

function ProfileBlock() {
  return (
    <section className="mt-6 flex flex-col items-center">
      <img src={avatar} alt="Quinn Fabray" className="w-[94px] h-[94px] rounded-full object-cover" />
      <h1 className="mt-4 text-[var(--color-grey-darker)] text-[23.5px] font-medium">Quinn Fabray</h1>
      <div className="mt-1 flex items-center gap-6">
        <div className="flex flex-col items-center">
          <span className="text-[var(--color-grey-darker)] text-[15.7px] font-extrabold leading-tight">350</span>
          <span className="text-[var(--color-grey-dark-active)] text-[13.7px]">Seguindo</span>
        </div>
        <div className="w-px h-[31px] bg-[var(--color-grey-light-active)]" />
        <div className="flex flex-col items-center">
          <span className="text-[var(--color-grey-darker)] text-[15.7px] font-extrabold leading-tight">346</span>
          <span className="text-[var(--color-grey-dark-active)] text-[13.7px]">Seguidores</span>
        </div>
      </div>
    </section>
  )
}

function ActionButtons() {
  return (
    <div className="mt-5 px-[30px] flex gap-[18px]">
      <button
        type="button"
        className="bg-[var(--color-pink-normal)] text-[var(--color-grey-light)] rounded-[10px] px-[17px] py-[12px] flex items-center justify-center gap-[5px] w-[125px]"
      >
        <Pencil size={17} strokeWidth={2} />
        <span className="text-[15.7px]">Editar</span>
      </button>
      <button
        type="button"
        className="bg-[var(--color-pink-light)] text-[var(--color-pink-normal)] rounded-[10px] px-[17px] py-[12px] flex items-center justify-center gap-[7px] flex-1"
      >
        <MessageCircle size={17} strokeWidth={2} />
        <span className="text-[15.7px]">Mensagens</span>
      </button>
    </div>
  )
}

type Tab = 'eventos' | 'favoritos' | 'estatisticas'

function TabBar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  const tabs: { key: Tab; label: string }[] = [
    { key: 'eventos', label: 'EVENTOS' },
    { key: 'favoritos', label: 'FAVORITOS' },
    { key: 'estatisticas', label: 'ESTATÍSTICAS' },
  ]
  return (
    <div className="mt-7 px-[17px] flex justify-center gap-[35px]">
      {tabs.map(({ key, label }) => {
        const isActive = key === active
        return (
          <button key={key} type="button" onClick={() => onChange(key)} className="flex flex-col items-center gap-1">
            <span
              className={`text-[15.7px] font-medium tracking-[0.15px] ${
                isActive ? 'text-[var(--color-pink-normal)]' : 'text-[var(--color-grey-normal)]'
              }`}
            >
              {label}
            </span>
            {isActive && <span className="h-[2.5px] w-full bg-[var(--color-pink-normal)] rounded-full" />}
          </button>
        )
      })}
    </div>
  )
}

const events = [
  { image: eventRaye, title: 'RAYE', date: '12 de julho de 2026', venue: 'Audio Club', location: 'São Paulo', badgeCount: 1 },
  { image: eventLuan, title: 'Luan Santana', date: '08 de agosto de 2026', venue: 'Allianz Parque', location: 'São Paulo', badgeCount: 2 },
  { image: eventRaye, title: 'RAYE', date: '12 de julho de 2026', venue: 'Audio Club', location: 'São Paulo', badgeCount: 1 },
  { image: eventRaye, title: 'RAYE', date: '12 de julho de 2026', venue: 'Audio Club', location: 'São Paulo', badgeCount: 1 },
  { image: eventRaye, title: 'RAYE', date: '12 de julho de 2026', venue: 'Audio Club', location: 'São Paulo', badgeCount: 1 },
]

function EventList({ onSelect }: { onSelect: () => void }) {
  return (
    <div className="mt-5 px-[23px] pb-[120px] flex flex-col gap-[14px]">
      {events.map((e, i) => (
        <EventCard key={i} {...e} onClick={onSelect} />
      ))}
    </div>
  )
}

export default function Perfil() {
  const [tab, setTab] = useState<Tab>('eventos')
  const navigate = useNavigate()
  return (
    <PhoneFrame>
      <div className="min-h-[800px] bg-[var(--color-grey-light)] pb-24">
        <Header />
        <ProfileBlock />
        <ActionButtons />
        <TabBar active={tab} onChange={setTab} />
        <EventList onSelect={() => navigate('/evento')} />
      </div>
      <BottomNav />
    </PhoneFrame>
  )
}
