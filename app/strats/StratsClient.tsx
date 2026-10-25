"use client"
import { useEffect, useState } from "react"
import { Map, Plus, X, Crosshair } from "lucide-react"
import StratCanvas from "@/components/StratCanvas"
import { useToast } from "@/components/Toast"

export default function StratsClient({ currentUser }: { currentUser: any }) {
  const [strats, setStrats] = useState<any[]>([])
  const [showCanvas, setShowCanvas] = useState(false)
  const [title, setTitle] = useState("")
  const [saving, setSaving] = useState(false)
  const { showToast } = useToast()

  const fetchStrats = async () => {
    const res = await fetch("/api/strats")
    if (res.ok) setStrats(await res.json())
  }

  useEffect(() => { fetchStrats() }, [])

  const handleSave = async (base64Image: string, mapName: string) => {
    if (!title.trim()) return showToast("Lütfen taktiğe bir isim verin.", "error")
    setSaving(true)
    
    const res = await fetch("/api/strats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, map_name: mapName, image_data: base64Image })
    })

    if (res.ok) {
      setShowCanvas(false)
      setTitle("")
      fetchStrats()
      showToast("Taktik başarıyla kaydedildi.", "success")
    } else {
      showToast("Taktik kaydedilemedi.", "error")
    }
    setSaving(false)
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4 hud-panel p-6 rounded-md">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3 uppercase tracking-widest">
            <Map className="text-cyan-500" size={28}/> TAKTİK PANOSU
          </h1>
          <p className="text-zinc-500 text-xs mt-2 uppercase tracking-wider font-bold">Klan stratejileri ve çizimler.</p>
        </div>
        <button onClick={() => setShowCanvas(true)} className="bg-cyan-600 hover:bg-cyan-500 text-white px-5 py-2.5 rounded-sm text-xs font-black uppercase tracking-widest flex items-center gap-2 transition shadow-[0_0_15px_rgba(6,182,212,0.3)]">
          <Plus size={16} /> YENİ ÇİZİM
        </button>
      </div>

      {showCanvas && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md overflow-y-auto flex items-center justify-center p-4">
          <div className="hud-panel border border-white/10 rounded-md max-w-4xl w-full p-6 shadow-2xl relative">
            <button onClick={() => setShowCanvas(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-red-500 transition-colors"><X size={24}/></button>
            
            <h2 className="text-xl font-black text-white mb-6 uppercase tracking-widest flex items-center gap-2"><Crosshair size={20} className="text-cyan-500"/> STRATEJİ OLUŞTUR</h2>
            <div className="flex gap-4 mb-6">
              <input 
                type="text" placeholder="Taktik Adı (örn: Mirage A Smoke)" value={title} onChange={(e) => setTitle(e.target.value)}
                className="flex-1 bg-black/50 border border-white/10 text-white rounded-sm px-4 py-3 focus:outline-none focus:border-cyan-500 text-sm tracking-wide" 
              />
            </div>

            {saving ? (
              <div className="text-center py-20 text-cyan-500 animate-pulse font-black tracking-widest uppercase text-sm">Kaydediliyor...</div>
            ) : (
              <StratCanvas onSave={handleSave} />
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {strats.map(strat => (
          <div key={strat.id} className="hud-panel rounded-md overflow-hidden border border-white/5 group">
            <div className="relative aspect-square bg-black/60 p-2">
              <img src={strat.image_data} alt={strat.title} className="w-full h-full object-contain rounded-sm border border-white/5" />
            </div>
            <div className="p-4 flex items-center justify-between bg-black/40 border-t border-white/5">
              <div>
                <h3 className="font-bold text-white text-sm uppercase tracking-wide truncate">{strat.title}</h3>
                <p className="text-[10px] text-cyan-500 font-bold uppercase tracking-widest mt-1">{strat.map_name}</p>
              </div>
              <img src={strat.profiles?.avatar_url} alt="user" className="w-8 h-8 rounded-sm border border-white/20 grayscale-[30%] group-hover:grayscale-0 transition-all" title={strat.profiles?.display_name} />
            </div>
          </div>
        ))}
        {strats.length === 0 && (
          <div className="col-span-full text-center py-12 text-zinc-600 hud-panel rounded-md uppercase tracking-widest text-xs font-bold border-dashed">Henüz taktik yok. İlk çizimi sen yap!</div>
        )}
      </div>
    </div>
  )
}