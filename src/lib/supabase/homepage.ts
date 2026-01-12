import { createClient } from "@/lib/supabase/client";

export interface HeroSlide {
    id: string;
    title_ar: string;
    title_en?: string | null;
    subtitle_ar?: string | null;
    subtitle_en?: string | null;
    image_url: string;
    link_url?: string | null;
    display_order: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

/**
 * Fetches all active hero slides via API for store isolation.
 */
export async function getAllHeroSlides(): Promise<HeroSlide[]> {
  try {
    const res = await fetch('/api/hero-slides')
    if (!res.ok) {
      console.error("Error fetching hero slides: HTTP", res.status)
      return []
    }
    const json = await res.json()
    return json.data || []
  } catch (err) {
    console.error("Error fetching hero slides:", err)
    return []
  }
}

// ============================================================================
// Admin functions are in homepage-admin.ts to avoid client-side import issues
// ============================================================================
