import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { createClient } from "@supabase/supabase-js"
import { checkProgress } from "@/lib/achievements"

export async function GET() {
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)
  const { data, error } = await supabase
    .from("duels")
    .select(`*, challenger:challenger_id(id, display_name, avatar_url, premier_rating), opponent:opponent_id(id, display_name, avatar_url, premier_rating)`)
    .order("created_at", { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 })

  const { opponent_id } = await req.json()
  if (opponent_id === session.id) return NextResponse.json({ error: "Kendine meydan okuyamazsın." }, { status: 400 })

  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)
  const { error } = await supabase.from("duels").insert({ challenger_id: session.id, opponent_id, status: 'pending' })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function PUT(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 })

  const { duel_id, action, winner_id } = await req.json()
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)

  if (action === 'accept' || action === 'decline') {
    await supabase.from("duels").update({ status: action === 'accept' ? 'accepted' : 'declined' }).eq("id", duel_id)
    return NextResponse.json({ success: true })
  }

  if (action === 'complete') {
    if (session.role !== 'admin' && session.id !== winner_id) return NextResponse.json({ error: "Yetkisiz işlem" }, { status: 403 })

    // 1. Düelloyu tamamla
    await supabase.from("duels").update({ status: 'completed', winner_id }).eq("id", duel_id)
    await checkProgress(winner_id, 'win_duel')

    // 2. Kazanana Ödül Ver (+500 Kredi, +100 XP)
    const { data: winner } = await supabase.from("profiles").select("balance, xp, level").eq("id", winner_id).single()
    if (winner) {
      const newXp = (winner.xp || 0) + 100
      const newLevel = Math.floor(newXp / 100) + 1
      await supabase.from("profiles").update({ balance: (winner.balance || 0) + 500, xp: newXp, level: newLevel }).eq("id", winner_id)
    }

    // 3. BAHİSLERİ DAĞIT
    const { data: bets } = await supabase.from("bets").select("*").eq("duel_id", duel_id)
    if (bets && bets.length > 0) {
      for (const bet of bets) {
        if (bet.predicted_winner_id === winner_id) {
          // Kazandıysa 2 katını ver
          const { data: bettor } = await supabase.from("profiles").select("balance").eq("id", bet.user_id).single()
          if (bettor) {
             await supabase.from("profiles").update({ balance: (bettor.balance || 0) + (bet.amount * 2) }).eq("id", bet.user_id)
             await supabase.from("notifications").insert({ user_id: bet.user_id, type: 'system', message: `Bahis kazandın! +${bet.amount * 2} Kredi hesabına eklendi.`, link: `/arena` })
          }
        }
      }
    }
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: "Geçersiz işlem" }, { status: 400 })
}