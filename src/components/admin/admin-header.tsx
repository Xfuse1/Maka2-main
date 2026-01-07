
"use client"

import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSettingsStore } from "@/store/settings-store"
import { useEffect } from "react"

interface AdminHeaderProps {
  setSidebarOpen: (isOpen: boolean) => void;
  storeName: string;
}

export function AdminHeader({ setSidebarOpen, storeName }: AdminHeaderProps) {
  return (
    <header className="flex h-14 items-center gap-4 border-b bg-background px-4 md:px-6 sticky top-0 z-30">
      <Button
        variant="outline"
        size="icon"
        onClick={() => setSidebarOpen(true)}
        className="md:hidden"
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">فتح قائمة التنقل</span>
      </Button>
      
      <div className="flex-1">
        <h1 className="font-semibold text-lg whitespace-nowrap">لوحة تحكم {storeName}</h1>
      </div>

    </header>
  )
}
