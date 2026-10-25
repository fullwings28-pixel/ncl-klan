import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { createClient } from "@supabase/supabase-js"

export async function POST(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 })

  const { inventoryId, isLocked } = await req.json()
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)

  const { error } = await supabase
    .from("inventories")
    .update({ is_locked: isLocked })
    .eq("id", inventoryId)
    .eq("user_id", session.id)

  if (error) return NextResponse.json({ error: "İşlem başarısız." }, { status: 500 })
  return NextResponse.json({ success: true })
}