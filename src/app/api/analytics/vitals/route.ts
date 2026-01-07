import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
  /*  // Log web vitals metric
    console.log('[Web Vitals]', {
      name: body.name,
      value: body.value,
      rating: body.rating,
      timestamp: new Date().toISOString(),
    });*/

    // Here you can send to your analytics service
    // e.g., Google Analytics, Vercel Analytics, custom database, etc.
    
    return NextResponse.json({ success: true });
  } catch (error) {
    //console.error('[Web Vitals] Error:', error);
    return NextResponse.json({ error: 'Failed to record metric' }, { status: 500 });
  }
}

export const runtime = 'edge';
