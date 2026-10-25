import type { Metadata, Viewport } from "next";
import { Rajdhani } from "next/font/google";
import "./globals.css";
import AnnouncementBanner from "@/components/AnnouncementBanner";
import { ToastProvider } from "@/components/Toast";
import Footer from "@/components/Footer"; // <-- YENİ EKLENDİ

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
  themeColor: "#050811",
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
      <body className={`${rajdhani.variable} font-sans bg-[#050811] text-zinc-50 antialiased selection:bg-red-500/30 flex flex-col min-h-screen`}>
        <ToastProvider>
          <AnnouncementBanner />
          
          {/* İçerik Alanı (Sayfalar buraya yüklenir) */}
          <div className="flex-1 flex flex-col">
            {children}
          </div>
          
          {/* Alt Bilgi (Footer) */}
          <Footer />
        </ToastProvider>
      </body>
    </html>
  );
}