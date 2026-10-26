import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { createClient } from "@supabase/supabase-js"

export async function POST(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 })

  const subscription = await req.json()
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)

  await supabase.from("push_subscriptions").upsert({
    user_id: session.id,
    endpoint: subscription.endpoint,
    p256dh: subscription.keys.p256dh,
    auth: subscription.keys.auth
  }, { onConflict: "endpoint" })

  return NextResponse.json({ success: true })
}