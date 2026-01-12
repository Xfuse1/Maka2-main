"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  Store, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Eye, 
  Edit, 
  Trash2,
  Plus,
  Search,
  RefreshCw,
  Settings,
  CheckCircle,
  XCircle
} from "lucide-react"

interface StoreData {
  id: string
  store_name: string
  subdomain: string
  email: string
  phone: string | null
  description: string | null
  status: string // "active" | "inactive" | "suspended" | "cancelled"
  created_at: string
  subscription_plan_id: string | null
  owner_id: string | null
  // Statistics
  products_count?: number
  orders_count?: number
  revenue?: number
}

interface StoreStats {
  total_stores: number
  active_stores: number
  inactive_stores: number
  total_orders: number
  total_revenue: number
  total_products: number
}

export default function SuperAdminDashboard() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [stores, setStores] = useState<StoreData[]>([])
  const [filteredStores, setFilteredStores] = useState<StoreData[]>([])
  const [stats, setStats] = useState<StoreStats>({
    total_stores: 0,
    active_stores: 0,
    inactive_stores: 0,
    total_orders: 0,
    total_revenue: 0,
    total_products: 0,
  })
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStore, setSelectedStore] = useState<StoreData | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Check if user is super admin
  useEffect(() => {
    checkSuperAdminAccess()
  }, [])

  const checkSuperAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth?redirect=/super-admin")
        return
      }

      // Check if user has super_admin role
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single()

      if (error || !profile || profile.role !== "super_admin") {
        // Not authorized
        router.push("/")
        return
      }

      setIsSuperAdmin(true)
      loadDashboardData()
    } catch (error) {
      console.error("Error checking access:", error)
      router.push("/")
    }
  }

  const loadDashboardData = async () => {
    setIsLoading(true)
    try {
      // Use API route instead of direct Supabase queries
      const response = await fetch("/api/super-admin/stores")
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to load dashboard data")
      }

      const { stores: storesWithStats, stats: totalStats } = await response.json()

      setStores(storesWithStats)
      setFilteredStores(storesWithStats)
      setStats(totalStats)
    } catch (error) {
      console.error("Error loading dashboard:", error)
      alert("فشل تحميل البيانات. يرجى المحاولة مرة أخرى.")
    } finally {
      setIsLoading(false)
    }
  }

  // Search filter
  useEffect(() => {
    if (!searchTerm) {
      setFilteredStores(stores)
      return
    }

    const filtered = stores.filter(
      (store) =>
        store.store_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        store.subdomain.toLowerCase().includes(searchTerm.toLowerCase()) ||
        store.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredStores(filtered)
  }, [searchTerm, stores])

  const handleToggleStoreStatus = async (storeId: string, currentStatus: string) => {
    try {
      // Toggle between active and inactive
      const newStatus = currentStatus === "active" ? "inactive" : "active"

      const response = await fetch("/api/super-admin/stores", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          store_id: storeId,
          status: newStatus,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update store status")
      }
response = await fetch(`/api/super-admin/stores?store_id=${selectedStore.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete store")
      }
  }

  const handleDeleteStore = async () => {
    if (!selectedStore) return

    try {
      const { error } = await supabase
        .from("stores")
        .delete()
        .eq("id", selectedStore.id)

      if (error) throw error

      setIsDeleteDialogOpen(false)
      setSelectedStore(null)
      loadDashboardData()
    } catch (error) {
      console.error("Error deleting store:", error)
      alert("فشل حذف المتجر. قد يحتوي على بيانات مرتبطة.")
    }
  }

  const handleViewStore = (store: StoreData) => {
    const platformDomain = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || "xfuse.online"
    const protocol = platformDomain === "localhost" ? "http" : "https"
    const port = platformDomain === "localhost" ? ":3000" : ""
    const storeUrl = `${protocol}://${store.subdomain}.${platformDomain}${port}`
    window.open(storeUrl, "_blank")
  }

  if (!isSuperAdmin || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-reverse space-x-4">
              <div className="bg-gradient-to-br from-purple-600 to-blue-600 p-3 rounded-xl">
                <Settings className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Super Admin Dashboard</h1>
                <p className="text-sm text-gray-500">إدارة جميع المتاجر والإحصائيات</p>
              </div>
            </div>
            <div className="flex items-center space-x-reverse space-x-3">
              <Button
                variant="outline"
                onClick={() => loadDashboardData()}
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                تحديث
              </Button>
              <Button
                onClick={() => router.push("/create-store")}
                className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Plus className="w-4 h-4" />
                إضافة متجر جديد
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Store className="w-4 h-4" />
                إجمالي المتاجر
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.total_stores}</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                المتاجر النشطة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.active_stores}</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <XCircle className="w-4 h-4" />
                المتاجر غير النشطة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.inactive_stores}</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                إجمالي الطلبات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.total_orders.toLocaleString()}</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                إجمالي الإيرادات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.total_revenue.toLocaleString()} EGP</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="w-4 h-4" />
                إجمالي المنتجات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.total_products.toLocaleString()}</p>
            </CardContent>
          </Card>
        </div>

        {/* Stores Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>جميع المتاجر</CardTitle>
                <CardDescription>إدارة ومراقبة جميع المتاجر في المنصة</CardDescription>
              </div>
              <div className="relative w-64">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="بحث عن متجر..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>اسم المتجر</TableHead>
                    <TableHead>Subdomain</TableHead>
                    <TableHead>البريد</TableHead>
                    <TableHead>المنتجات</TableHead>
                    <TableHead>الطلبات</TableHead>
                    <TableHead>الإيرادات</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>تاريخ الإنشاء</TableHead>
                    <TableHead className="text-left">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStores.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                        لا توجد متاجر
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredStores.map((store) => (
                      <TableRow key={store.id}>
                        <TableCell className="font-medium">{store.store_name}</TableCell>
                        <TableCell>
                          <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                            {store.subdomain}
                          </code>
                        </TableCell>
                        <TableCell className="text-sm">{store.email}</TableCell>
                        <TableCell>{store.products_count || 0}</TableCell>
                        <TableCell>{store.orders_count || 0}</TableCell>
                        <TableCell className="font-medium">
                          {(store.revenue || 0).toLocaleString()} EGP
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={store.status === "active" ? "default" : "secondary"}
                            className={
                              store.status === "active"
                                ? "bg-green-500 hover:bg-green-600"
                                : store.status === "suspended"
                                ? "bg-red-500 hover:bg-red-600"
                                : "bg-gray-400 hover:bg-gray-500"
                            }
                          >
                            {store.status === "active" ? "نشط" : store.status === "suspended" ? "معلق" : "غير نشط"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {new Date(store.created_at).toLocaleDateString("ar-EG")}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewStore(store)}
                              className="gap-1"
                            >
                              <Eye className="w-4 h-4" />
                              عرض
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"status)
                              }
                              className={
                                store.status === "active"
                                  ? "text-red-600 hover:text-red-700 hover:bg-red-50"
                                  : "text-green-600 hover:text-green-700 hover:bg-green-50"
                              }
                            >
                              {store.status === "active" ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                              {store.status === "active"
                              {store.is_active ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                              {store.is_active ? "تعطيل" : "تفعيل"}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedStore(store)
                                setIsDeleteDialogOpen(true)
                              }}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 gap-1"
                            >
                              <Trash2 className="w-4 h-4" />
                              حذف
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تأكيد الحذف</DialogTitle>
            <DialogDescription>
              هل أنت متأكد من حذف المتجر "{selectedStore?.store_name}"؟
              <br />
              سيتم حذف جميع البيانات المرتبطة بالمتجر (المنتجات، الطلبات، إلخ).
              <br />
              <span className="text-red-600 font-semibold">هذا الإجراء لا يمكن التراجع عنه!</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              إلغاء
            </Button>
            <Button variant="destructive" onClick={handleDeleteStore}>
              حذف نهائياً
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
