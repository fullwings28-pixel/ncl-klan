import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import { createClient } from "@supabase/supabase-js"
import AdminPanelClient from "./AdminPanelClient"

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const session = await getSession()
  if (!session || session.role !== 'admin') redirect("/dashboard")

  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)
  
  const { data: users } = await supabase.from("profiles").select("*").order("created_at", { ascending: false })
  const { data: logs } = await supabase.from("moderation_logs").select("*, profiles:admin_id(display_name)").order("created_at", { ascending: false }).limit(30)
  const { data: bannedWords } = await supabase.from("banned_words").select("*").order("created_at", { ascending: false })
  const { data: reports } = await supabase.from("reports").select("*, reporter:reporter_id(display_name), reported:reported_user_id(display_name)").order("created_at", { ascending: false }).limit(20)
  
  // YENİ: Login Logları
  const { data: loginLogs } = await supabase
    .from("login_logs")
    .select("*, profiles(display_name, avatar_url)")
    .order("created_at", { ascending: false })
    .limit(20)

  return <AdminPanelClient 
    users={users || []} 
    logs={logs || []} 
    bannedWords={bannedWords || []} 
    reports={reports || []} 
    loginLogs={loginLogs || []} 
    adminProfile={session} 
  />
}