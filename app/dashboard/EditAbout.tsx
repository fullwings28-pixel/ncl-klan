"use client"
import { useState } from "react"
import { Save, Loader2 } from "lucide-react"
import { useToast } from "@/components/Toast"

export default function EditAbout({ initialAbout }: { initialAbout: string }) {
  const [about, setAbout] = useState(initialAbout || "")
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const { showToast } = useToast()

  const handleSave = async () => {
    setLoading(true)
    setSaved(false)
    await fetch("/api/profile/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ about_me: about })
    })
    setLoading(false)
    setSaved(true)
    showToast("Profilin güncellendi!", "success")
    setTimeout(() => setSaved(false), 3000) 
  }

  return (
    <div className="mt-6 border-t border-white/5 pt-6">
      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-3 block">OPERATÖR NOTU (HAKKIMDA)</label>
      <textarea
        value={about}
        onChange={(e) => setAbout(e.target.value)}
        placeholder="Kendin hakkında bir şeyler yaz (Favori silahın, oynadığın roller vs.)"
        className="w-full bg-black/40 text-zinc-300 text-sm p-4 rounded-sm border border-white/10 focus:outline-none focus:border-red-500/50 min-h-[100px] resize-none transition-colors"
        maxLength={250}
      />
      <div className="flex justify-between items-center mt-3">
        <span className="text-[10px] text-zinc-600 font-bold tracking-widest">{about.length}/250</span>
        <button 
          onClick={handleSave} 
          disabled={loading}
          className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 px-4 py-2 rounded-sm text-[10px] font-bold uppercase tracking-widest transition-colors"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {saved ? "KAYDEDİLDİ" : "KAYDET"}
        </button>
      </div>
    </div>
  )
}