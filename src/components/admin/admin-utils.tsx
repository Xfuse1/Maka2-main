"use client"

import React from "react"

export function TableWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full overflow-x-auto -mx-4 px-4">{/* negative margin to align with page padding */}
      <div className="min-w-[640px]">{children}</div>
    </div>
  )
}

export function ResponsiveCardRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row gap-4">{children}</div>
  )
}

export default TableWrapper
