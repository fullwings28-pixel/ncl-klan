import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import { Crosshair } from "lucide-react"

export const dynamic = 'force-dynamic'

export default async function Home() {
  const session = await getSession()
  if (session) redirect("/dashboard")

  return (
    <main className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-900/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="text-center space-y-8 z-10 p-8 glass-panel rounded-3xl max-w-lg w-full mx-4 border border-red-500/20">
        <div className="flex justify-center mb-4">
          <div className="p-4 bg-zinc-800/50 rounded-2xl border border-zinc-700/50 shadow-inner">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-red-500 to-red-900 flex items-center justify-center font-black text-white text-xl italic tracking-tighter shadow-[0_0_20px_rgba(239,68,68,0.5)] border border-red-400/30">
              NCL
            </div>
          </div>
        </div>
        
        <div>
          <h1 className="text-5xl font-black tracking-tighter mb-4 glow-text text-white">
            NCL <span className="text-red-500">KLan Merkezi</span>
          </h1>
          <p className="text-zinc-400 text-lg">
            Arkadaşlarınla CS2 oyna, sohbet et ve ranklarını takip et.
          </p>
        </div>

        <a
          href="/api/auth/steam"
          className="group relative inline-flex items-center justify-center gap-3 w-full bg-gradient-to-r from-[#171a21] to-[#1b2838] hover:from-[#1b2838] hover:to-[#2a475e] border border-zinc-700 px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 glow-box"
        >
          <img src="https://upload.wikimedia.org/wikipedia/commons/8/83/Steam_icon_logo.svg" alt="Steam" className="w-6 h-6 group-hover:scale-110 transition" />
          Steam ile Giriş Yap
        </a>
      </div>
    </main>
  )
}