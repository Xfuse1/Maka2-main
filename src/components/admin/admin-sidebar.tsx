
"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Home, Package, ShoppingBag, Settings, Palette, BarChart3, FileText, FolderTree, GalleryHorizontal, LogOut, X, Truck, Star, CreditCard, LogIn } from "lucide-react"
import { cn } from "@/lib/utils"
import { SiteLogo } from "@/components/site-logo"
import { Button } from "@/components/ui/button"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { useEffect, useState } from "react"
import { useSettingsStore } from "@/store/settings-store"

const menuItems = [
  {
    title: "الرئيسية",
    href: "/admin/homepage",
    icon: Home,
  },
  {
    title: "شرائح العرض",
    href: "/admin/hero-slides",
    icon: GalleryHorizontal,
  },
  {
    title: "العروض",
    href: "/admin/offers",
    icon: FileText,
  },
  {
    title: "الرسائل",
    href: "/admin/messages",
    icon: FileText,
  },
  {
    title: "الفئات",
    href: "/admin/categories",
    icon: FolderTree,
  },
  {
    title: "المنتجات",
    href: "/admin/products",
    icon: Package,
  },
  {
    title: "الطلبات",
    href: "/admin/orders",
    icon: ShoppingBag,
  },
  {
    title: "التقييمات",
    href: "/admin/reviews",
    icon: Star,
  },
  {
    title: "التحليلات",
    href: "/admin/analytics",
    icon: BarChart3,
  },
  {
    title: "التصميم",
    href: "/admin/design",
    icon: Palette,
  },
  {
    title: "الصفحات",
    href: "/admin/pages",
    icon: FileText,
  },
  {
    title: "تكاليف الشحن",
    href: "/admin/shipping",
    icon: Truck,
  },
  {
    title: "إعدادات الدفع",
    href: "/admin/payment-settings",
    icon: CreditCard,
  },
  {
    title: "الإعدادات",
    href: "/admin/settings",
    icon: Settings,
  },
]

interface AdminSidebarProps {
  isSidebarOpen: boolean;
  setSidebarOpen: (isOpen: boolean) => void;
  storeName: string;
}

