import "@/styles/globals.css"
import type React from "react"
import type { Metadata, Viewport } from "next"
import { Cairo } from "next/font/google"
import { getStoreSettingsServer } from "@/lib/store-settings"
import { Suspense } from "react"
import DesignProvider from "@/components/providers/design-provider"
import { DesignSyncProvider } from "@/components/design/design-sync-provider"
import { WebVitals } from "@/components/web-vitals"
import { StoreInitializer } from "@/components/store-initializer"

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
  display: "swap",
  preload: true,
  fallback: ["system-ui", "arial"],
  adjustFontFallback: true,
})

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#FFB6C1",
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getStoreSettingsServer()
  return {
    title: settings?.store_name || "متجرك - متجر إلكتروني",
    description: settings?.store_description || "اكتشفي مجموعتنا الحصرية من العبايات والكارديجان والبدل والفساتين",
    generator: "v0.app",
    // Performance hints
    other: {
      'dns-prefetch': '//tpkfgimtgduiiiscdqyq.supabase.co',
    },
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const settings = await getStoreSettingsServer()

  return (
    <html lang="ar" dir="rtl">
      <head>
        {/* DNS Prefetch for faster connections */}
        <link rel="dns-prefetch" href="https://tpkfgimtgduiiiscdqyq.supabase.co" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
        
        {/* Preconnect for critical resources */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://tpkfgimtgduiiiscdqyq.supabase.co" />
      </head>
      <body suppressHydrationWarning className={`font-sans ${cairo.variable} antialiased text-foreground bg-background`}>
        <WebVitals />
        <DesignProvider />
        <DesignSyncProvider>
          <StoreInitializer settings={settings} />
          <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>}>{children}</Suspense>
        </DesignSyncProvider>
      </body>
    </html>
  )
}
