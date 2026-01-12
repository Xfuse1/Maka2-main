"use client"

import { useEffect, useState } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

export type ContactInfoConfig = {
  phone?: string
  whatsapp?: string
  email?: string
  address?: string
  workingHours?: string
  subtitle?: string
}

const defaultContactInfo: ContactInfoConfig = {
  phone: "01234567890",
  whatsapp: "01234567890",
  email: "info@yourstore.com",
  address: "",
  workingHours: "",
  subtitle: "للاستفسارات والطلبات الخاصة",
}

export function FooterContactInfo() {
  const [contactInfo, setContactInfo] = useState<ContactInfoConfig>(defaultContactInfo)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const supabase = getSupabaseBrowserClient()
        const { data: page, error } = await supabase
          .from("page_content")
          .select("sections")
          .or("page_path.eq./contact,page_path.eq.contact/")
          .limit(1)
          .maybeSingle()

        if (error) {
          return
        }

        const raw = (page as any)?.sections?.contact_info
        if (!raw) {
          return
        }

        let parsed: ContactInfoConfig | null = null
        if (typeof raw === "string") {
          try {
            parsed = JSON.parse(raw)
          } catch (err) {
            // ignore parse error
          }
        } else if (typeof raw === "object") {
          parsed = raw as ContactInfoConfig
        }

        if (parsed && !cancelled) {
          setContactInfo((prev) => ({ ...prev, ...parsed }))
        }
      } catch (err) {
        // Failed to load contact info
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <>
      {/* subtitle (optional) */}
      {contactInfo.subtitle ? <>{contactInfo.subtitle}<br /></> : null}
      واتساب: {contactInfo.whatsapp || contactInfo.phone}<br />
      البريد: {contactInfo.email}
    </>
  )
}
