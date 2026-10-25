import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { createClient } from "@supabase/supabase-js"

export async function POST(req: Request) {
  const admin = await getSession()
  if (!admin || admin.role !== 'admin') return NextResponse.json({ error: "Yetkisiz" }, { status: 403 })

  const { messageId } = await req.json()
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)
  
  await supabase.from("messages").delete().eq("id", messageId)

  return NextResponse.json({ success: true })
}