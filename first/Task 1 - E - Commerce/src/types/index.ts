export interface Product {
  id: string
  name: string
  description: string
  price: number
  image_url: string | null
  category: string
  stock_quantity: number
  created_at: string
}

export interface Order {
  id: string
  user_id: string
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled"
  total_amount: number
  shipping_name: string
  shipping_address: string
  shipping_city: string
  shipping_state: string
  shipping_zip: string
  shipping_country: string
  created_at: string
  order_items?: OrderItem[]
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  quantity: number
  unit_price: number
  created_at: string
  product?: Product
}

export interface CartItem {
  product: Product
  quantity: number
}
