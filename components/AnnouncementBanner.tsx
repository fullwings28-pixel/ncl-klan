"use client"
import { useEffect, useState } from "react"
import { Megaphone, X } from "lucide-react"

export default function AnnouncementBanner() {
  const [announcement, setAnnouncement] = useState<any>(null)
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    fetch("/api/announcements")
      .then(res => res.json())
      .then(data => { if (data) setAnnouncement(data) })
  }, [])

  if (!announcement || !isVisible) return null

  return (
    <div className="bg-gradient-to-r from-red-600 to-red-800 text-white px-4 py-2 relative flex items-center justify-center text-sm font-medium shadow-lg z-40">
      <div className="flex items-center gap-2">
        <Megaphone size={18} className="animate-pulse" />
        <span>{announcement.content}</span>
      </div>
      <button onClick={() => setIsVisible(false)} className="absolute right-4 hover:bg-black/20 p-1 rounded transition">
        <X size={16} />
      </button>
    </div>
  )
}