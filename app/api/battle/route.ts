import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { createClient } from "@supabase/supabase-js"
import { fetchCrates } from "@/lib/csgo-api"

const RARITY_PRICES: Record<string, number> = { "Mil-Spec Grade": 10, "Restricted": 50, "Classified": 200, "Covert": 1000, "Rare Special": 5000 };

export async function POST(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 })

  const { case_id, wager, rounds, play_with_bot } = await req.json()
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)

  // Bakiye kontrolü
  const { data: profile } = await supabase.from("profiles").select("balance").eq("id", session.id).single()
  if (!profile || profile.balance < wager) return NextResponse.json({ error: "Yetersiz bakiye." }, { status: 400 })

  // Bakiyeden düş
  await supabase.from("profiles").update({ balance: profile.balance - wager }).eq("id", session.id)

  // Savaşı oluştur
  const { data: battle, error } = await supabase.from("battles").insert({
    case_id, wager, rounds, status: play_with_bot ? 'playing' : 'waiting'
  }).select().single()

  if (error) return NextResponse.json({ error: "Savaş oluşturulamadı." }, { status: 500 })

  // Oyuncuyu (Kullanıcıyı) ekle
  await supabase.from("battle_players").insert({
    battle_id: battle.id, user_id: session.id, is_bot: false
  })

  // Eğer Bot ile oynanacaksa, botu ekle ve oyunu hemen başlat
  if (play_with_bot) {
    const botNames = ["s1mple", "ZywOo", "NiKo", "dev1ce", "olofmeister"]
    const randomName = botNames[Math.floor(Math.random() * botNames.length)] + "_BOT"
    const botAvatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${randomName}`

    await supabase.from("battle_players").insert({
      battle_id: battle.id, is_bot: true, bot_name: randomName, bot_avatar: botAvatar
    })

    // Bot ile oynanıyorsa sonucu hemen hesapla
    await simulateBattle(battle.id, case_id, wager, rounds, supabase)
  }

  return NextResponse.json({ success: true, battle_id: battle.id })
}

export async function PUT(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 })

  const { battle_id } = await req.json()
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)

  const { data: battle } = await supabase.from("battles").select("*").eq("id", battle_id).single()
  if (!battle || battle.status !== 'waiting') return NextResponse.json({ error: "Savaş uygun değil." }, { status: 400 })

  // Bakiye kontrolü
  const { data: profile } = await supabase.from("profiles").select("balance").eq("id", session.id).single()
  if (!profile || profile.balance < battle.wager) return NextResponse.json({ error: "Yetersiz bakiye." }, { status: 400 })

  // Bakiyeden düş
  await supabase.from("profiles").update({ balance: profile.balance - battle.wager }).eq("id", session.id)

  // Kullanıcıyı savaşa ekle
  await supabase.from("battle_players").insert({ battle_id: battle.id, user_id: session.id, is_bot: false })
  
  // Savaşı başlat
  await supabase.from("battles").update({ status: 'playing' }).eq("id", battle.id)
  
  await simulateBattle(battle.id, battle.case_id, battle.wager, battle.rounds, supabase)

  return NextResponse.json({ success: true })
}

// Kasa açma simülasyonu ve kazananı belirleme
async function simulateBattle(battleId: string, caseId: string, wager: number, rounds: number, supabase: any) {
  const crates = await fetchCrates()
  const crate = crates.find((c: any) => c.id === caseId)
  if (!crate) return

  const players = await supabase.from("battle_players").select("*").eq("battle_id", battleId)
  const pool = crate.contains || []

  let p1_value = 0, p2_value = 0;
  const itemsToInsert = []

  for (let r = 1; r <= rounds; r++) {
    for (const player of players.data) {
      const roll = Math.random() * 100
      let rarity = "Mil-Spec Grade"
      if (roll < 0.26) rarity = "Rare Special"
      else if (roll < 0.90) rarity = "Covert"
      else if (roll < 4.10) rarity = "Classified"
      else if (roll < 20.08) rarity = "Restricted"

      let skinPool = rarity === "Rare Special" ? (crate.contains_rare || []) : pool.filter((s: any) => s.rarity.name === rarity)
      if (skinPool.length === 0) skinPool = pool
      
      const skin = skinPool[Math.floor(Math.random() * skinPool.length)]
      const price = RARITY_PRICES[rarity] || 10

      if (player.is_bot) p2_value += price; else p1_value += price;

      itemsToInsert.push({
        battle_id: battleId, player_id: player.id, round: r,
        skin_name: skin.name, skin_image: skin.image, skin_rarity: rarity, price: price
      })
    }
  }

  await supabase.from("battle_items").insert(itemsToInsert)

  // Kazananı belirle
  const p1 = players.data.find((p: any) => !p.is_bot)
  const p2 = players.data.find((p: any) => p.is_bot) // Bot ise
  
  let winnerId = null;
  const totalPot = wager * 2;

  if (p1_value > p2_value) {
    winnerId = p1.user_id
    // Kazanana parayı ver
    const { data: wProfile } = await supabase.from("profiles").select("balance").eq("id", p1.user_id).single()
    await supabase.from("profiles").update({ balance: wProfile.balance + totalPot }).eq("id", p1.user_id)
  } else if (p2_value > p1_value && p2) {
    // Bot kazandı, para uçar gider (veya ikinci kullanıcıya verilir ama şimdilik sadece botlar için)
  }

  await supabase.from("battle_players").update({ total_value: p1_value }).eq("id", p1.id)
  if(p2) await supabase.from("battle_players").update({ total_value: p2_value }).eq("id", p2.id)

  await supabase.from("battles").update({ status: 'finished', winner_id: winnerId }).eq("id", battleId)
}