import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(req: Request) {
  const { steamId } = await req.json()
  if (!steamId) return NextResponse.json({ error: "SteamID gerekli" }, { status: 400 })

  try {
    let premierRating = null
    let playtimeHours = null
    let kdRatio = null
    let headshotPercentage = null
    let isVacBanned = false

    // 1. Leetify'dan Detaylı İstatistikleri Çek
    const leetifyRes = await fetch(`https://api-public.cs-prod.leetify.com/v3/profile?steam64_id=${steamId}&v=3.6`)
    
    if (leetifyRes.ok) {
      const leetifyData = await leetifyRes.json()
      
      // TÜM VERİYİ KONSOLA YAZDIRALIM
      console.log("=== TÜM LEETIFY VERİSİ ===")
      console.log(JSON.stringify(leetifyData, null, 2))

      premierRating = leetifyData.ranks?.premier || null
      
      const stats = leetifyData.stats || leetifyData.lifetime_stats || {}
      console.log("=== SADECE STATS OBJESİ ===")
      console.log(JSON.stringify(stats, null, 2))
      
      // --- K/D ORANI HESAPLAMA ---
      if (stats.kd_ratio !== undefined && stats.kd_ratio !== null) {
        kdRatio = stats.kd_ratio
      } else if (stats.total_kills !== undefined && stats.total_deaths !== undefined && stats.total_deaths > 0) {
        kdRatio = stats.total_kills / stats.total_deaths
      }

      // --- HEADSHOT ORANI HESAPLAMA ---
      if (stats.headshot_percentage !== undefined) {
        headshotPercentage = stats.headshot_percentage
      } else if (stats.accuracy_head !== undefined) {
        headshotPercentage = stats.accuracy_head
      } else if (leetifyData.recent_matches && leetifyData.recent_matches.length > 0) {
        let totalHs = 0
        let validMatches = 0
        leetifyData.recent_matches.slice(0, 30).forEach((m: any) => {
          if (m.stats && m.stats.accuracy_head !== undefined) {
            totalHs += m.stats.accuracy_head
            validMatches++
          } else if (m.accuracy_head !== undefined) {
            totalHs += m.accuracy_head
            validMatches++
          }
        })
        if (validMatches > 0) headshotPercentage = totalHs / validMatches
      }
    }

    // 2. Steam API'den Oynama Süresi ve VAC Ban Durumu Çek
    const steamRes = await fetch(`https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${process.env.STEAM_API_KEY}&steamid=${steamId}&include_appinfo=true&include_played_free_games=true&appids_filter[0]=730`)
    if (steamRes.ok) {
      const steamData = await steamRes.json()
      const games = steamData.response?.games || []
      const cs2Game = games.find((g: any) => g.appid === 730)
      if (cs2Game) playtimeHours = Math.round(cs2Game.playtime_forever / 60)
    }

    const steamBanRes = await fetch(`https://api.steampowered.com/ISteamUser/GetPlayerBans/v1/?key=${process.env.STEAM_API_KEY}&steamids=${steamId}`)
    if (steamBanRes.ok) {
      const banData = await steamBanRes.json()
      const playerBan = banData.players?.[0]
      if (playerBan && (playerBan.VACBanned || playerBan.NumberOfGameBans > 0)) {
        isVacBanned = true
      }
    }

    // 3. Veritabanına Kaydet
    const updateData: any = { is_vac_banned: isVacBanned }
    if (premierRating !== null) updateData.premier_rating = premierRating
    if (playtimeHours !== null) updateData.cs_playtime = playtimeHours
    if (kdRatio !== null && kdRatio !== undefined && !isNaN(kdRatio) && kdRatio > 0) {
      updateData.kd_ratio = Number(Number(kdRatio).toFixed(2))
    }
    if (headshotPercentage !== null && headshotPercentage !== undefined && !isNaN(headshotPercentage)) {
      updateData.headshot_percentage = Number(Number(headshotPercentage).toFixed(1))
    }

    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)
    await supabase.from("profiles").update(updateData).eq("steam_id", steamId)

    return NextResponse.json({ success: true, ...updateData })
  } catch (error) {
    console.error("Güncelleme Hatası:", error)
    return NextResponse.json({ error: "Güncellenemedi" }, { status: 500 })
  }
}