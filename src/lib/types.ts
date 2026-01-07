// Database Types for Mecca Fashion Store

export interface ProductColor {
  name: string
  hex: string
  images: string[]
}

export interface Product {
  id: string
  name: string
  category: string
  subcategory?: string
  price: number
  description: string
  materials: string
  colors: ProductColor[]
  sizes: string[]
  rating: number
  reviews: number
  featured: boolean
  customSizesAvailable: boolean
  createdAt: string
}

export interface CartItem {
  product: Product
  color: ProductColor
  size: string
  quantity: number
}

export interface Order {
  id: string
  customerName: string
  customerEmail: string
  customerPhone: string
  customerAddress: string
  items: CartItem[]
  totalPrice: number
  paymentMethod: "cod" | "card" | "wallet"
  paymentStatus: "pending" | "completed" | "failed"
  orderStatus: "pending" | "processing" | "shipped" | "delivered" | "cancelled"
  createdAt: string
  updatedAt: string
}

export interface Customer {
  id: string
  name: string
  email: string
  phone: string
  address: string
  totalOrders: number
  totalSpent: number
  createdAt: string
}

export interface Coupon {
  id: string
  code: string
  discountType: "percentage" | "fixed"
  discountValue: number
  minPurchase: number
  maxUses: number
  usedCount: number
  expiresAt: string
  isActive: boolean
  createdAt: string
}

export interface SiteSettings {
  siteName: string
  siteDescription: string
  contactEmail: string
  contactPhone: string
  contactWhatsapp: string
  contactAddress: string
  logo: string
  primaryColor: string
  secondaryColor: string
  accentColor: string
  backgroundColor: string
  textColor: string
  fontFamily: string
  fontSize: string
  socialMedia: {
    facebook?: string
    instagram?: string
    twitter?: string
    tiktok?: string
    snapchat?: string
  }
}

export interface AdminUser {
  username: string
  password: string
}

export interface Review {
  id: string
  customerName: string
  rating: number
  comment: string
  productId: string
  createdAt: string
  approved: boolean
}
