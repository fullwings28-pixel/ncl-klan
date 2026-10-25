"use client"
import { useEffect, useState } from "react"
import { Swords, Check, X, Trophy, Crosshair, Coins } from "lucide-react"
import { createClient } from "@supabase/supabase-js"
import { useToast } from "@/components/Toast"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export default function ArenaClient({ currentUser }: { currentUser: any }) {
  const [duels, setDuels] = useState<any[]>([]) // TİP HATASI DÜZELTİLDİ
  const [players, setPlayers] = useState<any[]>([])
  const [selectedOpponent, setSelectedOpponent] = useState("")
  const [loading, setLoading] = useState(true)
  const { showToast } = useToast()

  const [betModal, setBetModal] = useState<{ isOpen: boolean, duel: any, winnerId: string, amount: string }>({ 
    isOpen: false, duel: null, winnerId: "", amount: "" 
  })

  const fetchDuels = async () => {
    const res = await fetch("/api/duels")
    if (res.ok) setDuels(await res.json())
  }

  const fetchPlayers = async () => {
    const { data } = await supabase.from("profiles").select("id, display_name, avatar_url, premier_rating").neq("id", currentUser.id)
    if (data) setPlayers(data)
  }

  useEffect(() => {
    Promise.all([fetchDuels(), fetchPlayers()]).then(() => setLoading(false))
    const channel = supabase.channel("realtime-duels").on("postgres_changes", { event: "*", schema: "public", table: "duels" }, () => fetchDuels()).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  const handleChallenge = async () => {
    if (!selectedOpponent) return showToast("Lütfen bir rakip seçin.", "error")
    const res = await fetch("/api/duels", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ opponent_id: selectedOpponent }) })
    if (res.ok) { setSelectedOpponent(""); showToast("Meydan okuma gönderildi!", "success"); fetchDuels() } 
    else { const err = await res.json(); showToast(err.error, "error") }
  }

  const handleAction = async (duelId: number, action: string, winnerId?: string) => {
    const res = await fetch("/api/duels", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ duel_id: duelId, action, winner_id: winnerId }) })
    if (res.ok) { showToast("İşlem başarılı.", "success"); fetchDuels() } 
    else showToast("İşlem başarısız.", "error")
  }

  const submitBet = async () => {
    const amount = parseInt(betModal.amount)
    if (!betModal.winnerId) return showToast("Kimi kazanacağını seç.", "error")
    if (isNaN(amount) || amount <= 0) return showToast("Geçerli bir miktar gir.", "error")
    if (amount > currentUser.balance) return showToast("Yetersiz bakiyen.", "error")

    const res = await fetch("/api/duels/bet", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ duel_id: betModal.duel.id, predicted_winner_id: betModal.winnerId, amount })
    })

    if (res.ok) { showToast("Bahsin başarıyla alındı!", "success"); setBetModal({ isOpen: false, duel: null, winnerId: "", amount: "" }) } 
    else showToast("Bahis oynanamadı.", "error")
  }

  if (loading) return <div className="text-center py-20 text-zinc-500 uppercase tracking-widest text-sm animate-pulse">Arena Bağlanıyor...</div>

  return (
    <div>
      {betModal.isOpen && betModal.duel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setBetModal({ ...betModal, isOpen: false })}>
          <div className="hud-panel p-6 rounded-sm max-w-md w-full border border-yellow-500/30 shadow-[0_0_30px_rgba(234,179,8,0.15)]" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-black text-white mb-2 flex items-center gap-2 tracking-widest uppercase"><Coins className="text-yellow-500" size={24}/> Bahis Oyna</h3>
            <p className="text-xs text-zinc-400 mb-6 uppercase tracking-wider">Sence bu maçı kim kazanır?</p>
            
            <div className="flex gap-3 mb-6">
              <button onClick={() => setBetModal({ ...betModal, winnerId: betModal.duel.challenger_id })}
                className={`flex-1 p-3 rounded-sm border flex flex-col items-center gap-2 transition ${betModal.winnerId === betModal.duel.challenger_id ? 'bg-cyan-500/20 border-cyan-500 text-white' : 'bg-black/40 border-white/10 text-zinc-400 hover:border-white/30'}`}>
                <img src={betModal.duel.challenger.avatar_url} className="w-12 h-12 rounded-sm border border-white/20 grayscale" />
                <span className="text-xs font-bold uppercase tracking-wider">{betModal.duel.challenger.display_name}</span>
              </button>
              <button onClick={() => setBetModal({ ...betModal, winnerId: betModal.duel.opponent_id })}
                className={`flex-1 p-3 rounded-sm border flex flex-col items-center gap-2 transition ${betModal.winnerId === betModal.duel.opponent_id ? 'bg-cyan-500/20 border-cyan-500 text-white' : 'bg-black/40 border-white/10 text-zinc-400 hover:border-white/30'}`}>
                <img src={betModal.duel.opponent.avatar_url} className="w-12 h-12 rounded-sm border border-white/20 grayscale" />
                <span className="text-xs font-bold uppercase tracking-wider">{betModal.duel.opponent.display_name}</span>
              </button>
            </div>

            <input type="number" value={betModal.amount} onChange={(e) => setBetModal({ ...betModal, amount: e.target.value })} placeholder="Bahis Miktarı (Kredi)" className="w-full bg-black/50 border border-white/10 text-white rounded-sm px-4 py-3 focus:outline-none focus:border-yellow-500 font-black tracking-widest mb-4" />

            <div className="flex gap-2">
              <button onClick={() => setBetModal({ ...betModal, isOpen: false })} className="flex-1 bg-white/5 hover:bg-white/10 py-2.5 rounded-sm text-xs font-bold text-white uppercase tracking-widest">İptal</button>
              <button onClick={submitBet} className="flex-1 bg-yellow-600/20 hover:bg-yellow-600 border border-yellow-500/30 text-yellow-500 hover:text-white py-2.5 rounded-sm text-xs font-bold transition uppercase tracking-widest">Onayla</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 hud-panel p-6 rounded-md">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3 tracking-widest uppercase">
            <Swords className="text-red-500" size={32}/> Düello Arenası
          </h1>
          <p className="text-zinc-400 mt-2 text-xs tracking-wider uppercase">Kazanan: +500 Kredi, +100 XP</p>
        </div>
        
        <div className="flex items-center gap-2">
          <select value={selectedOpponent} onChange={(e) => setSelectedOpponent(e.target.value)} className="bg-black/50 text-white text-xs font-bold tracking-wider uppercase rounded-sm px-4 py-3 focus:outline-none border border-white/10 min-w-[200px]">
            <option value="">Rakip Seç...</option>
            {players.map(p => <option key={p.id} value={p.id}>{p.display_name} ({p.premier_rating || "Yok"})</option>)}
          </select>
          <button onClick={handleChallenge} className="bg-red-600 hover:bg-red-500 text-white px-6 py-3 rounded-sm text-xs font-black uppercase tracking-widest transition flex items-center gap-2 shadow-[0_0_15px_rgba(239,68,68,0.3)]">
            <Crosshair size={16}/> Meydan Oku
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {duels.map((duel) => {
          const isChallenger = duel.challenger_id === currentUser.id
          const isOpponent = duel.opponent_id === currentUser.id
          const isAdmin = currentUser.role === 'admin'
          const isCompleted = duel.status === 'completed'
          
          return (
            <div key={duel.id} className={`hud-panel p-5 rounded-md flex flex-col md:flex-row items-center justify-between gap-6 transition-all relative ${
              duel.status === 'pending' ? 'border-yellow-500/30' : 
              duel.status === 'completed' ? 'border-green-500/30 opacity-75' : 
              'border-white/5'
            }`}>
              
              <div className="flex items-center justify-center gap-6 w-full md:w-auto">
                <div className="flex items-center gap-3 w-40">
                  <img src={duel.challenger?.avatar_url} className="w-10 h-10 rounded-sm border border-white/10 object-cover grayscale-[30%]" />
                  <div>
                    <div className="font-bold text-white text-sm truncate w-24 uppercase tracking-wider">{duel.challenger?.display_name}</div>
                    <div className="text-[10px] text-zinc-500 font-bold">{duel.challenger?.premier_rating || "Yok"} P</div>
                  </div>
                </div>
                
                <div className="text-zinc-600 font-black italic text-2xl tracking-tighter">VS</div>
                
                <div className="flex items-center gap-3 w-40 flex-row-reverse text-right">
                  <img src={duel.opponent?.avatar_url} className="w-10 h-10 rounded-sm border border-white/10 object-cover grayscale-[30%]" />
                  <div>
                    <div className="font-bold text-white text-sm truncate w-24 uppercase tracking-wider">{duel.opponent?.display_name}</div>
                    <div className="text-[10px] text-zinc-500 font-bold">{duel.opponent?.premier_rating || "Yok"} P</div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                {duel.status === 'pending' && (
                  <>
                    <span className="text-[10px] font-black text-yellow-500 bg-yellow-500/10 px-3 py-1.5 rounded-sm border border-yellow-500/20 mr-2 tracking-widest uppercase">BEKLİYOR</span>
                    {isOpponent && (
                      <>
                        <button onClick={() => handleAction(duel.id, 'accept')} className="bg-green-600/20 hover:bg-green-600 text-green-500 hover:text-white p-2.5 rounded-sm transition border border-green-500/30" title="Kabul Et"><Check size={16}/></button>
                        <button onClick={() => handleAction(duel.id, 'decline')} className="bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white p-2.5 rounded-sm transition border border-red-500/30" title="Reddet"><X size={16}/></button>
                      </>
                    )}
                    {isChallenger && <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest italic">Onay bekleniyor...</span>}
                  </>
                )}

                {duel.status === 'accepted' && (
                  <>
                    <span className="text-[10px] font-black text-cyan-400 bg-cyan-500/10 px-3 py-1.5 rounded-sm border border-cyan-500/20 mr-2 tracking-widest uppercase">MAÇTA</span>
                    
                    {!isChallenger && !isOpponent && !isCompleted && (
                      <button onClick={() => setBetModal({ isOpen: true, duel, winnerId: "", amount: "" })} className="bg-yellow-600/20 hover:bg-yellow-600 text-yellow-500 hover:text-white px-3 py-1.5 rounded-sm text-[10px] font-bold transition border border-yellow-500/30 flex items-center gap-1 mr-2 uppercase tracking-widest">
                        <Coins size={14}/> Bahis
                      </button>
                    )}

                    {(isAdmin || isChallenger || isOpponent) && (
                      <div className="flex flex-col sm:flex-row gap-2">
                        {isAdmin && <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mr-1 mt-1.5">Sonuç:</span>}
                        <button onClick={() => handleAction(duel.id, 'complete', duel.challenger_id)} className="bg-white/5 hover:bg-cyan-600 border border-white/10 text-[10px] font-bold text-white px-3 py-1.5 rounded-sm transition uppercase tracking-wider">Sol</button>
                        <button onClick={() => handleAction(duel.id, 'complete', duel.opponent_id)} className="bg-white/5 hover:bg-cyan-600 border border-white/10 text-[10px] font-bold text-white px-3 py-1.5 rounded-sm transition uppercase tracking-wider">Sağ</button>
                      </div>
                    )}
                  </>
                )}

                {duel.status === 'completed' && (
                  <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 px-4 py-2 rounded-sm">
                    <Trophy className="text-yellow-500" size={16} />
                    <span className="text-xs font-black text-white uppercase tracking-wider">
                      KAZANAN: {duel.winner_id === duel.challenger_id ? duel.challenger.display_name : duel.opponent.display_name}
                    </span>
                  </div>
                )}

                {duel.status === 'declined' && (
                  <span className="text-[10px] font-black text-zinc-500 bg-white/5 px-3 py-1.5 rounded-sm border border-white/10 uppercase tracking-widest">REDDEDİLDİ</span>
                )}
              </div>

            </div>
          )
        })}

        {duels.length === 0 && (
          <div className="text-center py-20 hud-panel rounded-md flex flex-col items-center justify-center text-zinc-500 border-dashed">
            <Swords size={48} className="mb-4 opacity-10" />
            <p className="uppercase tracking-widest text-sm font-bold">Henüz düello yok. İlk kanı sen dök!</p>
          </div>
        )}
      </div>
    </div>
  )
}