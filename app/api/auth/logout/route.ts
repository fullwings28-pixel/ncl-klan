import { NextResponse } from "next/server"

export async function POST() {
  // Yeni bir yanıt oluştur ve session cookie'sini sil
  const res = NextResponse.json({ success: true })
  
  res.cookies.set("session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0, // Süreyi 0 yaparak çerezi siliyoruz
    path: "/",
  })

  return res
}