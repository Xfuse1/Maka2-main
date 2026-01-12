import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStoreIdFromRequest } from "@/lib/supabase/admin";
import crypto from "crypto";

// Simple encryption/decryption for API keys
// Note: In production, use proper encryption service or environment variables
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "change-this-to-32-char-secret!!"; // Must be 32 chars
const ALGORITHM = "aes-256-cbc";

function encrypt(text: string): string {
  if (!text) return "";
  const iv = crypto.randomBytes(16);
  const key = Buffer.from(ENCRYPTION_KEY.padEnd(32, "0").slice(0, 32));
  const cipher = crypto.createCipheriv(ALGORITHM, new Uint8Array(key), new Uint8Array(iv));
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}

function decrypt(text: string): string {
  if (!text) return "";
  try {
    const parts = text.split(":");
    const iv = Buffer.from(parts[0], "hex");
    const encryptedText = parts[1];
    const key = Buffer.from(ENCRYPTION_KEY.padEnd(32, "0").slice(0, 32));
    const decipher = crypto.createDecipheriv(ALGORITHM, new Uint8Array(key), new Uint8Array(iv));
    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (error) {
    console.error("Decryption error:", error);
    return "";
  }
}

// GET: Retrieve payment settings for current store
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const storeId = await getStoreIdFromRequest();

    if (!storeId) {
      return NextResponse.json(
        { error: "Store not found" },
        { status: 400 }
      );
    }

    // Get store settings
    const { data, error } = await supabase
      .from("store_settings")
      .select("kashier_merchant_id, kashier_api_key, kashier_test_mode, kashier_webhook_secret, kashier_enabled")
      .eq("store_id", storeId)
      .single() as { data: any; error: any };

    if (error) {
      console.error("Error fetching payment settings:", error);
      return NextResponse.json(
        { error: "Failed to load settings" },
        { status: 500 }
      );
    }

    // Decrypt sensitive fields
    const decryptedData = {
      kashier_merchant_id: data?.kashier_merchant_id || "",
      kashier_api_key: data?.kashier_api_key ? decrypt(data.kashier_api_key) : "",
      kashier_test_mode: data?.kashier_test_mode ?? true,
      kashier_webhook_secret: data?.kashier_webhook_secret ? decrypt(data.kashier_webhook_secret) : "",
      kashier_enabled: data?.kashier_enabled ?? false,
    };

    return NextResponse.json(decryptedData);
  } catch (error) {
    console.error("Error in GET /api/admin/payment-settings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST: Save payment settings for current store
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const storeId = await getStoreIdFromRequest();

    if (!storeId) {
      return NextResponse.json(
        { error: "Store not found" },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Validate required fields if Kashier is enabled
    if (body.kashier_enabled) {
      if (!body.kashier_merchant_id || !body.kashier_api_key) {
        return NextResponse.json(
          { error: "Merchant ID and API Key are required when Kashier is enabled" },
          { status: 400 }
        );
      }
    }

    // Encrypt sensitive fields
    const encryptedData: any = {
      kashier_merchant_id: body.kashier_merchant_id,
      kashier_api_key: body.kashier_api_key ? encrypt(body.kashier_api_key) : null,
      kashier_test_mode: body.kashier_test_mode ?? true,
      kashier_webhook_secret: body.kashier_webhook_secret ? encrypt(body.kashier_webhook_secret) : null,
      kashier_enabled: body.kashier_enabled ?? false,
    };

    // Check if settings exist
    const { data: existingSettings } = await supabase
      .from("store_settings")
      .select("id")
      .eq("store_id", storeId)
      .single() as { data: any; error: any };

    let result;
    if (existingSettings) {
      // Update existing settings
      result = await (supabase
        .from("store_settings")
        .update(encryptedData) as any)
        .eq("store_id", storeId);
    } else {
      // Insert new settings
      result = await supabase
        .from("store_settings")
        .insert({
          store_id: storeId,
          ...encryptedData,
        } as any);
    }

    if (result.error) {
      console.error("Error saving payment settings:", result.error);
      return NextResponse.json(
        { error: "Failed to save settings" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: "Settings saved successfully" });
  } catch (error) {
    console.error("Error in POST /api/admin/payment-settings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
