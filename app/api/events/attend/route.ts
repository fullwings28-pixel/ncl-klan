import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(req: Request) {
  const { eventId, userId } = await req.json()
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)

  // Kullanıcı zaten katılmış mı?
  const { data: existing } = await supabase
    .from("event_attendees")
    .select("id")
    .eq("event_id", eventId)
    .eq("user_id", userId)
    .single()

  if (existing) {
    // Katılmışsa iptal et (Ayrıl)
    await supabase.from("event_attendees").delete().eq("id", existing.id)
  } else {
    // Katılmamışsa ekle
    await supabase.from("event_attendees").insert({ event_id: eventId, user_id: userId })
  }

  return NextResponse.json({ success: true })
}