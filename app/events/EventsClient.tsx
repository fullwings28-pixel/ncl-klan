"use client"
import { useEffect, useState } from "react"
import { Calendar as CalendarIcon, Clock, Plus, Trash2, CheckCircle2, UserPlus, ShieldAlert } from "lucide-react"
import { useToast } from "@/components/Toast"

export default function EventsClient({ currentUser }: { currentUser: any }) {
  const [events, setEvents] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [eventDate, setEventDate] = useState("")
  const { showToast } = useToast()

  const fetchEvents = () => {
    fetch("/api/events").then(res => res.json()).then(data => setEvents(data || []))
  }

  useEffect(() => { fetchEvents() }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, event_date: new Date(eventDate).toISOString(), created_by: currentUser.id })
    })
    setShowForm(false)
    setTitle(""); setDescription(""); setEventDate("")
    fetchEvents()
    showToast("Operasyon başarıyla oluşturuldu!", "success")
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Bu operasyonu silmek istediğinize emin misiniz?")) return
    await fetch(`/api/events?id=${id}`, { method: "DELETE" })
    fetchEvents()
    showToast("Operasyon iptal edildi.", "success")
  }

  const handleAttend = async (eventId: number) => {
    await fetch("/api/events/attend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId, userId: currentUser.id })
    })
    fetchEvents()
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4 hud-panel p-6 rounded-md">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3 uppercase tracking-widest">
            <CalendarIcon className="text-cyan-500" size={28}/> OPERASYON TAKVİMİ
          </h1>
          <p className="text-zinc-500 text-xs mt-2 uppercase tracking-wider font-bold">Yaklaşan maçlar ve antrenmanlar.</p>
        </div>
        {(currentUser.role === 'admin' || currentUser.role === 'moderator') && (
          <button onClick={() => setShowForm(!showForm)} className="bg-red-600 hover:bg-red-500 text-white px-5 py-2.5 rounded-sm text-xs font-black uppercase tracking-widest flex items-center gap-2 transition shadow-[0_0_15px_rgba(239,68,68,0.3)]">
            <Plus size={16} /> YENİ OPERASYON
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="hud-panel p-6 rounded-md border border-cyan-500/30 mb-8 space-y-4 shadow-[0_0_30px_rgba(6,182,212,0.1)]">
          <h2 className="text-sm font-bold text-cyan-400 mb-2 uppercase tracking-widest">Operasyon Detayları</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input required type="text" placeholder="Operasyon Adı (örn: Premier Maçı)" value={title} onChange={e => setTitle(e.target.value)} className="bg-black/50 border border-white/10 rounded-sm px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500 tracking-wide" />
            <input required type="datetime-local" value={eventDate} onChange={e => setEventDate(e.target.value)} className="bg-black/50 border border-white/10 rounded-sm px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500 tracking-wide" />
          </div>
          <textarea placeholder="Açıklama (örn: Dust2 üzerinde taktik çalışacağız, herkesin gelmesi zorunlu)" value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-sm px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500 min-h-[80px] tracking-wide" />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2 rounded-sm text-xs font-bold text-zinc-400 hover:text-white transition uppercase tracking-widest">İPTAL</button>
            <button type="submit" className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-2 rounded-sm text-xs font-black tracking-widest transition">OLUŞTUR</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 gap-4">
        {events.map(event => {
          const isAttending = event.event_attendees?.some((a: any) => a.user_id === currentUser.id)
          const attendeeCount = event.event_attendees?.length || 0

          return (
            <div key={event.id} className="hud-panel p-6 rounded-md flex flex-col md:flex-row justify-between gap-6 hover:border-white/20 transition-all border border-white/5">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <h2 className="text-xl font-black text-white uppercase tracking-wider">{event.title}</h2>
                  {(currentUser.role === 'admin' || currentUser.role === 'moderator') && (
                    <button onClick={() => handleDelete(event.id)} className="text-red-500 hover:bg-red-500/10 p-1.5 rounded-sm transition" title="Operasyonu İptal Et">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                
                {event.description && <p className="text-zinc-400 text-sm mb-5">{event.description}</p>}
                
                <div className="flex flex-wrap gap-3 text-[11px] font-bold text-zinc-300 uppercase tracking-wider">
                  <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-sm border border-white/5">
                    <CalendarIcon size={14} className="text-cyan-500" />
                    {new Date(event.event_date).toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </div>
                  <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-sm border border-white/5">
                    <Clock size={14} className="text-cyan-500" />
                    {new Date(event.event_date).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2 items-center">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1"><UserPlus size={12}/> KATILIMCILAR ({attendeeCount}):</span>
                  {event.event_attendees?.map((att: any) => (
                    <img key={att.user_id} src={att.profiles?.avatar_url} alt="user" title={att.profiles?.display_name} className="w-7 h-7 rounded-sm border border-white/10 grayscale-[30%]" />
                  ))}
                  {attendeeCount === 0 && <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest italic">Henüz katılan yok.</span>}
                </div>
              </div>

              <div className="flex items-center md:items-start md:flex-col justify-center border-t md:border-t-0 md:border-l border-white/5 pt-4 md:pt-0 md:pl-6">
                <button 
                  onClick={() => handleAttend(event.id)}
                  className={`px-5 py-2.5 rounded-sm font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all ${isAttending ? 'bg-green-500/20 text-green-500 border border-green-500/30' : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'}`}
                >
                  <CheckCircle2 size={16} /> {isAttending ? 'KATILIYORUM' : 'KATIL'}
                </button>
              </div>
            </div>
          )
        })}
        {events.length === 0 && <div className="text-center text-zinc-500 py-12 hud-panel rounded-md text-xs uppercase tracking-widest font-bold">Planlanmış operasyon yok.</div>}
      </div>
    </div>
  )
}