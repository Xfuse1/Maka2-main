// Client-side helper to clear browser storage and caches during logout
export async function clearClientData() {
  try {
    // Clear local/session storage
    try { localStorage.clear() } catch (e) { /* ignore */ }
    try { sessionStorage.clear() } catch (e) { /* ignore */ }

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

export default clearClientData
