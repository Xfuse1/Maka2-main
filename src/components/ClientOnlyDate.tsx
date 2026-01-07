
"use client"

import { useState, useEffect } from "react"

interface ClientOnlyDateProps {
  date: string | number | Date;
  locale?: string;
  options?: Intl.DateTimeFormatOptions;
  className?: string;
}

export function ClientOnlyDate({ date, locale = "ar-EG", options, className }: ClientOnlyDateProps) {
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    setHasMounted(true)
  }, [])

  if (!hasMounted) {
    // Render a placeholder on the server and initial client render
    return <span className={className}>...</span>
  }

  const dateObject = new Date(date);
  const formattedDate = dateObject.toLocaleDateString(locale, options);

  return <span className={className}>{formattedDate}</span>
}
