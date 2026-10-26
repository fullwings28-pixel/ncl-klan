import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import { createClient } from "@supabase/supabase-js"
import Navbar from "@/components/Navbar"
import Link from "next/link"
import { Plus, ArrowLeft, MessageSquare, Eye, Clock } from "lucide-react"

export const dynamic = 'force-dynamic'

export default async function CategoryPage({ params }: { params: Promise<{ categoryId: string }> }) {
  const session = await getSession()
  if (!session) redirect("/")

  const resolvedParams = await params
  const categoryId = resolvedParams.categoryId

  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)
  
  const { data: category } = await supabase.from("forum_categories").select("*").eq("id", categoryId).single()
  if (!category) redirect("/forum")

  const { data: topics } = await supabase.from("forum_topics")
    .select("*, profiles(display_name, avatar_url)")
    .eq("category_id", categoryId)
    .order("created_at", { ascending: false })

  return (
    <main className="min-h-screen relative pb-12">
      <Navbar profile={session} />
      
      <div className="max-w-5xl mx-auto p-6 pt-12 relative z-10">
        <Link href="/forum" className="text-zinc-400 hover:text-white text-xs flex items-center gap-2 mb-6 uppercase tracking-widest transition">
          <ArrowLeft size={16}/> Foruma Dön
        </Link>

        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4 hud-panel p-6 rounded-md border border-white/5">
          <div>
            <h1 className={`text-2xl font-black uppercase tracking-widest ${category.color}`}>{category.name}</h1>
            <p className="text-zinc-400 text-xs mt-1">{category.description}</p>
          </div>
          <Link href={`/forum/${categoryId}/create`} className="bg-cyan-600 hover:bg-cyan-500 text-white px-5 py-2.5 rounded-sm text-xs font-black uppercase tracking-widest transition flex items-center gap-2">
            <Plus size={16}/> YENİ KONU AÇ
          </Link>
        </div>

        <div className="space-y-3">
          {topics?.map(topic => (
            <Link href={`/forum/topic/${topic.id}`} key={topic.id} className="block hud-panel p-4 rounded-md border border-white/5 hover:border-cyan-500/30 transition flex items-center gap-4 group">
              <img src={topic.profiles?.avatar_url} className="w-10 h-10 rounded-md border border-white/10 grayscale-[30%] group-hover:grayscale-0" />
              <div className="flex-1">
                <h2 className="text-base font-bold text-white group-hover:text-cyan-400 transition-colors">{topic.title}</h2>
                <div className="text-[10px] text-zinc-500 uppercase tracking-wider mt-1 flex items-center gap-3">
                  <span>Açan: <span className="text-zinc-300">{topic.profiles?.display_name}</span></span>
                  <span className="flex items-center gap-1"><Clock size={10}/> {new Date(topic.created_at).toLocaleDateString('tr-TR')}</span>
                </div>
              </div>
              <div className="text-right hidden sm:block text-zinc-500">
                <div className="flex items-center gap-1 text-xs font-bold"><Eye size={14}/> {topic.views} Görüntüleme</div>
              </div>
            </Link>
          ))}
          {topics?.length === 0 && (
            <div className="text-center py-20 hud-panel rounded-md text-zinc-500 uppercase tracking-widest text-xs font-bold border-dashed">
              Henüz bu kategoride konu yok. İlk konuyu sen aç!
            </div>
          )}
        </div>
      </div>
    </main>
  )
}