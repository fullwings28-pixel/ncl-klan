"use client"
import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import { Target, CheckCircle2, MessageSquare, Swords, Star, Activity, Crosshair } from "lucide-react"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export default function QuestsClient({ currentUser }: { currentUser: any }) {
  const [quests, setQuests] = useState<any[]>([])
  const [achievements, setAchievements] = useState<any[]>([])
  const [userAchievements, setUserAchievements] = useState<number[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const { data: allQuests } = await supabase.from("quests").select("*")
      const { data: userQuests } = await supabase.from("user_quests").select("*").eq("user_id", currentUser.id)
      
      if (allQuests) {
        const merged = allQuests.map(q => {
          const uq = userQuests?.find(u => u.quest_id === q.id)
          return { ...q, progress: uq?.progress || 0, is_completed: uq?.is_completed || false }
        })
        setQuests(merged)
      }

      const { data: allAch } = await supabase.from("achievements").select("*")
      const { data: userAch } = await supabase.from("user_achievements").select("achievement_id").eq("user_id", currentUser.id)
      
      if (allAch) setAchievements(allAch)
      if (userAch) setUserAchievements(userAch.map(a => a.achievement_id))

      setLoading(false)
    }
    fetchData()
  }, [currentUser.id])

  if (loading) return <div className="text-center py-20 text-zinc-500 uppercase tracking-widest text-sm animate-pulse flex items-center justify-center gap-2"><Activity className="animate-pulse"/> Veri Çekiliyor...</div>

  const getIcon = (type: string) => {
    if(type === 'send_message') return <MessageSquare className="text-cyan-400" />
    if(type === 'open_case') return <Target className="text-yellow-400" />
    if(type === 'win_duel') return <Swords className="text-red-400" />
    return <Crosshair />
  }

  return (
    <div className="space-y-12">
      
      <div>
        <h1 className="text-3xl font-black text-white flex items-center gap-3 mb-8 tracking-widest uppercase border-b border-white/10 pb-4">
          <Target className="text-cyan-500" size={32}/> AKTİF OPERASYONLAR
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quests.map(q => (
            <div key={q.id} className={`hud-panel p-5 rounded-md border transition-all duration-300 ${q.is_completed ? 'border-green-500/30 bg-green-500/5' : 'border-white/5 hover:border-white/20'}`}>
              <div className="flex justify-between items-start mb-5">
                <div className="p-3 bg-black/50 rounded-sm border border-white/10 shadow-lg">{getIcon(q.requirement_type)}</div>
                <div className="text-right">
                  <div className="text-[10px] font-bold text-yellow-500 uppercase tracking-widest">+{q.reward_credits} KREDİ</div>
                  <div className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">+{q.reward_xp} XP</div>
                </div>
              </div>
              <h3 className="font-bold text-white mb-4 uppercase tracking-wide">{q.title}</h3>
              
              <div>
                <div className="flex justify-between text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">
                  <span>İlerleme</span>
                  <span>{q.progress} / {q.requirement_count}</span>
                </div>
                <div className="w-full bg-black/60 border border-white/5 rounded-sm h-2 overflow-hidden relative">
                  <div className={`h-full transition-all duration-500 ${q.is_completed ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)]' : 'bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.8)]'}`} style={{ width: `${Math.min((q.progress / q.requirement_count) * 100, 100)}%` }}></div>
                </div>
              </div>
              {q.is_completed && <div className="mt-4 text-[10px] font-bold text-green-500 flex items-center gap-1 uppercase tracking-widest bg-green-500/10 w-fit px-2 py-1 rounded-sm border border-green-500/20"><CheckCircle2 size={12}/> TAMAMLANDI</div>}
            </div>
          ))}
        </div>
      </div>

      <div>
        <h1 className="text-3xl font-black text-white flex items-center gap-3 mb-8 tracking-widest uppercase border-b border-white/10 pb-4">
          <Star className="text-yellow-500" size={32}/> BAŞARIM ROZETLERİ
        </h1>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {achievements.map(a => {
            const isEarned = userAchievements.includes(a.id)
            return (
              <div key={a.id} className={`hud-panel p-4 rounded-md border flex flex-col items-center text-center transition-all duration-300 ${isEarned ? 'border-yellow-500/40 shadow-[0_0_20px_rgba(234,179,8,0.1)]' : 'border-white/5 opacity-50 grayscale'}`}>
                <div className={`p-4 rounded-full bg-black/50 border border-white/10 mb-3 ${isEarned ? a.color : 'text-zinc-700'}`}>
                  <Star size={28} />
                </div>
                <h3 className={`text-xs font-bold mb-1 uppercase tracking-wider ${isEarned ? 'text-white' : 'text-zinc-500'}`}>{a.title}</h3>
                <p className="text-[10px] text-zinc-500 leading-tight mb-2">{a.description}</p>
                {isEarned ? (
                   <div className="text-[9px] font-black text-yellow-500 uppercase tracking-widest mt-auto">KAZANILDI</div>
                ) : (
                   <div className="text-[9px] text-zinc-700 font-bold uppercase tracking-widest mt-auto">KİLİTLİ</div>
                )}
              </div>
            )
          })}
        </div>
      </div>

    </div>
  )
}