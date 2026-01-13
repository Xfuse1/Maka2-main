"use client"

import { useEffect } from "react"
import { useDesignStore } from "@/store/design-store"

export default function DesignProvider() {
  const { colors, fonts, layout } = useDesignStore()

  useEffect(() => {
    // Apply settings using CSS variables only (avoids hydration mismatch)
    const root = document.documentElement

    // Apply colors as CSS variables - CSS will use these via var()
    root.style.setProperty("--primary-hex", colors.primary)
    root.style.setProperty("--background-hex", colors.background)
    root.style.setProperty("--foreground-hex", colors.foreground)

    // Apply fonts as CSS variables
    root.style.setProperty("--font-heading", fonts.heading)
    root.style.setProperty("--font-body", fonts.body)

    // Apply layout as CSS variables
    root.style.setProperty("--container-width", layout.containerWidth)
    root.style.setProperty("--radius", layout.radius)
  }, [colors, fonts, layout])

  return null
}
