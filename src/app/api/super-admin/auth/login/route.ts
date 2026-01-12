import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import crypto from "crypto"

// Super Admin credentials (should be in env variables)
const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || "admin@xfuse.online"
const SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD || "SuperAdmin@2024!"
const SUPER_ADMIN_SECRET_CODE = process.env.SUPER_ADMIN_SECRET_CODE || "XFUSE-SUPER-2024"

// Generate secure session token
function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("hex")
}

// Hash for comparison (simple for now, can use bcrypt in production)
function verifyCredentials(email: string, password: string, secretCode: string): boolean {
  return (
    email === SUPER_ADMIN_EMAIL &&
    password === SUPER_ADMIN_PASSWORD &&
    secretCode === SUPER_ADMIN_SECRET_CODE
  )
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, secretCode } = body

    // Log attempt (without sensitive data)
    console.log("[Super Admin] Login attempt from:", request.headers.get("x-forwarded-for") || "unknown")
    console.log("[Super Admin] Email:", email ? email.substring(0, 3) + "***" : "missing")

    // Validate inputs
    if (!email || !password || !secretCode) {
      return NextResponse.json(
        { error: "جميع الحقول مطلوبة" },
        { status: 400 }
      )
    }

    // Verify credentials
    if (!verifyCredentials(email, password, secretCode)) {
      console.log("[Super Admin] Failed login attempt for:", email)
      return NextResponse.json(
        { error: "بيانات الدخول غير صحيحة" },
        { status: 401 }
      )
    }

    // Generate session token
    const sessionToken = generateSessionToken()
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 4) // 4 hours session

    // Store session in database (optional - for multi-device support)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        }
      }
    )

    // Check if super_admin_sessions table exists, if not, create it
    try {
      await supabaseAdmin
        .from("super_admin_sessions")
        .insert({
          token_hash: crypto.createHash("sha256").update(sessionToken).digest("hex"),
          ip_address: request.headers.get("x-forwarded-for") || "unknown",
          user_agent: request.headers.get("user-agent") || "unknown",
          expires_at: expiresAt.toISOString(),
        })
    } catch (dbError) {
      // Table might not exist, that's okay
      console.log("[Super Admin] Session storage skipped (table might not exist)")
    }

    // Set secure HTTP-only cookie
    const response = NextResponse.json({
      success: true,
      message: "تم تسجيل الدخول بنجاح",
    })

    // Set cookie
    response.cookies.set("super_admin_session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      expires: expiresAt,
    })

    console.log("[Super Admin] Successful login")

    return response
  } catch (error) {
    console.error("[Super Admin] Login error:", error)
    return NextResponse.json(
      { error: "حدث خطأ في الخادم" },
      { status: 500 }
    )
  }
}

// Logout endpoint
export async function DELETE(request: NextRequest) {
  const response = NextResponse.json({
    success: true,
    message: "تم تسجيل الخروج",
  })

  // Clear the session cookie
  response.cookies.delete("super_admin_session")

  return response
}
