import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import UpdateRankButton from "./UpdateRankButton"
import EditAbout from "./EditAbout"
import SelectRole from "./SelectRole"
import Navbar from "@/components/Navbar"
import { Trophy, Clock, Target, Skull, ShieldAlert, Package, MessageSquare, Activity } from "lucide-react"

export const dynamic = 'force-dynamic'

export default async function Dashboard() {
  const profile = await getSession()
  if (!profile) redirect("/")

  return (
    <main className="min-h-screen relative pb-12 overflow-hidden">
      {/* Arka plan süslemeleri */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-600/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-cyan-600/5 rounded-full blur-[120px] pointer-events-none"></div>
      
      <Navbar profile={profile} />

      <div className="max-w-6xl mx-auto px-6 mt-10 relative z-10">
        
        {/* PROFİL KARTI (HUD Paneli) */}
        <div className="hud-panel rounded-xl p-8 flex flex-col md:flex-row items-center md:items-start gap-8 relative">
          
          <div className="relative shrink-0">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-transparent opacity-20 blur-xl"></div>
            <img
              src={profile.avatar_url}
              alt={profile.display_name}
              className="relative w-32 h-32 md:w-40 md:h-40 rounded-lg border-2 border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.8)] object-cover grayscale-[20%] hover:grayscale-0 transition-all duration-500"
            />
            {profile.role === 'admin' && (
              <div className="absolute -bottom-3 -right-3 bg-red-600 p-2 rounded-md border border-red-400 shadow-[0_0_15px_rgba(239,68,68,0.6)]" title="Yönetici">
                <ShieldAlert size={20} className="text-white" />
              </div>
            )}
          </div>
          
          <div className="flex-1 text-center md:text-left w-full">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-white/5">
              <div>
                <h1 className="text-4xl font-black text-white tracking-widest uppercase text-glow">{profile.display_name}</h1>
                <div className="flex items-center justify-center md:justify-start gap-3 mt-2">
                  <a href={profile.steam_profile_url} target="_blank" className="text-xs bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1 rounded-sm text-zinc-300 transition-colors font-bold tracking-wider">
                    STEAM PROFİLİ ↗
                  </a>
                  <div className="text-xs text-red-500 font-bold tracking-wider flex items-center gap-1">
                    <Activity size={14}/> AKTİF
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <UpdateRankButton steamId={profile.steam_id} />
              </div>
            </div>
            
            {/* İSTATİSTİK PANELLERİ */}
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-black/40 p-4 rounded-lg border border-white/5 flex flex-col items-center justify-center gap-2 group hover:border-yellow-500/30 transition-colors">
                <Trophy className="text-yellow-500" size={24} />
                <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Premier</div>
                <div className="text-xl font-black text-white">{profile.premier_rating ? profile.premier_rating.toLocaleString('tr-TR') : "-"}</div>
              </div>
              
              <div className="bg-black/40 p-4 rounded-lg border border-white/5 flex flex-col items-center justify-center gap-2 group hover:border-red-500/30 transition-colors">
                <Skull className="text-red-500" size={24} />
                <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">K/D Oranı</div>
                <div className="text-xl font-black text-white">
                  {profile.kd_ratio !== null && profile.kd_ratio !== undefined ? profile.kd_ratio.toFixed(2) : <span className="text-sm text-zinc-600">Gizli</span>}
                </div>
              </div>

              <div className="bg-black/40 p-4 rounded-lg border border-white/5 flex flex-col items-center justify-center gap-2 group hover:border-cyan-500/30 transition-colors">
                <Target className="text-cyan-500" size={24} />
                <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">HS %</div>
                <div className="text-xl font-black text-white">
                  {profile.headshot_percentage !== null && profile.headshot_percentage !== undefined ? `%${profile.headshot_percentage.toFixed(1)}` : "-"}
                </div>
              </div>

              <div className="bg-black/40 p-4 rounded-lg border border-white/5 flex flex-col items-center justify-center gap-2 group hover:border-blue-500/30 transition-colors">
                <Clock className="text-blue-500" size={24} />
                <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Oynama</div>
                <div className="text-xl font-black text-white">{profile.cs_playtime ? `${profile.cs_playtime}s` : "-"}</div>
              </div>
            </div>

            <SelectRole initialRole={profile.player_role} />
            <EditAbout initialAbout={profile.about_me} />
          </div>
        </div>

        {/* HIZLI ERİŞİM (Alt Kutular) */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
          <a href="/chat" className="hud-panel p-5 rounded-lg flex items-center gap-5 group hover:bg-white/5 transition-all">
            <div className="bg-cyan-500/10 p-3 rounded-md border border-cyan-500/20 group-hover:scale-110 group-hover:border-cyan-500/50 transition-all">
              <MessageSquare className="text-cyan-400" size={24} />
            </div>
            <div>
              <div className="font-bold text-white tracking-wider uppercase text-sm group-hover:text-cyan-400 transition-colors">Sohbete Katıl</div>
              <div className="text-[11px] text-zinc-500 mt-1">Klanla iletişimde kal</div>
            </div>
          </a>
          
          <a href="/case" className="hud-panel p-5 rounded-lg flex items-center gap-5 group hover:bg-white/5 transition-all">
            <div className="bg-yellow-500/10 p-3 rounded-md border border-yellow-500/20 group-hover:scale-110 group-hover:border-yellow-500/50 transition-all">
              <Trophy className="text-yellow-500" size={24} />
            </div>
            <div>
              <div className="font-bold text-white tracking-wider uppercase text-sm group-hover:text-yellow-500 transition-colors">Kasa Aç</div>
              <div className="text-[11px] text-zinc-500 mt-1">Şansını dene</div>
            </div>
          </a>

          <a href="/inventory" className="hud-panel p-5 rounded-lg flex items-center gap-5 group hover:bg-white/5 transition-all">
            <div className="bg-green-500/10 p-3 rounded-md border border-green-500/20 group-hover:scale-110 group-hover:border-green-500/50 transition-all">
              <Package className="text-green-400" size={24} />
            </div>
            <div>
              <div className="font-bold text-white tracking-wider uppercase text-sm group-hover:text-green-400 transition-colors">Envanterim</div>
              <div className="text-[11px] text-zinc-500 mt-1">Eşyalarını yönet</div>
            </div>
          </a>
        </div>

      </div>
    </main>
  )
}