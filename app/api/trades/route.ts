import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { createClient } from "@supabase/supabase-js"

// Takasları getir
export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 })

  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)
  
  const { data, error } = await supabase
    .from("trades")
    .select(`
      *,
      sender:sender_id(id, display_name, avatar_url),
      receiver:receiver_id(id, display_name, avatar_url)
    `)
    .or(`sender_id.eq.${session.id},receiver_id.eq.${session.id}`)
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// Yeni takas oluştur
export async function POST(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 })

  const { receiver_id, sender_items } = await req.json()
  if (!receiver_id || sender_items.length === 0) return NextResponse.json({ error: "Eksik bilgi" }, { status: 400 })

  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)
  
  const { error } = await supabase.from("trades").insert({
    sender_id: session.id,
    receiver_id,
    sender_items,
    receiver_items: []
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

// Takası kabul et, reddet veya iptal et
export async function PUT(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 })

  const { trade_id, action, receiver_items = [] } = await req.json()
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)

  const { data: trade } = await supabase.from("trades").select("*").eq("id", trade_id).single()
  if (!trade) return NextResponse.json({ error: "Takas bulunamadı." }, { status: 404 })

  // Sadece alıcı kabul/red edebilir, gönderen iptal edebilir
  if (action === 'cancel' && trade.sender_id !== session.id) return NextResponse.json({ error: "Yetkisiz" }, { status: 403 })
  if ((action === 'accept' || action === 'decline') && trade.receiver_id !== session.id) return NextResponse.json({ error: "Yetkisiz" }, { status: 403 })

  if (action === 'cancel' || action === 'decline') {
    await supabase.from("trades").update({ status: action === 'cancel' ? 'cancelled' : 'declined' }).eq("id", trade_id)
    return NextResponse.json({ success: true })
  }

  if (action === 'accept') {
    // 1. Eşyaların sahipliğini kontrol et (Güvenlik)
    const { data: sItems } = await supabase.from("inventories").select("id, user_id").in("id", trade.sender_items)
    const { data: rItems } = await supabase.from("inventories").select("id, user_id").in("id", receiver_items)
    
    const senderOwns = sItems?.every(item => item.user_id === trade.sender_id)
    const receiverOwns = rItems?.every(item => item.user_id === session.id)

    if (!senderOwns || !receiverOwns) {
      return NextResponse.json({ error: "Taraflardan biri eşyalara sahip değil (Belki sattı veya sildi)." }, { status: 400 })
    }

    // 2. Eşyaların sahiplerini değiştir (Takas)
    if (trade.sender_items.length > 0) {
      await supabase.from("inventories").update({ user_id: trade.receiver_id }).in("id", trade.sender_items)
    }
    if (receiver_items.length > 0) {
      await supabase.from("inventories").update({ user_id: trade.sender_id }).in("id", receiver_items)
    }

    // 3. Takası tamamlandı olarak işaretle
    await supabase.from("trades").update({ status: 'accepted', receiver_items }).eq("id", trade_id)
    
    // 4. Gönderene bildirim at
    await supabase.from("notifications").insert({
      user_id: trade.sender_id,
      sender_id: session.id,
      type: 'system',
      message: `Takas teklifin kabul edildi!`,
      link: `/trades`
    })

    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: "Geçersiz işlem" }, { status: 400 })
}