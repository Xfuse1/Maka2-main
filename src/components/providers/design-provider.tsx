"use client"

import { useEffect } from "react"
import { useDesignStore } from "@/store/design-store"

export default function DesignProvider() {
  const { colors, fonts, layout } = useDesignStore()

  useEffect(() => {
    // Apply settings whenever colors/fonts/layout change
    const root = document.documentElement
    const body = document.body
    
    // Apply colors directly as hex (more reliable)
    root.style.setProperty("--primary-hex", colors.primary)
    root.style.setProperty("--background-hex", colors.background)
    root.style.setProperty("--foreground-hex", colors.foreground)
    
    // Apply background directly to body and html
    body.style.backgroundColor = colors.background
    root.style.backgroundColor = colors.background
    
    // Apply text color
    body.style.color = colors.foreground
    
    // Apply fonts
    root.style.setProperty("--font-heading", fonts.heading)
    root.style.setProperty("--font-body", fonts.body)
    body.style.fontFamily = fonts.body
    
    // Apply layout
    root.style.setProperty("--container-width", layout.containerWidth)
    root.style.setProperty("--radius", layout.radius)
  }, [colors, fonts, layout])

  return null
}
