import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { createClient } from "@supabase/supabase-js"

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 })

  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)
  
  // Kullanıcının dahil olduğu tüm DM'leri çek
  const { data: messages, error } = await supabase
    .from("direct_messages")
    .select("*, sender:sender_id(id, display_name, avatar_url), receiver:receiver_id(id, display_name, avatar_url)")
    .or(`sender_id.eq.${session.id},receiver_id.eq.${session.id}`)
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Son mesajlaşılan kişileri tekil hale getir
  const chatPartners = new Map()
  messages.forEach(msg => {
    const partner = msg.sender_id === session.id ? msg.receiver : msg.sender
    if (!chatPartners.has(partner.id)) {
      chatPartners.set(partner.id, {
        ...partner,
        lastMessage: msg.content,
        lastMessageTime: msg.created_at,
        unreadCount: (msg.receiver_id === session.id && !msg.is_read) ? 1 : 0
      })
    } else if (msg.receiver_id === session.id && !msg.is_read) {
      // Okunmamışları say
      const existing = chatPartners.get(partner.id)
      existing.unreadCount += 1
    }
  })

  return NextResponse.json(Array.from(chatPartners.values()))
}