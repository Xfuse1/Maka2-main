// Authentication store for admin panel
import { create } from "zustand"
import { persist } from "zustand/middleware"

interface AuthStore {
  isAuthenticated: boolean
  login: (username: string, password: string) => boolean
  logout: () => void
}

// Admin credentials from environment variables
// Note: Both must be NEXT_PUBLIC_ prefixed to work on client-side
const ADMIN_USERNAME = process.env.NEXT_PUBLIC_ADMIN_USERNAME || "admin"
const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "mecca2025"

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      isAuthenticated: false,

      login: (username: string, password: string) => {
        // Verify against environment variables
        if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
          set({ isAuthenticated: true })
          return true
        }
        return false
      },

      logout: () => {
        set({ isAuthenticated: false })
        // Remove persisted store entry and clear client caches (best-effort)
        try {
          if (typeof window !== 'undefined') {
            try { localStorage.removeItem('mecca-auth-storage') } catch { /* ignore */ }
            import('@/lib/client/clearClientData').then((m) => m.clearClientData()).catch(() => { /* ignore */ })
          }
        } catch {
          // ignore
        }
      },
    }),
    {
      name: "mecca-auth-storage",
    },
  ),
)
