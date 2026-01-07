// makastore-main/src/lib/supabase/design-settings.ts

// قيم افتراضية لو حصل أي خطأ أو لسه مفيش بيانات في الجدول
const defaultColors = {
  primary: "#FFB6C1",
  secondary: "#a13030",
  background: "#FFFFFF",
  foreground: "#1a1a1a",
}

const defaultFonts = {
  heading: "Cairo",
  body: "Cairo",
}

const defaultLayout = {
  containerWidth: "1280px",
  radius: "0.5rem",
}

/**
 * حفظ إعدادات التصميم عبر API route
 */
export async function saveDesignSettings(key: string, value: any): Promise<void> {
  try {
    const response = await fetch("/api/admin/design/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || "فشل حفظ الإعدادات")
    }
  } catch (error: any) {
    const message = error?.message ?? "حدث خطأ أثناء حفظ الإعدادات"
    console.error("[saveDesignSettings] Error:", error)
    throw new Error(message)
  }
}

/**
 * قراءة إعدادات التصميم من API route
 * (مصدر الحقيقة الوحيد هو /api/admin/design/settings)
 */
export async function getDesignSettings(): Promise<any> {
  try {
    const response = await fetch("/api/admin/design/settings", {
      method: "GET",
      cache: "no-store",
    })

    if (!response.ok) {
      console.error("[getDesignSettings] HTTP error:", response.status)
      return {
        colors: defaultColors,
        fonts: defaultFonts,
        layout: defaultLayout,
        logoUrl: null,
      }
    }

    const data = await response.json()
    const settings = data?.settings || {}

    return {
      colors: settings.colors ?? defaultColors,
      fonts: settings.fonts ?? defaultFonts,
      layout: settings.layout ?? defaultLayout,
      // حالياً API مش راجع logoUrl، فبنرجع null لحد ما نزبطه بعدين
      logoUrl: settings.logoUrl ?? null,
    }
  } catch (error) {
    console.error("[getDesignSettings] Error:", error)
    return {
      colors: defaultColors,
      fonts: defaultFonts,
      layout: defaultLayout,
      logoUrl: null,
    }
  }
}
