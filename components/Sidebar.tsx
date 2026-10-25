"use client"
import { motion, AnimatePresence } from "framer-motion"
import { X, MessageSquare, Send, Gamepad2, Package, Swords, Crown, Map, Calendar, Target, Users, ShieldAlert, LogOut, ArrowUpRight, ArrowRightLeft } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useRouter } from "next/navigation"

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  profile: any
}

export default function Sidebar({ isOpen, onClose, profile }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/")
    router.refresh()
  }

  const menuGroups = [
    {
      title: "İletişim",
      links: [
        { name: "Sohbet", href: "/chat", icon: MessageSquare, color: "text-cyan-400" },
        { name: "Direkt Mesajlar", href: "/dm", icon: Send, color: "text-purple-400" },
      ]
    },
    {
      title: "Oyun & Eğlence",
      links: [
        { name: "Kasa Aç", href: "/case", icon: Gamepad2, color: "text-yellow-500" },
        { name: "Upgrade", href: "/upgrade", icon: ArrowUpRight, color: "text-green-500" },
        { name: "Kasa Savaşı", href: "/battle", icon: Swords, color: "text-orange-500" },
        { name: "Envanter", href: "/inventory", icon: Package, color: "text-green-400" },
        { name: "1v1 Arena", href: "/arena", icon: Swords, color: "text-red-400" },
        { name: "Takas Merkezi", href: "/trades", icon: ArrowRightLeft, color: "text-cyan-400" },
      ]
    },
    {
      title: "Klan & İstatistik",
      links: [
        { name: "Liderlik Tablosu", href: "/leaderboard", icon: Crown, color: "text-yellow-500" },
        { name: "Taktik Panosu", href: "/strats", icon: Map, color: "text-zinc-400" },
        { name: "Günlük Görevler", href: "/quests", icon: Target, color: "text-purple-400" },
        { name: "Takvim", href: "/events", icon: Calendar, color: "text-zinc-400" },
        { name: "Üyeler", href: "/members", icon: Users, color: "text-zinc-400" },
      ]
    }
  ]

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]"
          />

          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 left-0 h-full w-72 bg-[#050811] border-r border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)] z-[110] flex flex-col"
          >
            <div className="h-[72px] flex items-center justify-between px-6 border-b border-white/5">
              <Link href="/dashboard" onClick={onClose} className="flex items-center gap-3 group">
                <div className="w-8 h-8 rounded-sm bg-gradient-to-br from-red-500 to-red-900 flex items-center justify-center font-black text-white text-[11px] italic tracking-tighter shadow-[0_0_10px_rgba(239,68,68,0.4)] border border-red-400/30 transform -skew-x-6">
                  NCL
                </div>
                <span className="font-black text-lg text-white tracking-widest uppercase">MENÜ</span>
              </Link>
              <button onClick={onClose} className="p-2 text-zinc-500 hover:text-white hover:bg-white/5 rounded-sm transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8 custom-scrollbar">
              {menuGroups.map((group, i) => (
                <div key={i}>
                  <h3 className="text-[10px] font-bold text-red-500/70 uppercase tracking-[0.2em] mb-3 px-2">{group.title}</h3>
                  <div className="space-y-1">
                    {group.links.map((link) => {
                      const Icon = link.icon
                      const isActive = pathname === link.href
                      return (
                        <Link
                          key={link.name}
                          href={link.href}
                          onClick={onClose}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-sm font-bold text-[13px] tracking-wide uppercase transition-all ${
                            isActive 
                              ? "bg-white/10 text-white shadow-[inset_3px_0_0_0_#ef4444] border border-white/5" 
                              : "text-zinc-400 hover:text-white hover:bg-white/5 hover:shadow-[inset_3px_0_0_0_#3f3f46]"
                          }`}
                        >
                          <Icon size={16} className={isActive ? "text-red-500" : link.color} />
                          {link.name}
                        </Link>
                      )
                    })}
                  </div>
                </div>
              ))}

              {profile?.role === 'admin' && (
                <div>
                  <h3 className="text-[10px] font-bold text-red-500/70 uppercase tracking-[0.2em] mb-3 px-2">Yönetim</h3>
                  <Link
                    href="/admin"
                    onClick={onClose}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-sm font-bold text-[13px] tracking-wide uppercase transition-all ${
                      pathname === '/admin' ? "bg-red-500/10 text-red-400 shadow-[inset_3px_0_0_0_#ef4444] border border-red-500/20" : "text-red-400/70 hover:text-red-400 hover:bg-red-500/5"
                    }`}
                  >
                    <ShieldAlert size={16} />
                    Yönetim Paneli
                  </Link>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-white/5 bg-black/20 flex flex-col gap-2">
              <Link href="/dashboard" onClick={onClose} className="flex items-center gap-3 bg-[#0a0f1c] p-3 rounded-sm border border-white/10 hover:border-red-500/50 transition-colors group">
                <img src={profile?.avatar_url} alt="Profile" className="w-10 h-10 rounded-sm border border-white/20 grayscale group-hover:grayscale-0 transition-all" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-white truncate uppercase tracking-wider">{profile?.display_name}</div>
                  <div className="text-[10px] text-red-500 font-bold tracking-widest mt-0.5">LVL {profile?.level || 1} • {profile?.xp || 0} XP</div>
                </div>
              </Link>
              
              <button 
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 py-2.5 rounded-sm text-xs font-black uppercase tracking-widest transition-colors"
              >
                <LogOut size={16} />
                Çıkış Yap
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}