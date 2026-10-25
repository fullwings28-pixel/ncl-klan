import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { createClient } from "@supabase/supabase-js"

export async function GET() {
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)
  const { data } = await supabase.from("banned_words").select("*").order("created_at", { ascending: false })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const session = await getSession()
  if (!session || session.role !== 'admin') return NextResponse.json({ error: "Yetkisiz" }, { status: 403 })

  const { word } = await req.json()
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)
  const { error } = await supabase.from("banned_words").insert({ word })
  
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(req: Request) {
  const session = await getSession()
  if (!session || session.role !== 'admin') return NextResponse.json({ error: "Yetkisiz" }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)
  await supabase.from("banned_words").delete().eq("id", id)
  
  return NextResponse.json({ success: true })
}