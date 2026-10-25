"use client"

import { useEffect, useState, useRef } from "react"
import { supabase } from "@/lib/supabaseClient"
import { useRouter } from "next/navigation"
import Navbar from "@/components/Navbar"
import UserProfileModal from "@/components/UserProfileModal"
import LFGModal from "@/components/LFGModal"
import ContextMenu from "@/components/ContextMenu"
import { Send, ShieldAlert, Hash, Users, Flag, Terminal } from "lucide-react"
import { useToast } from "@/components/Toast"
import ConfirmModal from "@/components/ConfirmModal"
import { usePresence } from "@/hooks/usePresence"

type Message = {
  id: number
  content: string
  created_at: string
  user_id: string
  room_id: string
  profiles: { display_name: string; avatar_url: string; role: string }
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [showLFG, setShowLFG] = useState(false)
  
  const [rooms, setRooms] = useState<any[]>([])
  const [activeRoomId, setActiveRoomId] = useState<string>("")
  const [reactions, setReactions] = useState<any[]>([])
  
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, messageId: 0 })
  const [reportModal, setReportModal] = useState({ isOpen: false, messageId: 0, userId: "", reason: "" })
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, msg: Message | null }>({ x: 0, y: 0, msg: null })

  const router = useRouter()
  const bottomRef = useRef<HTMLDivElement>(null)
  const { showToast } = useToast()

  const onlineUsers = usePresence(currentUser)

  const fetchReactions = async () => {
    const { data } = await supabase.from("message_reactions").select("*")
    if (data) setReactions(data)
  }

  useEffect(() => {
    fetch("/api/rooms").then(res => res.json()).then(data => {
      setRooms(data)
      if (data.length > 0) setActiveRoomId(data[0].id)
    })
  }, [])

  useEffect(() => {
    fetch("/api/me").then((res) => res.json()).then((data) => {
      if (data.profile) setCurrentUser(data.profile)
      else router.push("/")
    })
  }, [router])

  useEffect(() => {
    if (!activeRoomId) return
    setMessages([]) 

    const fetchMessages = async () => {
      const { data } = await supabase.from("messages").select("*, profiles(display_name, avatar_url, role)").eq("room_id", activeRoomId).order("created_at", { ascending: true }).limit(100)
      if (data) setMessages(data as any)
    }
    fetchMessages()
    fetchReactions()

    const channel = supabase.channel(`realtime-chat-${activeRoomId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `room_id=eq.${activeRoomId}` }, async (payload) => {
          const { data: profile } = await supabase.from("profiles").select("display_name, avatar_url, role").eq("id", payload.new.user_id).single()
          const newMsg = { id: payload.new.id, content: payload.new.content, created_at: payload.new.created_at, user_id: payload.new.user_id, room_id: payload.new.room_id, profiles: profile }
          setMessages((prev) => {
            if (prev.some(m => m.id === payload.new.id)) return prev;
            const optIndex = prev.findIndex(m => m.user_id === payload.new.user_id && m.content === payload.new.content && m.id > 1000000000000);
            if (optIndex !== -1) {
                const newMsgs = [...prev];
                newMsgs[optIndex] = { ...newMsgs[optIndex], id: payload.new.id };
                return newMsgs;
            }
            return [...prev, newMsg as any]
          })
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "messages" }, (payload) => {
          setMessages((prev) => prev.filter((msg) => msg.id !== payload.old.id))
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "message_reactions" }, () => fetchReactions())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [activeRoomId])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages])

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !currentUser || !activeRoomId) return
    if (currentUser.is_banned) return showToast("Sohbetten banlandığınız için mesaj gönderemezsiniz.", "error")
    if (currentUser.is_muted) return showToast("Sohbetten susturuldunuz (Mute).", "error")

    const content = newMessage
    setNewMessage("")
    const tempId = Date.now()
    const optimisticMsg: Message = {
      id: tempId, content, created_at: new Date().toISOString(), user_id: currentUser.id, room_id: activeRoomId,
      profiles: { display_name: currentUser.display_name, avatar_url: currentUser.avatar_url, role: currentUser.role }
    }
    setMessages((prev) => [...prev, optimisticMsg])

    await fetch("/api/chat/send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: currentUser.id, roomId: activeRoomId, content }) })
  }

  const reactToMessage = async (messageId: number, emoji: string) => {
    if (!currentUser) return
    const existingReaction = reactions.find(r => r.message_id === messageId && r.emoji === emoji && r.user_id === currentUser.id)
    if (existingReaction) setReactions(prev => prev.filter(r => r.id !== existingReaction.id))
    else setReactions(prev => [...prev, { id: Math.random(), message_id: messageId, user_id: currentUser.id, emoji }])
    
    await fetch("/api/chat/react", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messageId, userId: currentUser.id, emoji }) })
  }

  const openDeleteModal = (id: number) => setDeleteModal({ isOpen: true, messageId: id })
  const confirmDelete = async () => {
    await fetch("/api/admin/delete-message", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messageId: deleteModal.messageId }) })
    showToast("Mesaj silindi.", "success")
    setDeleteModal({ isOpen: false, messageId: 0 })
  }

  const submitReport = async () => {
    if (!reportModal.reason.trim()) return showToast("Lütfen bir şikayet sebebi yazın.", "error")
    const res = await fetch("/api/reports", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reported_user_id: reportModal.userId, message_id: reportModal.messageId, reason: reportModal.reason }) })
    if (res.ok) {
      showToast("Şikayetiniz yetkililere iletildi.", "success")
      setReportModal({ isOpen: false, messageId: 0, userId: "", reason: "" })
    } else showToast("Şikayet iletilemedi.", "error")
  }

  const handleContextMenu = (e: React.MouseEvent, msg: Message) => {
    e.preventDefault()
    setContextMenu({ x: e.pageX, y: e.pageY, msg })
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'text-red-400';
      case 'moderator': return 'text-purple-400';
      case 'vip': return 'text-yellow-400';
      case 'retired': return 'text-zinc-500';
      default: return 'text-cyan-400';
    }
  }

  const formatMessage = (text: string) => {
    const parts = text.split(/(@[\wçÇğĞıİöÖşŞüÜ]+)/g);
    return parts.map((part, i) => {
      if (part.match(/^@[\wçÇğĞıİöÖşŞüÜ]+$/)) {
        return <span key={i} className="bg-cyan-500/20 text-cyan-400 font-bold px-1 rounded-sm border border-cyan-500/30">{part}</span>
      }
      return <span key={i}>{part}</span>
    });
  }

  if (!currentUser) return <div className="p-8 text-white min-h-screen bg-[#050811] flex items-center justify-center text-sm"><ShieldAlert className="animate-pulse mr-2"/> BAĞLANIYOR...</div>

  return (
    <main className="h-screen bg-[#050811] text-white flex flex-col relative overflow-hidden">
      <ConfirmModal isOpen={deleteModal.isOpen} title="Mesajı Sil" message="Bu mesajı silmek istediğinize emin misiniz?" onConfirm={confirmDelete} onCancel={() => setDeleteModal({ isOpen: false, messageId: 0 })} />

      {contextMenu.msg && (
        <ContextMenu x={contextMenu.x} y={contextMenu.y} isMe={contextMenu.msg.user_id === currentUser.id} isAdmin={currentUser.role === 'admin'}
          onClose={() => setContextMenu({ ...contextMenu, msg: null })}
          onCopy={() => { navigator.clipboard.writeText(contextMenu.msg!.content); showToast("Mesaj kopyalandı!", "success") }}
          onReport={() => setReportModal({ isOpen: true, messageId: contextMenu.msg!.id, userId: contextMenu.msg!.user_id, reason: "" })}
          onDelete={() => openDeleteModal(contextMenu.msg!.id)}
        />
      )}

      {reportModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setReportModal({ ...reportModal, isOpen: false })}>
          <div className="hud-panel p-6 rounded-sm max-w-sm w-full border border-yellow-500/30 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2 tracking-wider"><Flag className="text-yellow-500" size={20}/> MESAJI ŞİKAYET ET</h3>
            <textarea value={reportModal.reason} onChange={(e) => setReportModal({ ...reportModal, reason: e.target.value })} placeholder="Şikayet sebebi..." className="w-full bg-black/50 border border-white/10 text-white rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-yellow-500/50 min-h-[80px] mb-4" />
            <div className="flex gap-2">
              <button onClick={() => setReportModal({ ...reportModal, isOpen: false })} className="flex-1 bg-white/5 hover:bg-white/10 py-2 rounded-sm text-sm font-bold text-white transition">İPTAL</button>
              <button onClick={submitReport} className="flex-1 bg-yellow-600/20 hover:bg-yellow-600 border border-yellow-500/30 text-yellow-500 hover:text-white py-2 rounded-sm text-sm font-bold transition">GÖNDER</button>
            </div>
          </div>
        </div>
      )}

      <Navbar profile={currentUser} />

      <div className="flex-1 flex overflow-hidden max-w-[1600px] w-full mx-auto relative z-10 p-4 gap-4">
        
        {/* KANALLAR (SOL) */}
        <div className="w-56 bg-[#0a0f1c]/80 border border-white/5 rounded-md flex flex-col hidden lg:flex backdrop-blur-xl shrink-0">
          <div className="p-4 border-b border-white/5">
            <h2 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-3 flex items-center gap-2"><Terminal size={12}/> KANALLAR</h2>
            <button onClick={() => setShowLFG(true)} className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-sm text-xs font-bold bg-red-600 hover:bg-red-500 text-white transition-colors uppercase tracking-wider shadow-[0_0_15px_rgba(239,68,68,0.3)]">
              <Users size={14} /> TAKIM BUL
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
            {rooms.map(room => (
              <button key={room.id} onClick={() => setActiveRoomId(room.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-sm text-[13px] transition-colors uppercase font-bold tracking-wide ${activeRoomId === room.id ? 'bg-white/10 text-white shadow-[inset_3px_0_0_0_#ef4444]' : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'}`}>
                <Hash size={14} className={activeRoomId === room.id ? 'text-red-500' : 'text-zinc-600'} /> {room.name}
              </button>
            ))}
          </div>
        </div>

        {/* SOHBET (ORTA) */}
        <div className="flex-1 flex flex-col bg-[#0a0f1c]/60 border border-white/5 rounded-md relative backdrop-blur-xl min-w-0">
          <div className="flex-1 overflow-y-auto p-4 sm:px-6 space-y-2 custom-scrollbar">
            {messages.map((msg) => {
              const isMe = msg.user_id === currentUser.id
              const isTemp = msg.id > 1000000000000 
              return (
                <div key={msg.id} onContextMenu={(e) => !isTemp && handleContextMenu(e, msg)} className="flex gap-3 p-2 -mx-2 hover:bg-white/5 rounded-sm group transition-colors border border-transparent hover:border-white/5">
                  <img src={msg.profiles?.avatar_url || ""} alt="avatar" onClick={() => setSelectedUserId(msg.user_id)} className="w-9 h-9 rounded-sm bg-zinc-800 border border-white/10 mt-0.5 flex-shrink-0 cursor-pointer hover:border-red-500 transition-colors grayscale-[30%] hover:grayscale-0" />
                  <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-0.5">
                      <span onClick={() => setSelectedUserId(msg.user_id)} className={`text-[13px] font-bold cursor-pointer hover:underline uppercase tracking-wide ${getRoleColor(msg.profiles?.role)}`}>{msg.profiles?.display_name}</span>
                      {msg.profiles?.role !== 'member' && <span className={`text-[9px] px-1.5 py-0.5 rounded-sm border border-current uppercase tracking-widest ${getRoleColor(msg.profiles?.role)}`}>{msg.profiles?.role}</span>}
                      <span className="text-[10px] text-zinc-600 font-medium">{new Date(msg.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className={`text-[14px] leading-relaxed break-words whitespace-pre-wrap flex-1 ${isMe ? 'text-zinc-200' : 'text-zinc-300'}`}>
                      {formatMessage(msg.content)}
                    </div>
                    <div className="flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {['🔥', '😂', '👍', '💀'].map(emoji => {
                        const count = reactions.filter(r => r.message_id === msg.id && r.emoji === emoji).length;
                        const hasReacted = reactions.some(r => r.message_id === msg.id && r.emoji === emoji && r.user_id === currentUser.id);
                        return (
                          <button key={emoji} onClick={() => reactToMessage(msg.id, emoji)}
                            className={`text-[11px] px-1.5 py-0.5 rounded-sm border flex items-center gap-1 transition ${hasReacted ? 'bg-red-500/20 border-red-500/50 text-red-300' : count > 0 ? 'bg-white/5 border-white/10 text-zinc-300' : 'bg-transparent border-transparent hover:bg-white/10 text-zinc-500'}`}>
                            {emoji} {count > 0 && count}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )
            })}
            <div ref={bottomRef} className="h-4" />
          </div>

          <div className="p-4 bg-black/40 border-t border-white/5">
            {currentUser.is_banned ? (
              <div className="text-center text-red-500 text-sm font-bold py-2 flex items-center justify-center gap-2 uppercase tracking-widest"><ShieldAlert size={16}/> SOHBETTEN BANLANDINIZ</div>
            ) : currentUser.is_muted ? (
              <div className="text-center text-yellow-500 text-sm font-bold py-2 flex items-center justify-center gap-2 uppercase tracking-widest"><ShieldAlert size={16}/> SUSTURULDUNUZ</div>
            ) : (
              <form onSubmit={sendMessage} className="flex gap-2 bg-[#050811] border border-white/10 rounded-sm p-1.5 focus-within:border-red-500/50 transition-colors">
                <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Mesaj ilet..." className="flex-1 bg-transparent text-zinc-200 text-sm px-3 py-1.5 focus:outline-none placeholder-zinc-600" />
                <button type="submit" className="bg-red-600/20 hover:bg-red-600 border border-red-500/30 text-red-500 hover:text-white p-2 rounded-sm transition-all"><Send size={16} /></button>
              </form>
            )}
          </div>
        </div>

        {/* ÇEVRİMİÇİ KULLANICILAR (SAĞ) */}
        <div className="w-48 bg-[#0a0f1c]/80 border border-white/5 rounded-md flex flex-col hidden xl:flex backdrop-blur-xl shrink-0">
          <div className="p-4 border-b border-white/5">
            <h2 className="text-[10px] font-bold text-green-500 uppercase tracking-[0.2em] flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              ÇEVRİMİÇİ — {onlineUsers.length}
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
            {onlineUsers.map((u: any) => (
              <div key={u.user_id} onClick={() => setSelectedUserId(u.user_id)} className="flex items-center gap-2 px-2 py-1.5 hover:bg-white/5 rounded-sm cursor-pointer transition-colors group">
                <img src={u.avatar_url} alt={u.display_name} className="w-8 h-8 rounded-sm border border-white/10 grayscale-[20%] group-hover:grayscale-0 transition-all" />
                <div className="flex flex-col min-w-0">
                  <span className={`text-[12px] font-bold truncate uppercase tracking-wide ${getRoleColor(u.role)}`}>{u.display_name}</span>
                  <span className="text-[9px] text-zinc-500 font-bold">LVL {u.level}</span>
                </div>
              </div>
            ))}
            {onlineUsers.length === 0 && <div className="text-[10px] text-zinc-600 text-center mt-4 uppercase tracking-widest">Kimse yok.</div>}
          </div>
        </div>

      </div>

      {selectedUserId && <UserProfileModal userId={selectedUserId} onClose={() => setSelectedUserId(null)} />}
      {showLFG && <LFGModal currentUser={currentUser} onClose={() => setShowLFG(false)} />}
    </main>
  )
}