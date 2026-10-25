import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import Navbar from "@/components/Navbar"
import InventoryClient from "./InventoryClient"

export const dynamic = 'force-dynamic'

export default async function InventoryPage() {
  const session = await getSession()
  if (!session) redirect("/")

  return (
    <main className="min-h-screen relative">
      <Navbar profile={session} />
      <div className="max-w-7xl mx-auto p-8 pt-12 relative z-10">
        <InventoryClient currentUser={session} />
      </div>
    </main>
  )
}