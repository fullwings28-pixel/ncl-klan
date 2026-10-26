import webpush from "web-push"
import { createClient } from "@supabase/supabase-js"

export async function sendPushNotification(userId: string, title: string, body: string, url: string) {
  // Anahtarları sadece fonksiyon çağrıldığında kontrol et (Build aşamasında çökmemesi için)
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY

  if (!publicKey || !privateKey) {
    console.warn("VAPID anahtarları eksik! Push bildirimi gönderilemiyor.")
    return
  }

  webpush.setVapidDetails(
    "mailto:admin@nclklan.com",
    publicKey,
    privateKey
  )

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
      // Eğer abonelik geçersizse (kullanıcı bildirimleri kapatmışsa) veritabanından sil
      if (error.statusCode === 410 || error.statusCode === 404) {
        await supabase.from("push_subscriptions").delete().eq("id", sub.id)
      }
    }
  }
}