import { getSupabaseAdminClient, getStoreIdFromRequest } from "@/lib/supabase/admin";
import type { HeroSlide } from "./homepage";

/**
 * Fetches ALL hero slides (active and inactive) for current store using Admin client.
 * Server-side only.
 */
export async function getAllHeroSlidesAdmin(): Promise<HeroSlide[]> {
  const supabase = getSupabaseAdminClient();
  const storeId = await getStoreIdFromRequest();
  
  const { data, error } = await supabase
    .from('hero_slides')
    .select('*')
    .eq('store_id', storeId)
    .order('display_order', { ascending: true });

  if (error) {
    console.error("[Admin] Error fetching hero slides:", error);
    throw new Error(error.message);
  }

  return data || [];
}

export async function createHeroSlide(slide: Omit<HeroSlide, "id" | "created_at" | "updated_at">) {
  const supabase = getSupabaseAdminClient() as any;
  const storeId = await getStoreIdFromRequest();
  
  const { data, error } = await supabase
    .from('hero_slides')
    .insert([{ ...slide, store_id: storeId }])
    .select()
    .single();

  if (error) {
    console.error("[Admin] Error creating hero slide:", error);
    throw new Error(error.message);
  }

  return data;
}

export async function updateHeroSlide(id: string, updates: Partial<HeroSlide>) {
  const supabase = getSupabaseAdminClient() as any;
  const storeId = await getStoreIdFromRequest();
  
  const { data, error } = await supabase
    .from('hero_slides')
    .update(updates)
    .eq('id', id)
    .eq('store_id', storeId)
    .select()
    .single();

  if (error) {
    console.error("[Admin] Error updating hero slide:", error);
    throw new Error(error.message);
  }

  return data;
}

export async function deleteHeroSlide(id: string) {
  const supabase = getSupabaseAdminClient();
  const storeId = await getStoreIdFromRequest();
  
  const { error } = await supabase
    .from('hero_slides')
    .delete()
    .eq('id', id)
    .eq('store_id', storeId);

  if (error) {
    console.error("[Admin] Error deleting hero slide:", error);
    throw new Error(error.message);
  }

  return true;
}
