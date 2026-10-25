import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET() {
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)
  const { data } = await supabase.from("settings").select("value").eq("key", "site_name").single()
  return NextResponse.json({ site_name: data?.value || "CS2 Klan Merkezi" })
}

export async function POST(req: Request) {
  const { site_name } = await req.json()
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)
  await supabase.from("settings").upsert({ key: "site_name", value: site_name })
  return NextResponse.json({ success: true })
}