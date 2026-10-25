"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"

export function usePresence(currentUser: any) {
  const [onlineUsers, setOnlineUsers] = useState<any[]>([])

  useEffect(() => {
    if (!currentUser) return

    const channel = supabase.channel("online-users", {
      config: {
        presence: {
          key: currentUser.id,
        },
      },
    })

    // presence dinleyicisi subscribe() ÇAĞRISINDAN ÖNCE eklenmeli
    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState()
        const users = Object.values(state).flat()
        setOnlineUsers(users as any[])
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          // Kanala başarıyla abone olunduktan sonra kendi bilgilerimizi yayınla
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
      channel.unsubscribe()
    }
  }, [currentUser])

  return onlineUsers
}