"use client"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabaseClient"
import { X, Users, Plus, Trash2, ShieldAlert } from "lucide-react"

export default function LFGModal({ currentUser, onClose }: { currentUser: any, onClose: () => void }) {
  const [posts, setPosts] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  
  const [gameMode, setGameMode] = useState("Premier")
  const [playersNeeded, setPlayersNeeded] = useState(1)
  const [note, setNote] = useState("")

  const fetchPosts = async () => {
    const { data } = await supabase.from("lfg_posts").select("*, profiles(display_name, avatar_url, premier_rating, steam_profile_url)").order("created_at", { ascending: false })
    if (data) setPosts(data)
  }

  useEffect(() => {
    fetchPosts()
    const channel = supabase.channel("realtime-lfg").on("postgres_changes", { event: "*", schema: "public", table: "lfg_posts" }, () => fetchPosts()).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    await fetch("/api/lfg", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: currentUser.id, game_mode: gameMode, players_needed: playersNeeded, note })
    })
    setShowForm(false); setNote(""); fetchPosts()
  }

  const handleDelete = async (id: number) => {
    await fetch(`/api/lfg?id=${id}&userId=${currentUser.id}`, { method: "DELETE" })
    fetchPosts()
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" onClick={onClose}>
      <div className="w-full max-w-2xl hud-panel rounded-md overflow-hidden relative shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col max-h-[85vh] border border-white/10" onClick={(e) => e.stopPropagation()}>
        
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-black/40">
          <div>
            <h2 className="text-2xl font-black text-white flex items-center gap-2 uppercase tracking-widest"><Users className="text-cyan-500" size={24}/> TAKIM BUL (LFG)</h2>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-1">Eksik oyuncunu tamamla.</p>
          </div>
          <button onClick={onClose} className="p-2 bg-white/5 hover:bg-red-500/20 rounded-sm text-zinc-400 hover:text-red-500 transition-colors"><X size={20} /></button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-[#050811]">
          {!showForm ? (
            <button onClick={() => setShowForm(true)} className="w-full bg-cyan-600/20 hover:bg-cyan-600 border border-cyan-500/30 text-cyan-400 hover:text-white py-3 rounded-sm font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 mb-6 transition shadow-lg">
              <Plus size={16} /> YENİ İLAN OLUŞTUR
            </button>
          ) : (
            <form onSubmit={handleCreate} className="bg-black/50 p-4 rounded-sm border border-cyan-500/30 mb-6 space-y-4 shadow-[0_0_20px_rgba(6,182,212,0.1)]">
              <div className="flex flex-col sm:flex-row gap-4">
                <select value={gameMode} onChange={e => setGameMode(e.target.value)} className="flex-1 bg-[#0a0f1c] border border-white/10 text-white text-xs font-bold uppercase tracking-wider rounded-sm px-4 py-2.5 focus:outline-none focus:border-cyan-500">
                  <option value="Premier">Premier</option>
                  <option value="Faceit">FACEIT</option>
                  <option value="Normal">Normal</option>
                  <option value="Wingman">Wingman</option>
                </select>
                <select value={playersNeeded} onChange={e => setPlayersNeeded(Number(e.target.value))} className="flex-1 bg-[#0a0f1c] border border-white/10 text-white text-xs font-bold uppercase tracking-wider rounded-sm px-4 py-2.5 focus:outline-none focus:border-cyan-500">
                  <option value={1}>1 Kişi Aranıyor</option>
                  <option value={2}>2 Kişi Aranıyor</option>
                  <option value={3}>3 Kişi Aranıyor</option>
                  <option value={4}>4 Kişi Aranıyor</option>
                </select>
              </div>
              <input type="text" placeholder="Not (örn: Mikrofon zorunlu, ciddi oyun)" value={note} onChange={e => setNote(e.target.value)} className="w-full bg-[#0a0f1c] border border-white/10 text-white text-xs rounded-sm px-4 py-2.5 focus:outline-none focus:border-cyan-500 tracking-wide" />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-[10px] font-bold text-zinc-400 hover:text-white uppercase tracking-widest">İptal</button>
                <button type="submit" className="bg-cyan-600 hover:bg-cyan-500 text-white px-5 py-2 rounded-sm text-[10px] font-black uppercase tracking-widest transition">YAYINLA</button>
              </div>
            </form>
          )}

          <div className="space-y-3">
            {posts.map(post => {
              const isMe = post.user_id === currentUser.id
              return (
                <div key={post.id} className={`p-4 rounded-sm border flex flex-col sm:flex-row justify-between items-center gap-4 ${isMe ? 'bg-cyan-500/5 border-cyan-500/30' : 'bg-[#0a0f1c]/80 border-white/5'}`}>
                  <div className="flex items-center gap-3 w-full">
                    <img src={post.profiles?.avatar_url} alt="avatar" className="w-10 h-10 rounded-sm border border-white/10 grayscale-[30%]" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm uppercase tracking-wider">{post.profiles?.display_name}</span>
                        {isMe && <span className="text-[8px] bg-cyan-600 text-white px-1.5 py-0.5 rounded-sm font-bold uppercase tracking-widest">SEN</span>}
                      </div>
                      <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mt-1">
                        <span className="text-cyan-400">{post.game_mode}</span> • {post.players_needed} KİŞİ ARIYOR
                        {post.profiles?.premier_rating && <span className="text-yellow-500 ml-1">• {post.profiles.premier_rating.toLocaleString('tr-TR')} P</span>}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                    {post.note && <span className="text-[10px] text-zinc-500 italic hidden md:block">"{post.note}"</span>}
                    {isMe ? (
                      <button onClick={() => handleDelete(post.id)} className="bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white px-3 py-1.5 rounded-sm text-[10px] font-bold uppercase tracking-widest transition flex items-center gap-1 border border-red-500/20"><Trash2 size={12} /> SİL</button>
                    ) : (
                      <a href={post.profiles?.steam_profile_url} target="_blank" className="bg-white/5 hover:bg-white/10 border border-white/10 text-white px-4 py-1.5 rounded-sm text-[10px] font-bold uppercase tracking-widest transition">STEAM ↗</a>
                    )}
                  </div>
                </div>
              )
            })}
            {posts.length === 0 && (
              <div className="text-center py-12 text-zinc-600 flex flex-col items-center gap-3">
                <ShieldAlert size={40} className="opacity-20" />
                <p className="text-[10px] font-bold uppercase tracking-widest">Aktif ilan yok. İlk ilanı sen ver!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}