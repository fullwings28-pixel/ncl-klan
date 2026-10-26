import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import { createClient } from "@supabase/supabase-js"
import Navbar from "@/components/Navbar"
import Link from "next/link"
import { MessageSquare, Eye, Clock, Plus } from "lucide-react"

export const dynamic = 'force-dynamic'

export default async function ForumPage() {
  const session = await getSession()
  if (!session) redirect("/")

  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)

  // Kategorileri ve her kategorideki son konuları çekelim
  const { data: categories } = await supabase.from("forum_categories").select("*").order("created_at", { ascending: true })
  
  // Her kategori için konu sayısını ve son konuyu bulalım
  const categoriesWithStats = await Promise.all((categories || []).map(async (cat) => {
    const { count } = await supabase.from("forum_topics").select("*", { count: 'exact', head: true }).eq("category_id", cat.id)
    const { data: lastTopic } = await supabase.from("forum_topics")
      .select("*, profiles(display_name)")
      .eq("category_id", cat.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    return { ...cat, topicCount: count || 0, lastTopic }
  }))

  return (
    <main className="min-h-screen relative pb-12">
      <Navbar profile={session} />
      
      <div className="max-w-5xl mx-auto p-6 pt-12 relative z-10">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-black text-white uppercase tracking-widest flex items-center gap-3">
              <MessageSquare className="text-cyan-500" size={32} /> KLAN FORUMU
            </h1>
            <p className="text-zinc-400 text-xs mt-1 uppercase tracking-wider">Taktiklerini paylaş, sorular sor, tartış.</p>
          </div>
          {/* Yeni konu açma butonu (Genel kategoriye yönlendirelim) */}
          <Link href={`/forum/${categoriesWithStats[0]?.id}/create`} className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-3 rounded-sm text-xs font-black uppercase tracking-widest transition flex items-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
            <Plus size={16}/> YENİ KONU AÇ
          </Link>
        </div>

        <div className="space-y-4">
          {categoriesWithStats.map(cat => (
            <Link href={`/forum/${cat.id}`} key={cat.id} className="block hud-panel p-5 rounded-md border border-white/5 hover:border-white/20 hover:bg-white/5 transition group">
              <div className="flex items-center gap-5">
                <div className={`p-4 bg-black/40 rounded-lg border border-white/10 group-hover:scale-105 transition-transform ${cat.color}`}>
                  <MessageSquare size={24} />
                </div>
                <div className="flex-1">
                  <h2 className={`text-lg font-bold uppercase tracking-wider ${cat.color}`}>{cat.name}</h2>
                  <p className="text-zinc-400 text-xs mt-1">{cat.description}</p>
                </div>
                <div className="hidden sm:flex flex-col items-end text-right w-1/3">
                  <div className="text-sm font-black text-white">{cat.topicCount} KONU</div>
                  {cat.lastTopic && (
                    <div className="text-[10px] text-zinc-500 mt-1 truncate max-w-[200px]">
                      Son: <span className="text-zinc-300">{cat.lastTopic.title}</span> - <span className="text-cyan-400">{cat.lastTopic.profiles?.display_name}</span>
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}