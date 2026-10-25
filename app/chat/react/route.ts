import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(req: Request) {
  try {
    const { messageId, userId, emoji } = await req.json()
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)

    // Tepki zaten var mı kontrol et (maybeSingle kullanarak hata fırlatmasını engelliyoruz)
    const { data: existing, error: fetchError } = await supabase
      .from("message_reactions")
      .select("id")
      .eq("message_id", messageId)
      .eq("user_id", userId)
      .eq("emoji", emoji)
      .maybeSingle()

    if (fetchError) {
      console.error("Tepki sorgu hatası:", fetchError)
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    if (existing) {
      // Varsa sil (Tepkiyi geri çek)
      const { error: deleteError } = await supabase.from("message_reactions").delete().eq("id", existing.id)
      if (deleteError) throw deleteError
    } else {
      // Yoksa ekle
      const { error: insertError } = await supabase.from("message_reactions").insert({ message_id: messageId, user_id: userId, emoji })
      if (insertError) throw insertError
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Tepki API Hatası:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}