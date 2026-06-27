import { BrowserRouter, Routes, Route, Navigate } from "@/lib/router"
import { AuthProvider, useAuth } from "@/contexts/AuthContext"
import { CartProvider } from "@/contexts/CartContext"
import { Navbar } from "@/components/layout/Navbar"
import { HomePage } from "@/pages/HomePage"
import { ProductDetailPage } from "@/pages/ProductDetailPage"
import { CartPage } from "@/pages/CartPage"
import { CheckoutPage } from "@/pages/CheckoutPage"
import { LoginPage } from "@/pages/LoginPage"
import { OrdersPage } from "@/pages/OrdersPage"
import { OrderConfirmationPage } from "@/pages/OrderConfirmationPage"

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function AppRoutes() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <CheckoutPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <OrdersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders/:id/confirmation"
            element={
              <ProtectedRoute>
                <OrderConfirmationPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <AppRoutes />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
