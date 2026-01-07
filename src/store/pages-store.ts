import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface PageSection {
  key: string
  value: string
}

export interface PageItem {
  id: string
  path: string
  title: string
  sections: PageSection[]
}

interface PagesStore {
  pages: PageItem[]
  addPage: (page: Omit<PageItem, "id">) => void
  updatePage: (id: string, updates: Partial<PageItem>) => void
  removePage: (id: string) => void
  upsertSection: (pageId: string, key: string, value: string) => void
  getByPath: (path: string) => PageItem | undefined
  initializeDefaultPages: () => void
}

const defaultPages: Omit<PageItem, "id">[] = [
  {
    path: "/",
    title: "الصفحة الرئيسية",
    sections: [
      { key: "hero.title", value: "مكة" },
      { key: "hero.subtitle", value: "أزياء نسائية راقية" },
      { key: "bestsellers.title", value: "الأكثر مبيعاً" },
      { key: "bestsellers.subtitle", value: "المنتجات الأكثر طلباً من عملائنا" },
      { key: "new.title", value: "المنتجات الجديدة" },
      { key: "new.subtitle", value: "أحدث إضافاتنا من التصاميم العصرية" },
      { key: "featured.title", value: "المنتجات المميزة" },
      { key: "featured.subtitle", value: "تشكيلة مختارة بعناية من أفضل منتجاتنا" },
      { key: "categories.title", value: "تسوقي حسب الفئة" },
      {
        key: "footer.about",
        value: "متجر مكة للأزياء النسائية الراقية - نقدم لكِ أفضل التصاميم العصرية التي تجمع بين الأصالة والحداثة",
      },
      { key: "footer.phone", value: "01234567890" },
      { key: "footer.email", value: "info@mecca-fashion.com" },
    ],
  },
  {
    path: "/about",
    title: "من نحن",
    sections: [
      { key: "hero.title", value: "من نحن" },
      { key: "hero.subtitle", value: "رحلتنا في عالم الموضة المحتشمة" },
      { key: "story.title", value: "قصتنا" },
      {
        key: "story.paragraph1",
        value:
          "بدأت رحلة مكة من حلم بسيط: توفير أزياء نسائية راقية تجمع بين الأناقة العصرية والاحتشام الأصيل. نؤمن بأن كل امرأة تستحق أن تشعر بالثقة والجمال في ملابسها، دون التنازل عن قيمها ومبادئها.",
      },
      {
        key: "story.paragraph2",
        value:
          "منذ انطلاقتنا، كرسنا جهودنا لتقديم تصاميم فريدة تعكس الذوق الرفيع والجودة العالية. نختار أقمشتنا بعناية فائقة، ونهتم بأدق التفاصيل في كل قطعة نقدمها لكِ.",
      },
      {
        key: "story.paragraph3",
        value:
          "اليوم، نفخر بخدمة آلاف العميلات اللواتي وثقن بنا لنكون جزءاً من إطلالاتهن المميزة. رضاكِ هو هدفنا، وأناقتكِ هي نجاحنا.",
      },
      { key: "values.title", value: "قيمنا" },
      { key: "values.passion.title", value: "الشغف" },
      { key: "values.passion.description", value: "نحب ما نقوم به ونسعى دائماً لتقديم الأفضل لعميلاتنا" },
      { key: "values.quality.title", value: "الجودة" },
      { key: "values.quality.description", value: "نختار أفضل الأقمشة ونهتم بأدق التفاصيل في كل منتج" },
      { key: "values.customers.title", value: "العملاء" },
      { key: "values.customers.description", value: "رضاكِ وسعادتكِ هما أولويتنا القصوى في كل ما نقدمه" },
      { key: "values.innovation.title", value: "الابتكار" },
      { key: "values.innovation.description", value: "نواكب أحدث صيحات الموضة مع الحفاظ على الأصالة" },
      { key: "cta.title", value: "ابدئي رحلتكِ معنا" },
      { key: "cta.subtitle", value: "اكتشفي مجموعتنا الحصرية من الأزياء الراقية" },
      { key: "cta.button", value: "تسوقي الآن" },
    ],
  },
  {
    path: "/contact",
    title: "تواصل معنا",
    sections: [
      { key: "hero.title", value: "تواصل معنا" },
      { key: "hero.subtitle", value: "نحن هنا للإجابة على استفساراتك" },
      { key: "form.title", value: "أرسل لنا رسالة" },
      { key: "form.subtitle", value: "سنرد عليك في أقرب وقت ممكن" },
      { key: "contact.phone", value: "01234567890" },
      { key: "contact.whatsapp", value: "01234567890" },
      { key: "contact.email", value: "info@mecca-fashion.com" },
      { key: "contact.address", value: "القاهرة، مصر" },
      { key: "hours.title", value: "ساعات العمل" },
      { key: "hours.weekdays", value: "السبت - الخميس: 9:00 ص - 9:00 م" },
      { key: "hours.friday", value: "الجمعة: 2:00 م - 9:00 م" },
    ],
  },
  {
    path: "/abayas",
    title: "عبايات",
    sections: [
      { key: "hero.title", value: "عبايات" },
      {
        key: "hero.description",
        value: "اكتشفي مجموعتنا الفاخرة من العبايات المصممة بعناية لتمنحك الأناقة والراحة في آن واحد",
      },
    ],
  },
  {
    path: "/cardigans",
    title: "كارديجان",
    sections: [
      { key: "hero.title", value: "كارديجان" },
      { key: "hero.description", value: "تشكيلة أنيقة من الكارديجان العصري" },
    ],
  },
  {
    path: "/suits",
    title: "بدل",
    sections: [
      { key: "hero.title", value: "بدل" },
      { key: "hero.description", value: "بدل نسائية راقية للمناسبات الخاصة" },
    ],
  },
  {
    path: "/dresses",
    title: "فساتين",
    sections: [
      { key: "hero.title", value: "فساتين" },
      { key: "hero.description", value: "فساتين محتشمة وأنيقة لكل المناسبات" },
    ],
  },
  {
    path: "/return-policy",
    title: "سياسة الإرجاع",
    sections: [
      { key: "hero.title", value: "سياسة الإرجاع والاستبدال" },
      {
        key: "content",
        value: "نحن نهتم برضاك التام عن مشترياتك. يمكنك إرجاع أو استبدال المنتجات خلال 14 يوماً من تاريخ الاستلام.",
      },
    ],
  },
  {
    path: "/policies",
    title: "سياسات الموقع",
    sections: [
      { key: "privacy_policy", value: "هنا يتم كتابة سياسة الخصوصية الخاصة بالموقع..." },
      { key: "return_policy", value: "هنا يتم كتابة سياسة الاسترجاع والاستبدال الخاصة بالموقع..." },
    ],
  },
]

