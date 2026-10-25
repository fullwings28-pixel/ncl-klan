"use client"
import { useEffect, useState, useRef } from "react"
import { Bell } from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabaseClient"

export default function NotificationBell({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<any[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const fetchNotifications = async () => {
    const res = await fetch("/api/notifications")
    if (res.ok) {
      const data = await res.json()
      setNotifications(data)
    }
  }

  useEffect(() => {
    fetchNotifications()

    const channel = supabase.channel('realtime-notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, () => {
        fetchNotifications()
      })
      .subscribe()

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setIsOpen(false)
    }
    document.addEventListener("mousedown", handleClickOutside)

    return () => { 
      supabase.removeChannel(channel)
      document.removeEventListener("mousedown", handleClickOutside) 
    }
  }, [userId])

  const markAsRead = async () => {
    setIsOpen(!isOpen)
    if (!isOpen) {
      await fetch("/api/notifications", { method: "PUT" })
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    }
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <div className="relative" ref={menuRef}>
      <button onClick={markAsRead} className="relative p-2 text-zinc-400 hover:text-white transition">
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#09090b] animate-pulse" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="p-3 border-b border-zinc-800 bg-zinc-950/50">
            <h3 className="text-xs font-bold text-zinc-300">Bildirimler</h3>
          </div>
          <div className="max-h-80 overflow-y-auto custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-zinc-500">Henüz bildirimin yok.</div>
            ) : (
              notifications.map(n => (
                <Link key={n.id} href={n.link || "#"} className={`flex gap-3 p-3 border-b border-zinc-800/50 hover:bg-zinc-800/50 transition ${!n.is_read ? 'bg-cyan-500/5' : ''}`}>
                  <img src={n.sender?.avatar_url || "/default.png"} className="w-8 h-8 rounded-full border border-zinc-700" />
                  <div>
                    <p className="text-xs text-zinc-200">
                      <span className="font-bold text-cyan-400">{n.sender?.display_name}</span> {n.message}
                    </p>
                    <span className="text-[10px] text-zinc-500">{new Date(n.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}