import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { createClient } from "@supabase/supabase-js"

export async function GET() {
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)
  const { data, error } = await supabase
    .from("strategies")
    .select("*, profiles(display_name, avatar_url)")
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 })

  const { title, map_name, image_data } = await req.json()
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)

  const { error } = await supabase.from("strategies").insert({
    title,
    map_name,
    image_data,
    created_by: session.id
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}