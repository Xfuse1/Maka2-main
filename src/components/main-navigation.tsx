
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const navLinks = [
  { href: "/", text: "الرئيسية" },
  { href: "/about", text: "من نحن" },
  { href: "/contact", text: "تواصل معنا" },
]

export function MainNavigation() {
  const pathname = usePathname()

  return (
    <nav className="hidden md:flex items-center gap-2">
      {navLinks.map((link) => {
        const isActive = pathname === link.href
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-primary/80 hover:text-white"
            }`}
          >
            {link.text}
          </Link>
        )
      })}
    </nav>
  )
}
