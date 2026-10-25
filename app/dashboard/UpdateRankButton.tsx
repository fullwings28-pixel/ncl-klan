"use client"
import { useState } from "react"
import { RefreshCw, Activity } from "lucide-react"
import { useToast } from "@/components/Toast"

export default function UpdateRankButton({ steamId }: { steamId: string }) {
  const [loading, setLoading] = useState(false)
  const { showToast } = useToast()

  const handleUpdate = async () => {
    setLoading(true)
    const res = await fetch("/api/update-rank", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ steamId })
    })
    
    if (res.ok) {
      showToast("İstatistikler güncellendi!", "success")
      setTimeout(() => window.location.reload(), 1000)
    } else {
      showToast("Veriler çekilemedi.", "error")
    }
    setLoading(false)
  }

  return (
    <button 
      onClick={handleUpdate} 
      disabled={loading} 
      className="bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 px-4 py-2 rounded-sm text-[10px] font-bold uppercase tracking-widest transition flex items-center justify-center gap-2 disabled:opacity-50"
    >
      {loading ? <Activity size={14} className="animate-pulse" /> : <RefreshCw size={14} className={loading ? "animate-spin" : ""} />}
      {loading ? "SENKRONİZE EDİLİYOR..." : "VERİLERİ GÜNCELLE"}
    </button>
  )
}