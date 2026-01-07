"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import { nanoid } from "nanoid"

export type PageSection = { key: string; value: string }
export type PageItem = { id: string; path: string; title: string; sections: PageSection[] }

type PagesState = {
  pages: PageItem[]
  addPage: (p: Omit<PageItem, "id">) => void
  updatePage: (id: string, patch: Partial<PageItem>) => void
  removePage: (id: string) => void
  upsertSection: (id: string, key: string, value: string) => void
  getByPath: (path: string) => PageItem | undefined
}

const initialPages: PageItem[] = [
  {
    id: nanoid(),
    path: "/",
    title: "الصفحة الرئيسية",
    sections: [
      { key: "hero.title", value: "عبايات فاخرة" },
      { key: "hero.subtitle", value: "تشكيلة واسعة من العبايات الأنيقة" },
      { key: "hero.cta", value: "اكتشفي المزيد" },
    ],
  },
  {
    id: nanoid(),
    path: "/abayas",
    title: "صفحة العبايات",
    sections: [
      { key: "heading", value: "عبايات" },
      { key: "intro", value: "اكتشفي مجموعتنا الفاخرة من العبايات" },
    ],
  },
  {
    id: nanoid(),
    path: "/about",
    title: "من نحن",
    sections: [{ key: "content", value: "نص تعريفي عن المتجر..." }],
  },
]

export const usePagesStore = create<PagesState>()(
  persist(
    (set, get) => ({
      pages: initialPages,
      addPage: (p) => set((s) => ({ pages: [...s.pages, { ...p, id: nanoid() }] })),
      updatePage: (id, patch) =>
        set((s) => ({ pages: s.pages.map((pg) => (pg.id === id ? { ...pg, ...patch } : pg)) })),
      removePage: (id) => set((s) => ({ pages: s.pages.filter((pg) => pg.id !== id) })),
      upsertSection: (id, key, value) =>
        set((s) => ({
          pages: s.pages.map((pg) => {
            if (pg.id !== id) return pg
            const i = pg.sections.findIndex((sec) => sec.key === key)
            if (i === -1) return { ...pg, sections: [...pg.sections, { key, value }] }
            const sections = [...pg.sections]; sections[i] = { key, value }
            return { ...pg, sections }
          }),
        })),
      getByPath: (path) => get().pages.find((p) => p.path === path),
    }),
    { name: "mecca-pages-store" },
  ),
)
