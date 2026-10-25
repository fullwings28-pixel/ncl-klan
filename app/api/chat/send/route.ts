import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { checkProgress } from "@/lib/achievements"
// ... Mesaj kaydedildikten sonra:
await checkProgress(userId, 'send_message')

export async function POST(req: Request) {
  try {
    const { userId, roomId, content } = await req.json()
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)

    // 1. KÜFÜR FİLTRESİ
    const { data: bannedWords } = await supabase.from("banned_words").select("word")
    let filteredContent = content
    if (bannedWords && bannedWords.length > 0) {
      bannedWords.forEach(({ word }) => {
        const regex = new RegExp(word, "gi")
        filteredContent = filteredContent.replace(regex, "*".repeat(word.length))
      })
    }

    // 2. MESAJI KAYDET
    const { data: msgData, error } = await supabase
      .from("messages")
      .insert({ user_id: userId, room_id: roomId, content: filteredContent })
      .select().single()

    if (error) throw error

    // 3. XP EKLE
    const { data: profile } = await supabase.from("profiles").select("xp, level").eq("id", userId).single()
    if (profile) {
      const newXp = (profile.xp || 0) + 5
      const newLevel = Math.floor(newXp / 100) + 1
      await supabase.from("profiles").update({ xp: newXp, level: newLevel }).eq("id", userId)
    }

    // 4. ETİKETLEME
    const mentionMatch = content.match(/(@[\wçÇğĞıİöÖşŞüÜ]+)/g)
    if (mentionMatch) {
      const uniqueMentions = [...new Set(mentionMatch)]
      for (const match of uniqueMentions) {
        const username = match.substring(1)
        if (username.toLowerCase() === 'everyone' || username.toLowerCase() === 'herkes') {
          const { data: allUsers } = await supabase.from("profiles").select("id").neq("id", userId)
          if (allUsers) {
            await supabase.from("notifications").insert(allUsers.map(u => ({
              user_id: u.id, sender_id: userId, type: 'mention', message: `Sohbette @everyone etiketlendi!`, link: `/chat`
            })))
          }
        } else {
          const { data: mentionedUsers } = await supabase.from("profiles").select("id").ilike("display_name", `%${username}%`)
          if (mentionedUsers) {
            for (const mUser of mentionedUsers) {
              await supabase.from("notifications").insert({
                user_id: mUser.id, sender_id: userId, type: 'mention', message: `Sohbette senden bahsedildi!`, link: `/chat`
              })
            }
          }
        }
      }
    }

    return NextResponse.json({ success: true, message: msgData })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}