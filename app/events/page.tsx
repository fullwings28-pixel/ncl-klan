import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import Navbar from "@/components/Navbar"
import EventsClient from "./EventsClient"

export const dynamic = 'force-dynamic'

export default async function EventsPage() {
  const session = await getSession()
  if (!session) redirect("/")

  return (
    <main className="min-h-screen relative">
      <Navbar profile={session} />
      <div className="max-w-6xl mx-auto p-8 pt-12 relative z-10">
        <EventsClient currentUser={session} />
      </div>
    </main>
  )
}