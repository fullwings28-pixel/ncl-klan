import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import Navbar from "@/components/Navbar"
import TradesClient from "./TradesClient"

export const dynamic = 'force-dynamic'

export default async function TradesPage() {
  const session = await getSession()
  if (!session) redirect("/")

  return (
    <main className="min-h-screen relative pb-12">
      <Navbar profile={session} />
      <div className="max-w-6xl mx-auto p-6 pt-12 relative z-10">
        <TradesClient currentUser={session} />
      </div>
    </main>
  )
}