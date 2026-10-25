import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { createClient } from "@supabase/supabase-js"
import { fetchCrates } from "@/lib/csgo-api"
import { getWear, getPriceMultiplier, RARITY_BASE_PRICES } from "@/lib/economy"

export async function POST(req: Request) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "Yetkisiz işlem" }, { status: 401 })

    const { crateId, quantity = 1 } = await req.json()
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)

    const crates = await fetchCrates()
    const crate = crates.find((c: any) => c.id === crateId)
    if (!crate) return NextResponse.json({ error: "Kasa bulunamadı" }, { status: 404 })

    // Bakiye Kontrolü (Kasa başı 2.50$ diyelim)
    const caseCost = 2.50 * quantity;
    const { data: userProfile } = await supabase.from("profiles").select("balance").eq("id", session.id).single()
    const currentBalance = Number(userProfile?.balance || 0)

    if (currentBalance < caseCost) {
      return NextResponse.json({ error: `Yetersiz bakiye! ${quantity} kasa için $${caseCost.toFixed(2)} gerekli.` }, { status: 400 })
    }

    const wonSkins = [];
    const inventoryInserts = [];

    // Çoklu Açma Döngüsü
    for (let i = 0; i < quantity; i++) {
      const roll = Math.random() * 100
      let selectedRarity = "Mil-Spec Grade"
      
      if (roll < 0.26) selectedRarity = "Rare Special"
      else if (roll < 0.26 + 0.64) selectedRarity = "Covert"
      else if (roll < 0.26 + 0.64 + 3.20) selectedRarity = "Classified"
      else if (roll < 0.26 + 0.64 + 3.20 + 15.98) selectedRarity = "Restricted"

      let pool: any[] = []
      if (selectedRarity === "Rare Special") pool = crate.contains_rare || []
      else pool = crate.contains?.filter((s: any) => s.rarity.name === selectedRarity) || []

      if (pool.length === 0) pool = crate.contains || []

      const selectedSkin = pool[Math.floor(Math.random() * pool.length)]
      
      // FLOAT SİSTEMİ
      const floatVal = Number((Math.random()).toFixed(8)); // 0.00000000 - 0.99999999
      const wear = getWear(floatVal);
      const basePrice = RARITY_BASE_PRICES[selectedRarity] || 1.00;
      const finalPrice = Number((basePrice * getPriceMultiplier(floatVal)).toFixed(2));

      wonSkins.push({ ...selectedSkin, float: floatVal, wear, price: finalPrice });

      inventoryInserts.push({
        user_id: session.id,
        skin_id: selectedSkin.id,
        skin_name: selectedSkin.name,
        skin_image: selectedSkin.image,
        skin_rarity: selectedRarity,
        price: finalPrice,
        float_value: floatVal,
        wear: wear
      })
    }

    // Bakiyeyi düş ve envantere ekle
    const newBalance = currentBalance - caseCost
    await supabase.from("profiles").update({ balance: newBalance }).eq("id", session.id)
    await supabase.from("inventories").insert(inventoryInserts)

    return NextResponse.json({
      success: true,
      skins: wonSkins, // Kazanılan tüm skinlerin listesi
      newBalance,
    })

  } catch (error: any) {
    return NextResponse.json({ error: "Sunucu hatası: " + error.message }, { status: 500 })
  }
}