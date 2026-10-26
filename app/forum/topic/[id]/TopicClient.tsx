"use client"
import { useState } from "react"
import { createClient } from "@supabase/supabase-js"
import { useToast } from "@/components/Toast"
import Link from "next/link"
import { ArrowLeft, Send, MessageSquare, ShieldAlert } from "lucide-react"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export default function TopicClient({ topic, replies: initialReplies, currentUser }: any) {
  const [replies, setReplies] = useState(initialReplies)
  const [content, setContent] = useState("")
  const [loading, setLoading] = useState(false)
  const { showToast } = useToast()

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'text-red-400';
      case 'moderator': return 'text-purple-400';
      case 'vip': return 'text-yellow-400';
      default: return 'text-cyan-400';
    }
  }

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return
    
    setLoading(true)
    const tempId = Date.now()
    
    // Optimistic UI
    const newReply = {
      id: tempId,
      content,
      created_at: new Date().toISOString(),
      profiles: {
        display_name: currentUser.display_name,
        avatar_url: currentUser.avatar_url,
        role: currentUser.role
      }
    }
    setReplies((prev: any) => [...prev, newReply])
    setContent("")

    const { error } = await supabase.from("forum_replies").insert({
      topic_id: topic.id,
      user_id: currentUser.id,
      content
    })

    if (error) {
      showToast("Yanıt gönderilemedi.", "error")
      setReplies(initialReplies) // Hata olursa geri al
    }
    setLoading(false)
  }

  return (
    <div>
      <Link href={`/forum/${topic.category_id}`} className="text-zinc-400 hover:text-white text-xs flex items-center gap-2 mb-6 uppercase tracking-widest transition">
        <ArrowLeft size={16}/> Konulara Dön
      </Link>

      {/* ANA KONU */}
      <div className="hud-panel p-6 sm:p-8 rounded-md border border-cyan-500/20 mb-6">
        <h1 className="text-2xl font-black text-white mb-4">{topic.title}</h1>
        
        <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
          <img src={topic.profiles?.avatar_url} className="w-10 h-10 rounded-md border border-white/10" />
          <div>
            <div className={`text-sm font-bold uppercase tracking-wider ${getRoleColor(topic.profiles?.role)}`}>{topic.profiles?.display_name}</div>
            <div className="text-[10px] text-zinc-500">{new Date(topic.created_at).toLocaleString('tr-TR')}</div>
          </div>
        </div>

        <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">{topic.content}</p>
      </div>

      {/* YANITLAR */}
      <div className="space-y-4 mb-8">
        <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
          <MessageSquare size={16}/> {replies.length} YANIT
        </h3>
        
        {replies.map((reply: any) => (
          <div key={reply.id} className="hud-panel p-5 rounded-md border border-white/5 ml-4 sm:ml-8 relative">
            <div className="absolute left-0 top-6 bottom-6 w-0.5 bg-zinc-800 -ml-4 sm:-ml-8"></div>
            <div className="flex items-center gap-3 mb-3">
              <img src={reply.profiles?.avatar_url} className="w-8 h-8 rounded-md border border-white/10" />
              <div>
                <div className={`text-xs font-bold uppercase tracking-wider ${getRoleColor(reply.profiles?.role)}`}>{reply.profiles?.display_name}</div>
                <div className="text-[9px] text-zinc-500">{new Date(reply.created_at).toLocaleString('tr-TR')}</div>
              </div>
            </div>
            <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">{reply.content}</p>
          </div>
        ))}
      </div>

      {/* YANIT YAZMA ALANI */}
      <form onSubmit={handleReply} className="hud-panel p-4 rounded-md border border-white/10">
        <textarea
          value={content} onChange={e => setContent(e.target.value)}
          placeholder="Yanıtını buraya yaz..."
          className="w-full bg-black/50 border border-white/10 rounded-sm px-4 py-3 text-white focus:outline-none focus:border-cyan-500 min-h-[100px] resize-none mb-3"
        />
        <div className="flex justify-end">
          <button type="submit" disabled={loading || !content.trim()} className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white px-6 py-2.5 rounded-sm text-xs font-black uppercase tracking-widest transition flex items-center gap-2">
            <Send size={16}/> GÖNDER
          </button>
        </div>
      </form>
    </div>
  )
}