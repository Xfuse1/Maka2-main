"use server"

import { getSupabaseAdminClient } from "@/lib/supabase/admin"

export async function uploadPageContentImage(formData: FormData) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return {
      success: false,
      error: "إعدادات الخادم غير مكتملة. يرجى التأكد من أن متغير SUPABASE_SERVICE_ROLE_KEY تم إعداده بشكل صحيح.",
    }
  }

  try {
    const file = formData.get("file") as File
    if (!file) {
      return { success: false, error: "لم يتم تقديم أي ملف" }
    }

    if (!file.type.startsWith("image/")) {
      return { success: false, error: "يجب أن يكون الملف صورة" }
    }

    if (file.size > 5 * 1024 * 1024) {
      return { success: false, error: "يجب أن يكون حجم الملف أقل من 5 ميغابايت" }
    }

    const supabase = getSupabaseAdminClient()

    const fileExt = file.name.split(".").pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    const filePath = `page-content/${fileName}`

    const arrayBuffer = await file.arrayBuffer()

    const { data, error } = await supabase.storage
      .from("page-images")
      .upload(filePath, arrayBuffer, {
        contentType: file.type,
        upsert: false,
      })

    if (error) {
      console.error("Supabase Upload error:", error)
      if (error.message.includes("new row violates row-level security policy")) {
        return { success: false, error: "خطأ في الأذونات. تحقق من سياسات الأمان في Supabase Storage." }
      }
      return { success: false, error: `فشل الرفع: ${error.message}` }
    }

    const { data: urlData } = supabase.storage.from("page-images").getPublicUrl(filePath)

    return {
      success: true,
      url: urlData.publicUrl,
      path: filePath,
    }
  } catch (error: any) {
    console.error("Error in uploadPageContentImage function:", error)
    return { success: false, error: error?.message || "فشل رفع الصورة لسبب غير معروف" }
  }
}

export async function deletePageContentImage(filePath: string) {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return {
        success: false,
        error: "إعدادات الخادم غير مكتملة. يرجى التأكد من أن متغير SUPABASE_SERVICE_ROLE_KEY تم إعداده بشكل صحيح.",
      }
    }

    const supabase = getSupabaseAdminClient()

    const { error } = await supabase.storage.from("page-images").remove([filePath])

    if (error) {
      console.error("Delete error:", error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    console.error("Error deleting page content image:", error)
    return { success: false, error: error?.message || "Failed to delete image" }
  }
}
