"use client"
import { useState, useEffect } from "react"
import { createClient } from "@supabase/supabase-js"
import { ArrowRightLeft, Check, ShieldAlert } from "lucide-react"
import { useToast } from "@/components/Toast"
import { useRouter } from "next/navigation"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export default function CreateTradeClient({ currentUser, targetUserId }: { currentUser: any, targetUserId: string }) {
  const [targetUser, setTargetUser] = useState<any>(null)
  const [myItems, setMyItems] = useState<any[]>([])
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const { showToast } = useToast()
  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      const { data: userData } = await supabase.from("profiles").select("*").eq("id", targetUserId).single()
      if (userData) setTargetUser(userData)

      const { data: invData } = await supabase.from("inventories").select("*").eq("user_id", currentUser.id).eq("is_locked", false)
      if (invData) setMyItems(invData)
      
      setLoading(false)
    }
    fetchData()
  }, [currentUser.id, targetUserId])

  const toggleItem = (id: string) => {
    const exists = selectedItems.includes(id)
    if (exists) setSelectedItems(prev => prev.filter(i => i !== id))
    else setSelectedItems(prev => [...prev, id])
  }

  const handleSubmit = async () => {
    if (selectedItems.length === 0) return showToast("En az 1 eşya seçmelisin.", "error")

    const res = await fetch("/api/trades", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ receiver_id: targetUserId, sender_items: selectedItems })
    })

    if (res.ok) {
      showToast("Takas teklifi gönderildi!", "success")
      router.push("/trades")
    } else {
      const data = await res.json()
      showToast(data.error || "İşlem başarısız", "error")
    }
  }

  if (loading) return <div className="text-center py-20 text-zinc-500 animate-pulse uppercase tracking-widest">Yükleniyor...</div>

  return (
    <div className="hud-panel p-8 rounded-md border border-white/10 shadow-2xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-black text-white flex items-center justify-center gap-3 tracking-widest uppercase">
          <ArrowRightLeft className="text-cyan-500" size={28} /> TAKAS TEKLİFİ OLUŞTUR
        </h1>
        <p className="text-zinc-400 mt-2 text-xs uppercase tracking-widest">Karşı tarafa vermek istediğin eşyaları seç.</p>
      </div>

      <div className="flex items-center justify-center gap-6 mb-8 bg-black/40 p-4 rounded-sm border border-white/5">
        <div className="text-center">
          <img src={currentUser.avatar_url} className="w-16 h-16 rounded-sm mx-auto mb-2" />
          <div className="text-sm font-bold text-white uppercase">{currentUser.display_name}</div>
        </div>
        
        <ArrowRightLeft className="text-cyan-500" size={32} />

        <div className="text-center">
          <img src={targetUser?.avatar_url} className="w-16 h-16 rounded-sm mx-auto mb-2" />
          <div className="text-sm font-bold text-white uppercase">{targetUser?.display_name}</div>
        </div>
      </div>

      <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3 border-b border-white/10 pb-2">Envanterinden Seç</h3>
      
      {myItems.length === 0 ? (
        <div className="text-center py-10 text-zinc-600 text-xs">Envanterinde takas edilecek eşya yok.</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 mb-8 max-h-[400px] overflow-y-auto custom-scrollbar p-2">
          {myItems.map(item => (
            <div 
              key={item.id} 
              onClick={() => toggleItem(item.id)}
              className={`p-3 rounded-md border cursor-pointer transition flex flex-col items-center ${selectedItems.includes(item.id) ? 'border-cyan-500 bg-cyan-500/10 shadow-[0_0_15px_rgba(6,182,212,0.2)]' : 'border-white/10 bg-zinc-900/50 hover:border-white/30'}`}
            >
              <img src={item.skin_image} className="w-full h-16 object-contain mb-2" />
              <div className="text-[10px] font-bold text-white truncate w-full text-center">{item.skin_name}</div>
              <div className="text-[10px] font-black text-green-400 mt-1">${Number(item.price).toFixed(2)}</div>
            </div>
          ))}
        </div>
      )}

      <button 
        onClick={handleSubmit}
        disabled={selectedItems.length === 0}
        className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white py-4 rounded-sm text-sm font-black uppercase tracking-widest transition shadow-[0_0_20px_rgba(6,182,212,0.3)] disabled:shadow-none"
      >
        TAKAS TEKLİFİNİ GÖNDER
      </button>
    </div>
  )
}