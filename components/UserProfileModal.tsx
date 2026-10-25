"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { X, Trophy, Calendar, Clock, Skull, Target, ShieldAlert, Send, Flag, ArrowRightLeft } from "lucide-react"
import Link from "next/link"
import { useToast } from "./Toast"

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
      case 'admin': return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'moderator': return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
      case 'vip': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      case 'retired': return 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20';
      default: return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
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
    
    const res = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reported_user_id: userId, reason: reportReason })
    })

    if (res.ok) {
      showToast("Kullanıcı başarıyla şikayet edildi.", "success")
      setIsReporting(false)
      setReportReason("")
      onClose()
    } else {
      showToast("Şikayet iletilemedi.", "error")
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm glass-panel rounded-2xl overflow-hidden relative shadow-2xl" onClick={(e) => e.stopPropagation()}>
        
        <div className="h-24 bg-gradient-to-r from-red-600 to-red-900 relative">
          <button onClick={onClose} className="absolute top-3 right-3 p-1.5 bg-black/40 hover:bg-black/80 rounded-full text-white transition"><X size={18} /></button>
        </div>
        
        <div className="px-6 pb-6 relative">
          <div className="absolute -top-12 left-6">
            <img src={profile.avatar_url} alt={profile.display_name} className="w-24 h-24 rounded-full border-4 border-[#09090b] bg-zinc-900 shadow-xl object-cover" />
          </div>
          
          <div className="pt-14">
            <h2 className="text-2xl font-black text-white">{profile.display_name}</h2>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className={`text-[10px] px-2 py-1 rounded border font-bold uppercase tracking-wider ${getRoleStyle(profile.role)}`}>{profile.role}</span>
              
              {profile.player_role && profile.player_role !== 'Belirtilmemiş' && (
                <span className={`text-[10px] px-2 py-1 rounded border font-bold uppercase tracking-wider ${getPlayerRoleStyle(profile.player_role)}`}>
                  {profile.player_role}
                </span>
              )}

              {profile.is_vac_banned && (
                <span className="text-[10px] px-2 py-1 rounded border font-bold uppercase tracking-wider text-red-400 bg-red-500/10 border-red-500/20 flex items-center gap-1">
                  <ShieldAlert size={12}/> VAC BAN
                </span>
              )}
            </div>
          </div>
          
          {isReporting ? (
            <div className="mt-6 bg-red-500/10 border border-red-500/30 p-4 rounded-xl">
              <h3 className="text-sm font-bold text-red-400 mb-2 flex items-center gap-2"><Flag size={16}/> Kullanıcıyı Şikayet Et</h3>
              <textarea 
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder="Neden şikayet ediyorsunuz? (Küfür, hakaret vb.)"
                className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500 min-h-[80px] mb-3"
              />
              <div className="flex gap-2">
                <button onClick={() => setIsReporting(false)} className="flex-1 bg-zinc-800 py-2 rounded-lg text-xs font-bold text-white">İptal</button>
                <button onClick={handleReport} className="flex-1 bg-red-600 hover:bg-red-500 py-2 rounded-lg text-xs font-bold text-white transition">Gönder</button>
              </div>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              <div>
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Hakkında</h3>
                <p className="text-sm text-zinc-300 bg-zinc-950/50 p-3 rounded-lg border border-zinc-800/50 min-h-[60px]">{profile.about_me || "Henüz bir şey yazmamış."}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-zinc-900/80 p-3 rounded-xl border border-zinc-800 flex items-center gap-3">
                  <Trophy className="text-yellow-500" size={20} />
                  <div className="text-left"><div className="text-[10px] text-zinc-500 uppercase font-bold">Premier</div><div className="text-sm font-black text-white">{profile.premier_rating ? profile.premier_rating.toLocaleString('tr-TR') : "Yok"}</div></div>
                </div>
                
                <div className="bg-zinc-900/80 p-3 rounded-xl border border-zinc-800 flex items-center gap-3">
                  <Skull className="text-red-400" size={20} />
                  <div className="text-left">
                    <div className="text-[10px] text-zinc-500 uppercase font-bold">K/D</div>
                    <div className="text-sm font-black text-white">
                      {profile.kd_ratio !== null && profile.kd_ratio !== undefined ? profile.kd_ratio.toFixed(2) : "Yok"}
                    </div>
                  </div>
                </div>

                <div className="bg-zinc-900/80 p-3 rounded-xl border border-zinc-800 flex items-center gap-3">
                  <Target className="text-cyan-400" size={20} />
                  <div className="text-left">
                    <div className="text-[10px] text-zinc-500 uppercase font-bold">HS %</div>
                    <div className="text-sm font-black text-white">
                      {profile.headshot_percentage !== null && profile.headshot_percentage !== undefined ? `%${profile.headshot_percentage.toFixed(1)}` : "Yok"}
                    </div>
                  </div>
                </div>

                <div className="bg-zinc-900/80 p-3 rounded-xl border border-zinc-800 flex items-center gap-3">
                  <Clock className="text-blue-400" size={20} />
                  <div className="text-left"><div className="text-[10px] text-zinc-500 uppercase font-bold">Süre</div><div className="text-sm font-black text-white">{profile.cs_playtime ? `${profile.cs_playtime}s` : "Yok"}</div></div>
                </div>
              </div>

              <div className="bg-zinc-900/80 p-3 rounded-xl border border-zinc-800 flex items-center justify-center gap-3">
                  <Calendar className="text-cyan-500" size={20} />
                  <div className="text-center"><div className="text-[10px] text-zinc-500 uppercase font-bold">Üyelik Tarihi</div><div className="text-sm font-bold text-white">{new Date(profile.created_at).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}</div></div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <a href={profile.steam_profile_url} target="_blank" className="flex-1 text-center bg-[#171a21] hover:bg-[#1b2838] border border-zinc-700 text-xs py-2.5 rounded-lg transition">Steam ↗</a>
                  <Link href={`/dm?user=${profile.id}`} onClick={onClose} className="flex-1 text-center bg-purple-600/20 hover:bg-purple-600 border border-purple-500/30 text-purple-400 hover:text-white text-xs font-bold py-2.5 rounded-lg transition flex items-center justify-center gap-2">
                    <Send size={14}/> Mesaj
                  </Link>
                </div>
                
                {currentUser && currentUser.id !== profile.id && (
                  <>
                    <Link href={`/trades/create?user=${profile.id}`} onClick={onClose} className="w-full text-center bg-cyan-600/20 hover:bg-cyan-600 border border-cyan-500/30 text-cyan-400 hover:text-white text-xs font-bold py-2.5 rounded-lg transition flex items-center justify-center gap-2">
                      <ArrowRightLeft size={14}/> Takas Teklif Et
                    </Link>
                    <button onClick={() => setIsReporting(true)} className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-bold py-2 rounded-lg transition flex items-center justify-center gap-2 mt-1">
                      <Flag size={14} /> Kullanıcıyı Şikayet Et
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}