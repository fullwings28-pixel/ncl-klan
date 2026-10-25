import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { createClient } from "@supabase/supabase-js"
import { BACKGROUNDS } from "@/lib/backgrounds"

export async function POST(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 })

  const { background_id, showcase_items } = await req.json()
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)

  const updateData: any = {}

  // Arka plan satın alma işlemi
  if (background_id) {
    const bg = BACKGROUNDS.find(b => b.id === background_id)
    if (!bg) return NextResponse.json({ error: "Arka plan bulunamadı." }, { status: 404 })

    // Zaten sahip mi? (Basitlik açısından, eğer zaten buysa tekrar para almayalım)
    if (session.background_url === bg.url) {
      return NextResponse.json({ error: "Bu arka plana zaten sahipsin." }, { status: 400 })
    }

    // Yeterli kredi var mı?
    const { data: profile } = await supabase.from("profiles").select("balance").eq("id", session.id).single()
    if (Number(profile?.balance || 0) < bg.price) {
      return NextResponse.json({ error: "Yetersiz bakiye." }, { status: 400 })
    }

    // Krediyi düş ve arka planı kaydet
    await supabase.from("profiles").update({ balance: Number(profile!.balance) - bg.price }).eq("id", session.id)
    updateData.background_url = bg.url
  }

  // Vitrin eşyalarını güncelleme
  if (showcase_items !== undefined) {
    updateData.showcase_items = showcase_items
  }

  if (Object.keys(updateData).length > 0) {
    const { error } = await supabase.from("profiles").update(updateData).eq("id", session.id)
    if (error) return NextResponse.json({ error: "Güncellenemedi." }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}