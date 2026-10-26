import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import Navbar from "@/components/Navbar"
import CreateTopicClient from "./CreateTopicClient"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export const dynamic = 'force-dynamic'

export default async function CreateTopicPage({ params }: { params: Promise<{ categoryId: string }> }) {
  const session = await getSession()
  if (!session) redirect("/")

  const resolvedParams = await params
  const categoryId = resolvedParams.categoryId

  return (
    <main className="min-h-screen relative pb-12">
      <Navbar profile={session} />
      <div className="max-w-3xl mx-auto p-6 pt-12 relative z-10">
        <Link href={`/forum/${categoryId}`} className="text-zinc-400 hover:text-white text-xs flex items-center gap-2 mb-6 uppercase tracking-widest transition">
          <ArrowLeft size={16}/> Geri Dön
        </Link>
        <CreateTopicClient categoryId={categoryId} />
      </div>
    </main>
  )
}