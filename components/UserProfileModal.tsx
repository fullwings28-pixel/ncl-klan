"use client"
import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import { X, Trophy, Calendar, Clock, Skull, Target, ShieldAlert, Send, Flag } from "lucide-react"
import Link from "next/link"
import { useToast } from "./Toast"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export default function UserProfileModal({ userId, onClose }: { userId: string, onClose: () => void }) {
  const [profile, setProfile] = useState<any>(null)
  
  const [isReporting, setIsReporting] = useState(false)
  const [reportReason, setReportReason] = useState("")
  const [currentUser, setCurrentUser] = useState<any>(null)
  const { showToast } = useToast()

  useEffect(() => {
    supabase.from("profiles").select("*").eq("id", userId).single().then(({ data }) => { if (data) setProfile(data) })
    fetch("/api/me").then(res => res.json()).then(data => { if(data.profile) setCurrentUser(data.profile) })
  }, [userId])

  if (!profile) return null

  const getRoleStyle = (role: string) => {
    switch(role) {
      case 'admin': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'moderator': return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
      case 'vip': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      case 'retired': return 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20';
      default: return 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20';
    }
  }

  const getPlayerRoleStyle = (role: string) => {
    switch(role) {
      case 'AWPer': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      case 'Entry Fragger': return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'IGL': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      case 'Support': return 'text-green-400 bg-green-500/10 border-green-500/20';
      case 'Lurker': return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
      case 'Rifler': return 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20';
      default: return 'hidden';
    }
  }

  const handleReport = async () => {
    if (!reportReason.trim()) return showToast("Lütfen bir şikayet sebebi yazın.", "error")
    
    const res = await fetch("/api/reports", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reported_user_id: userId, reason: reportReason }) })

    if (res.ok) { showToast("Kullanıcı başarıyla şikayet edildi.", "success"); setIsReporting(false); setReportReason(""); onClose() } 
    else { showToast("Şikayet iletilemedi.", "error") }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm hud-panel rounded-md overflow-hidden relative shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-white/10" onClick={(e) => e.stopPropagation()}>
        
        <div className="h-24 bg-gradient-to-r from-red-900/50 to-black/50 relative border-b border-white/5">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 pointer-events-none"></div>
          <button onClick={onClose} className="absolute top-3 right-3 p-1.5 bg-black/40 hover:bg-red-500 rounded-sm text-white transition-colors"><X size={16} /></button>
        </div>
        
        <div className="px-6 pb-6 relative">
          <div className="absolute -top-12 left-6">
            <img src={profile.avatar_url} alt={profile.display_name} className="w-24 h-24 rounded-sm border-2 border-[#0a0f1c] bg-zinc-900 shadow-2xl object-cover grayscale-[20%]" />
          </div>
          
          <div className="pt-14">
            <h2 className="text-2xl font-black text-white uppercase tracking-widest">{profile.display_name}</h2>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className={`text-[9px] px-2 py-1 rounded-sm border font-bold uppercase tracking-widest ${getRoleStyle(profile.role)}`}>{profile.role}</span>
              {profile.player_role && profile.player_role !== 'Belirtilmemiş' && (
                <span className={`text-[9px] px-2 py-1 rounded-sm border font-bold uppercase tracking-widest ${getPlayerRoleStyle(profile.player_role)}`}>{profile.player_role}</span>
              )}
              {profile.is_vac_banned && (
                <span className="text-[9px] px-2 py-1 rounded-sm border font-bold uppercase tracking-widest text-red-500 bg-red-500/10 border-red-500/20 flex items-center gap-1"><ShieldAlert size={10}/> VAC BAN</span>
              )}
            </div>
          </div>
          
          {isReporting ? (
            <div className="mt-6 bg-red-500/10 border border-red-500/30 p-4 rounded-sm">
              <h3 className="text-xs font-bold text-red-500 mb-2 flex items-center gap-2 uppercase tracking-widest"><Flag size={14}/> Kullanıcıyı Şikayet Et</h3>
              <textarea value={reportReason} onChange={(e) => setReportReason(e.target.value)} placeholder="Şikayet sebebi..." className="w-full bg-black/50 border border-white/10 text-white rounded-sm px-3 py-2 text-xs focus:outline-none focus:border-red-500 min-h-[70px] mb-3" />
              <div className="flex gap-2">
                <button onClick={() => setIsReporting(false)} className="flex-1 bg-white/5 py-2 rounded-sm text-[10px] font-bold text-white uppercase tracking-widest">İptal</button>
                <button onClick={handleReport} className="flex-1 bg-red-600 hover:bg-red-500 py-2 rounded-sm text-[10px] font-bold text-white transition uppercase tracking-widest">Gönder</button>
              </div>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              <div>
                <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-2">Hakkında</h3>
                <p className="text-xs text-zinc-300 bg-black/30 p-3 rounded-sm border border-white/5 min-h-[50px]">{profile.about_me || "Henüz bir şey yazmamış."}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-black/40 p-2.5 rounded-sm border border-white/5 flex items-center gap-2">
                  <Trophy className="text-yellow-500" size={16} />
                  <div className="text-left"><div className="text-[8px] text-zinc-500 uppercase font-bold tracking-widest">Premier</div><div className="text-xs font-black text-white">{profile.premier_rating ? profile.premier_rating.toLocaleString('tr-TR') : "-"}</div></div>
                </div>
                <div className="bg-black/40 p-2.5 rounded-sm border border-white/5 flex items-center gap-2">
                  <Skull className="text-red-500" size={16} />
                  <div className="text-left"><div className="text-[8px] text-zinc-500 uppercase font-bold tracking-widest">K/D</div><div className="text-xs font-black text-white">{profile.kd_ratio !== null && profile.kd_ratio !== undefined ? profile.kd_ratio.toFixed(2) : <span className="text-[10px] text-zinc-600">Gizli</span>}</div></div>
                </div>
                <div className="bg-black/40 p-2.5 rounded-sm border border-white/5 flex items-center gap-2">
                  <Target className="text-cyan-500" size={16} />
                  <div className="text-left"><div className="text-[8px] text-zinc-500 uppercase font-bold tracking-widest">HS %</div><div className="text-xs font-black text-white">{profile.headshot_percentage !== null && profile.headshot_percentage !== undefined ? `%${profile.headshot_percentage.toFixed(1)}` : "-"}</div></div>
                </div>
                <div className="bg-black/40 p-2.5 rounded-sm border border-white/5 flex items-center gap-2">
                  <Clock className="text-blue-500" size={16} />
                  <div className="text-left"><div className="text-[8px] text-zinc-500 uppercase font-bold tracking-widest">Süre</div><div className="text-xs font-black text-white">{profile.cs_playtime ? `${profile.cs_playtime}s` : "-"}</div></div>
                </div>
              </div>

              <div className="bg-black/40 p-2.5 rounded-sm border border-white/5 flex items-center justify-center gap-2">
                <Calendar className="text-zinc-500" size={14} />
                <div className="text-[9px] text-zinc-400 uppercase font-bold tracking-widest">KAYIT: {new Date(profile.created_at).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}</div>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <div className="flex gap-2">
                  <a href={profile.steam_profile_url} target="_blank" className="flex-1 text-center bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-bold text-zinc-300 py-2.5 rounded-sm transition uppercase tracking-widest">Steam ↗</a>
                  <Link href={`/dm?user=${profile.id}`} onClick={onClose} className="flex-1 text-center bg-purple-500/10 hover:bg-purple-600 border border-purple-500/30 text-purple-400 hover:text-white text-[10px] font-bold py-2.5 rounded-sm transition flex items-center justify-center gap-2 uppercase tracking-widest"><Send size={12}/> Mesaj</Link>
                </div>
                {currentUser && currentUser.id !== profile.id && (
                  <button onClick={() => setIsReporting(true)} className="w-full bg-red-500/5 hover:bg-red-500/20 text-red-500 border border-red-500/20 text-[10px] font-bold py-2 rounded-sm transition flex items-center justify-center gap-2 uppercase tracking-widest">
                    <Flag size={12} /> Şikayet Et
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}