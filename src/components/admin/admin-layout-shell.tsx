"use client"

import type React from "react"
import { useState } from "react"
import dynamic from "next/dynamic"
const AdminSidebar = dynamic(() => import("@/components/admin/admin-sidebar").then((mod) => mod.AdminSidebar), { ssr: false })
const AdminHeader = dynamic(() => import("@/components/admin/admin-header").then((mod) => mod.AdminHeader), { ssr: false })
import { useInitializePages } from "@/lib/use-page-content"

interface AdminLayoutShellProps {
  children: React.ReactNode
  storeName: string
}

export function AdminLayoutShell({ children, storeName }: AdminLayoutShellProps) {
  useInitializePages()
  const [isSidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-muted/40" dir="rtl">
      <AdminSidebar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} storeName={storeName} />

      <div className="flex flex-col flex-1">
        <AdminHeader setSidebarOpen={setSidebarOpen} storeName={storeName} />
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
