import { NextResponse, type NextRequest } from 'next/server'

import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  // استخدام Host header للحصول على الـ subdomain الصحيح
  const host = request.headers.get('host') || requestUrl.host
  const protocol = request.headers.get('x-forwarded-proto') ||
                   (host.includes('localhost') ? 'http' : 'https')

  // بناء الـ origin من الـ host header
  const origin = `${protocol}://${host}`

  const next = requestUrl.searchParams.get('next') || '/'
  return NextResponse.redirect(new URL(next, origin))
}
