
"use server";

import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function updateReviewStatus(
  reviewId: number,
  status: "approved" | "rejected"
) {
  const supabase = await createSupabaseAdmin();

  try {
    // The DB uses a boolean `is_approved` column. Map the incoming
    // status ('approved'|'rejected') to that boolean to avoid schema mismatches.
    const is_approved = status === "approved";

    const { data, error } = await (supabase as any)
      .from("product_reviews")
      .update({ is_approved })
      .eq("id", reviewId);

    if (error) {
      // If PostgREST reports the column is missing from the schema cache,
      // include actionable guidance in logs so the maintainer can fix the DB/schema.
      if (error.code === "PGRST204") {
        console.error(
          "PostgREST schema error while updating review approval flag:\n",
          error,
          {
            hint: "The 'is_approved' column appears to be missing from 'product_reviews' in the PostgREST schema cache.",
            remediation_sql:
              "SELECT column_name, data_type FROM information_schema.columns WHERE table_schema='public' AND table_name='product_reviews'; -- then ALTER TABLE product_reviews ADD COLUMN is_approved boolean DEFAULT false if missing",
            restart_hint:
              "If the column exists in the DB, restart PostgREST / the Supabase instance to refresh the schema cache (or use Supabase Studio to reload the schema).",
          }
        );

        return {
          error:
            "Schema cache error: 'is_approved' column not found on 'product_reviews'. Check logs for remediation steps.",
        };
      }

      console.error("Error updating review status:", error);
      return { error: "Could not update review status." };
    }

    // success
    // Revalidate the page to show the updated status
    revalidatePath("/admin/reviews");
    return { success: true };
  } catch (err) {
    console.error("Unexpected error updating review status:", err instanceof Error ? { message: err.message, stack: err.stack } : err);
    return { error: "Unexpected error while updating review status." };
  }

  
}
