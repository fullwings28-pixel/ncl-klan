import { createClient } from "@supabase/supabase-js"

export async function checkProgress(userId: string, actionType: string) {
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)

  // 1. İLGİLİ GÖREVLERİ BUL
  const { data: quests } = await supabase.from("quests").select("*").eq("requirement_type", actionType)
  
  if (quests && quests.length > 0) {
    for (const quest of quests) {
      // Kullanıcının bu göreve ait kaydı var mı?
      const { data: userQuest } = await supabase
        .from("user_quests")
        .select("*")
        .eq("user_id", userId)
        .eq("quest_id", quest.id)
        .single()

      if (!userQuest) {
        // İlk kez yapıyorsa oluştur
        await supabase.from("user_quests").insert({ user_id: userId, quest_id: quest.id, progress: 1 })
      } else if (!userQuest.is_completed) {
        // İlerlemeyi artır
        const newProgress = userQuest.progress + 1
        if (newProgress >= quest.requirement_count) {
          // GÖREV TAMAMLANDI! Ödülleri ver.
          await supabase.from("user_quests").update({ progress: newProgress, is_completed: true }).eq("id", userQuest.id)
          
          // Kullanıcıya XP ve Kredi ekle
          const { data: profile } = await supabase.from("profiles").select("xp, level, balance").eq("id", userId).single()
          if (profile) {
            const newXp = (profile.xp || 0) + quest.reward_xp
            const newLevel = Math.floor(newXp / 100) + 1
            const newBalance = (profile.balance || 0) + quest.reward_credits
            
            await supabase.from("profiles").update({ xp: newXp, level: newLevel, balance: newBalance }).eq("id", userId)
            
            // Bildirim at
            await supabase.from("notifications").insert({
              user_id: userId, type: 'system', message: `Görev Tamamlandı: ${quest.title}! (+${quest.reward_xp} XP, +${quest.reward_credits} Kredi)`, link: `/quests`
            })
          }
        } else {
          // Sadece ilerlemeyi kaydet
          await supabase.from("user_quests").update({ progress: newProgress }).eq("id", userQuest.id)
        }
      }
    }
  }
}