import { useNavigate } from 'react-router-dom'
import {
  EventHero,
  FansPill,
  EventTitle,
  DateRow,
  VenueRow,
  OrganizerRow,
  AboutBlock,
  CTAFooter,
} from '../components/event-detail'

// Standalone /evento route — no shared layoutIds. The card-to-detail morph
// is handled by EventMorphOverlay launched from Perfil. This page is for
// direct URL loads (Vercel preview share links, refresh on /evento) and any
// future non-RAYE detail navigations.
export default function Evento() {
  const navigate = useNavigate()
  return (
    <div className="h-full flex flex-col bg-white overflow-hidden">
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <EventHero onBack={() => navigate(-1)} />
        <FansPill />
        <EventTitle />
        <div className="mt-6 flex flex-col gap-[16px] shrink-0">
          <DateRow />
          <VenueRow />
          <OrganizerRow />
        </div>
        <div className="mt-6">
          <AboutBlock />
        </div>
        <div className="h-[20px]" />
      </div>
      <CTAFooter onClick={() => navigate('/ramificacao')} />
    </div>
  )
}
