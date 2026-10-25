"use client"
import { useState, useEffect } from "react"
import { createClient } from "@supabase/supabase-js"
import { Swords, Bot, User, Plus, Coins, Trophy, X } from "lucide-react"
import { fetchCrates, Crate } from "@/lib/csgo-api"
import { useToast } from "@/components/Toast"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export default function BattleClient({ currentUser }: { currentUser: any }) {
  const [battles, setBattles] = useState<any[]>([])
  const [crates, setCrates] = useState<Crate[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  
  // Form state
  const [selectedCase, setSelectedCase] = useState("")
  const [wager, setWager] = useState("100")
  const [rounds, setRounds] = useState("3")
  const [opponentType, setOpponentType] = useState<"bot" | "player">("bot")

  // Aktif Savaş İzleme State
  const [activeBattle, setActiveBattle] = useState<any>(null)
  const [battleItems, setBattleItems] = useState<any[]>([])
  const { showToast } = useToast()

  const fetchBattles = async () => {
    const { data } = await supabase.from("battles")
      .select("*, battle_players(*, profiles(display_name, avatar_url))")
      .in("status", ["waiting", "playing"])
      .order("created_at", { ascending: false })
    if (data) setBattles(data)
  }

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const loadedCrates = await fetchCrates()
        setCrates(loadedCrates)
        await fetchBattles()
      } catch (error) {
        console.error("Veri yüklenirken hata:", error)
      } finally {
        setLoading(false) // <-- BURADAKİ EKSİK BİZİ KURTARACAK
      }
    }

    loadInitialData()
    
    const channel = supabase.channel("battle-lobby")
      .on("postgres_changes", { event: "*", schema: "public", table: "battles" }, () => fetchBattles())
      .subscribe()
      
    return () => { supabase.removeChannel(channel) }
  }, [])

  // Eğer bir savaş açıksa onu canlı izle
  useEffect(() => {
    if (!activeBattle) return

    const fetchBattleData = async () => {
      const { data: bData } = await supabase.from("battles").select("*, battle_players(*, profiles(display_name, avatar_url))").eq("id", activeBattle.id).single()
      const { data: iData } = await supabase.from("battle_items").select("*").eq("battle_id", activeBattle.id).order("round")
      
      if (bData) setActiveBattle(bData)
      if (iData) setBattleItems(iData)
    }

    fetchBattleData()
    const interval = setInterval(fetchBattleData, 1500) // 1.5 saniyede bir güncelle
    return () => clearInterval(interval)
  }, [activeBattle?.id])

  const handleCreateBattle = async () => {
    if (!selectedCase) return showToast("Kasa seçin.", "error")
    const wagerNum = parseInt(wager)
    if (isNaN(wagerNum) || wagerNum < 100) return showToast("Minimum bahis 100 Kredidir.", "error")
    if (wagerNum > currentUser.balance) return showToast("Yetersiz bakiye.", "error")

    const res = await fetch("/api/battle", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ case_id: selectedCase, wager: wagerNum, rounds: parseInt(rounds), play_with_bot: opponentType === "bot" })
    })

    const data = await res.json()
    if (res.ok) {
      setShowCreate(false)
      showToast("Savaş başlatıldı!", "success")
      
      const { data: b } = await supabase.from("battles").select("*, battle_players(*, profiles(display_name, avatar_url))").eq("id", data.battle_id).single()
      if (b) setActiveBattle(b)
    } else {
      showToast(data.error, "error")
    }
  }

  const handleJoinBattle = async (battleId: string) => {
    const res = await fetch("/api/battle", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ battle_id: battleId })
    })

    if (res.ok) {
      const { data: b } = await supabase.from("battles").select("*, battle_players(*, profiles(display_name, avatar_url))").eq("id", battleId).single()
      if (b) setActiveBattle(b)
      showToast("Savaşa katıldın!", "success")
    } else {
      const err = await res.json()
      showToast(err.error, "error")
    }
  }

  if (loading) return <div className="text-center py-20 text-zinc-500 uppercase tracking-widest text-sm animate-pulse">Savaş Alanı Yükleniyor...</div>

  // AKTİF SAVAŞ EKRANI
  if (activeBattle) {
    const p1 = activeBattle.battle_players.find((p: any) => !p.is_bot)
    const p2 = activeBattle.battle_players.find((p: any) => p.is_bot) // Şimdilik hep 2 kişi üzerinden
    const isFinished = activeBattle.status === "finished"
    const winnerName = activeBattle.winner_id === p1?.user_id ? p1?.profiles?.display_name : p2?.bot_name

    return (
      <div className="hud-panel p-6 rounded-md relative border border-red-500/30 shadow-[0_0_50px_rgba(239,68,68,0.1)]">
        <button onClick={() => setActiveBattle(null)} className="absolute top-4 right-4 text-zinc-500 hover:text-white"><X size={24}/></button>
        
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black text-white uppercase tracking-widest text-glow mb-2">
            {isFinished ? "SAVAŞ BİTTİ" : "SAVAŞIYORLAR..."}
          </h1>
          <p className="text-sm text-zinc-400 font-bold uppercase tracking-widest">Bahis: {activeBattle.wager} Kredi • {activeBattle.rounds} Raunt</p>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-12">
          {/* SOL OYUNCU */}
          <div className="flex flex-col items-center flex-1">
            <div className="relative mb-4">
              {!p1?.is_bot ? <img src={p1?.profiles?.avatar_url} className="w-24 h-24 rounded-sm border-2 border-cyan-500" /> : <img src={p1?.bot_avatar} className="w-24 h-24 rounded-sm border-2 border-cyan-500 bg-zinc-800" />}
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-cyan-600 text-white text-[10px] font-black px-3 py-1 rounded-sm uppercase tracking-widest whitespace-nowrap">
                {p1?.is_bot ? p1.bot_name : p1?.profiles?.display_name}
              </div>
            </div>
            <div className="text-2xl font-black text-white mt-4">{p1?.total_value} <span className="text-sm text-yellow-500">DEĞER</span></div>
          </div>

          <div className="text-4xl font-black italic text-red-500 tracking-tighter">VS</div>

          {/* SAĞ OYUNCU */}
          <div className="flex flex-col items-center flex-1">
            <div className="relative mb-4">
              {!p2?.is_bot ? <img src={p2?.profiles?.avatar_url} className="w-24 h-24 rounded-sm border-2 border-red-500" /> : <img src={p2?.bot_avatar} className="w-24 h-24 rounded-sm border-2 border-red-500 bg-zinc-800" />}
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[10px] font-black px-3 py-1 rounded-sm uppercase tracking-widest whitespace-nowrap">
                {p2?.is_bot ? p2.bot_name : p2?.profiles?.display_name}
              </div>
            </div>
            <div className="text-2xl font-black text-white mt-4">{p2?.total_value} <span className="text-sm text-yellow-500">DEĞER</span></div>
          </div>
        </div>

        {/* DROPLAR */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: activeBattle.rounds }).map((_, i) => {
            const r = i + 1;
            const p1Drop = battleItems.find(item => item.player_id === p1?.id && item.round === r);
            const p2Drop = battleItems.find(item => item.player_id === p2?.id && item.round === r);

            return (
              <div key={r} className="col-span-full flex items-center justify-between gap-2 md:gap-8">
                <div className="flex-1 flex justify-end">
                  {p1Drop && <img src={p1Drop.skin_image} title={p1Drop.skin_name} className={`w-20 h-20 md:w-32 md:h-32 object-contain bg-black/40 border rounded-sm p-2 ${p1Drop.skin_rarity === 'Covert' ? 'border-red-500' : p1Drop.skin_rarity === 'Classified' ? 'border-pink-500' : 'border-zinc-800'}`} />}
                </div>
                <div className="w-8 md:w-12 text-center text-xs font-bold text-zinc-500 bg-black/50 py-1 rounded-sm border border-white/5">R{r}</div>
                <div className="flex-1 flex justify-start">
                  {p2Drop && <img src={p2Drop.skin_image} title={p2Drop.skin_name} className={`w-20 h-20 md:w-32 md:h-32 object-contain bg-black/40 border rounded-sm p-2 ${p2Drop.skin_rarity === 'Covert' ? 'border-red-500' : p2Drop.skin_rarity === 'Classified' ? 'border-pink-500' : 'border-zinc-800'}`} />}
                </div>
              </div>
            )
          })}
        </div>

        {isFinished && (
          <div className="mt-12 text-center animate-bounce">
            <div className="inline-block bg-green-500/20 border border-green-500/50 text-green-400 px-8 py-4 rounded-sm shadow-[0_0_30px_rgba(34,197,94,0.3)]">
              <Trophy size={32} className="mx-auto mb-2 text-yellow-500" />
              <h2 className="text-2xl font-black uppercase tracking-widest">KAZANAN: {winnerName}</h2>
            </div>
          </div>
        )}
      </div>
    )
  }

  // LOBİ EKRANI
  return (
    <div>
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
          <div className="hud-panel p-6 rounded-md max-w-md w-full border border-white/10 shadow-2xl">
            <h2 className="text-xl font-black text-white mb-6 uppercase tracking-widest flex items-center gap-2"><Swords size={20} className="text-red-500"/> Savaş Kur</h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mb-2 block">Kasa Seç</label>
                <select value={selectedCase} onChange={e => setSelectedCase(e.target.value)} className="w-full bg-black/50 border border-white/10 text-white rounded-sm px-4 py-3 focus:outline-none focus:border-red-500 font-bold">
                  <option value="">Kasa Seçin...</option>
                  {crates.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mb-2 block">Bahis Miktarı (Kredi)</label>
                <input type="number" value={wager} onChange={e => setWager(e.target.value)} className="w-full bg-black/50 border border-white/10 text-white rounded-sm px-4 py-3 focus:outline-none focus:border-red-500 font-black" />
              </div>
              <div>
                <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mb-2 block">Kaç Raunt?</label>
                <select value={rounds} onChange={e => setRounds(e.target.value)} className="w-full bg-black/50 border border-white/10 text-white rounded-sm px-4 py-3 focus:outline-none focus:border-red-500 font-bold">
                  <option value="1">1 Kasa</option>
                  <option value="3">3 Kasa</option>
                  <option value="5">5 Kasa</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setOpponentType("bot")} className={`flex-1 flex items-center justify-center gap-2 py-2 border rounded-sm text-xs font-bold uppercase tracking-widest transition ${opponentType === 'bot' ? 'bg-red-500/20 border-red-500 text-red-400' : 'bg-white/5 border-white/10 text-zinc-500'}`}><Bot size={16}/> Bota Karşı</button>
                <button onClick={() => setOpponentType("player")} className={`flex-1 flex items-center justify-center gap-2 py-2 border rounded-sm text-xs font-bold uppercase tracking-widest transition ${opponentType === 'player' ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400' : 'bg-white/5 border-white/10 text-zinc-500'}`}><User size={16}/> Oyuncuya Karşı</button>
              </div>
            </div>

            <div className="flex gap-2 mt-8">
              <button onClick={() => setShowCreate(false)} className="flex-1 bg-white/5 hover:bg-white/10 py-3 rounded-sm text-xs font-bold text-white uppercase tracking-widest">İptal</button>
              <button onClick={handleCreateBattle} className="flex-1 bg-red-600 hover:bg-red-500 text-white py-3 rounded-sm text-xs font-black uppercase tracking-widest shadow-[0_0_15px_rgba(239,68,68,0.4)]">Başlat</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 hud-panel p-6 rounded-md">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3 tracking-widest uppercase">
            <Swords className="text-red-500" size={32}/> KASA SAVAŞLARI
          </h1>
          <p className="text-zinc-400 mt-2 text-xs tracking-wider uppercase">Kasa aç, rakibini ez, ödülü kap.</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="bg-red-600 hover:bg-red-500 text-white px-6 py-3 rounded-sm text-xs font-black uppercase tracking-widest transition flex items-center gap-2 shadow-[0_0_15px_rgba(239,68,68,0.3)]">
          <Plus size={16}/> Savaş Kur
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {battles.map(b => {
          const isWaiting = b.status === "waiting"
          const players = b.battle_players || []
          const p1 = players[0]
          
          return (
            <div key={b.id} className="hud-panel p-4 rounded-md flex flex-col md:flex-row items-center justify-between border border-white/5 hover:border-white/20 transition">
              <div className="flex items-center gap-6">
                <div className="flex flex-col items-center">
                  <img src={p1?.is_bot ? p1.bot_avatar : p1?.profiles?.avatar_url} className="w-12 h-12 rounded-sm border border-white/10" />
                  <span className="text-[10px] text-white font-bold mt-1 max-w-[80px] truncate">{p1?.is_bot ? p1.bot_name : p1?.profiles?.display_name}</span>
                </div>
                <span className="text-zinc-500 font-black italic">VS</span>
                <div className="flex flex-col items-center">
                  {players[1] ? (
                    <>
                      <img src={players[1].is_bot ? players[1].bot_avatar : players[1].profiles?.avatar_url} className="w-12 h-12 rounded-sm border border-white/10" />
                      <span className="text-[10px] text-white font-bold mt-1 max-w-[80px] truncate">{players[1].is_bot ? players[1].bot_name : players[1].profiles?.display_name}</span>
                    </>
                  ) : (
                    <div className="w-12 h-12 rounded-sm border border-dashed border-white/20 flex items-center justify-center text-zinc-600 bg-black/30">
                      <User size={20} />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-6 mt-4 md:mt-0">
                <div className="text-right">
                  <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Bahis / Raunt</div>
                  <div className="text-lg font-black text-yellow-500">{b.wager} K / {b.rounds}</div>
                </div>
                
                {isWaiting ? (
                  <button onClick={() => handleJoinBattle(b.id)} className="bg-cyan-600/20 hover:bg-cyan-600 text-cyan-400 hover:text-white border border-cyan-500/30 px-6 py-2.5 rounded-sm text-xs font-black uppercase tracking-widest transition">
                    Savaşa Katıl
                  </button>
                ) : (
                  <button onClick={() => setActiveBattle(b)} className="bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white border border-red-500/30 px-6 py-2.5 rounded-sm text-xs font-black uppercase tracking-widest transition animate-pulse">
                    İzle (Devam Ediyor)
                  </button>
                )}
              </div>
            </div>
          )
        })}
        {battles.length === 0 && (
          <div className="text-center py-20 text-zinc-500 hud-panel rounded-md uppercase tracking-widest text-xs font-bold border-dashed">
            Şu an aktif bir savaş yok. İlk savaşı sen başlat!
          </div>
        )}
      </div>
    </div>
  )
}