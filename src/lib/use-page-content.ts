"use client"

import { useEffect, useMemo, useCallback } from "react"
import { usePagesStore } from "@/store/pages-store"

/**
 * يشغّل تهيئة الصفحات الافتراضية مرّة واحدة عند تركيب التطبيق.
 * استخدميه في root layout أو أي مكان يُحمَّل دائمًا.
 */
export function useInitializePages() {
  const initializeDefaultPages = usePagesStore((s) => s.initializeDefaultPages)
  useEffect(() => {
    initializeDefaultPages()
    // Auto-seed policies page on admin load if missing
    fetch('/api/seed-policies', { method: 'POST' }).catch((err) => console.error('Policies seed error:', err))
  }, [])
}

/** يرجّع كائن الصفحة لمسار معيّن (أو undefined لو مش موجودة) */
export function usePage(path: string) {
  return usePagesStore((s) => s.getByPath(path))
}

/** يقرأ قيمة Section نصّية من صفحة معيّنة؛ يرجّع fallback لو غير موجود */
export function usePageSection(path: string, key: string, fallback = ""): string {
  const page = usePagesStore((s) => s.getByPath(path))
  const val = useMemo(() => page?.sections.find((s) => s.key === key)?.value, [page, key])
  return val ?? fallback
}

/**
 * يقرأ Section على أنه JSON (آمن ضد الأخطاء):
 * - يحاول JSON.parse
 * - لو فشل أو غير موجود يرجّع fallback
 */
export function usePageJSONSection<T = unknown>(path: string, key: string, fallback: T): T {
  const raw = usePageSection(path, key, "")
  return useMemo(() => {
    if (!raw) return fallback
    try {
      return JSON.parse(raw) as T
    } catch {
      return fallback
    }
  }, [raw, fallback])
}

/**
 * مساعد للكتابة/التعديل على أقسام الصفحة من أي كومبوننت.
 * يوفّر setSection/removeSection/renameSection بشكل مباشر.
 */
export function usePageEditor(path: string) {
  const store = usePagesStore()
  const page = usePagesStore((s) => s.getByPath(path))

  const setSection = useCallback(
    (key: string, value: string) => {
      if (!page) return
      store.upsertSection(page.id, key, value)
    },
    [page, store],
  )

  const removeSection = useCallback(
    (key: string) => {
      if (!page) return
      const next = page.sections.filter((s) => s.key !== key)
      store.updatePage(page.id, { sections: next })
    },
    [page, store],
  )

  const renameSection = useCallback(
    (oldKey: string, newKey: string) => {
      if (!page) return
      const idx = page.sections.findIndex((s) => s.key === oldKey)
      if (idx === -1) return
      const next = [...page.sections]
      next[idx] = { ...next[idx], key: newKey }
      store.updatePage(page.id, { sections: next })
    },
    [page, store],
  )

  return { page, setSection, removeSection, renameSection }
}
