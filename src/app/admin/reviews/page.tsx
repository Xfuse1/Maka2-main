
import { createClient } from "@/lib/supabase/server";
import { getStoreIdFromRequest } from "@/lib/supabase/admin";
import AdminReviewsClient from "@/components/admin/AdminReviewsClient";

export const dynamic = "force-dynamic";

async function getReviews(filterStatus?: 'all' | 'approved' | 'rejected' | 'pending') {
  try {
    const supabase: any = await createClient();
    const storeId = await getStoreIdFromRequest();

    // Fetch reviews first (without relationship) - FILTER BY STORE
    let query: any = supabase
      .from("product_reviews")
      .select("*")
      .eq("store_id", storeId)
      .order("created_at", { ascending: false });

    // Apply server-side filter based on is_approved boolean
    if (filterStatus === 'approved') {
      query = query.eq('is_approved', true)
    } else if (filterStatus === 'rejected') {
      query = query.eq('is_approved', false)
    } else if (filterStatus === 'pending') {
      // pending => is_approved is null (not yet decided)
      query = query.is('is_approved', null)
    }

    const { data: reviews, error } = await query;

    if (error) {
      console.error("Error fetching reviews:", {
        message: error.message ?? String(error),
        details: error.details ?? undefined,
        hint: error.hint ?? undefined,
        code: error.code ?? undefined,
      });
      return [];
    }

    if (!Array.isArray(reviews) || reviews.length === 0) return [];

    // Fetch product names separately (workaround for partitioned tables)
    const productIds = [...new Set(reviews.map((r: { product_id: string }) => r.product_id))];
    const { data: products } = await supabase
      .from("products")
      .select("id, name_ar")
      .eq("store_id", storeId)
      .in("id", productIds);

    // Attach product info to reviews
    const reviewsWithProducts = reviews.map((review: { product_id: string }) => ({
      ...review,
      product: (products || []).find((p: { id: string }) => p.id === review.product_id) || null
    }));

    return reviewsWithProducts;
  } catch (err) {
    console.error("Unexpected error in getReviews:", err instanceof Error ? { message: err.message, stack: err.stack } : err);
    return [];
  }
}


export default async function ReviewsPage({ searchParams }: { searchParams?: { status?: string | string[] } }) {
  // Normalize searchParams.status which may be string or string[]
  const rawStatus = searchParams?.status as string | string[] | undefined;
  const statusStr = Array.isArray(rawStatus) ? rawStatus[0] : rawStatus;
  const allowed = ['all', 'approved', 'rejected', 'pending'];
  const statusParam = allowed.includes(statusStr || '') ? (statusStr as 'all' | 'approved' | 'rejected' | 'pending') : 'all';

  const reviews = await getReviews(statusParam);

  return (
    <div className="w-full p-4 md:p-8">
      <div className="flex items-center py-4">
        <h1 className="text-2xl font-bold">إدارة التقييمات</h1>
      </div>

      {/* Use client-side reviews component to perform filtering reliably in browser */}
      <AdminReviewsClient reviews={reviews} />
    </div>
  );
}
