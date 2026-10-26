"use client"
import { useState } from "react"
import { Bell } from "lucide-react"
import { useToast } from "@/components/Toast"

export default function PushNotificationButton() {
  const [isSubscribed, setIsSubscribed] = useState(false)
  const { showToast } = useToast()

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)
    for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i)
    return outputArray
  }

  const subscribe = async () => {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js")
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!)
      })

      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription)
      })

      setIsSubscribed(true)
      showToast("Bildirimler başarıyla açıldı!", "success")
    } catch (err) {
      showToast("Bildirim izni verilmedi veya hata oluştu.", "error")
    }
  }

  return (
    <button onClick={subscribe} disabled={isSubscribed} className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs px-4 py-2 rounded-lg text-white flex items-center justify-center gap-2 transition disabled:opacity-50 w-full sm:w-auto mt-4">
      <Bell size={16} /> {isSubscribed ? "Bildirimler Açık" : "Tarayıcı Bildirimlerini Aç"}
    </button>
  )
}