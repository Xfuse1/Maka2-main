"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Shield,
  TrendingUp,
  XCircle,
  Eye,
  Ban,
  CheckCheck,
} from "lucide-react"
import Link from "next/link"
import {
  getPaymentTransactions,
  getSecurityEvents,
  getFraudRules,
  getPaymentStats,
  updateFraudRule,
  resolveSecurityEvent,
  blockIpAddress,
} from "./actions"

export default function AdminPaymentsPage() {
  const [stats, setStats] = useState<any>(null)
  const [transactions, setTransactions] = useState<any[]>([])
  const [securityEvents, setSecurityEvents] = useState<any[]>([])
  const [fraudRules, setFraudRules] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [riskFilter, setRiskFilter] = useState<string>("all")

  useEffect(() => {
    loadData()
  }, [statusFilter, riskFilter])

  async function loadData() {
    setLoading(true)
    try {
      const [statsRes, transactionsRes, eventsRes, rulesRes] = await Promise.all([
        getPaymentStats(),
        getPaymentTransactions({
          status: statusFilter !== "all" ? statusFilter : undefined,
          riskLevel: riskFilter !== "all" ? riskFilter : undefined,
          limit: 50,
        }),
        getSecurityEvents({ limit: 20 }),
        getFraudRules(),
      ])

      if (statsRes.success) setStats(statsRes.data)
      if (transactionsRes.success) setTransactions(transactionsRes.data || [])
      if (eventsRes.success) setSecurityEvents(eventsRes.data || [])
      if (rulesRes.success) setFraudRules(rulesRes.data || [])
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      completed: { variant: "default", icon: CheckCircle, color: "text-green-600" },
      pending: { variant: "secondary", icon: Clock, color: "text-yellow-600" },
      processing: { variant: "secondary", icon: TrendingUp, color: "text-blue-600" },
      failed: { variant: "destructive", icon: XCircle, color: "text-red-600" },
      cancelled: { variant: "outline", icon: Ban, color: "text-muted-foreground" },
    }

    const config = variants[status] || variants.pending
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    )
  }

  const getRiskBadge = (level: string) => {
    const colors: Record<string, string> = {
      low: "bg-green-100 text-green-800",
      medium: "bg-yellow-100 text-yellow-800",
      high: "bg-orange-100 text-orange-800",
      critical: "bg-red-100 text-red-800",
    }

    return <Badge className={colors[level] || colors.low}>{level}</Badge>
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">جاري التحميل...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">لوحة تحكم المدفوعات</h1>
          <p className="text-muted-foreground">إدارة المعاملات والأمان</p>
        </div>
        <Link href="/admin">
          <Button variant="outline">العودة للوحة التحكم</Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المعاملات</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalTransactions || 0}</div>
            <p className="text-xs text-muted-foreground">{stats?.completedTransactions || 0} مكتملة</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">المبلغ الإجمالي</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalAmount || "0.00"} ج.م</div>
            <p className="text-xs text-muted-foreground">المعاملات المكتملة</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">معاملات عالية المخاطر</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats?.highRiskTransactions || 0}</div>
            <p className="text-xs text-muted-foreground">تحتاج مراجعة</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">تنبيهات أمنية</CardTitle>
            <Shield className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats?.openSecurityEvents || 0}</div>
            <p className="text-xs text-muted-foreground">{stats?.criticalEvents || 0} حرجة</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="transactions">المعاملات</TabsTrigger>
          <TabsTrigger value="security">الأمان</TabsTrigger>
          <TabsTrigger value="fraud-rules">قواعد الاحتيال</TabsTrigger>
        </TabsList>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>المعاملات الأخيرة</CardTitle>
                  <CardDescription>جميع معاملات الدفع</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="الحالة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع الحالات</SelectItem>
                      <SelectItem value="pending">قيد الانتظار</SelectItem>
                      <SelectItem value="completed">مكتملة</SelectItem>
                      <SelectItem value="failed">فاشلة</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={riskFilter} onValueChange={setRiskFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="المخاطر" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع المستويات</SelectItem>
                      <SelectItem value="low">منخفضة</SelectItem>
                      <SelectItem value="medium">متوسطة</SelectItem>
                      <SelectItem value="high">عالية</SelectItem>
                      <SelectItem value="critical">حرجة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>رقم المعاملة</TableHead>
                    <TableHead>الطلب</TableHead>
                    <TableHead>العميل</TableHead>
                    <TableHead>المبلغ</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>المخاطر</TableHead>
                    <TableHead>ال��اريخ</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-mono text-sm">
                        {transaction.transaction_id?.substring(0, 12)}...
                      </TableCell>
                      <TableCell>{transaction.orders?.order_number || "N/A"}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{transaction.orders?.customer_name}</div>
                          <div className="text-muted-foreground text-xs">{transaction.orders?.customer_email}</div>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {transaction.amount} {transaction.currency}
                      </TableCell>
                      <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                      <TableCell>{getRiskBadge(transaction.risk_level)}</TableCell>
                      <TableCell className="text-sm">
                        {new Date(transaction.created_at).toLocaleDateString("ar-MA")}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Events Tab */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>الأحداث الأمنية</CardTitle>
              <CardDescription>تنبيهات ومحاولات احتيال</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>النوع</TableHead>
                    <TableHead>الوصف</TableHead>
                    <TableHead>الخطورة</TableHead>
                    <TableHead>IP</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>التاريخ</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {securityEvents.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell className="font-medium">{event.event_type}</TableCell>
                      <TableCell className="max-w-md truncate">{event.description}</TableCell>
                      <TableCell>{getRiskBadge(event.severity)}</TableCell>
                      <TableCell className="font-mono text-sm">{event.ip_address}</TableCell>
                      <TableCell>
                        <Badge variant={event.status === "open" ? "destructive" : "secondary"}>{event.status}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(event.created_at).toLocaleDateString("ar-MA")}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {event.status === "open" && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => resolveSecurityEvent(event.id, "تم الحل")}
                              >
                                <CheckCheck className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => blockIpAddress(event.ip_address, 60)}>
                                <Ban className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fraud Rules Tab */}
        <TabsContent value="fraud-rules" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>قواعد كشف الاحتيال</CardTitle>
              <CardDescription>إدارة قواعد الأمان التلقائية</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الاسم</TableHead>
                    <TableHead>النوع</TableHead>
                    <TableHead>الإجراء</TableHead>
                    <TableHead>الخطورة</TableHead>
                    <TableHead>الأولوية</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fraudRules.map((rule) => (
                    <TableRow key={rule.id}>
                      <TableCell className="font-medium">{rule.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{rule.rule_type}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge>{rule.action}</Badge>
                      </TableCell>
                      <TableCell>{getRiskBadge(rule.severity)}</TableCell>
                      <TableCell>{rule.priority}</TableCell>
                      <TableCell>
                        <Badge variant={rule.is_active ? "default" : "secondary"}>
                          {rule.is_active ? "نشط" : "معطل"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateFraudRule(rule.id, { is_active: !rule.is_active })}
                        >
                          {rule.is_active ? "تعطيل" : "تفعيل"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
