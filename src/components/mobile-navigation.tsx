"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Menu, X, Search, User as UserIcon } from "lucide-react"
import type { User } from "@supabase/supabase-js"

import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { SignOutButton } from "./sign-out-button"

const navItems = [
  { title: "الرئيسية", href: "/" },
  { title: "من نحن", href: "/about" },
  { title: "تواصل معنا", href: "/contact" },
] as const

interface MobileNavigationProps {
  user?: User | null
}

export function MobileNavigation({ user }: MobileNavigationProps) {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "auto"
    }
    return () => {
      document.body.style.overflow = "auto"
    }
  }, [isOpen])

  const closeMenu = () => setIsOpen(false)

  return (
    <div className="md:hidden">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle menu"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm" onClick={closeMenu}></div>
      )}

      {isOpen && (
        <div className="fixed top-0 right-0 h-full w-4/5 max-w-sm bg-background shadow-2xl z-[110] transform transition-transform duration-300 ease-in-out animate-in slide-in-from-right">
          <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="font-bold text-lg">القائمة</h2>
            <Button variant="ghost" size="icon" onClick={closeMenu}>
              <X className="h-6 w-6" />
            </Button>
          </div>

          <nav className="flex-grow p-4">
            {/* Search Bar */}
            <div className="relative mb-4">
              <Input type="search" placeholder="ابحث عن المنتجات..." className="pl-10" />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            </div>

            {/* Navigation Links */}
            <div className="flex flex-col gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.title}
                  href={item.href}
                  onClick={closeMenu}
                  className="block p-3 rounded-md text-base font-medium text-foreground hover:bg-secondary"
                >
                  {item.title}
                </Link>
              ))}
            </div>
          </nav>

          {/* Auth Section */}
          <div className="p-4 border-t border-border flex flex-col gap-2">
            {user ? (
              <>
                <Button variant="outline" asChild className="w-full justify-start">
                  <Link href="/account" onClick={closeMenu}>
                    <UserIcon className="h-4 w-4 ml-2" />
                    حسابي
                  </Link>
                </Button>
                <div className="w-full">
                  <SignOutButton />
                </div>
              </>
            ) : (
              <Button asChild className="w-full">
                <Link href="/auth" onClick={closeMenu}>
                  تسجيل الدخول
                </Link>
              </Button>
            )}
          </div>
        </div>
        </div>
      )}
    </div>
  )
}
