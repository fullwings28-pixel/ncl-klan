import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { SignJWT } from "jose"

export async function GET(req: Request) {
  const url = new URL(req.url)
  const params = url.searchParams

  // 1) Steam doğrulama
  const verify = new URLSearchParams()
  for (const [k, v] of params) {
    if (k.startsWith("openid.")) verify.set(k, v)
  }
  verify.set("openid.mode", "check_authentication")

  const verifyRes = await fetch("https://steamcommunity.com/openid/login", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: verify.toString(),
  })
  const verifyText = await verifyRes.text()

  if (!verifyText.includes("is_valid:true")) {
    return NextResponse.json({ error: "Geçersiz Steam yanıtı" }, { status: 401 })
  }

  // 2) SteamID64 çıkar
  const claimedId = params.get("openid.claimed_id") ?? ""
  const match = claimedId.match(/\/id\/(\d+)$/)
  if (!match) {
    return NextResponse.json({ error: "SteamID bulunamadı" }, { status: 400 })
  }
  const steamId = match[1]

  // 3) Steam'den profil bilgilerini çek
  const steamRes = await fetch(
    `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${process.env.STEAM_API_KEY}&steamids=${steamId}`
  )
  const steamData = await steamRes.json()
  const player = steamData.response.players[0]

  // 4) Supabase Bağlantısı
  // Hata ayıklama için URL'i terminale yazdırıyoruz
  console.log("🔍 Kullanılan Supabase URL:", process.env.SUPABASE_URL)

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )

  // 5) Veritabanına Kaydet
  const { data: profile, error } = await supabase
    .from("profiles")
    .upsert(
      {
        steam_id: steamId,
        display_name: player.personaname,
        avatar_url: player.avatarfull,
        steam_profile_url: player.profileurl,
      },
      { onConflict: "steam_id" }
    )
    .select()
    .single()

  if (error || !profile) {
    console.error("❌ Supabase Kayıt Hatası Detayı:", error) 
    return NextResponse.json({ error: "Kayıt başarısız" }, { status: 500 })
  }

  // 6) JWT Oturum Cookie'si Oluştur
  const secret = new TextEncoder().encode(process.env.SESSION_SECRET!)
  const token = await new SignJWT({ sub: profile.id, steamId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret)

  const res = NextResponse.redirect(`${url.origin}/dashboard`)
  res.cookies.set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  })
  return res
}