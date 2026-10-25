"use client"
import { useEffect, useState } from "react"
import { Coins, Star, Package, Crown, Shield, TrendingUp } from "lucide-react"
import { createClient } from "@supabase/supabase-js"
import { useToast } from "@/components/Toast"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export default function LeaderboardClient({ currentUser }: { currentUser: any }) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"balance" | "xp" | "inventory">("balance")
  
  const [treasury, setTreasury] = useState(0)
  const [depositAmount, setDepositAmount] = useState("")
  const [isDepositing, setIsDepositing] = useState(false)
  const { showToast } = useToast()

  const fetchLeaderboard = () => {
    fetch("/api/leaderboard").then(res => res.json()).then(resData => { if (Array.isArray(resData)) setData(resData); setLoading(false) })
  }

  const fetchTreasury = async () => {
    const { data } = await supabase.from("settings").select("value").eq("key", "treasury_balance").single()
    if (data) setTreasury(parseInt(data.value || "0"))
  }

  useEffect(() => { fetchLeaderboard(); fetchTreasury() }, [])

  const handleDeposit = async () => {
    const amount = parseInt(depositAmount)
    if (isNaN(amount) || amount <= 0) return showToast("Geçerli bir miktar girin.", "error")
    if (currentUser.balance < amount) return showToast("Yetersiz bakiyeniz.", "error")

    setIsDepositing(true)
    const res = await fetch("/api/treasury/deposit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amount }) })

    if (res.ok) { showToast(`Klan kasasına ${amount} Kredi bağışladın!`, "success"); setDepositAmount(""); fetchTreasury(); window.location.reload() } 
    else { showToast("Bağış yapılamadı.", "error") }
    setIsDepositing(false)
  }

  const getSortedData = () => {
    return [...data].sort((a, b) => {
      if (activeTab === "balance") return (b.balance || 0) - (a.balance || 0)
      if (activeTab === "xp") return (b.xp || 0) - (a.xp || 0)
      if (activeTab === "inventory") return (b.inventory_value || 0) - (a.inventory_value || 0)
      return 0
    })
  }

  const sortedData = getSortedData()

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'moderator': return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
      case 'vip': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      default: return 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20';
    }
  }

  if (loading) return <div className="text-center py-20 text-zinc-500 uppercase tracking-widest text-sm animate-pulse">İstatistikler Yükleniyor...</div>

  return (
    <div>
      <div className="text-center mb-10">
        <h1 className="text-4xl font-black text-white flex items-center justify-center gap-3 tracking-widest uppercase">
          <Crown className="text-yellow-500" size={36} /> Klan Skor Tabelası
        </h1>
        <p className="text-zinc-500 mt-2 text-xs font-bold tracking-[0.3em] uppercase">Klanın En İyileri</p>
      </div>

      <div className="hud-panel p-6 mb-10 rounded-md flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/5 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="flex items-center gap-5 relative z-10">
          <div className="bg-yellow-500/10 p-4 rounded-sm border border-yellow-500/20 shadow-[0_0_15px_rgba(234,179,8,0.2)]">
            <Shield size={32} className="text-yellow-500" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white mb-1 uppercase tracking-widest">Klan Ortak Kasası</h2>
            <div className="text-3xl font-black text-yellow-500 flex items-center gap-2 text-glow">
              <Coins size={24} /> {treasury.toLocaleString('tr-TR')} <span className="text-xs text-yellow-600 font-bold uppercase tracking-widest mt-1">KREDİ</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2 w-full md:w-auto relative z-10">
          <input type="number" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} placeholder="Miktar" className="w-28 bg-black/50 border border-white/10 text-white rounded-sm px-4 py-3 focus:outline-none focus:border-yellow-500 font-black tracking-widest text-center" />
          <button onClick={handleDeposit} disabled={isDepositing} className="flex-1 md:flex-none bg-yellow-600/20 hover:bg-yellow-600 border border-yellow-500/30 text-yellow-500 hover:text-white px-6 py-3 rounded-sm text-xs font-black uppercase tracking-widest transition flex items-center gap-2 disabled:opacity-50">
            <TrendingUp size={16}/> Bağış
          </button>
        </div>
      </div>

      <div className="flex justify-center gap-2 mb-8 bg-black/40 p-1.5 rounded-sm w-fit mx-auto border border-white/5">
        <button onClick={() => setActiveTab("balance")} className={`flex items-center gap-2 px-6 py-2 rounded-sm font-bold text-xs uppercase tracking-widest transition-all ${activeTab === "balance" ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30' : 'text-zinc-500 hover:text-white'}`}>
          <Coins size={14} /> En Zenginler
        </button>
        <button onClick={() => setActiveTab("xp")} className={`flex items-center gap-2 px-6 py-2 rounded-sm font-bold text-xs uppercase tracking-widest transition-all ${activeTab === "xp" ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-zinc-500 hover:text-white'}`}>
          <Star size={14} /> En Yüksek XP
        </button>
        <button onClick={() => setActiveTab("inventory")} className={`flex items-center gap-2 px-6 py-2 rounded-sm font-bold text-xs uppercase tracking-widest transition-all ${activeTab === "inventory" ? 'bg-green-500/20 text-green-500 border border-green-500/30' : 'text-zinc-500 hover:text-white'}`}>
          <Package size={14} /> Envanter Değeri
        </button>
      </div>

      <div className="hud-panel rounded-md border border-white/5 overflow-hidden">
        {sortedData.map((user, index) => {
          const isMe = user.id === currentUser.id
          let displayValue = ""
          if (activeTab === "balance") displayValue = `${(user.balance || 0).toLocaleString('tr-TR')} K`
          if (activeTab === "xp") displayValue = `${(user.xp || 0).toLocaleString('tr-TR')} XP`
          if (activeTab === "inventory") displayValue = `${(user.inventory_value || 0).toLocaleString('tr-TR')} D`

          let rankColor = "text-zinc-600 bg-black/40 border-white/5"
          if (index === 0) rankColor = "text-yellow-500 bg-yellow-500/10 border-yellow-500/30 shadow-[0_0_10px_rgba(234,179,8,0.2)]"
          else if (index === 1) rankColor = "text-zinc-300 bg-zinc-300/10 border-zinc-300/30"
          else if (index === 2) rankColor = "text-amber-600 bg-amber-600/10 border-amber-600/30"

          return (
            <div key={user.id} className={`flex items-center justify-between p-3 border-b border-white/5 last:border-0 transition-colors ${isMe ? 'bg-red-500/5' : 'hover:bg-white/5'}`}>
              <div className="flex items-center gap-4">
                <div className={`w-8 h-8 flex items-center justify-center rounded-sm font-black text-sm border ${rankColor}`}>{index + 1}</div>
                <div className="flex items-center gap-3">
                  <img src={user.avatar_url} alt={user.display_name} className={`w-8 h-8 rounded-sm border object-cover grayscale-[30%] ${isMe ? 'border-red-500' : 'border-white/10'}`} />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm uppercase tracking-wide">{user.display_name}</span>
                      <span className={`text-[8px] px-1.5 py-0.5 rounded-sm border font-bold uppercase tracking-wider ${getRoleColor(user.role)}`}>{user.role}</span>
                      {isMe && <span className="text-[8px] bg-red-600 text-white px-1.5 py-0.5 rounded-sm font-bold uppercase tracking-widest">SEN</span>}
                    </div>
                    <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">LVL {user.level || 1}</div>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-black text-base text-white">{displayValue}</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}