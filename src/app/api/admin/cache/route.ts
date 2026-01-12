/**
 * Cache Management API
 * GET - Get cache statistics
 * POST - Invalidate cache by tag or pattern
 */

import { NextResponse } from 'next/server';
import { revalidateTag, revalidatePath } from 'next/cache';
import { 
  getCacheStats, 
  memoryCache, 
  CACHE_TAGS,
  clearAllCaches,
} from '@/lib/cache';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/cache
 * Returns cache statistics
 */
export async function GET() {
  try {
    const stats = getCacheStats();
    
    return NextResponse.json({
      success: true,
      stats: {
        ...stats,
        hitRateFormatted: `${stats.hitRate.toFixed(2)}%`,
      },
      availableTags: Object.values(CACHE_TAGS),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/cache
 * Invalidate cache
 * 
 * Body:
 * - action: 'invalidateTag' | 'invalidatePath' | 'invalidatePattern' | 'clearAll'
 * - tag?: string (for invalidateTag)
 * - path?: string (for invalidatePath)
 * - pattern?: string (for invalidatePattern)
 * - storeId?: string (optional, for store-specific invalidation)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, tag, path, pattern, storeId } = body;

    let result: any = { success: true };

    switch (action) {
      case 'invalidateTag':
        if (!tag) {
          return NextResponse.json(
            { success: false, error: 'Tag is required' },
            { status: 400 }
          );
        }
        revalidateTag(tag);
        if (storeId) {
          revalidateTag(`store:${storeId}`);
        }
        memoryCache.invalidate(tag, storeId);
        result.message = `Invalidated tag: ${tag}`;
        break;

      case 'invalidatePath':
        if (!path) {
          return NextResponse.json(
            { success: false, error: 'Path is required' },
            { status: 400 }
          );
        }
        revalidatePath(path);
        result.message = `Invalidated path: ${path}`;
        break;

      case 'invalidatePattern':
        if (!pattern) {
          return NextResponse.json(
            { success: false, error: 'Pattern is required' },
            { status: 400 }
          );
        }
        const count = memoryCache.invalidate(pattern, storeId);
        result.message = `Invalidated ${count} entries matching pattern: ${pattern}`;
        result.entriesCleared = count;
        break;

      case 'clearAll':
        clearAllCaches();
        result.message = 'All caches cleared';
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action. Use: invalidateTag, invalidatePath, invalidatePattern, or clearAll' },
          { status: 400 }
        );
    }

    // Return updated stats
    result.stats = getCacheStats();

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
