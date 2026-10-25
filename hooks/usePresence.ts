"use client"
import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export function usePresence(currentUser: any) {
  const [onlineUsers, setOnlineUsers] = useState<any[]>([])

  useEffect(() => {
    if (!currentUser) return

    // Aynı kullanıcının birden fazla sekmede açmasını engellemek için key olarak user.id kullanıyoruz
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
        const users = Object.values(state).flat() // Gelen veriyi diziye çevir
        setOnlineUsers(users as any[])
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          // Kanala bağlanınca kendi bilgilerimizi yayınla
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