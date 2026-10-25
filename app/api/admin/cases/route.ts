import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { createClient } from "@supabase/supabase-js"

export async function POST(req: Request) {
  const session = await getSession()
  if (!session || session.role !== 'admin') return NextResponse.json({ error: "Yetkisiz" }, { status: 403 })

  const { name, image_url, price, items } = await req.json()
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)

  // 1. Kasayı oluştur
  const { data: newCase, error: caseError } = await supabase
    .from("custom_cases")
    .insert({ name, image_url, price })
    .select()
    .single()

  if (caseError) return NextResponse.json({ error: caseError.message }, { status: 500 })

  // 2. İçerikleri (Skinleri) ekle
  const itemsToInsert = items.map((item: any) => ({
    case_id: newCase.id,
    skin_id: item.skin_id || Math.random().toString(36).substring(7),
    skin_name: item.skin_name,
    skin_image: item.skin_image,
    skin_rarity: item.skin_rarity,
    chance: item.chance,
    price: item.price
  }))

  const { error: itemsError } = await supabase.from("custom_case_items").insert(itemsToInsert)

  if (itemsError) return NextResponse.json({ error: itemsError.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(req: Request) {
  const session = await getSession()
  if (!session || session.role !== 'admin') return NextResponse.json({ error: "Yetkisiz" }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)
  
  await supabase.from("custom_cases").delete().eq("id", id)
  return NextResponse.json({ success: true })
}