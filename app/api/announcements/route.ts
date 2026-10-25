import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET() {
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)
  const { data } = await supabase.from("announcements").select("*").order("created_at", { ascending: false }).limit(1)
  return NextResponse.json(data?.[0] || null)
}

export async function POST(req: Request) {
  const { content } = await req.json()
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)
  await supabase.from("announcements").insert({ content })
  return NextResponse.json({ success: true })
}