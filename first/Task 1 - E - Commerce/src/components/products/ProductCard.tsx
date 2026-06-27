import { Link } from "@/lib/router"
import { ShoppingCart, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { useCart } from "@/contexts/CartContext"
import type { Product } from "@/types"

const CATEGORY_COLORS: Record<string, string> = {
  Electronics: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  Sports: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  Accessories: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  "Home & Kitchen": "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  Footwear: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
  Clothing: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
}

const CATEGORY_ICONS: Record<string, string> = {
  Electronics: "💻",
  Sports: "⚽",
  Accessories: "👜",
  "Home & Kitchen": "🏠",
  Footwear: "👟",
  Clothing: "👕",
}

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart()
  const outOfStock = product.stock_quantity === 0
  const lowStock = product.stock_quantity > 0 && product.stock_quantity <= 10
  const categoryColor = CATEGORY_COLORS[product.category] ?? "bg-muted text-muted-foreground"
  const emoji = CATEGORY_ICONS[product.category] ?? "📦"

  return (
    <Card className="group flex flex-col overflow-hidden h-full hover:shadow-md transition-shadow duration-200">
      <Link to={`/products/${product.id}`} className="block overflow-hidden">
        <div className="relative h-48 bg-muted overflow-hidden">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-5xl">{emoji}</span>
            </div>
          )}
          {outOfStock && (
            <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
              <span className="text-sm font-medium text-muted-foreground">Out of Stock</span>
            </div>
          )}
          <span className={`absolute top-2 left-2 text-xs font-medium px-2 py-0.5 rounded-full ${categoryColor}`}>
            {product.category}
          </span>
        </div>
      </Link>

      <CardContent className="flex-1 p-4">
        <Link to={`/products/${product.id}`}>
          <h3 className="font-semibold text-sm leading-tight line-clamp-2 hover:text-primary transition-colors mb-1">
            {product.name}
          </h3>
        </Link>
        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{product.description}</p>
        {lowStock && (
          <p className="text-xs text-destructive mt-2 flex items-center gap-1">
            <Package className="size-3" />
            Only {product.stock_quantity} left
          </p>
        )}
      </CardContent>

      <CardFooter className="p-4 pt-0 flex items-center justify-between gap-2">
        <span className="text-lg font-bold">${Number(product.price).toFixed(2)}</span>
        <Button size="sm" onClick={() => addItem(product)} disabled={outOfStock} className="gap-1.5">
          <ShoppingCart className="size-3.5" />
          Add to Cart
        </Button>
      </CardFooter>
    </Card>
  )
}
