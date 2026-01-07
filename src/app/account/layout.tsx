import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { User } from "lucide-react"

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth?message=الرجاء تسجيل الدخول للوصول إلى حسابك")
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5 flex flex-col">
      <SiteHeader />
      
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-primary/10 via-primary/5 to-background py-12 overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-10 right-20 w-32 h-32 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-20 w-40 h-40 bg-primary/15 rounded-full blur-3xl" />
        </div>
        <div className="container mx-auto px-4 relative">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center">
              <User className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">حسابي</h1>
              <p className="text-muted-foreground mt-1">إدارة حسابك وبياناتك الشخصية</p>
            </div>
          </div>
        </div>
      </div>
      
      <main className="flex-grow container mx-auto px-4 py-10">
        {children}
      </main>
      <SiteFooter />
    </div>
  )
}
