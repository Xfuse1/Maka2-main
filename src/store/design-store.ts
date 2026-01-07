"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

type DesignState = {
  colors: {
    primary: string
    secondary: string
    background: string
    foreground: string
  }
  fonts: {
    heading: string
    body: string
  }
  layout: {
    containerWidth: string
    radius: string
  }
  logoUrl: string
  isLoaded: boolean

  // setters
  setColor: (key: keyof DesignState["colors"], value: string) => void
  setFont: (key: keyof DesignState["fonts"], value: string) => void
  setLayout: (key: keyof DesignState["layout"], value: string) => void
  setLogo: (url: string) => void
  setColors: (colors: DesignState["colors"]) => void
  setFonts: (fonts: DesignState["fonts"]) => void
  setLayouts: (layout: DesignState["layout"]) => void
  reset: () => void
}

const defaults: Omit<DesignState, "setColor" | "setFont" | "setLayout" | "setLogo" | "setColors" | "setFonts" | "setLayouts" | "reset"> = {
  colors: {
    primary: "#FFB6C1",
    secondary: "#a13030",
    background: "#FFFFFF",
    foreground: "#1a1a1a",
  },
  fonts: {
    heading: "Cairo",
    body: "Cairo",
  },
  layout: {
    containerWidth: "1280px",
    radius: "0.5rem",
  },
  logoUrl: "/placeholder-logo.svg",
  isLoaded: false,
}

export const useDesignStore = create<DesignState>()(
  persist(
    (set, get) => ({
      ...defaults,
      setColor: (key, value) => {
        const newColors = { ...get().colors, [key]: value }
        set({ colors: newColors })
      },
      setFont: (key, value) => {
        const newFonts = { ...get().fonts, [key]: value }
        set({ fonts: newFonts })
      },
      setLayout: (key, value) => {
        const newLayout = { ...get().layout, [key]: value }
        set({ layout: newLayout })
      },
      setLogo: (url) => set(() => ({ logoUrl: url })),
      setColors: (colors) => set(() => ({ colors })),
      setFonts: (fonts) => set(() => ({ fonts })),
      setLayouts: (layout) => set(() => ({ layout })),
      reset: () => set(() => ({ ...defaults })),
    }),
    { name: "mecca-design-store" },
  ),
)
