// Local Database Management using localStorage
import type { Product, Order, Customer, Coupon, SiteSettings, AdminUser, Review } from "./types"

const STORAGE_KEYS = {
  PRODUCTS: "mecca_products",
  ORDERS: "mecca_orders",
  CUSTOMERS: "mecca_customers",
  COUPONS: "mecca_coupons",
  SETTINGS: "mecca_settings",
  ADMIN: "mecca_admin",
  REVIEWS: "mecca_reviews",
}

// Default admin credentials
const DEFAULT_ADMIN: AdminUser = {
  username: "admin",
  password: "mecca2025", // In production, this should be hashed
}

// Default site settings
const DEFAULT_SETTINGS: SiteSettings = {
  siteName: "مكة",
  siteDescription: "متجر مكة للأزياء النسائية الراقية",
  contactEmail: "info@mecca-fashion.com",
  contactPhone: "01234567890",
  contactWhatsapp: "01234567890",
  contactAddress: "القاهرة، مصر",
  logo: "/logo-option-4.jpg",
  primaryColor: "#e8b4b8",
  secondaryColor: "#f5f5f5",
  accentColor: "#d4a5a5",
  backgroundColor: "#ffffff",
  textColor: "#1a1a1a",
  fontFamily: "Cairo",
  fontSize: "16px",
  socialMedia: {
    facebook: "",
    instagram: "",
    twitter: "",
    tiktok: "",
    snapchat: "",
  },
}

// Initialize default data
export function initializeDatabase() {
  if (typeof window === "undefined") return

  // Initialize admin if not exists
  if (!localStorage.getItem(STORAGE_KEYS.ADMIN)) {
    localStorage.setItem(STORAGE_KEYS.ADMIN, JSON.stringify(DEFAULT_ADMIN))
  }

  // Initialize settings if not exists
  if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
    // Save default settings immediately so app has something to read synchronously
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS))

    // Attempt to fetch store name from server and update settings if available.
    // This runs asynchronously and won't block initialization.
    ;(async () => {
      try {
        const res = await fetch('/api/store/name')
        if (res.ok) {
          const json = await res.json()
          if (json && json.store_name) {
            const current = JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS) || "{}")
            const updated = { ...current, siteName: json.store_name }
            localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated))
          }
        }
      } catch (e) {
        // ignore fetch errors and keep defaults
        console.error('Failed to fetch store name for local settings:', e)
      }
    })()
  }

  // Initialize empty arrays if not exists
  if (!localStorage.getItem(STORAGE_KEYS.ORDERS)) {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify([]))
  }
  if (!localStorage.getItem(STORAGE_KEYS.CUSTOMERS)) {
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify([]))
  }
  if (!localStorage.getItem(STORAGE_KEYS.COUPONS)) {
    localStorage.setItem(STORAGE_KEYS.COUPONS, JSON.stringify([]))
  }
  if (!localStorage.getItem(STORAGE_KEYS.REVIEWS)) {
    localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify([]))
  }
}

// Products
export function saveProducts(products: Product[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products))
}

export function getProducts(): Product[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem(STORAGE_KEYS.PRODUCTS)
  return data ? JSON.parse(data) : []
}

export function addProduct(product: Product) {
  const products = getProducts()
  products.push(product)
  saveProducts(products)
}

export function updateProduct(id: string, updates: Partial<Product>) {
  const products = getProducts()
  const index = products.findIndex((p) => p.id === id)
  if (index !== -1) {
    products[index] = { ...products[index], ...updates }
    saveProducts(products)
  }
}

export function deleteProduct(id: string) {
  const products = getProducts().filter((p) => p.id !== id)
  saveProducts(products)
}

// Orders
export function saveOrders(orders: Order[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders))
}

export function getOrders(): Order[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem(STORAGE_KEYS.ORDERS)
  return data ? JSON.parse(data) : []
}

export function addOrder(order: Order) {
  const orders = getOrders()
  orders.push(order)
  saveOrders(orders)
}

export function updateOrder(id: string, updates: Partial<Order>) {
  const orders = getOrders()
  const index = orders.findIndex((o) => o.id === id)
  if (index !== -1) {
    orders[index] = { ...orders[index], ...updates, updatedAt: new Date().toISOString() }
    saveOrders(orders)
  }
}

export function updateOrderStatus(orderId: string, status: Order["orderStatus"]) {
  const orders = getOrders()
  const index = orders.findIndex((o) => o.id === orderId)
  if (index !== -1) {
    orders[index] = { ...orders[index], orderStatus: status, updatedAt: new Date().toISOString() }
    saveOrders(orders)
  }
}

// Customers
export function getCustomers(): Customer[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem(STORAGE_KEYS.CUSTOMERS)
  return data ? JSON.parse(data) : []
}

export function saveCustomers(customers: Customer[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers))
}

export function addCustomer(customer: Customer) {
  const customers = getCustomers()
  customers.push(customer)
  saveCustomers(customers)
}

// Coupons
export function getCoupons(): Coupon[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem(STORAGE_KEYS.COUPONS)
  return data ? JSON.parse(data) : []
}

export function saveCoupons(coupons: Coupon[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEYS.COUPONS, JSON.stringify(coupons))
}

export function addCoupon(coupon: Coupon) {
  const coupons = getCoupons()
  coupons.push(coupon)
  saveCoupons(coupons)
}

export function updateCoupon(id: string, updates: Partial<Coupon>) {
  const coupons = getCoupons()
  const index = coupons.findIndex((c) => c.id === id)
  if (index !== -1) {
    coupons[index] = { ...coupons[index], ...updates }
    saveCoupons(coupons)
  }
}

export function deleteCoupon(id: string) {
  const coupons = getCoupons().filter((c) => c.id !== id)
  saveCoupons(coupons)
}

// Settings
export function getSettings(): SiteSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS
  const data = localStorage.getItem(STORAGE_KEYS.SETTINGS)
  return data ? JSON.parse(data) : DEFAULT_SETTINGS
}

export function saveSettings(settings: SiteSettings) {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings))
}

// Admin
export function getAdmin(): AdminUser {
  if (typeof window === "undefined") return DEFAULT_ADMIN
  const data = localStorage.getItem(STORAGE_KEYS.ADMIN)
  return data ? JSON.parse(data) : DEFAULT_ADMIN
}

export function updateAdmin(admin: AdminUser) {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEYS.ADMIN, JSON.stringify(admin))
}

// Reviews
export function getReviews(): Review[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem(STORAGE_KEYS.REVIEWS)
  return data ? JSON.parse(data) : []
}

export function saveReviews(reviews: Review[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(reviews))
}

export function addReview(review: Review) {
  const reviews = getReviews()
  reviews.push(review)
  saveReviews(reviews)
}
