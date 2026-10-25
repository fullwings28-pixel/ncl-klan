import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { createClient } from "@supabase/supabase-js"
import { fetchCrates } from "@/lib/csgo-api"

const RARITY_PRICES: Record<string, number> = {
  "Mil-Spec Grade": 10,
  "Restricted": 50,
  "Classified": 200,
  "Covert": 1000,
  "Rare Special": 5000,
};

const CASE_COST = 100;

export async function POST(req: Request) {
  try {
    // 1. Oturum Kontrolü
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "Yetkisiz işlem" }, { status: 401 })

    // 2. Gelen Veriyi Güvenli Okuma
    let body
    try {
      body = await req.json()
    } catch (e) {
      return NextResponse.json({ error: "Geçersiz istek verisi." }, { status: 400 })
    }

    const { crateId } = body
    if (!crateId) return NextResponse.json({ error: "Kasa ID gerekli" }, { status: 400 })

    // 3. Kasayı Bulma
    let crates
    try {
      crates = await fetchCrates()
    } catch (e) {
      return NextResponse.json({ error: "Kasa verileri sunucudan çekilemedi." }, { status: 500 })
    }

    const crate = crates.find((c: any) => c.id === crateId)
    if (!crate) return NextResponse.json({ error: "Kasa bulunamadı" }, { status: 404 })

    // 4. Veritabanı Bağlantısı
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)
    
    // 5. Bakiye Kontrolü
    const { data: userProfile } = await supabase.from("profiles").select("balance").eq("id", session.id).single()
    const currentBalance = userProfile?.balance || 0

    if (currentBalance < CASE_COST) {
      return NextResponse.json({ error: "Yetersiz bakiye! Günlük ödülünü almayı dene." }, { status: 400 })
    }

    // 6. Şans Faktörü (RNG)
    const roll = Math.random() * 100
    let selectedRarity = "Mil-Spec Grade"
    
    if (roll < 0.26) selectedRarity = "Rare Special"
    else if (roll < 0.26 + 0.64) selectedRarity = "Covert"
    else if (roll < 0.26 + 0.64 + 3.20) selectedRarity = "Classified"
    else if (roll < 0.26 + 0.64 + 3.20 + 15.98) selectedRarity = "Restricted"

    let pool: any[] = []
    if (selectedRarity === "Rare Special") {
      pool = crate.contains_rare || []
    } else {
      pool = crate.contains?.filter((s: any) => s.rarity.name === selectedRarity) || []
    }

    if (pool.length === 0) {
      return NextResponse.json({ error: "Bu kasada uygun skin bulunamadı." }, { status: 500 })
    }

    const selectedSkin = pool[Math.floor(Math.random() * pool.length)]
    const price = RARITY_PRICES[selectedRarity] || 10

    // 7. Bakiyeyi Düş ve Envantere Ekle
    const newBalance = currentBalance - CASE_COST
    await supabase.from("profiles").update({ balance: newBalance }).eq("id", session.id)
    
    await supabase.from("inventories").insert({
      user_id: session.id,
      skin_id: selectedSkin.id,
      skin_name: selectedSkin.name,
      skin_image: selectedSkin.image,
      skin_rarity: selectedRarity,
      price: price
    })

    // 8. Başarılı Yanıt
    return NextResponse.json({
      success: true,
      skin: selectedSkin,
      price,
      newBalance,
    })

  } catch (error: any) {
    console.error("Kasa Açma API Hatası:", error)
    return NextResponse.json({ error: "Sunucu hatası: " + error.message }, { status: 500 })
  }
}