export const usePagesStore = create<PagesStore>()(
  persist(
    (set, get) => ({
      pages: [],

      addPage: (page) =>
        set((state) => ({
          pages: [
            ...state.pages,
            {
              ...page,
              id: crypto.randomUUID(),
            },
          ],
        })),

      updatePage: (id, updates) =>
        set((state) => ({
          pages: state.pages.map((page) => (page.id === id ? { ...page, ...updates } : page)),
        })),

      removePage: (id) =>
        set((state) => ({
          pages: state.pages.filter((page) => page.id !== id),
        })),

      upsertSection: (pageId, key, value) =>
        set((state) => ({
          pages: state.pages.map((page) => {
            if (page.id !== pageId) return page

            const existingIndex = page.sections.findIndex((s) => s.key === key)

            if (existingIndex >= 0) {
              // Update existing section
              const newSections = [...page.sections]
              newSections[existingIndex] = { key, value }
              return { ...page, sections: newSections }
            } else {
              // Add new section
              return {
                ...page,
                sections: [...page.sections, { key, value }],
              }
            }
          }),
        })),

      getByPath: (path) => {
        return get().pages.find((page) => page.path === path)
      },

      initializeDefaultPages: () => {
        const currentPages = get().pages
        if (currentPages.length === 0) {
          set({
            pages: defaultPages.map((page) => ({
              ...page,
              id: crypto.randomUUID(),
            })),
          })
          // After seeding defaults, attempt to fetch the store name and update hero titles.
          ;(async () => {
            try {
              const res = await fetch('/api/store/name')
              if (res.ok) {
                const json = await res.json()
                const storeName = json?.store_name
                if (storeName) {
                  set((state) => ({
                    pages: state.pages.map((p) => ({
                      ...p,
                      sections: p.sections.map((s) =>
                        s.key === 'hero.title' ? { ...s, value: storeName } : s
                      ),
                    })),
                  }))
                }
              }
            } catch (e) {
              // ignore network errors; defaults remain
              console.error('Failed to update hero.title with store name:', e)
            }
          })()
        }
      },
    }),
    {
      name: "pages-storage",
    },
  ),
)