function SidebarContent({ onLinkClick, onClose, storeName }: { onLinkClick?: () => void; onClose?: () => void; storeName: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const { toast } = useToast()
  const { settings, loadSettings } = useSettingsStore()
  const supabase = getSupabaseBrowserClient()
  
  // Don't initialize from localStorage - it might not be synced yet
  // Wait for Supabase to tell us the truth
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  // Check if user is logged in - ONLY use Supabase, not localStorage
  useEffect(() => {
    let isMounted = true
    let lastEvent = ""

    // Subscribe to auth state changes (more reliable than getSession)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return
      console.log("[AdminSidebar] Auth state changed:", _event, !!session?.user, session?.user?.id)
      
      // Ignore INITIAL_SESSION false events after we've already signed in
      if (_event === "INITIAL_SESSION" && !session?.user && lastEvent === "SIGNED_IN") {
        console.log("[AdminSidebar] Ignoring INITIAL_SESSION false after SIGNED_IN, keeping user logged in")
        return
      }
      
      lastEvent = _event
      setUser(session?.user || null)
      setIsLoading(false)
    })

    // Also try getSession for cases where onAuthStateChange might be delayed
    const checkUser = async () => {
      // Small delay to let onAuthStateChange fire first
      await new Promise(resolve => setTimeout(resolve, 100))
      
      if (!isMounted) return
      
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!isMounted) return
        
        console.log("[AdminSidebar] Session fallback check:", !!session?.user, session?.user?.id)
        if (session?.user && !user) {
          setUser(session.user)
          setIsLoading(false)
        }
      } catch (error) {
        console.error("[AdminSidebar] Error getting session:", error)
      }
    }

    checkUser()

    return () => {
      isMounted = false
      subscription?.unsubscribe()
    }
  }, [user, supabase])

  const handleLogout = async () => {
    try {
      const supabase = getSupabaseBrowserClient()
      await supabase.auth.signOut()
      // Try to clear client caches/storage (best-effort)
      try {
        const { clearClientData } = await import("@/lib/client/clearClientData")
        await clearClientData()
      } catch (e) {
        // ignore
      }
      toast({
        title: "تم تسجيل الخروج",
        description: "تم تسجيل خروجك بنجاح",
      })
      // Force hard reload / cache-bust after logout
      const target = `/admin/login?_cb=${Date.now()}`
      if (typeof window !== "undefined") {
        window.location.replace(target)
      } else {
        router.push("/admin/login")
        router.refresh()
      }
    } catch (error) {
      console.error("Logout error:", error)
      toast({
        title: "خطأ",
        description: "فشل تسجيل الخروج",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="flex flex-col h-full">
       <div className="p-4 border-b border-border flex justify-between items-center">
        <Link href="/" className="flex items-center gap-3">
          <SiteLogo width={40} height={40} />
          <div>
            <h2 className="text-xl font-bold text-primary">{storeName}</h2>
            <p className="text-xs text-muted-foreground">لوحة التحكم</p>
          </div>
        </Link>
        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => onClose?.()} type="button">
            <X className="h-6 w-6" />
        </Button>
      </div>

      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href + "/"))
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onLinkClick}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all font-medium",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-foreground hover:bg-muted",
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.title}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-border mt-auto space-y-2">
        {/* Quick link to admin root */}
        <Button asChild variant="primary" className="w-full mb-2">
          <Link href="/admin" onClick={() => onClose?.()} className="flex items-center justify-center gap-2 px-4 py-2.5">
            <Home className="h-4 w-4" />
            <span className="text-sm">لوحة التحكم</span>
          </Link>
        </Button>

        {/* Conditional auth button */}
        {isLoading ? (
          // Loading state
          <Button variant="outline" className="w-full flex items-center justify-center gap-2" disabled>
            <div className="h-4 w-4 rounded-full border-2 border-muted-foreground border-t-foreground animate-spin" />
            <span className="text-sm">جاري التحقق...</span>
          </Button>
        ) : user ? (
          // Logout button when user is logged in
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full flex items-center justify-center gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <LogOut className="h-4 w-4" />
            <span className="text-sm">تسجيل الخروج</span>
          </Button>
        ) : (
          // Login button when user is not logged in
          <Button asChild variant="outline" className="w-full flex items-center justify-center gap-2">
            <Link href="/admin/login" onClick={() => onClose?.()}>
              <LogIn className="h-4 w-4" />
              <span className="text-sm">تسجيل الدخول</span>
            </Link>
          </Button>
        )}

        <Link
          href="/"
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-muted hover:bg-muted/80 transition-all text-foreground font-medium"
        >
          <Home className="h-4 w-4" />
          <span className="text-sm">العودة للموقع</span>
        </Link>
      </div>
    </div>
  )
}

export function AdminSidebar({ isSidebarOpen, setSidebarOpen, storeName }: AdminSidebarProps) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (isSidebarOpen && window.innerWidth < 768) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSidebarOpen(false);
      }
    };

    window.addEventListener("keydown", handleKey);

    return () => {
      document.body.style.overflow = "auto";
      window.removeEventListener("keydown", handleKey);
    };
  }, [isSidebarOpen, setSidebarOpen]);

  return (
    <>
      <div className={cn(
          "fixed inset-0 bg-black/60 z-40 md:hidden",
          isSidebarOpen ? "block" : "hidden"
      )} onClick={() => setSidebarOpen(false)} />

      <aside className={cn(
        "fixed top-0 right-0 h-full bg-background border-l border-border w-64 z-50 transform transition-transform duration-300 ease-in-out",
        "md:sticky md:top-0 md:h-screen md:translate-x-0 md:w-64 md:flex-shrink-0",
        isSidebarOpen ? "translate-x-0" : "translate-x-full md:translate-x-0"
      )}>
        <SidebarContent 
          onLinkClick={() => setSidebarOpen(false)} 
          onClose={() => setSidebarOpen(false)}
          storeName={storeName}
        />
      </aside>
    </>
  )
}
