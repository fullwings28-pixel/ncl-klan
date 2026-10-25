import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET() {
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)
  const { data, error } = await supabase
    .from("lfg_posts")
    .select("*, profiles(display_name, avatar_url, premier_rating, steam_profile_url)")
    .order("created_at", { ascending: false })
  
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const { user_id, game_mode, players_needed, note } = await req.json()
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)
  
  const { error } = await supabase.from("lfg_posts").insert({ user_id, game_mode, players_needed, note })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  
  return NextResponse.json({ success: true })
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  const userId = searchParams.get("userId")
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)
  
  // Sadece ilanı oluşturan silebilir
  await supabase.from("lfg_posts").delete().eq("id", id).eq("user_id", userId)
  return NextResponse.json({ success: true })
}