"use client"
import { useState, useEffect } from "react"
import { createClient } from "@supabase/supabase-js"
import { BACKGROUNDS } from "@/lib/backgrounds"
import { useToast } from "@/components/Toast"
import { Paintbrush, Check } from "lucide-react"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export default function CustomizeProfile({ profile }: { profile: any }) {
  const [inventory, setInventory] = useState<any[]>([])
  const [selectedShowcase, setSelectedShowcase] = useState<string[]>(profile.showcase_items || [])
  const [isLoading, setIsLoading] = useState(false)
  const { showToast } = useToast()

  useEffect(() => {
    supabase.from("inventories").select("*").eq("user_id", profile.id).eq("is_locked", false).then(({ data }) => {
      if (data) setInventory(data)
    })
  }, [profile.id])

  const buyBackground = async (bgId: string, price: number) => {
    if (profile.balance < price) return showToast("Yetersiz bakiye.", "error")
    setIsLoading(true)
    const res = await fetch("/api/profile/customize", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ background_id: bgId })
    })
    if (res.ok) {
      showToast("Arka plan satın alındı ve uygulandı!", "success")
      setTimeout(() => window.location.reload(), 1000) // Sayfayı yenile
    } else {
      const d = await res.json()
      showToast(d.error, "error")
    }
    setIsLoading(false)
  }

  const toggleShowcase = (itemId: string) => {
    if (selectedShowcase.includes(itemId)) {
      setSelectedShowcase(prev => prev.filter(id => id !== itemId))
    } else {
      if (selectedShowcase.length >= 3) return showToast("En fazla 3 eşya sergileyebilirsin.", "error")
      setSelectedShowcase(prev => [...prev, itemId])
    }
  }

  const saveShowcase = async () => {
    setIsLoading(true)
    const res = await fetch("/api/profile/customize", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ showcase_items: selectedShowcase })
    })
    if (res.ok) {
      showToast("Vitrin başarıyla güncellendi!", "success")
      setTimeout(() => window.location.reload(), 1000) // Sayfayı yenile
    } else {
      showToast("Vitrin güncellenemedi.", "error")
    }
    setIsLoading(false)
  }

  return (
    <div className="mt-6 border-t border-white/10 pt-6">
      <h3 className="text-sm font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
        <Paintbrush className="text-purple-500" size={20} /> Profili Kişiselleştir
      </h3>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ARKA PLAN MAĞAZASI */}
        <div className="bg-black/40 border border-white/5 p-4 rounded-lg">
          <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3">Arka Planlar</h4>
          <div className="grid grid-cols-2 gap-2">
            {BACKGROUNDS.map(bg => (
              <div key={bg.id} className="relative group rounded-md overflow-hidden border border-white/10 cursor-pointer" onClick={() => !isLoading && buyBackground(bg.id, bg.price)}>
                <img src={bg.url} alt={bg.name} className="w-full h-20 object-cover group-hover:scale-110 transition duration-500" />
                <div className="absolute inset-0 bg-black/60 group-hover:bg-black/40 transition flex flex-col items-center justify-center">
                  <span className="text-xs font-bold text-white">{bg.name}</span>
                  <span className="text-[10px] text-green-400 font-black">${bg.price}</span>
                </div>
                {profile.background_url === bg.url && (
                  <div className="absolute top-1 right-1 bg-green-500 rounded-full p-1"><Check size={12} className="text-white"/></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* VİTRİN SEÇİMİ */}
        <div className="bg-black/40 border border-white/5 p-4 rounded-lg flex flex-col">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Eşya Vitrini (Maks 3)</h4>
            <span className="text-[10px] text-cyan-400 font-bold">{selectedShowcase.length}/3 Seçildi</span>
          </div>
          
          <div className="grid grid-cols-4 gap-2 overflow-y-auto custom-scrollbar flex-1 max-h-48 mb-3">
            {inventory.map(item => (
              <div key={item.id} onClick={() => toggleShowcase(item.id)} className={`p-1.5 border rounded-sm cursor-pointer transition ${selectedShowcase.includes(item.id) ? 'border-cyan-500 bg-cyan-500/10' : 'border-white/10 hover:border-white/30'}`}>
                <img src={item.skin_image} className="w-full h-10 object-contain" />
              </div>
            ))}
            {inventory.length === 0 && <div className="col-span-full text-center text-xs text-zinc-500 py-4">Envanterde eşya yok.</div>}
          </div>

          <button onClick={saveShowcase} disabled={isLoading} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white py-2 rounded-md text-xs font-bold uppercase tracking-widest transition shadow-[0_0_15px_rgba(6,182,212,0.2)]">
            Vitrini Kaydet
          </button>
        </div>
      </div>
    </div>
  )
}