import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import Navbar from "@/components/Navbar"
import DMClient from "./DMClient"

export const dynamic = 'force-dynamic'

export default async function DMPage() {
  const session = await getSession()
  if (!session) redirect("/")

  return (
    <main className="h-screen bg-[#09090b] text-white flex flex-col relative overflow-hidden">
      <Navbar profile={session} />
      <DMClient currentUser={session} />
    </main>
  )
}