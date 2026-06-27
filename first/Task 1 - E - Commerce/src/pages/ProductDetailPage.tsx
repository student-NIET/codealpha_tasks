import { useEffect, useState } from "react"
import { useParams, useNavigate, Link } from "@/lib/router"
import { supabase } from "@/lib/supabase"
import type { Product } from "@/types"
import { useCart } from "@/contexts/CartContext"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import {
  ShoppingCart,
  ArrowLeft,
  Package,
  Truck,
  ShieldCheck,
  RefreshCw,
  Plus,
  Minus,
  AlertCircle,
} from "lucide-react"

const CATEGORY_ICONS: Record<string, string> = {
  Electronics: "💻",
  Sports: "⚽",
  Accessories: "👜",
  "Home & Kitchen": "🏠",
  Footwear: "👟",
  Clothing: "👕",
}

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { addItem } = useCart()

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)

  useEffect(() => {
    async function fetchProduct() {
      if (!id) return
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from<Product>("products")
          .select("*")
          .eq("id", id)
          .single()
        if (error) setError(error.message)
        else setProduct(data as Product)
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load product")
      } finally {
        setLoading(false)
      }
    }
    fetchProduct()
  }, [id])

  function handleAddToCart() {
    if (!product) return
    addItem(product, quantity)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Skeleton className="h-4 w-32 mb-6" />
        <div className="grid md:grid-cols-2 gap-10">
          <Skeleton className="h-96 rounded-xl" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription>{error ?? "Product not found."}</AlertDescription>
        </Alert>
        <Button variant="ghost" className="mt-4" onClick={() => navigate("/")}>
          <ArrowLeft className="size-4" /> Back to Store
        </Button>
      </div>
    )
  }

  const outOfStock = product.stock_quantity === 0
  const lowStock = product.stock_quantity > 0 && product.stock_quantity <= 10
  const emoji = CATEGORY_ICONS[product.category] ?? "📦"

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <Button variant="ghost" size="sm" asChild className="mb-6 gap-1.5">
        <Link to="/">
          <ArrowLeft className="size-4" />
          Back to Products
        </Link>
      </Button>

      <div className="grid md:grid-cols-2 gap-10">
        <div className="rounded-xl overflow-hidden border bg-muted aspect-square flex items-center justify-center">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center justify-center gap-3">
              <span className="text-8xl">{emoji}</span>
              <span className="text-sm text-muted-foreground">{product.category}</span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {product.category}
            </span>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight mt-1">{product.name}</h1>
          </div>

          <span className="text-4xl font-extrabold">${Number(product.price).toFixed(2)}</span>

          {outOfStock && (
            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-destructive text-destructive-foreground w-fit">
              Out of Stock
            </span>
          )}
          {lowStock && (
            <p className="text-sm text-destructive flex items-center gap-1.5">
              <Package className="size-4" />
              Only {product.stock_quantity} units remaining
            </p>
          )}

          <Separator />
          <p className="text-muted-foreground leading-relaxed">{product.description}</p>
          <Separator />

          {!outOfStock && (
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">Quantity</span>
              <div className="flex items-center border rounded-md">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  className="rounded-r-none"
                >
                  <Minus className="size-3.5" />
                </Button>
                <span className="w-10 text-center text-sm font-medium">{quantity}</span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setQuantity(q => Math.min(product.stock_quantity, q + 1))}
                  disabled={quantity >= product.stock_quantity}
                  className="rounded-l-none"
                >
                  <Plus className="size-3.5" />
                </Button>
              </div>
            </div>
          )}

          <Button size="lg" onClick={handleAddToCart} disabled={outOfStock} className="w-full gap-2">
            <ShoppingCart className="size-5" />
            {added ? "Added to Cart!" : outOfStock ? "Out of Stock" : "Add to Cart"}
          </Button>

          <div className="grid grid-cols-3 gap-3 mt-2">
            {[
              { icon: Truck, label: "Free shipping over $50" },
              { icon: ShieldCheck, label: "2-year warranty" },
              { icon: RefreshCw, label: "30-day returns" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-1.5 text-center p-3 rounded-lg bg-muted">
                <Icon className="size-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
