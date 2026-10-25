import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import { createClient } from "@supabase/supabase-js"
import Navbar from "@/components/Navbar"
import { Crown, Medal, Award, Skull, Target, ShieldAlert } from "lucide-react"

export const dynamic = 'force-dynamic'

export default async function MembersPage() {
  const session = await getSession()
  if (!session) redirect("/")

  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)
  
  const { data: users } = await supabase.from("profiles").select("*").order("premier_rating", { ascending: false, nullsFirst: false })

  const getRoleStyle = (role: string) => {
    switch(role) {
      case 'admin': return 'bg-red-500/10 text-red-500 border-red-500/30';
      case 'moderator': return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'vip': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30';
      case 'retired': return 'bg-zinc-800 text-zinc-400 border-zinc-700';
      default: return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
    }
  }

  const getRoleName = (role: string) => {
    switch(role) {
      case 'admin': return 'ADMİN';
      case 'moderator': return 'MOD';
      case 'vip': return 'VIP';
      case 'retired': return 'EMEKLİ';
      default: return 'ÜYE';
    }
  }

  const getPlayerRoleStyle = (role: string) => {
    switch(role) {
      case 'AWPer': return 'text-blue-400 border-blue-500/30 bg-blue-500/10';
      case 'Entry Fragger': return 'text-red-400 border-red-500/30 bg-red-500/10';
      case 'IGL': return 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10';
      case 'Support': return 'text-green-400 border-green-500/30 bg-green-500/10';
      case 'Lurker': return 'text-purple-400 border-purple-500/30 bg-purple-500/10';
      case 'Rifler': return 'text-zinc-300 border-zinc-500/30 bg-zinc-500/10';
      default: return 'hidden';
    }
  }

  return (
    <main className="min-h-screen relative pb-12">
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-red-600/5 rounded-full blur-[100px] pointer-events-none"></div>
      <Navbar profile={session} />

      <div className="max-w-7xl mx-auto p-6 pt-12 relative z-10">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black mb-2 flex items-center justify-center gap-3 tracking-widest uppercase text-white">
            <Crown className="text-yellow-500" size={36} /> NCL Personel
          </h1>
          <p className="text-zinc-500 text-xs font-bold tracking-[0.3em] uppercase">Toplam {users?.length || 0} Aktif Operatör</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {users?.map((user, index) => {
            const isFirst = index === 0
            const isSecond = index === 1
            const isThird = index === 2

            const badgeColor = isFirst ? 'bg-yellow-500 text-black shadow-[0_0_15px_rgba(234,179,8,0.5)]' : isSecond ? 'bg-zinc-300 text-black' : isThird ? 'bg-amber-700 text-white' : 'bg-zinc-800 text-zinc-500';

            return (
              <div key={user.id} className={`hud-panel p-5 rounded-md relative group transition-all duration-300 hover:-translate-y-1 ${isFirst ? 'border-yellow-500/30' : ''} ${user.is_vac_banned ? 'border-red-500/50' : ''}`}>
                
                <div className={`absolute -top-3 -left-3 w-10 h-10 rounded-sm flex items-center justify-center font-black text-lg border border-[#050811] z-20 transform -skew-x-6 ${badgeColor}`}>
                  {isFirst ? <Crown size={20} /> : isSecond ? <Medal size={20} /> : isThird ? <Award size={20} /> : `#${index + 1}`}
                </div>

                <div className="flex items-center gap-4 mb-5 border-b border-white/5 pb-4">
                  <img src={user.avatar_url} alt={user.display_name} className={`w-14 h-14 rounded-sm border object-cover grayscale-[20%] group-hover:grayscale-0 transition-all ${isFirst ? 'border-yellow-500' : 'border-white/10'}`} />
                  <div>
                    <h2 className="text-base font-bold text-white truncate max-w-[140px] flex items-center gap-2 uppercase tracking-wide">
                      {user.display_name}
                      {user.is_vac_banned && <ShieldAlert size={14} className="text-red-500" title="VAC Banlı" />}
                    </h2>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      <span className={`text-[9px] px-2 py-0.5 rounded-sm font-bold uppercase tracking-widest border ${getRoleStyle(user.role)}`}>
                        {getRoleName(user.role)}
                      </span>
                      {user.player_role && user.player_role !== 'Belirtilmemiş' && (
                        <span className={`text-[9px] px-2 py-0.5 rounded-sm font-bold uppercase tracking-widest border ${getPlayerRoleStyle(user.player_role)}`}>
                          {user.player_role}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="bg-black/40 p-3 rounded-sm flex justify-between items-center border border-white/5">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">PREMIER</span>
                    <span className={`font-black text-lg ${user.premier_rating ? 'text-yellow-500' : 'text-zinc-600'}`}>
                      {user.premier_rating ? user.premier_rating.toLocaleString('tr-TR') : "YOK"}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-black/40 p-2 rounded-sm flex items-center justify-center gap-2 border border-white/5">
                      <Skull size={14} className="text-red-500" />
                      <span className="font-bold text-xs text-white">
                        {user.kd_ratio !== null && user.kd_ratio !== undefined ? user.kd_ratio.toFixed(2) : "-"}
                      </span>
                    </div>
                    <div className="bg-black/40 p-2 rounded-sm flex items-center justify-center gap-2 border border-white/5">
                      <Target size={14} className="text-cyan-500" />
                      <span className="font-bold text-xs text-white">
                        {user.headshot_percentage !== null && user.headshot_percentage !== undefined ? `%${user.headshot_percentage.toFixed(0)}` : "-"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </main>
  )
}