"use client"
import { useEffect, useState, useRef } from "react"
import { createClient } from "@supabase/supabase-js"
import { Send, Search, MessageSquare, Terminal } from "lucide-react"
import { useSearchParams } from "next/navigation"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export default function DMClient({ currentUser }: { currentUser: any }) {
  const searchParams = useSearchParams()
  const initialUserId = searchParams.get("user")

  const [chatPartners, setChatPartners] = useState<any[]>([])
  const [allUsers, setAllUsers] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  
  const [activeUser, setActiveUser] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState("")
  
  const bottomRef = useRef<HTMLDivElement>(null)

  const fetchChatList = async () => {
    const res = await fetch("/api/dm/list")
    if (res.ok) setChatPartners(await res.json())
    const { data } = await supabase.from("profiles").select("id, display_name, avatar_url, role").neq("id", currentUser.id)
    if (data) setAllUsers(data)
  }

  useEffect(() => { fetchChatList() }, [])

  useEffect(() => {
    if (initialUserId && allUsers.length > 0 && !activeUser) {
      const user = allUsers.find(u => u.id === initialUserId)
      if (user) setActiveUser(user)
    }
  }, [initialUserId, allUsers])

  useEffect(() => {
    if (!activeUser) return

    const fetchMessages = async () => {
      const res = await fetch(`/api/dm/${activeUser.id}`)
      if (res.ok) {
        const data = await res.json()
        setMessages(data)
        fetchChatList() 
      }
    }
    fetchMessages()

    const channel = supabase.channel(`dm-${activeUser.id}`).on("postgres_changes", { event: "INSERT", schema: "public", table: "direct_messages" }, async (payload) => {
          const msg = payload.new
          if ((msg.sender_id === currentUser.id && msg.receiver_id === activeUser.id) || (msg.sender_id === activeUser.id && msg.receiver_id === currentUser.id)) {
            setMessages((prev) => {
              if (prev.some(m => m.id === msg.id)) return prev;
              return [...prev, msg]
            })
            if (msg.receiver_id === currentUser.id) fetch(`/api/dm/${msg.sender_id}`) 
          }
      }).subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [activeUser, currentUser.id])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages])

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !activeUser) return

    const content = newMessage
    setNewMessage("")

    const optimisticMsg = {
      id: Date.now(), sender_id: currentUser.id, receiver_id: activeUser.id, content,
      created_at: new Date().toISOString(), is_read: false
    }
    setMessages(prev => [...prev, optimisticMsg])

    await fetch(`/api/dm/${activeUser.id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content }) })
  }

  const filteredList = searchQuery 
    ? allUsers.filter(u => u.display_name.toLowerCase().includes(searchQuery.toLowerCase()))
    : chatPartners

  return (
    <div className="flex-1 flex overflow-hidden max-w-[1400px] w-full mx-auto relative z-10 p-4 gap-4 h-[calc(100vh-72px)]">
      
      <div className="w-64 bg-[#0a0f1c]/80 border border-white/5 rounded-md flex flex-col hidden sm:flex backdrop-blur-xl">
        <div className="p-4 border-b border-white/5">
          <h2 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-3 flex items-center gap-2"><Terminal size={12}/> GÜVENLİ HATLAR</h2>
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-2.5 text-zinc-500" />
            <input 
              type="text" placeholder="Kişi ara..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/50 border border-white/10 text-xs font-bold text-white rounded-sm pl-8 pr-2 py-2 focus:outline-none focus:border-red-500/50 tracking-wider placeholder-zinc-600" 
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          {filteredList.map(user => (
            <button key={user.id} onClick={() => { setActiveUser(user); setSearchQuery(""); }}
              className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-sm transition-colors ${activeUser?.id === user.id ? 'bg-white/10 text-white shadow-[inset_3px_0_0_0_#ef4444]' : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'}`}>
              <div className="relative">
                <img src={user.avatar_url} alt="avatar" className="w-8 h-8 rounded-sm border border-white/10 object-cover grayscale-[30%]" />
                {user.unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm border border-[#0a0f1c] shadow-[0_0_10px_rgba(239,68,68,0.5)]">
                    {user.unreadCount}
                  </span>
                )}
              </div>
              <div className="text-left flex-1 min-w-0">
                <div className="text-[13px] font-bold truncate leading-tight uppercase tracking-wide">{user.display_name}</div>
                {user.lastMessage && !searchQuery && <div className="text-[10px] text-zinc-500 truncate mt-0.5">{user.lastMessage}</div>}
              </div>
            </button>
          ))}
          {filteredList.length === 0 && <div className="text-center text-[10px] text-zinc-600 uppercase tracking-widest mt-4">Sinyal Yok.</div>}
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-[#0a0f1c]/60 border border-white/5 rounded-md relative backdrop-blur-xl">
        {activeUser ? (
          <>
            <div className="h-14 border-b border-white/5 flex items-center px-4 gap-3 bg-black/40">
              <img src={activeUser.avatar_url} alt="avatar" className="w-8 h-8 rounded-sm border border-white/10 grayscale-[30%]" />
              <div>
                <span className="font-bold text-sm text-white uppercase tracking-widest">{activeUser.display_name}</span>
                <div className="text-[9px] text-green-500 font-bold tracking-widest flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div> BAĞLANTI AKTİF</div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {messages.map((msg, i) => {
                const isMe = msg.sender_id === currentUser.id
                return (
                  <div key={msg.id || i} className={`flex flex-col max-w-[70%] ${isMe ? "ml-auto items-end" : "mr-auto items-start"}`}>
                    <div className={`px-4 py-2.5 rounded-sm text-[13px] tracking-wide ${isMe ? "bg-red-600/20 border border-red-500/30 text-red-100 rounded-tr-none" : "bg-white/5 border border-white/10 text-zinc-300 rounded-tl-none"}`}>
                      {msg.content}
                    </div>
                    <span className="text-[9px] text-zinc-600 mt-1 px-1 font-mono tracking-widest">{new Date(msg.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                )
              })}
              <div ref={bottomRef} />
            </div>

            <div className="p-3 bg-black/40 border-t border-white/5">
              <form onSubmit={sendMessage} className="flex gap-2 bg-[#050811] border border-white/10 rounded-sm p-1.5 focus-within:border-red-500/50 transition-colors">
                <input 
                  type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Mesaj şifrele..." 
                  className="flex-1 bg-transparent text-zinc-200 text-sm px-3 py-1.5 focus:outline-none placeholder-zinc-600 tracking-wide" 
                />
                <button type="submit" className="bg-red-600/20 hover:bg-red-600 border border-red-500/30 text-red-500 hover:text-white p-2 rounded-sm transition-all"><Send size={16} /></button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-600">
            <MessageSquare size={48} className="mb-4 opacity-20" />
            <p className="text-xs uppercase tracking-[0.2em] font-bold">Şifreli hat kurulmayı bekliyor.</p>
          </div>
        )}
      </div>
    </div>
  )
}