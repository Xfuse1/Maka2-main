/**
 * Upload logo to Supabase storage and update design_settings via API route
 * Uses server-side admin client to bypass RLS
 */
export async function uploadLogo(file: File): Promise<string> {
  try {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch('/api/admin/design/logo', {
      method: 'POST',
      body: formData,
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'فشل رفع الشعار')
    }

    if (!data.success || !data.url) {
      throw new Error('رد غير صالح من الخادم')
    }

    return data.url
  } catch (error: any) {
    const message = error?.message ?? 'حدث خطأ أثناء رفع الشعار'
    console.error('[uploadLogo] Error:', error)
    throw new Error(message)
  }
}

/**
 * Get current logo URL from design_settings via API route
 */
export async function getLogoUrl(): Promise<string> {
  try {
    const response = await fetch('/api/admin/design/logo', {
      method: 'GET',
    })

    const data = await response.json()

    return data.url || '/placeholder-logo.svg'
  } catch (error) {
    console.error('[getLogoUrl] Error:', error)
    return '/placeholder-logo.svg' // fallback
  }
}

/**
 * Delete old logo from storage (cleanup)
 * Note: This should also use an API route if needed, but for now it's optional cleanup
 */
export async function deleteOldLogo(fileName: string): Promise<void> {
  // This function is currently not critical - logo cleanup can be done manually
  // or via a dedicated API route if needed in the future
}
