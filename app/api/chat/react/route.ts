import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const messageId = Number(body.messageId) // ID'yi sayıya zorla
    const { userId, emoji } = body

    if (!messageId || !userId || !emoji) {
      return NextResponse.json({ error: "Eksik parametre" }, { status: 400 })
    }

    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)

    const { data: existing, error: fetchError } = await supabase
      .from("message_reactions")
      .select("id")
      .eq("message_id", messageId)
      .eq("user_id", userId)
      .eq("emoji", emoji)
      .maybeSingle()

    if (fetchError) {
      console.error("Supabase Sorgu Hatası:", fetchError)
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    if (existing) {
      const { error: deleteError } = await supabase.from("message_reactions").delete().eq("id", existing.id)
      if (deleteError) {
        console.error("Supabase Silme Hatası:", deleteError)
        return NextResponse.json({ error: deleteError.message }, { status: 500 })
      }
    } else {
      const { error: insertError } = await supabase.from("message_reactions").insert({ 
        message_id: messageId, 
        user_id: userId, 
        emoji 
      })
      if (insertError) {
        console.error("Supabase Ekleme Hatası:", insertError)
        return NextResponse.json({ error: insertError.message }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Genel API Hatası:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}