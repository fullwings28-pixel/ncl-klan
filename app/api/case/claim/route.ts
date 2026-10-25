import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { createClient } from "@supabase/supabase-js"

export async function POST(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 })

  const { skins, action } = await req.json()
  if (!skins || skins.length === 0) return NextResponse.json({ error: "Eşya bulunamadı" }, { status: 400 })

  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)

  if (action === 'sell') {
    const totalSellPrice = skins.reduce((acc: number, item: any) => acc + Number(item.price), 0)
    const { data: profile } = await supabase.from("profiles").select("balance").eq("id", session.id).single()
    const newBalance = Number(profile?.balance || 0) + totalSellPrice
    
    await supabase.from("profiles").update({ balance: newBalance }).eq("id", session.id)
    return NextResponse.json({ success: true, newBalance, soldFor: totalSellPrice })
  } 
  
  if (action === 'save') {
    const inserts = skins.map((skin: any) => ({
      user_id: session.id,
      skin_id: skin.skin_id,
      skin_name: skin.skin_name,
      skin_image: skin.skin_image,
      skin_rarity: skin.skin_rarity,
      price: skin.price,
      float_value: skin.float,
      wear: skin.wear
    }))

    const { error } = await supabase.from("inventories").insert(inserts)
    if (error) return NextResponse.json({ error: "Envantere kaydedilemedi." }, { status: 500 })
    
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: "Geçersiz işlem" }, { status: 400 })
}