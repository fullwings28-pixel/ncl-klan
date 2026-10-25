import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { createClient } from "@supabase/supabase-js"

// Bildirimleri getir
export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 })

  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)
  const { data } = await supabase
    .from("notifications")
    .select("*, sender:sender_id(display_name, avatar_url)")
    .eq("user_id", session.id)
    .order("created_at", { ascending: false })
    .limit(20)

  return NextResponse.json(data)
}

// Bildirimleri okundu yap
export async function PUT() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 })

  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)
  await supabase.from("notifications").update({ is_read: true }).eq("user_id", session.id)

  return NextResponse.json({ success: true })
}