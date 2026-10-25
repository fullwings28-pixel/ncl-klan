import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { createClient } from "@supabase/supabase-js"

export async function POST(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 })

  const { amount } = await req.json()
  if (!amount || amount <= 0) return NextResponse.json({ error: "Geçersiz miktar" }, { status: 400 })

  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)

  // 1. Kullanıcının bakiyesini kontrol et
  const { data: profile } = await supabase.from("profiles").select("balance").eq("id", session.id).single()
  if (!profile || (profile.balance || 0) < amount) {
    return NextResponse.json({ error: "Yetersiz bakiye." }, { status: 400 })
  }

  // 2. Kullanıcıdan düş
  await supabase.from("profiles").update({ balance: profile.balance - amount }).eq("id", session.id)

  // 3. Ortak kasaya ekle
  const { data: treasury } = await supabase.from("settings").select("value").eq("key", "treasury_balance").single()
  const currentTreasury = parseInt(treasury?.value || "0")
  await supabase.from("settings").update({ value: (currentTreasury + amount).toString() }).eq("key", "treasury_balance")

  return NextResponse.json({ success: true })
}