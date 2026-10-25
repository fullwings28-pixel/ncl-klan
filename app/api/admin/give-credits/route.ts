import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { createClient } from "@supabase/supabase-js"

export async function POST(req: Request) {
  const admin = await getSession()
  
  if (!admin || admin.role !== 'admin') {
    return NextResponse.json({ error: "Yetkisiz işlem" }, { status: 403 })
  }

  const { targetUserId, amount } = await req.json()
  if (!targetUserId || amount === undefined) {
    return NextResponse.json({ error: "Eksik parametre" }, { status: 400 })
  }

  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)

  // Mevcut bakiyeyi al
  const { data: user, error: fetchError } = await supabase
    .from("profiles")
    .select("balance")
    .eq("id", targetUserId)
    .single()

  if (fetchError || !user) {
    return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 })
  }

  const currentBalance = user.balance || 0
  const newBalance = currentBalance + Number(amount)

  if (newBalance < 0) {
    return NextResponse.json({ error: "Kullanıcının bakiyesi sıfırın altına düşemez" }, { status: 400 })
  }

  // Bakiyeyi güncelle
  await supabase.from("profiles").update({ balance: newBalance }).eq("id", targetUserId)

  // Log kaydı at
  await supabase.from("moderation_logs").insert({
    admin_id: admin.id,
    target_user_id: targetUserId,
    action_type: 'give_credits',
    reason: `${amount} Kredi işlemi yapıldı. (Yeni Bakiye: ${newBalance})`
  })

  return NextResponse.json({ success: true, newBalance })
}