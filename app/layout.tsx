import type { Metadata, Viewport } from "next";
import { Rajdhani } from "next/font/google";
import "./globals.css";
import AnnouncementBanner from "@/components/AnnouncementBanner";
import { ToastProvider } from "@/components/Toast";

// Rajdhani fontu (CS2 HUD tarzı)
const rajdhani = Rajdhani({ 
  weight: ['400', '500', '600', '700'],
  subsets: ["latin"],
  variable: "--font-rajdhani"
});

export const metadata: Metadata = {
  title: "NCL Klan Merkezi",
  description: "Arkadaşlarınla CS2 oyna, sohbet et ve ranklarını takip et.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "NCL Klan",
  },
};

export const viewport: Viewport = {
  themeColor: "#050811", // Yeni arka plan rengimiz
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className={`${rajdhani.variable} font-sans bg-[#050811] text-zinc-50 antialiased selection:bg-red-500/30`}>
        <ToastProvider>
          <AnnouncementBanner />
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}