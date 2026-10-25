// hooks/usePresence.ts
"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"

export function usePresence(currentUser: any) {
  const [onlineUsers, setOnlineUsers] = useState<any[]>([])

  useEffect(() => {
    if (!currentUser) return

    // ÇÖZÜM: Eğer daha önceden açılmış ve abone olunmuş bir "online-users" kanalı varsa, onu temizle.
    const existingChannels = supabase.getChannels().filter(c => c.topic === 'realtime:online-users')
    existingChannels.forEach(channel => {
      supabase.removeChannel(channel)
    })

    const channel = supabase.channel("online-users", {
      config: {
        presence: {
          key: currentUser.id,
        },
      },
    })

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState()
        const users = Object.values(state).flat()
        setOnlineUsers(users as any[])
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            user_id: currentUser.id,
            display_name: currentUser.display_name,
            avatar_url: currentUser.avatar_url,
            level: currentUser.level,
            role: currentUser.role
          })
        }
      })

    return () => {
      // Bileşen ekrandan kalktığında kanalı temizle
      supabase.removeChannel(channel)
    }
  }, [currentUser])

  return onlineUsers
}