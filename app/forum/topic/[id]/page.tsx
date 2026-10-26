import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import { createClient } from "@supabase/supabase-js"
import Navbar from "@/components/Navbar"
import TopicClient from "./TopicClient"

export const dynamic = 'force-dynamic'

export default async function TopicPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) redirect("/")

  const resolvedParams = await params
  const topicId = resolvedParams.id

  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)
  
  const { data: topic } = await supabase.from("forum_topics")
    .select("*, profiles(display_name, avatar_url, role)")
    .eq("id", topicId)
    .single()

  if (!topic) redirect("/forum")

  const { data: replies } = await supabase.from("forum_replies")
    .select("*, profiles(display_name, avatar_url, role)")
    .eq("topic_id", topicId)
    .order("created_at", { ascending: true })

  // Görüntülenme sayısını 1 artır
  await supabase.from("forum_topics").update({ views: (topic.views || 0) + 1 }).eq("id", topicId)

  return (
    <main className="min-h-screen relative pb-12">
      <Navbar profile={session} />
      <div className="max-w-4xl mx-auto p-6 pt-12 relative z-10">
        <TopicClient topic={topic} replies={replies || []} currentUser={session} />
      </div>
    </main>
  )
}