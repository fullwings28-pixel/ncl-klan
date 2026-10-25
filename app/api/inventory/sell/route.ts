import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { createClient } from "@supabase/supabase-js"

export async function POST(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 })

  const { inventoryId, price } = await req.json()
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)

  // 1. Envanterde bu eşya var mı ve kullanıcıya mı ait?
  const { data: item } = await supabase
    .from("inventories")
    .select("id")
    .eq("id", inventoryId)
    .eq("user_id", session.id)
    .single()

  if (!item) return NextResponse.json({ error: "Eşya bulunamadı." }, { status: 404 })

  // 2. Kullanıcının bakiyesini al
  const { data: profile } = await supabase.from("profiles").select("balance").eq("id", session.id).single()
  const newBalance = (profile?.balance || 0) + price

  // 3. Bakiyeyi güncelle ve eşyayı sil
  await supabase.from("profiles").update({ balance: newBalance }).eq("id", session.id)
  await supabase.from("inventories").delete().eq("id", inventoryId)

  return NextResponse.json({ success: true, newBalance })
}