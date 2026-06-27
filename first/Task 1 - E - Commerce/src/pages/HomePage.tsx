import { useEffect, useState } from "react"
import { useSearchParams } from "@/lib/router"
import { supabase } from "@/lib/supabase"
import type { Product } from "@/types"
import { ProductCard } from "@/components/products/ProductCard"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, SlidersHorizontal } from "lucide-react"

const CATEGORIES = ["All", "Electronics", "Sports", "Accessories", "Home & Kitchen", "Footwear", "Clothing"]

const SORT_OPTIONS = [
  { label: "Featured", value: "featured" },
  { label: "Price: Low to High", value: "price_asc" },
  { label: "Price: High to Low", value: "price_desc" },
  { label: "Newest", value: "newest" },
]

function ProductSkeleton() {
  return (
    <div className="rounded-xl border overflow-hidden">
      <Skeleton className="h-48 w-full rounded-none" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
        <div className="flex items-center justify-between pt-2">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>
    </div>
  )
}

export function HomePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [sortBy, setSortBy] = useState("featured")
  const [searchParams] = useSearchParams()

  const searchQuery = searchParams.get("search") ?? ""

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true)
      setError(null)

      try {
        let query = supabase.from<Product>("products").select("*")

        if (selectedCategory !== "All") {
          query = query.eq("category", selectedCategory)
        }
        if (searchQuery) {
          query = query.ilike("name", `%${searchQuery}%`)
        }
        if (sortBy === "price_asc") query = query.order("price", { ascending: true })
        else if (sortBy === "price_desc") query = query.order("price", { ascending: false })
        else if (sortBy === "newest") query = query.order("created_at", { ascending: false })
        else query = query.order("name", { ascending: true })

        const { data, error } = await query

        if (error) {
          setError(error.message)
        } else {
          setProducts((data as Product[]) ?? [])
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load products")
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [selectedCategory, sortBy, searchQuery])

  return (
    <div className="container mx-auto px-4 py-8">
      {!searchQuery && (
        <div className="rounded-2xl bg-primary text-primary-foreground p-8 md:p-12 mb-10 text-center">
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-3">
            Shop the Latest
          </h1>
          <p className="text-primary-foreground/70 text-lg max-w-xl mx-auto">
            Discover thousands of products across electronics, fashion, home goods, and more.
          </p>
        </div>
      )}

      {searchQuery && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold">
            Search results for <span className="text-primary">"{searchQuery}"</span>
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {products.length} product{products.length !== 1 ? "s" : ""} found
          </p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="flex flex-wrap gap-2 flex-1">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === cat
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <SlidersHorizontal className="size-4 text-muted-foreground" />
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="text-sm bg-background border border-input rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {SORT_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="size-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => <ProductSkeleton key={i} />)}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-muted-foreground text-lg">No products found.</p>
          <Button variant="ghost" className="mt-4" onClick={() => setSelectedCategory("All")}>
            Clear filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}
