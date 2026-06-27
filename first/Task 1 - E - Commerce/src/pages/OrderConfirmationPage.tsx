import { useEffect, useState } from "react"
import { useParams, Link } from "@/lib/router"
import { supabase } from "@/lib/supabase"
import type { Order } from "@/types"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { CheckCircle, ShoppingBag, Package } from "lucide-react"

export function OrderConfirmationPage() {
  const { id } = useParams<{ id: string }>()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    async function fetchOrder() {
      try {
        const { data } = await supabase
          .from<Order>("orders")
          .select("*, order_items(*, product:products(*))")
          .eq("id", id!)
          .single()
        setOrder(data as Order)
      } finally {
        setLoading(false)
      }
    }
    fetchOrder()
  }, [id])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-2xl space-y-4">
        <Skeleton className="h-16 w-16 rounded-full mx-auto" />
        <Skeleton className="h-8 w-64 mx-auto" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl text-center">
      <div className="flex flex-col items-center gap-3 mb-8">
        <div className="size-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
          <CheckCircle className="size-10 text-green-600 dark:text-green-400" />
        </div>
        <h1 className="text-3xl font-bold">Order Confirmed!</h1>
        <p className="text-muted-foreground max-w-sm">
          Thank you for your purchase. We're processing your order and will ship it soon.
        </p>
      </div>

      {order && (
        <div className="rounded-xl border bg-card text-left p-6 space-y-4 mb-8">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2">
              <Package className="size-4" />Order Details
            </h2>
            <span className="text-xs text-muted-foreground font-mono">
              #{order.id.slice(0, 8).toUpperCase()}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <div>
              <p className="text-muted-foreground">Status</p>
              <p className="font-medium capitalize">{order.status}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Total</p>
              <p className="font-medium">${Number(order.total_amount).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Ship To</p>
              <p className="font-medium">{order.shipping_name}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Address</p>
              <p className="font-medium">{order.shipping_city}, {order.shipping_state}</p>
            </div>
          </div>

          {order.order_items && order.order_items.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                {order.order_items.map(item => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {item.product?.name ?? "Product"} × {item.quantity}
                    </span>
                    <span className="font-medium">
                      ${(Number(item.unit_price) * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button asChild>
          <Link to="/"><ShoppingBag className="size-4" /> Continue Shopping</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/orders"><Package className="size-4" /> View All Orders</Link>
        </Button>
      </div>
    </div>
  )
}
