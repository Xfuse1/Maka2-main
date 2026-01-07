import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const CACHE_TTL_HOURS = 24;
const MAX_CANDIDATES = 50;
const TOP_RECOMMENDATIONS = 6;

// Perplexity AI helper
async function callPerplexity(messages: { role: string; content: string }[]) {
  const base = process.env.PPLX_BASE_URL ?? "https://api.perplexity.ai";
  const key = process.env.PPLX_API_KEY;
  const model = process.env.PPLX_MODEL ?? "sonar";

  if (!key) throw new Error("Missing PPLX_API_KEY");

  const r = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ model, messages, temperature: 0.3 }),
  });

  if (!r.ok) {
    const text = await r.text();
    throw new Error(`Perplexity error ${r.status}: ${text}`);
  }

  const data = await r.json();
  return (data?.choices?.[0]?.message?.content ?? "").trim();
}

// Extract JSON from response (fallback parser)
function extractJSON(text: string): any {
  try {
    return JSON.parse(text);
  } catch {
    // Try to find JSON in text
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]);
    }
    throw new Error("Failed to extract JSON from response");
  }
}

// Get AI recommendations
async function getAIRecommendations(
  currentProduct: any,
  candidates: any[]
): Promise<string[]> {
  const system =
    "You are a recommendation engine. Choose the most similar products from a provided candidate list. Do not invent facts. Output only strict JSON.";

  const candidatesInfo = candidates.map((c) => ({
    id: c.id,
    name_ar: c.name_ar,
    name_en: c.name_en,
    short_desc_ar: (c.description_ar || "").substring(0, 200),
    short_desc_en: (c.description_en || "").substring(0, 200),
  }));

  const user = `Current product:
- Name (AR): ${currentProduct.name_ar}
- Name (EN): ${currentProduct.name_en || ""}
- Description (AR): ${(currentProduct.description_ar || "").substring(0, 300)}
- Description (EN): ${(currentProduct.description_en || "").substring(0, 300)}
- Category: ${currentProduct.category?.name_ar || ""}

Candidates (${candidates.length} products):
${JSON.stringify(candidatesInfo, null, 2)}

Task: Return the top ${TOP_RECOMMENDATIONS} most similar candidate IDs based on product names, descriptions, and category.

IMPORTANT: Output ONLY this strict JSON format (no extra text):
{"ids":["uuid1","uuid2","uuid3","uuid4","uuid5","uuid6"]}`;

  const response = await callPerplexity([
    { role: "system", content: system },
    { role: "user", content: user },
  ]);

  const parsed = extractJSON(response);
  const ids = parsed.ids || [];

  // Validate IDs
  const candidateIds = new Set(candidates.map((c) => c.id));
  const validIds = ids.filter(
    (id: string) => candidateIds.has(id) && id !== currentProduct.id
  );

  return validIds.slice(0, TOP_RECOMMENDATIONS);
}

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(
  req: Request,
  { params }: RouteParams
) {
  try {
    const { id: productId } = await params;
    const supabase = getSupabaseAdminClient();

    // 1. Fetch current product
    const { data: product, error: productError } = await supabase
      .from("products")
      .select(
        `
        id,
        name_ar,
        name_en,
        description_ar,
        description_en,
        category_id,
        category:categories(name_ar, name_en)
      `
      )
      .eq("id", productId)
      .eq("is_active", true)
      .single();

    if (productError || !product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // 2. Check cache
    const { data: cached } = await (supabase
      .from("product_recommendations") as any)
      .select("recommended_ids, updated_at")
      .eq("product_id", productId)
      .single();

    const isCacheFresh =
      cached &&
      new Date(cached.updated_at).getTime() >
        Date.now() - CACHE_TTL_HOURS * 60 * 60 * 1000;

    let recommendedIds: string[] = [];

    if (isCacheFresh && Array.isArray(cached.recommended_ids)) {
      // Use cached recommendations
      recommendedIds = cached.recommended_ids;
      console.log(`[AI Recommendations] Using cached recommendations for ${productId}`);
    } else {
      // 3. Fetch candidates
      const { data: candidates, error: candidatesError } = await (supabase
        .from("products") as any)
        .select(
          `
          id,
          name_ar,
          name_en,
          description_ar,
          description_en
        `
        )
        .eq("category_id", (product as any).category_id)
        .eq("is_active", true)
        .neq("id", productId)
        .limit(MAX_CANDIDATES);

      if (candidatesError || !candidates || candidates.length === 0) {
        // No candidates, return empty
        return NextResponse.json({ items: [] });
      }

      // 4. Call Perplexity AI
      try {
        recommendedIds = await getAIRecommendations(product, candidates);
        console.log(`[AI Recommendations] Generated ${recommendedIds.length} recommendations for ${productId}`);
      } catch (aiError: any) {
        console.error("[AI Recommendations] AI Error:", aiError);
        // Fallback: return first 6 candidates
        recommendedIds = candidates.slice(0, TOP_RECOMMENDATIONS).map((c: any) => c.id);
      }

      // 5. Save to cache
      if (recommendedIds.length > 0) {
        await (supabase
          .from("product_recommendations") as any)
          .upsert({
            product_id: productId,
            recommended_ids: recommendedIds,
            updated_at: new Date().toISOString(),
          })
          .eq("product_id", productId);
      }
    }

    // 6. Fetch full product details for recommended IDs
    if (recommendedIds.length === 0) {
      return NextResponse.json({ items: [] });
    }

    const { data: recommendedProducts } = await (supabase
      .from("products") as any)
      .select(
        `
        id,
        name_ar,
        name_en,
        base_price,
        category:categories(name_ar),
        product_images(image_url, display_order)
      `
      )
      .in("id", recommendedIds)
      .eq("is_active", true);

    // Preserve order from recommendedIds
    const orderedProducts = recommendedIds
      .map((id) => recommendedProducts?.find((p: any) => p.id === id))
      .filter(Boolean);

    return NextResponse.json({ items: orderedProducts || [] });
  } catch (e: any) {
    console.error("[AI Recommendations] Error:", e);
    return NextResponse.json(
      { error: "Failed to get recommendations", details: e?.message ?? String(e) },
      { status: 500 }
    );
  }
}
