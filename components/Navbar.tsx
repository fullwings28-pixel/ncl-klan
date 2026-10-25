"use client"
import Link from "next/link"
import { Menu, Trophy, Activity } from "lucide-react"
import { useEffect, useState } from "react"
import NotificationBell from "./NotificationBell"
import Sidebar from "./Sidebar"

export default function Navbar({ profile }: { profile: any }) {
  const [siteName, setSiteName] = useState("NCL Klan Merkezi")
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  useEffect(() => {
    fetch("/api/settings").then(res => res.json()).then(data => setSiteName(data.site_name))
  }, [])

  return (
    <>
      <nav className="sticky top-0 z-50 w-full bg-[#050811]/90 backdrop-blur-md border-b border-white/5 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
        <div className="max-w-7xl mx-auto px-4 h-[72px] flex items-center justify-between">
          
          {/* SOL TARAF */}
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 -ml-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-all group"
            >
              <Menu size={24} className="group-hover:text-red-500 transition-colors" />
            </button>
            
            <Link href="/dashboard" className="flex items-center gap-3 group">
              {/* NCL LOGO - DAHA AGRESİF */}
              <div className="relative">
                <div className="absolute inset-0 bg-red-500 blur-md opacity-20 group-hover:opacity-40 transition-opacity"></div>
                <div className="relative w-10 h-10 bg-gradient-to-br from-red-500 to-red-900 flex items-center justify-center font-black text-white text-[15px] italic tracking-tighter border border-red-400/50 rounded-sm transform -skew-x-6 group-hover:scale-105 transition-transform">
                  NCL
                </div>
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="font-bold text-lg tracking-widest uppercase text-white leading-none">{siteName.split(' ')[0]}</span>
                <span className="text-[10px] text-red-500 tracking-[0.2em] font-bold uppercase leading-none mt-1">E-Sports</span>
              </div>
            </Link>
          </div>

          {/* ORTA (Durum Çubuğu) */}
          <div className="hidden md:flex items-center gap-6 px-4 py-1.5 bg-black/40 border border-white/5 rounded-full">
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-400">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div> SUNUCU AKTİF
            </div>
            <div className="w-px h-3 bg-white/10"></div>
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-400">
              <Activity size={12} className="text-red-500" /> {profile?.display_name}
            </div>
          </div>

          {/* SAĞ TARAF */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-md">
              <Trophy size={14} className="text-yellow-500" />
              <span className="text-sm font-bold text-yellow-500">{profile?.xp || 0} XP</span>
            </div>

            <div className="w-px h-6 bg-white/10"></div>

            <NotificationBell userId={profile?.id} />
            
            <Link href="/dashboard" className="relative group flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <div className="text-[13px] font-bold text-white uppercase tracking-wider">{profile?.display_name}</div>
                <div className="text-[10px] text-red-500 font-bold tracking-widest">LVL {profile?.level || 1}</div>
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-red-500 blur-sm opacity-0 group-hover:opacity-50 transition-opacity"></div>
                <img src={profile?.avatar_url} alt="Profil" className="relative w-10 h-10 rounded-sm border border-white/20 group-hover:border-red-500 transition-colors object-cover" />
              </div>
            </Link>
          </div>

        </div>
      </nav>

      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        profile={profile} 
      />
    </>
  )
}