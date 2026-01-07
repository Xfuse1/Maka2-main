export function humanizeOrderStatus(status: string) {
  const s = String(status || "").toLowerCase()
  switch (s) {
    case "pending":
      return "قيد المراجعة"
    case "processing":
      return "جاري التجهيز"
    case "shipped":
      return "خرج للشحن"
    case "delivered":
    case "completed":
      return "تم التوصيل"
    case "cancelled":
      return "ملغي"
    case "confirmed":
      return "مؤكد"
    default:
      return status || "غير معروف"
  }
}

export function getStatusBadgeClass(status: string) {
  const s = String(status || "").toLowerCase()
  const base = "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold"
  switch (s) {
    case "pending":
      return `${base} bg-yellow-50 text-yellow-800 border border-yellow-100`
    case "processing":
      return `${base} bg-indigo-50 text-indigo-800 border border-indigo-100`
    case "shipped":
      return `${base} bg-purple-50 text-purple-800 border border-purple-100`
    case "delivered":
    case "completed":
      return `${base} bg-green-50 text-green-800 border border-green-100`
    case "cancelled":
      return `${base} bg-red-50 text-red-800 border border-red-100`
    case "confirmed":
      return `${base} bg-teal-50 text-teal-800 border border-teal-100`
    default:
      return `${base} bg-gray-50 text-gray-800 border border-gray-100`
  }
}
