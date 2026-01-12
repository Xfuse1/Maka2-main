import { NextResponse } from "next/server"
import { getStoreSettingsServer } from "@/lib/store-settings"
import { getCachedStoreSettings } from "@/lib/cache/settings-cache"
import { DEFAULT_STORE_ID, getStoreIdFromRequest } from "@/lib/supabase/admin"

// Enable caching for this route
export const revalidate = 3600 // 1 hour

export async function GET() {
  try {
    let storeId: string
    try {
      storeId = await getStoreIdFromRequest()
    } catch {
      storeId = DEFAULT_STORE_ID
    }

    // Use cached version
    const settings = await getCachedStoreSettings(storeId, getStoreSettingsServer)
    
    return NextResponse.json({ 
      settings,
      cached: true,
      storeId,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      }
    })
  } catch (error: any) {
    console.error('[store-settings] Error:', error)
    return NextResponse.json(
      { settings: null, error: error.message },
      { status: 500 }
    )
  }
}
