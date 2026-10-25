import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { createClient } from "@supabase/supabase-js"

export async function POST(req: Request) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 })

    const { inventoryId, targetItem } = await req.json()
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)

    // 1. Kaynak eşyayı veritabanından çek ve sahiplik kontrolü yap
    const { data: sourceItem, error: fetchError } = await supabase
      .from("inventories")
      .select("*")
      .eq("id", inventoryId)
      .eq("user_id", session.id)
      .single()

    if (fetchError || !sourceItem) return NextResponse.json({ error: "Eşya bulunamadı." }, { status: 404 })

    const sourcePrice = Number(sourceItem.price)
    const targetPrice = Number(targetItem.price)

    // 2. Şans Hesaplaması (Kaynak Fiyat / Hedef Fiyat) * 100
    // Örn: 10$ eşyayı 100$ eşyaya yükseltmek istiyorsan %10 şansın var.
    let winChance = (sourcePrice / targetPrice) * 100
    
    // Maksimum %90 şans olabilir (Daha fazlası kumarhaneyi batırır)
    if (winChance > 90) winChance = 90
    // Minimum %2 şans olabilir
    if (winChance < 2) winChance = 2

    // Eğer hedef, kaynaktan ucuz veya eşitse yükseltmeye izin verme
    if (targetPrice <= sourcePrice) {
      return NextResponse.json({ error: "Hedef eşya, mevcut eşyadan daha değerli olmalıdır." }, { status: 400 })
    }

    // 3. Rastgele Sayı Üret (RNG)
    const roll = Math.random() * 100
    const isWin = roll <= winChance

    // 4. Kaynak eşyayı her türlü envanterden sil
    await supabase.from("inventories").delete().eq("id", inventoryId)

    // 5. Eğer kazandıysa yeni eşyayı envantere ekle
    if (isWin) {
      await supabase.from("inventories").insert({
        user_id: session.id,
        skin_id: targetItem.id,
        skin_name: targetItem.name,
        skin_image: targetItem.image,
        skin_rarity: targetItem.rarity.name,
        price: targetPrice,
        float_value: targetItem.float,
        wear: targetItem.wear
      })
    }

    return NextResponse.json({
      success: true,
      won: isWin,
      chance: winChance,
      roll: roll
    })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}