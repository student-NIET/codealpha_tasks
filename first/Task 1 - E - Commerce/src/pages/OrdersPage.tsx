import { useEffect, useState } from "react"
import { Link } from "@/lib/router"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/AuthContext"
import type { Order } from "@/types"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Package, ShoppingBag, AlertCircle, ChevronRight } from "lucide-react"

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
  processing: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  shipped: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  delivered: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
}

export function OrdersPage() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    async function fetchOrders() {
      try {
        const { data, error } = await supabase
          .from<Order>("orders")
          .select("*, order_items(*, product:products(name))")
          .eq("user_id", user!.id)
          .order("created_at", { ascending: false })
        if (error) setError(error.message)
        else setOrders((data as Order[]) ?? [])
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load orders")
      } finally {
        setLoading(false)
      }
    }
    fetchOrders()
  }, [user])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl space-y-4">
        <Skeleton className="h-8 w-48 mb-6" />
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-2xl font-bold mb-8 flex items-center gap-2">
        <Package className="size-6" />
        My Orders
      </h1>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="size-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {orders.length === 0 ? (
        <div className="text-center py-20">
          <Package className="size-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">No orders yet</h2>
          <p className="text-muted-foreground mb-6">Start shopping to see your orders here.</p>
          <Button asChild>
            <Link to="/"><ShoppingBag className="size-4" /> Browse Products</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map(order => (
            <Link
              key={order.id}
              to={`/orders/${order.id}/confirmation`}
              className="flex items-center gap-4 p-4 rounded-xl border bg-card hover:bg-accent/50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs text-muted-foreground">
                    #{order.id.slice(0, 8).toUpperCase()}
                  </span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[order.status] ?? ""}`}>
                    {order.status}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold">${Number(order.total_amount).toFixed(2)}</span>
                  <span className="text-sm text-muted-foreground">
                    {order.order_items?.length ?? 0} item{(order.order_items?.length ?? 0) !== 1 ? "s" : ""}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(order.created_at).toLocaleDateString("en-US", {
                    year: "numeric", month: "long", day: "numeric",
                  })}
                </p>
              </div>
              <ChevronRight className="size-4 text-muted-foreground shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
