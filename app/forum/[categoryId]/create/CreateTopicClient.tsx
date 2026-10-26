"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@supabase/supabase-js"
import { useToast } from "@/components/Toast"
import { Send } from "lucide-react"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export default function CreateTopicClient({ categoryId }: { categoryId: string }) {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { showToast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) return showToast("Başlık ve içerik boş olamaz.", "error")
    
    setLoading(true)
    
    // Kullanıcıyı /api/me üzerinden alıyoruz
    const meRes = await fetch("/api/me")
    const meData = await meRes.json()
    if (!meData.profile) return showToast("Oturum bulunamadı.", "error")

    const { error } = await supabase.from("forum_topics").insert({
      category_id: categoryId,
      user_id: meData.profile.id,
      title,
      content
    })

    if (error) {
      showToast("Konu oluşturulamadı.", "error")
      setLoading(false)
    } else {
      showToast("Konu başarıyla açıldı!", "success")
      router.push(`/forum/${categoryId}`)
    }
  }

  return (
    <div className="hud-panel p-8 rounded-md border border-white/10 shadow-2xl">
      <h1 className="text-2xl font-black text-white uppercase tracking-widest mb-6">Yeni Konu Aç</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest block mb-2">Konu Başlığı</label>
          <input 
            type="text" value={title} onChange={e => setTitle(e.target.value)}
            placeholder="Örn: Mirage A Site Smoke Taktikleri"
            className="w-full bg-black/50 border border-white/10 rounded-sm px-4 py-3 text-white focus:outline-none focus:border-cyan-500 font-bold" 
          />
        </div>
        <div>
          <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest block mb-2">İçerik</label>
          <textarea 
            value={content} onChange={e => setContent(e.target.value)}
            placeholder="Konu hakkında detaylı bilgi ver..."
            className="w-full bg-black/50 border border-white/10 rounded-sm px-4 py-3 text-white focus:outline-none focus:border-cyan-500 min-h-[150px] resize-none" 
          />
        </div>
        <button 
          type="submit" disabled={loading}
          className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white py-4 rounded-sm text-sm font-black uppercase tracking-widest transition shadow-[0_0_20px_rgba(6,182,212,0.3)] flex items-center justify-center gap-2"
        >
          <Send size={18}/> KONUYU YAYINLA
        </button>
      </form>
    </div>
  )
}