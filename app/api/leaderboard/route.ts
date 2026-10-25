import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET() {
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)

  // 1. Tüm kullanıcıları çek
  const { data: users, error: userError } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, role, premier_rating, xp, level, balance")

  if (userError) return NextResponse.json({ error: userError.message }, { status: 500 })

  // 2. Tüm envanterleri çek ve kullanıcılara göre grupla
  const { data: inventories, error: invError } = await supabase
    .from("inventories")
    .select("user_id, price")

  if (invError) return NextResponse.json({ error: invError.message }, { status: 500 })

  // 3. Envanter değerlerini hesapla
  const inventoryValues: Record<string, number> = {}
  inventories?.forEach(item => {
    if (!inventoryValues[item.user_id]) inventoryValues[item.user_id] = 0
    inventoryValues[item.user_id] += item.price
  })

  // 4. Kullanıcı verilerini envanter değerleriyle birleştir
  const leaderboardData = users.map(user => ({
    ...user,
    inventory_value: inventoryValues[user.id] || 0
  }))

  return NextResponse.json(leaderboardData)
}