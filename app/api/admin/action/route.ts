import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { createClient } from "@supabase/supabase-js"

export async function POST(req: Request) {
  const admin = await getSession()
  
  if (!admin || admin.role !== 'admin') {
    return NextResponse.json({ error: "Yetkisiz işlem" }, { status: 403 })
  }

  const { targetUserId, action, reason } = await req.json()
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)

  let updateData = {}
  switch (action) {
    case 'ban': updateData = { is_banned: true }; break
    case 'unban': updateData = { is_banned: false }; break
    case 'mute': updateData = { is_muted: true }; break
    case 'unmute': updateData = { is_muted: false }; break
  }

  if (Object.keys(updateData).length > 0) {
    await supabase.from("profiles").update(updateData).eq("id", targetUserId)
  }

  await supabase.from("moderation_logs").insert({
    admin_id: admin.id,
    target_user_id: targetUserId,
    action_type: action,
    reason: reason || null
  })

  return NextResponse.json({ success: true })
}