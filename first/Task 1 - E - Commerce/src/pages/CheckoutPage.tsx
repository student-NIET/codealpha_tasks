import { useState } from "react"
import { useNavigate, Link } from "@/lib/router"
import { useCart } from "@/contexts/CartContext"
import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, CreditCard, AlertCircle, Lock } from "lucide-react"

const EMOJI: Record<string, string> = {
  Electronics: "💻", Sports: "⚽", Accessories: "👜",
  "Home & Kitchen": "🏠", Footwear: "👟", Clothing: "👕",
}

interface ShippingForm {
  full_name: string
  address: string
  city: string
  state: string
  zip: string
  country: string
}

export function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState<ShippingForm>({
    full_name: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    country: "United States",
  })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const shipping = totalPrice >= 50 ? 0 : 5.99
  const total = totalPrice + shipping

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user || items.length === 0) return

    setError(null)
    setLoading(true)

    try {
      // Insert order — insert() returns an array of created rows
      const { data: rows, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          status: "processing",
          total_amount: total,
          shipping_name: form.full_name,
          shipping_address: form.address,
          shipping_city: form.city,
          shipping_state: form.state,
          shipping_zip: form.zip,
          shipping_country: form.country,
        })

      if (orderError) throw new Error(orderError.message)
      const order = Array.isArray(rows) && rows.length > 0 ? rows[0] as { id: string } : null
      if (!order) throw new Error("Failed to create order")

      // Insert order items
      const { error: itemsError } = await supabase.from("order_items").insert(
        items.map(({ product, quantity }) => ({
          order_id: order.id,
          product_id: product.id,
          quantity,
          unit_price: product.price,
        }))
      )
      if (itemsError) throw new Error(itemsError.message)

      clearCart()
      navigate(`/orders/${order.id}/confirmation`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (items.length === 0 && !loading) {
    return (
      <div className="container mx-auto px-4 py-20 max-w-2xl text-center">
        <p className="text-muted-foreground mb-4">Your cart is empty.</p>
        <Button asChild><Link to="/">Browse Products</Link></Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <Button variant="ghost" size="sm" asChild className="mb-6">
        <Link to="/cart"><ArrowLeft className="size-4" /> Back to Cart</Link>
      </Button>

      <h1 className="text-2xl font-bold mb-8">Checkout</h1>

      <div className="grid lg:grid-cols-5 gap-8">
        <form onSubmit={handleSubmit} className="lg:col-span-3 space-y-6">
          <div className="rounded-xl border bg-card p-6 space-y-4">
            <h2 className="font-semibold text-base">Shipping Information</h2>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="size-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input id="full_name" name="full_name" placeholder="John Doe" value={form.full_name} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Street Address</Label>
              <Input id="address" name="address" placeholder="123 Main St" value={form.address} onChange={handleChange} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" name="city" placeholder="New York" value={form.city} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input id="state" name="state" placeholder="NY" value={form.state} onChange={handleChange} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="zip">ZIP Code</Label>
                <Input id="zip" name="zip" placeholder="10001" value={form.zip} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input id="country" name="country" placeholder="United States" value={form.country} onChange={handleChange} required />
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-6 space-y-4">
            <h2 className="font-semibold text-base flex items-center gap-2">
              <CreditCard className="size-4" />Payment
            </h2>
            <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground flex items-center gap-2">
              <Lock className="size-4 shrink-0" />
              Demo mode — no real payment required. Click "Place Order" to simulate a purchase.
            </div>
          </div>

          <Button type="submit" size="lg" className="w-full gap-2" disabled={loading}>
            <Lock className="size-4" />
            {loading ? "Placing Order..." : `Place Order — $${total.toFixed(2)}`}
          </Button>
        </form>

        <div className="lg:col-span-2">
          <div className="rounded-xl border bg-card p-6 space-y-4 sticky top-24">
            <h2 className="font-semibold">Order Summary</h2>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {items.map(({ product, quantity }) => (
                <div key={product.id} className="flex gap-3 text-sm">
                  <div className="size-10 rounded bg-muted flex items-center justify-center text-lg shrink-0">
                    {EMOJI[product.category] ?? "📦"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{product.name}</p>
                    <p className="text-muted-foreground">Qty: {quantity}</p>
                  </div>
                  <span className="font-medium shrink-0">${(Number(product.price) * quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <Separator />

            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span><span>${totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Shipping</span>
                <span className={shipping === 0 ? "text-green-600 dark:text-green-400" : ""}>
                  {shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}
                </span>
              </div>
            </div>

            <Separator />

            <div className="flex justify-between font-bold">
              <span>Total</span><span>${total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
