import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { createClient } from "@supabase/supabase-js"

export async function POST(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 })

  const { duel_id, predicted_winner_id, amount } = await req.json()
  if (!duel_id || !predicted_winner_id || amount <= 0) return NextResponse.json({ error: "Eksik bilgi" }, { status: 400 })

  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)

  // 1. Kullanıcının bakiyesi yeterli mi?
  const { data: profile } = await supabase.from("profiles").select("balance").eq("id", session.id).single()
  if (!profile || (profile.balance || 0) < amount) {
    return NextResponse.json({ error: "Yetersiz bakiye." }, { status: 400 })
  }

  // 2. Bakiyeden düş
  await supabase.from("profiles").update({ balance: profile.balance - amount }).eq("id", session.id)

  // 3. Bahsi kaydet
  const { error } = await supabase.from("bets").insert({
    duel_id,
    user_id: session.id,
    predicted_winner_id,
    amount
  })

  if (error) return NextResponse.json({ error: "Bahis kaydedilemedi." }, { status: 500 })
  return NextResponse.json({ success: true })
}