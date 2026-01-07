import { NextResponse } from "next/server";

export const runtime = "nodejs";

async function callPerplexity(messages: { role: string; content: string }[]) {
  const base = process.env.PPLX_BASE_URL ?? "https://api.perplexity.ai";
  const key = process.env.PPLX_API_KEY;
  const model = process.env.PPLX_MODEL ?? "sonar";

  if (!key) throw new Error("Missing PPLX_API_KEY");

  const r = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${key}`,
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify({ model, messages, temperature: 0.4 }),
  });

  if (!r.ok) {
    const text = await r.text();
    throw new Error(`Perplexity error ${r.status}: ${text}`);
  }

  const data = await r.json();
  return (data?.choices?.[0]?.message?.content ?? "").trim();
}

export async function POST(req: Request) {
  try {
    // لو عندك auth للـ admin بالفعل، ممكن تشيل الجزء ده وتعتمد على الـ middleware
    const secret = req.headers.get("x-admin-secret");
    if (process.env.ADMIN_API_SECRET && secret !== process.env.ADMIN_API_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name_ar, name_en, description_ar } = await req.json();
    if (!description_ar || String(description_ar).trim().length < 10) {
      return NextResponse.json({ error: "Arabic description too short" }, { status: 400 });
    }

    const system = "You are an expert e-commerce copywriter. Rewrite Arabic product descriptions professionally without adding any new facts.";
    const user = `Rewrite the Arabic product description to be professional, clear, and persuasive while staying 100% faithful to the provided facts.
Rules:
- Do NOT invent features, materials, sizes, warranties, or claims not mentioned.
- Output plain text only (no markdown).
- Structure: 2 short paragraphs, then 4-6 lines starting with "- ".
Product name (AR): ${name_ar ?? ""}
Product name (EN): ${name_en ?? ""}
Arabic description: ${description_ar}
`;

    const rewritten = await callPerplexity([
      { role: "system", content: system },
      { role: "user", content: user },
    ]);

    return NextResponse.json({ rewritten });
  } catch (e: any) {
    return NextResponse.json({ error: "Failed", details: e?.message ?? String(e) }, { status: 500 });
  }
}
