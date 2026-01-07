/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: false,
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 3600,

    // ⚠️ SECURITY WARNING: SVG files can contain malicious JavaScript
    // dangerouslyAllowSVG is enabled to support SVG images in the app.
    //
    // MITIGATIONS IN PLACE:
    // - Supabase storage serves from separate domain (*.supabase.co), limiting XSS impact
    // - contentDispositionType: 'inline' is used (consider 'attachment' for untrusted SVGs)
    //
    // REQUIREMENTS IF USER UPLOADS ARE ALLOWED:
    // - Implement SVG sanitization using DOMPurify or svg-sanitizer
    // - Strip <script> tags, event handlers (onclick, onload, etc.)
    // - Validate SVG structure before storage
    // - Consider serving user-uploaded SVGs with Content-Disposition: attachment
    //
    // RECOMMENDED: If possible, convert user-uploaded SVGs to PNG/WebP at upload time
    dangerouslyAllowSVG: true,
    contentDispositionType: 'inline',

    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'tpkfgimtgduiiiscdqyq.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'bbzjxcjfmeoiojjnfvfa.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'fmeeioiajtyfvfa.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      // Allow externally hosted images from i.postimg.cc (used by some test content)
      {
        protocol: 'https',
        hostname: 'i.postimg.cc',
        pathname: '/**',
      },
    ],
  },
  compress: true,
  reactStrictMode: true,
  poweredByHeader: false,
}

// Security headers: add a Content-Security-Policy to prevent unexpected
// third-party script injection (e.g. browser extensions or AV tooling)
// while allowing Next.js development features (HMR/Fast Refresh require
// 'unsafe-inline' and 'unsafe-eval' in dev mode).
//
// ⚠️ SECURITY NOTICE:
// - 'unsafe-inline' and 'unsafe-eval' significantly weaken XSS protection
// - For production, consider implementing a nonce-based CSP strategy
// - See: https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy
//
// PRODUCTION RECOMMENDATIONS:
// 1. Generate a unique nonce per request
// 2. Pass the nonce to Next.js scripts
// 3. Remove 'unsafe-inline' and 'unsafe-eval' from script-src
// 4. Use nonce-based approach: script-src 'self' 'nonce-{NONCE}'
nextConfig.headers = async () => {
  const isDev = process.env.NODE_ENV === 'development';

  // Development CSP - allows hot reload and debugging
  const devCSP =
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://connect.facebook.net; " +
    "connect-src 'self' https://tpkfgimtgduiiiscdqyq.supabase.co wss://tpkfgimtgduiiiscdqyq.supabase.co https://bbzjxcjfmeoiojjnfvfa.supabase.co wss://bbzjxcjfmeoiojjnfvfa.supabase.co http://localhost:* ws://localhost:* https://connect.facebook.net https://www.facebook.com https://signals.birchub.events https://7pdiumnsps.us-east-2.awsapprunner.com; " +
    "img-src 'self' data: blob: https: https://www.facebook.com; " +
    "style-src 'self' 'unsafe-inline'; " +
    "font-src 'self' data:;";

  // Production CSP - still permissive but documented for improvement
  // TODO: Implement nonce-based CSP for better XSS protection
  const prodCSP =
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://connect.facebook.net; " +
    "connect-src 'self' https://tpkfgimtgduiiiscdqyq.supabase.co wss://tpkfgimtgduiiiscdqyq.supabase.co https://bbzjxcjfmeoiojjnfvfa.supabase.co wss://bbzjxcjfmeoiojjnfvfa.supabase.co https://connect.facebook.net https://www.facebook.com https://signals.birchub.events https://7pdiumnsps.us-east-2.awsapprunner.com; " +
    "img-src 'self' data: blob: https: https://www.facebook.com; " +
    "style-src 'self' 'unsafe-inline'; " +
    "font-src 'self' data:;";

  return [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'Content-Security-Policy',
          value: isDev ? devCSP : prodCSP,
        },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'Referrer-Policy', value: 'no-referrer-when-downgrade' },
        // Additional security headers
        { key: 'X-XSS-Protection', value: '1; mode=block' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      ],
    },
  ]
}

export default nextConfig
