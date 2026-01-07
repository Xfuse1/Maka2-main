import { getStoreSettingsServer } from "@/lib/store-settings"
import { AdminLayoutShell } from "@/components/admin/admin-layout-shell"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const settings = await getStoreSettingsServer()
  const storeName = settings?.store_name ?? "مكة"

  return (
    <AdminLayoutShell storeName={storeName}>
      {children}
    </AdminLayoutShell>
  )
}
