"use client"

import { useState, useEffect, useCallback } from "react"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Search, 
  RefreshCw, 
  CreditCard,
  Calendar,
  Store,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle
} from "lucide-react"

interface Subscription {
  id: string
  store_id: string
  plan_id: string
  status: string
  start_date: string
  end_date: string
  payment_reference: string
  payment_method: string
  amount_paid: number
  created_at: string
  store?: {
    store_name: string
    subdomain: string
    email: string
  }
  plan?: {
    name: string
    name_en: string
    price: number
  }
}

interface SubscriptionStats {
  total: number
  active: number
  expired: number
  pending: number
  total_revenue: number
}

interface SubscriptionsManagementProps {
  onRefresh?: () => void
}

export default function SubscriptionsManagement({ onRefresh }: SubscriptionsManagementProps) {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [filteredSubscriptions, setFilteredSubscriptions] = useState<Subscription[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [stats, setStats] = useState<SubscriptionStats>({
    total: 0,
    active: 0,
    expired: 0,
    pending: 0,
    total_revenue: 0,
  })

  const loadSubscriptions = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/super-admin/subscriptions")
      if (!response.ok) {
        throw new Error("Failed to fetch subscriptions")
      }
      const data = await response.json()
      setSubscriptions(data.subscriptions || [])
      setStats(data.stats || stats)
    } catch (error) {
      console.error("Error loading subscriptions:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSubscriptions()
  }, [loadSubscriptions])

  // Filter subscriptions
  useEffect(() => {
    let filtered = [...subscriptions]

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((s) => s.status === statusFilter)
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (s) =>
          s.store?.store_name?.toLowerCase().includes(term) ||
          s.store?.subdomain?.toLowerCase().includes(term) ||
          s.store?.email?.toLowerCase().includes(term) ||
          s.payment_reference?.toLowerCase().includes(term)
      )
    }

    setFilteredSubscriptions(filtered)
  }, [subscriptions, searchTerm, statusFilter])

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
      active: { 
        label: "نشط", 
        color: "bg-green-500 hover:bg-green-600",
        icon: <CheckCircle className="w-3 h-3" />
      },
      pending: { 
        label: "قيد الانتظار", 
        color: "bg-yellow-500 hover:bg-yellow-600",
        icon: <Clock className="w-3 h-3" />
      },
      expired: { 
        label: "منتهي", 
        color: "bg-red-500 hover:bg-red-600",
        icon: <XCircle className="w-3 h-3" />
      },
      cancelled: { 
        label: "ملغي", 
        color: "bg-gray-500 hover:bg-gray-600",
        icon: <XCircle className="w-3 h-3" />
      },
      trial: { 
        label: "تجربة", 
        color: "bg-blue-500 hover:bg-blue-600",
        icon: <Clock className="w-3 h-3" />
      },
    }

    const config = statusConfig[status] || { 
      label: status, 
      color: "bg-gray-400",
      icon: null 
    }

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        {config.icon}
        {config.label}
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "-"
    return new Date(dateString).toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const getDaysRemaining = (endDate: string) => {
    if (!endDate) return null
    const end = new Date(endDate)
    const now = new Date()
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return diff
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              إجمالي الاشتراكات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              نشطة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.active}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4" />
              قيد الانتظار
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.pending}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <XCircle className="w-4 h-4" />
              منتهية
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.expired}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Store className="w-4 h-4" />
              إجمالي الإيرادات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.total_revenue.toLocaleString()} EGP</p>
          </CardContent>
        </Card>
      </div>

      {/* Subscriptions Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle>جميع الاشتراكات</CardTitle>
              <CardDescription>عرض ومتابعة اشتراكات المتاجر</CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative w-64">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="بحث..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  <SelectItem value="active">نشط</SelectItem>
                  <SelectItem value="pending">قيد الانتظار</SelectItem>
                  <SelectItem value="expired">منتهي</SelectItem>
                  <SelectItem value="trial">تجربة</SelectItem>
                  <SelectItem value="cancelled">ملغي</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={loadSubscriptions} className="gap-2">
                <RefreshCw className="w-4 h-4" />
                تحديث
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>المتجر</TableHead>
                  <TableHead>الباقة</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>تاريخ البدء</TableHead>
                  <TableHead>تاريخ الانتهاء</TableHead>
                  <TableHead>المتبقي</TableHead>
                  <TableHead>المبلغ</TableHead>
                  <TableHead>رقم الدفع</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubscriptions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      لا توجد اشتراكات
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSubscriptions.map((sub) => {
                    const daysRemaining = getDaysRemaining(sub.end_date)
                    
                    return (
                      <TableRow key={sub.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{sub.store?.store_name || "غير معروف"}</p>
                            <p className="text-sm text-gray-500">
                              {sub.store?.subdomain}.xfuse.online
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{sub.plan?.name || "غير محدد"}</span>
                        </TableCell>
                        <TableCell>{getStatusBadge(sub.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            {formatDate(sub.start_date)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            {formatDate(sub.end_date)}
                          </div>
                        </TableCell>
                        <TableCell>
                          {daysRemaining !== null && (
                            <div className={`flex items-center gap-1 ${
                              daysRemaining <= 0 
                                ? "text-red-600" 
                                : daysRemaining <= 7 
                                ? "text-yellow-600" 
                                : "text-green-600"
                            }`}>
                              {daysRemaining <= 0 ? (
                                <>
                                  <AlertTriangle className="w-4 h-4" />
                                  منتهي
                                </>
                              ) : daysRemaining <= 7 ? (
                                <>
                                  <AlertTriangle className="w-4 h-4" />
                                  {daysRemaining} يوم
                                </>
                              ) : (
                                <>
                                  <Clock className="w-4 h-4" />
                                  {daysRemaining} يوم
                                </>
                              )}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="font-bold">
                            {sub.amount_paid?.toLocaleString() || 0} EGP
                          </span>
                        </TableCell>
                        <TableCell>
                          {sub.payment_reference ? (
                            <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                              {sub.payment_reference}
                            </code>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
