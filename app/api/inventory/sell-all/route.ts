import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { createClient } from "@supabase/supabase-js"

export async function POST() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 })

  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)

  // 1. Kullanıcının envanterini çek
  const { data: items, error } = await supabase
    .from("inventories")
    .select("id, price")
    .eq("user_id", session.id)

  if (error) return NextResponse.json({ error: "Envanter çekilemedi." }, { status: 500 })
  if (!items || items.length === 0) return NextResponse.json({ error: "Envanter zaten boş." }, { status: 400 })

  // 2. Toplam fiyatı hesapla
  const totalPrice = items.reduce((acc, item) => acc + Number(item.price), 0)

  // 3. Bakiyeyi güncelle
  const { data: profile } = await supabase.from("profiles").select("balance").eq("id", session.id).single()
  const newBalance = Number(profile?.balance || 0) + totalPrice

  await supabase.from("profiles").update({ balance: newBalance }).eq("id", session.id)

  // 4. Envanteri temizle
  await supabase.from("inventories").delete().eq("user_id", session.id)

  return NextResponse.json({ success: true, newBalance, totalPrice })
}