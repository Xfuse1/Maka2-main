// Client-side helper to clear browser storage and caches during logout
export async function clearClientData() {
  try {
    // Clear local/session storage
    try { localStorage.clear() } catch (e) { /* ignore */ }
    try { sessionStorage.clear() } catch (e) { /* ignore */ }

    // Clear server-side cache via API (for logout - clear all)
    try {
      await fetch('/api/admin/cache', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clearAll' }),
      });
    } catch (e) {
      // Server cache clear is best-effort
    }

    // Clear Cache Storage
    if (typeof caches !== 'undefined') {
      try {
        const keys = await caches.keys()
        await Promise.all(keys.map((k) => caches.delete(k)))
      } catch (e) {
        // ignore
      }
    }

    // Delete IndexedDB databases (if supported)
    try {
      // @ts-ignore - indexedDB.databases is not on all TS lib defs
      if (indexedDB && typeof (indexedDB as any).databases === 'function') {
        // modern browsers
        // @ts-ignore
        const dbs = await (indexedDB as any).databases()
        if (Array.isArray(dbs)) {
          await Promise.all(dbs.map((d: any) => {
            try { return new Promise((res) => { indexedDB.deleteDatabase(d.name).onblocked = res; indexedDB.deleteDatabase(d.name).onsuccess = res; setTimeout(res, 200) }) } catch (e) { return Promise.resolve() }
          }))
        }
      }
    } catch (e) {
      // ignore
    }

    // Unregister service workers
    try {
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations()
        await Promise.all(regs.map((r) => r.unregister()))
      }
    } catch (e) {
      // ignore
    }

    // Remove non-httpOnly cookies
    try {
      const cookies = document.cookie ? document.cookie.split('; ') : []
      for (const c of cookies) {
        const eqPos = c.indexOf('=')
        const name = eqPos > -1 ? c.substr(0, eqPos) : c
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;`;
      }
    } catch (e) {
      // ignore
    }
  } catch (outer) {
    // ignore
  }
}

/**
 * Clear user-specific cache on login
 * Only clears user-related data, keeps product/category cache
 */
export async function clearUserCacheOnLogin(): Promise<void> {
  try {
    // Clear user-specific patterns from server cache
    const userPatterns = ['user-', 'order', 'profile', 'cart', 'addresses', 'wishlist'];
    
    await Promise.all(
      userPatterns.map(pattern =>
        fetch('/api/admin/cache', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'invalidatePattern', pattern }),
        }).catch(() => { /* ignore */ })
      )
    );

    // Clear user-specific tags
    const userTags = ['orders', 'user-profile', 'user-addresses', 'user-cart'];
    await Promise.all(
      userTags.map(tag =>
        fetch('/api/admin/cache', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'invalidateTag', tag }),
        }).catch(() => { /* ignore */ })
      )
    );

    console.log('[Client] User cache cleared on login');
  } catch (e) {
    // Best effort - ignore errors
  }
}

export default clearClientData
