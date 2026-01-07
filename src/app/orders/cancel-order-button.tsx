"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface CancelOrderButtonProps {
  orderId: string
  status: string
  onOrderCancelled?: () => void
}

export function CancelOrderButton({ orderId, status, onOrderCancelled }: CancelOrderButtonProps) {
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  // Allow cancellation for 'pending' or 'under_creation'
  const canCancel = ["pending", "under_creation"].includes(status)

  const handleCancel = async () => {
    if (!canCancel) return
    setLoading(true)
    try {
      const res = await fetch(`/api/orders/${orderId}/cancel`, {
        method: "POST",
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || "فشل إلغاء الطلب")
      }

      toast({
        title: "تم إلغاء الطلب",
        description: "تم تحديث حالة الطلب بنجاح",
        variant: "default",
      })
      
      setOpen(false)
      
      // Force reload to update UI
      if (onOrderCancelled) {
        onOrderCancelled()
      } else {
        window.location.reload()
      }
    } catch (e: any) {
      console.error("[CancelOrderButton] Error:", e)
      toast({
        title: "خطأ",
        description: e?.message || "خطأ غير متوقع",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (!canCancel) return null

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="destructive" 
          size="sm"
          disabled={loading}
          className="w-full sm:w-auto"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "إلغاء الطلب"
          )}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>تأكيد إلغاء الطلب</DialogTitle>
          <DialogDescription>
            هل أنت متأكد من رغبتك في إلغاء هذا الطلب؟ لا يمكن التراجع عن هذا الإجراء.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <DialogClose asChild>
            <Button variant="outline" disabled={loading}>تراجع</Button>
          </DialogClose>
          <Button 
            variant="destructive"
            onClick={(e: React.MouseEvent) => {
              e.preventDefault()
              handleCancel()
            }}
            disabled={loading}
          >
            {loading ? "جاري الإلغاء..." : "نعم، إلغاء الطلب"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
