import { jwtVerify } from "jose"
import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"

export async function getSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get("session")?.value
  if (!token) return null

  try {
    const secret = new TextEncoder().encode(process.env.SESSION_SECRET!)
    const { payload } = await jwtVerify(token, secret)

    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    )
    
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", payload.sub as string)
      .single()

    return profile
  } catch (error) {
    return null
  }
}