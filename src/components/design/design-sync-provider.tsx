// makastore-main/src/components/design/design-sync-provider.tsx
"use client"

import { useEffect, type ReactNode } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { getDesignSettings } from "@/lib/supabase/design-settings"
import { useDesignStore } from "@/store/design-store"

interface DesignSyncProviderProps {
  children: ReactNode
}

export function DesignSyncProvider({ children }: DesignSyncProviderProps) {
  const { setColors, setFonts, setLayouts, setLogo } = useDesignStore()

  // تطبيق الألوان فوراً على CSS variables (بدون inline styles عشان نتجنب hydration mismatch)
  const applyColorsImmediately = (colors: any) => {
    if (!colors) return
    const root = document.documentElement

    // Our custom hex vars - CSS will use these via var()
    root.style.setProperty("--primary-hex", colors.primary)
    root.style.setProperty("--secondary-hex", colors.secondary ?? colors.primary)
    root.style.setProperty("--background-hex", colors.background)
    root.style.setProperty("--foreground-hex", colors.foreground)

    // Bridge to shadcn / Tailwind v4 theme vars
    root.style.setProperty("--primary", colors.primary)
    root.style.setProperty("--background", colors.background)
    root.style.setProperty("--foreground", colors.foreground)

    if (colors.secondary) {
      root.style.setProperty("--secondary", colors.secondary)
    }
  }

  // تطبيق الفونتس فوراً
  const applyFontsImmediately = (fonts: any) => {
    if (!fonts) return
    const root = document.documentElement
    root.style.setProperty("--font-heading", fonts.heading)
    root.style.setProperty("--font-body", fonts.body)
  }

  // تطبيق الـ layout فوراً
  const applyLayoutImmediately = (layout: any) => {
    if (!layout) return
    const root = document.documentElement
    root.style.setProperty("--container-width", layout.containerWidth)
    root.style.setProperty("--radius", layout.radius)
  }

  // دالة مساعدة: تاخد settings وتطبقها على الستور + CSS
  const applySettings = (settings: any) => {
    if (!settings) return

    if (settings.colors) {
      setColors(settings.colors)
      applyColorsImmediately(settings.colors)
    }

    if (settings.fonts) {
      setFonts(settings.fonts)
      applyFontsImmediately(settings.fonts)
    }

    if (settings.layout) {
      setLayouts(settings.layout)
      applyLayoutImmediately(settings.layout)
    }

    if (settings.logoUrl) {
      setLogo(settings.logoUrl)
    }
  }

  // 1) تحميل الإعدادات أول ما الموقع يفتح
  useEffect(() => {
    async function loadInitialSettings() {
      try {
        const settings = await getDesignSettings()
        applySettings(settings)
      } catch (error) {
        console.error(
          "[DesignSyncProvider] Failed to load initial design settings",
          error
        )
      }
    }

    loadInitialSettings()
  }, [setColors, setFonts, setLayouts, setLogo])

  // 2) الاستماع لتغييرات Realtime من Supabase وإعادة تحميل الإعدادات
  useEffect(() => {
    const supabase = getSupabaseBrowserClient()

    const channel = supabase
      .channel("design_settings_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "design_settings",
          filter: "site_key=eq.default",
        },
        async () => {
          try {
            const settings = await getDesignSettings()
            applySettings(settings)
          } catch (error) {
            console.error(
              "[DesignSyncProvider] Error syncing design settings (realtime)",
              error
            )
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [setColors, setFonts, setLayouts, setLogo])

  return <>{children}</>
}
