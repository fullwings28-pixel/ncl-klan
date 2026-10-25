import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET() {
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)
  // Etkinlikleri ve katılımcıların profillerini çek
  const { data, error } = await supabase
    .from("events")
    .select("*, event_attendees(user_id, profiles(display_name, avatar_url))")
    .order("event_date", { ascending: true })
  
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const { title, description, event_date, created_by } = await req.json()
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)
  
  const { error } = await supabase.from("events").insert({ title, description, event_date, created_by })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  
  return NextResponse.json({ success: true })
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)
  
  await supabase.from("events").delete().eq("id", id)
  return NextResponse.json({ success: true })
}