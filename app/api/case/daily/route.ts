import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { createClient } from "@supabase/supabase-js"

export async function POST() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 })

  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)
  
  // Kullanıcının bakiyesini ve son kredi alma tarihini çek
  const { data: profile, error: fetchError } = await supabase
    .from("profiles")
    .select("balance, last_daily_claim")
    .eq("id", session.id)
    .single()

  if (fetchError || !profile) {
    return NextResponse.json({ error: "Profil bulunamadı" }, { status: 404 })
  }

  // Gün kontrolü (Tarihleri YYYY-MM-DD formatında karşılaştırıyoruz)
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  
  if (profile.last_daily_claim) {
    const lastClaimDate = new Date(profile.last_daily_claim).toISOString().split('T')[0];
    if (today === lastClaimDate) {
      return NextResponse.json({ error: "Bugün zaten günlük ödülünü aldın! Yarın tekrar gel." }, { status: 400 })
    }
  }

  const currentBalance = profile.balance || 0
  const newBalance = currentBalance + 500

  // Bakiyeyi ve son alma tarihini güncelle
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ 
      balance: newBalance,
      last_daily_claim: now.toISOString()
    })
    .eq("id", session.id)

  if (updateError) {
    return NextResponse.json({ error: "Bakiye güncellenemedi" }, { status: 500 })
  }

  return NextResponse.json({ success: true, newBalance })
}