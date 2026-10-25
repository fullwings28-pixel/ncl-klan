import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { createClient } from "@supabase/supabase-js"

export async function POST(req: Request) {
  const admin = await getSession()
  
  if (!admin || admin.role !== 'admin') {
    return NextResponse.json({ error: "Yetkisiz işlem" }, { status: 403 })
  }

  const { targetUserId, newRole } = await req.json()
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)

  await supabase
    .from("profiles")
    .update({ role: newRole })
    .eq("id", targetUserId)

  return NextResponse.json({ success: true })
}