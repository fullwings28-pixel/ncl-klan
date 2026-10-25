"use client"
import { useEffect, useRef } from "react"
import { supabase } from "@/lib/supabaseClient"
import { useToast } from "./Toast"

export default function GlobalNotifications({ currentUser }: { currentUser: any }) {
  const { showToast } = useToast()
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    audioRef.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3")
    audioRef.current.volume = 0.5

    const unlockAudio = () => {
      if (audioRef.current) {
        audioRef.current.play().then(() => {
          audioRef.current!.pause()
          audioRef.current!.currentTime = 0
        }).catch(() => {})
      }
      document.removeEventListener('click', unlockAudio)
      document.removeEventListener('touchstart', unlockAudio)
    }

    document.addEventListener('click', unlockAudio)
    document.addEventListener('touchstart', unlockAudio)

    return () => {
      document.removeEventListener('click', unlockAudio)
      document.removeEventListener('touchstart', unlockAudio)
    }
  }, [])

  const playSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0
      audioRef.current.play().catch((e) => console.log("Ses çalınamadı:", e))
    }
  }

  useEffect(() => {
    if (!currentUser) return

    const chatChannel = supabase.channel("global-chat-notifs")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, async (payload) => {
        const msg = payload.new
        if (msg.user_id !== currentUser.id) {
          playSound()
          const { data: sender } = await supabase.from("profiles").select("display_name").eq("id", msg.user_id).single()
          if (sender) {
            showToast(`💬 ${sender.display_name}: ${msg.content.substring(0, 30)}${msg.content.length > 30 ? '...' : ''}`, "info")
          }
        }
      }).subscribe()

    const dmChannel = supabase.channel("global-dm-notifs")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "direct_messages" }, async (payload) => {
        const msg = payload.new
        if (msg.receiver_id === currentUser.id) {
          playSound()
          const { data: sender } = await supabase.from("profiles").select("display_name").eq("id", msg.sender_id).single()
          if (sender) {
            showToast(`✉️ ${sender.display_name} sana özel mesaj attı: ${msg.content.substring(0, 20)}...`, "success")
          }
        }
      }).subscribe()

    return () => {
      supabase.removeChannel(chatChannel)
      supabase.removeChannel(dmChannel)
    }
  }, [currentUser, showToast])

  return null
}