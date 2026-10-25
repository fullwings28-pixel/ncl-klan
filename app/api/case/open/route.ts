import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { createClient } from "@supabase/supabase-js"
import { fetchCrates } from "@/lib/csgo-api"
import { getWear, getFloatMultiplier, getSkinMultiplier, RARITY_BASE_PRICES, CASE_PRICE } from "@/lib/economy"

export async function POST(req: Request) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 })

    const body = await req.json()
    const crateId = body.crateId
    const quantity = Number(body.quantity) || 1

    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)

    // Özel kasa mı kontrol et
    const { data: customCase } = await supabase
      .from("custom_cases")
      .select("*, custom_case_items(*)")
      .eq("id", crateId)
      .single()

    let isCustom = false;
    let crateName = "";
    let crateImage = "";
    let caseCost = 0;
    let customPool: any[] = [];

    if (customCase) {
      isCustom = true;
      crateName = customCase.name;
      crateImage = customCase.image_url;
      caseCost = Number(customCase.price) * quantity;
      customPool = customCase.custom_case_items;
    } else {
      const crates = await fetchCrates()
      const crate = crates.find((c: any) => c.id === crateId)
      if (!crate) return NextResponse.json({ error: "Kasa bulunamadı" }, { status: 404 })
      crateName = crate.name;
      crateImage = crate.image;
      caseCost = CASE_PRICE * quantity;
    }

    const { data: userProfile } = await supabase.from("profiles").select("balance").eq("id", session.id).single()
    const currentBalance = Number(userProfile?.balance || 0)

    if (currentBalance < caseCost) {
      return NextResponse.json({ error: `Yetersiz bakiye! ${quantity} kasa için $${caseCost.toFixed(2)} gerekli.` }, { status: 400 })
    }

    const wonSkins = [];
    const inventoryInserts = [];

    for (let i = 0; i < quantity; i++) {
      let selectedSkin: any = null;
      let selectedRarity = "Mil-Spec Grade";
      let finalPrice = 0;
      
      const floatVal = Number((Math.random()).toFixed(8)); 
      const wear = getWear(floatVal);

      if (isCustom && customPool.length > 0) {
        // ÖZEL KASA İÇİN ŞANS HESAPLAMASI
        const roll = Math.random() * 100;
        let cumulativeChance = 0;
        
        for (const item of customPool) {
          cumulativeChance += Number(item.chance);
          if (roll <= cumulativeChance) {
            selectedSkin = item;
            selectedRarity = item.skin_rarity;
            finalPrice = Number(item.price);
            break;
          }
        }
        // Eğer şanslar 100'e tamamlanmadıysa son eşyayı ver
        if (!selectedSkin) {
          selectedSkin = customPool[customPool.length - 1];
          selectedRarity = selectedSkin.skin_rarity;
          finalPrice = Number(selectedSkin.price);
        }
        
        // Fiyata float etkisi
        finalPrice = Number((finalPrice * getFloatMultiplier(floatVal)).toFixed(2));

        wonSkins.push({ 
          id: selectedSkin.skin_id, name: selectedSkin.skin_name, image: selectedSkin.skin_image, 
          rarity: { name: selectedRarity }, float: floatVal, wear, price: finalPrice 
        });
        
        inventoryInserts.push({
          user_id: session.id, skin_id: selectedSkin.skin_id, skin_name: selectedSkin.skin_name,
          skin_image: selectedSkin.skin_image, skin_rarity: selectedRarity,
          price: finalPrice, float_value: floatVal, wear: wear
        });

      } else {
        // NORMAL CS2 KASASI İÇİN STANDART HESAPLAMA
        const crates = await fetchCrates()
        const crate = crates.find((c: any) => c.id === crateId)!
        
        const roll = Math.random() * 100
        if (roll < 0.26) selectedRarity = "Rare Special"
        else if (roll < 0.26 + 0.64) selectedRarity = "Covert"
        else if (roll < 0.26 + 0.64 + 3.20) selectedRarity = "Classified"
        else if (roll < 0.26 + 0.64 + 3.20 + 15.98) selectedRarity = "Restricted"

        let pool: any[] = []
        if (selectedRarity === "Rare Special") pool = crate.contains_rare || []
        else pool = crate.contains?.filter((s: any) => s.rarity.name === selectedRarity) || []
        if (pool.length === 0) pool = crate.contains || []

        const skin = pool[Math.floor(Math.random() * pool.length)]
        
        const basePrice = RARITY_BASE_PRICES[selectedRarity] || 1.00;
        const skinMultiplier = getSkinMultiplier(skin.name);
        finalPrice = Number((basePrice * getFloatMultiplier(floatVal) * skinMultiplier).toFixed(2));

        wonSkins.push({ ...skin, float: floatVal, wear, price: finalPrice });

        inventoryInserts.push({
          user_id: session.id, skin_id: skin.id, skin_name: skin.name, skin_image: skin.image,
          skin_rarity: selectedRarity, price: finalPrice, float_value: floatVal, wear: wear
        });
      }
    }

    const newBalance = currentBalance - caseCost
    await supabase.from("profiles").update({ balance: newBalance }).eq("id", session.id)
    await supabase.from("inventories").insert(inventoryInserts)

    return NextResponse.json({ success: true, skins: wonSkins, newBalance })

  } catch (error: any) {
    console.error("Kasa açma hatası:", error)
    return NextResponse.json({ error: "Sunucu hatası: " + error.message }, { status: 500 })
  }
}