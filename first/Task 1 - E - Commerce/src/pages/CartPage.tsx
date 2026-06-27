import { Link, useNavigate } from "@/lib/router"
import { useCart } from "@/contexts/CartContext"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, ShoppingCart, Trash2, Plus, Minus, ShoppingBag } from "lucide-react"

const EMOJI: Record<string, string> = {
  Electronics: "💻", Sports: "⚽", Accessories: "👜",
  "Home & Kitchen": "🏠", Footwear: "👟", Clothing: "👕",
}

export function CartPage() {
  const { items, removeItem, updateQuantity, totalItems, totalPrice } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 max-w-2xl text-center">
        <ShoppingCart className="size-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
        <p className="text-muted-foreground mb-6">Add some products to get started!</p>
        <Button asChild>
          <Link to="/">
            <ShoppingBag className="size-4" />
            Browse Products
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex items-center gap-3 mb-8">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/"><ArrowLeft className="size-4" /> Continue Shopping</Link>
        </Button>
        <h1 className="text-2xl font-bold">
          Shopping Cart ({totalItems} {totalItems === 1 ? "item" : "items"})
        </h1>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-1">
          {items.map(({ product, quantity }) => (
            <div key={product.id} className="flex gap-4 p-4 rounded-xl border bg-card">
              <Link to={`/products/${product.id}`} className="shrink-0">
                <div className="size-20 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl">{EMOJI[product.category] ?? "📦"}</span>
                  )}
                </div>
              </Link>

              <div className="flex-1 min-w-0">
                <Link to={`/products/${product.id}`}>
                  <h3 className="font-semibold text-sm leading-snug hover:text-primary transition-colors line-clamp-2">
                    {product.name}
                  </h3>
                </Link>
                <p className="text-xs text-muted-foreground mt-0.5">{product.category}</p>

                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center border rounded-md">
                    <Button
                      variant="ghost" size="icon-xs"
                      onClick={() => updateQuantity(product.id, quantity - 1)}
                      className="rounded-r-none"
                    >
                      <Minus className="size-3" />
                    </Button>
                    <span className="w-8 text-center text-sm font-medium">{quantity}</span>
                    <Button
                      variant="ghost" size="icon-xs"
                      onClick={() => updateQuantity(product.id, quantity + 1)}
                      disabled={quantity >= product.stock_quantity}
                      className="rounded-l-none"
                    >
                      <Plus className="size-3" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-semibold">${(Number(product.price) * quantity).toFixed(2)}</span>
                    <Button
                      variant="ghost" size="icon-xs"
                      onClick={() => removeItem(product.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-1">
          <div className="rounded-xl border bg-card p-6 sticky top-24 space-y-4">
            <h2 className="font-semibold text-lg">Order Summary</h2>

            <div className="space-y-2 text-sm">
              {items.map(({ product, quantity }) => (
                <div key={product.id} className="flex justify-between text-muted-foreground">
                  <span className="truncate pr-4">{product.name} × {quantity}</span>
                  <span className="shrink-0">${(Number(product.price) * quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <Separator />

            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>${totalPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Shipping</span>
              <span className={totalPrice >= 50 ? "text-green-600 dark:text-green-400" : ""}>
                {totalPrice >= 50 ? "Free" : "$5.99"}
              </span>
            </div>

            <Separator />

            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>${(totalPrice + (totalPrice >= 50 ? 0 : 5.99)).toFixed(2)}</span>
            </div>

            {totalPrice < 50 && (
              <p className="text-xs text-muted-foreground">
                Add ${(50 - totalPrice).toFixed(2)} more for free shipping!
              </p>
            )}

            <Button
              className="w-full" size="lg"
              onClick={() => navigate(user ? "/checkout" : "/login")}
            >
              {user ? "Proceed to Checkout" : "Sign In to Checkout"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
