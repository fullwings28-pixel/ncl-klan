import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { createClient } from "@supabase/supabase-js"
import { fetchCrates } from "@/lib/csgo-api"
import { getWear, getFloatMultiplier, getSkinMultiplier, RARITY_BASE_PRICES, CASE_PRICE } from "@/lib/economy"

export async function POST(req: Request) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "Yetkisiz işlem" }, { status: 401 })

    const { crateId, quantity = 1 } = await req.json()
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)

    const crates = await fetchCrates()
    // TypeScript'in 'Crate' tipi kısıtlamasına takılmamak için ': any' ekledik
    let crate: any = crates.find((c: any) => c.id === crateId)
    let isCustom = false

    // Eğer standart kasalarda yoksa özel kasalara (custom_cases) bak
    if (!crate) {
      const { data: customCrate } = await supabase.from("custom_cases").select("*").eq("id", crateId).single()
      if (customCrate) {
        isCustom = true
        crate = {
          id: customCrate.id,
          name: customCrate.name,
          price: Number(customCrate.price || CASE_PRICE),
          contains: customCrate.items || crates[0]?.contains || [],
          contains_rare: []
        }
      }
    }

    if (!crate) return NextResponse.json({ error: "Kasa bulunamadı" }, { status: 404 })

    const unitPrice = isCustom ? Number(crate.price) : CASE_PRICE
    const totalCost = unitPrice * quantity

    const { data: userProfile } = await supabase.from("profiles").select("balance").eq("id", session.id).single()
    const currentBalance = Number(userProfile?.balance || 0)

    if (currentBalance < totalCost) {
      return NextResponse.json({ error: `Yetersiz bakiye! ${quantity} kasa için $${totalCost.toFixed(2)} gerekli.` }, { status: 400 })
    }

    const wonSkins = []

    for (let i = 0; i < quantity; i++) {
      const roll = Math.random() * 100
      let selectedRarity = "Mil-Spec Grade"
      
      if (roll < 0.26) selectedRarity = "Rare Special"
      else if (roll < 0.26 + 0.64) selectedRarity = "Covert"
      else if (roll < 0.26 + 0.64 + 3.20) selectedRarity = "Classified"
      else if (roll < 0.26 + 0.64 + 3.20 + 15.98) selectedRarity = "Restricted"

      let pool: any[] = []
      if (selectedRarity === "Rare Special" && crate.contains_rare?.length > 0) {
        pool = crate.contains_rare
      } else {
        pool = crate.contains?.filter((s: any) => (s.rarity?.name || s.skin_rarity) === selectedRarity) || []
      }
      
      if (pool.length === 0) pool = crate.contains || []

      const selectedSkin = pool[Math.floor(Math.random() * pool.length)]
      
      const skinName = selectedSkin?.name || selectedSkin?.skin_name || "CS2 Skin"
      const skinImage = selectedSkin?.image || selectedSkin?.skin_image || ""
      const skinId = selectedSkin?.id || selectedSkin?.skin_id || String(Date.now() + i)
      const actualRarity = selectedSkin?.rarity?.name || selectedSkin?.skin_rarity || selectedRarity

      // FLOAT SİSTEMİ
      const floatVal = Number((Math.random()).toFixed(8))
      const wear = getWear(floatVal)
      
      // FİYAT HESAPLAMA
      const basePrice = RARITY_BASE_PRICES[actualRarity] || 1.00
      const skinMultiplier = getSkinMultiplier(skinName)
      const finalPrice = selectedSkin?.price 
        ? Number(selectedSkin.price) 
        : Number((basePrice * getFloatMultiplier(floatVal) * skinMultiplier).toFixed(2))

      wonSkins.push({ 
        skin_id: skinId,
        skin_name: skinName, 
        skin_image: skinImage, 
        skin_rarity: actualRarity, 
        float: floatVal, 
        wear, 
        price: finalPrice,
        name: skinName,
        image: skinImage,
        rarity: { name: actualRarity }
      })
    }

    const newBalance = currentBalance - totalCost
    await supabase.from("profiles").update({ balance: newBalance }).eq("id", session.id)

    return NextResponse.json({
      success: true,
      skins: wonSkins,
      newBalance,
    })
  } catch (error: any) {
    return NextResponse.json({ error: "Sunucu hatası: " + error.message }, { status: 500 })
  }
}