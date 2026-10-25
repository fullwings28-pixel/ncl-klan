import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { createClient } from "@supabase/supabase-js"

export async function POST(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 })

  const { role } = await req.json()
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)

  const { error } = await supabase
    .from("profiles")
    .update({ player_role: role })
    .eq("id", session.id)

  if (error) return NextResponse.json({ error: "Rol güncellenemedi" }, { status: 500 })
  return NextResponse.json({ success: true })
}