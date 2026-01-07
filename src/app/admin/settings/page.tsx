import { getStoreSettingsServer } from "@/lib/store-settings"
import { StoreSettingsForm } from "@/components/admin/store-settings-form"

export default async function AdminSettingsPage() {
  const settings = await getStoreSettingsServer()

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">الإعدادات العامة</h1>
        <p className="text-muted-foreground text-sm md:text-base">إدارة معلومات المتجر والإعدادات</p>
      </div>

      <StoreSettingsForm
        initialName={settings?.store_name ?? ""}
        initialDescription={settings?.store_description ?? ""}
      />
    </div>
  )
}
