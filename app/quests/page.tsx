import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import Navbar from "@/components/Navbar"
import QuestsClient from "./QuestsClient"

export const dynamic = 'force-dynamic'

export default async function QuestsPage() {
  const session = await getSession()
  if (!session) redirect("/")

  return (
    <main className="min-h-screen relative pb-12">
      <Navbar profile={session} />
      <div className="max-w-5xl mx-auto p-8 pt-12 relative z-10">
        <QuestsClient currentUser={session} />
      </div>
    </main>
  )
}