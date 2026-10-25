import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET() {
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)
  const { data } = await supabase.from("rooms").select("*").order("created_at", { ascending: true })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const { name } = await req.json()
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)
  await supabase.from("rooms").insert({ name })
  return NextResponse.json({ success: true })
}