"use client"

import { useRef } from "react"
import { useSettingsStore } from "@/store/settings-store"
import type { StoreSettings } from "@/lib/store-settings"

export function StoreInitializer({ settings }: { settings: StoreSettings | null }) {
  const initialized = useRef(false)
  if (!initialized.current && settings) {
    useSettingsStore.setState((state) => ({
      settings: {
        ...state.settings,
        siteName: settings.store_name || state.settings.siteName,
        siteDescription: settings.store_description || state.settings.siteDescription,
      }
    }))
    initialized.current = true
  }
  return null
}
