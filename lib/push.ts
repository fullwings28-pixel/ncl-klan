import webpush from "web-push"
import { createClient } from "@supabase/supabase-js"

webpush.setVapidDetails(
  "mailto:admin@nclklan.com",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export async function sendPushNotification(userId: string, title: string, body: string, url: string) {
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)
  const { data: subscriptions } = await supabase.from("push_subscriptions").select("*").eq("user_id", userId)

  if (!subscriptions || subscriptions.length === 0) return

  const payload = JSON.stringify({ title, body, url })

  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification({
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth }
      }, payload)
    } catch (error: any) {
      if (error.statusCode === 410 || error.statusCode === 404) {
        await supabase.from("push_subscriptions").delete().eq("id", sub.id)
      }
    }
  }
}