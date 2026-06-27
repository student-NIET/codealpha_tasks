import { useState } from "react"
import { Link, useNavigate } from "@/lib/router"
import { ShoppingBag, ShoppingCart, User, LogOut, Package, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/contexts/AuthContext"
import { useCart } from "@/contexts/CartContext"

export function Navbar() {
  const { user, signOut } = useAuth()
  const { totalItems } = useCart()
  const navigate = useNavigate()
  const [search, setSearch] = useState("")

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (search.trim()) {
      navigate(`/?search=${encodeURIComponent(search.trim())}`)
    }
  }

  async function handleSignOut() {
    await signOut()
    navigate("/")
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 flex h-16 items-center gap-4">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl shrink-0">
          <ShoppingBag className="size-6 text-primary" />
          <span className="hidden sm:inline">ShopHub</span>
        </Link>

        <form onSubmit={handleSearch} className="flex-1 max-w-md hidden md:flex">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-4"
            />
          </div>
        </form>

        <nav className="flex items-center gap-1 ml-auto">
          <Button variant="ghost" size="icon-sm" asChild className="relative">
            <Link to="/cart">
              <ShoppingCart className="size-5" />
              {totalItems > 0 && (
                <Badge className="absolute -top-1 -right-1 size-5 flex items-center justify-center p-0 text-xs">
                  {totalItems > 99 ? "99+" : totalItems}
                </Badge>
              )}
              <span className="sr-only">Cart ({totalItems})</span>
            </Link>
          </Button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm">
                  <User className="size-5" />
                  <span className="sr-only">Account</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-3 py-2">
                  <p className="text-xs text-muted-foreground truncate">{user.email as string}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/orders" className="cursor-pointer">
                    <Package className="size-4" />
                    My Orders
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive cursor-pointer">
                  <LogOut className="size-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="outline" size="sm" asChild>
              <Link to="/login">Sign In</Link>
            </Button>
          )}
        </nav>
      </div>

      <div className="md:hidden border-t px-4 py-2">
        <form onSubmit={handleSearch}>
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-4"
            />
          </div>
        </form>
      </div>
    </header>
  )
}
