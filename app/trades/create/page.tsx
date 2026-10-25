import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import Navbar from "@/components/Navbar"
import CreateTradeClient from "./CreateTradeClient"

export const dynamic = 'force-dynamic'

export default async function CreateTradePage({ searchParams }: { searchParams: { user: string } }) {
  const session = await getSession()
  if (!session) redirect("/")
  
  const targetUserId = searchParams.user
  if (!targetUserId) redirect("/trades")

  return (
    <main className="min-h-screen relative pb-12">
      <Navbar profile={session} />
      <div className="max-w-4xl mx-auto p-6 pt-12 relative z-10">
        <CreateTradeClient currentUser={session} targetUserId={targetUserId} />
      </div>
    </main>
  )
}