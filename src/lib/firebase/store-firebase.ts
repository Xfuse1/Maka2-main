/**
 * 🔥 Firebase Firestore Structure للـ Multi-tenant
 * 
 * هذا الملف يوضح كيفية تنظيم البيانات في Firebase
 * مع الحفاظ على Supabase كـ Source of Truth
 */

/**
 * FIRESTORE STRUCTURE:
 * 
 * stores/
 *   {storeId}/
 *     - store_name
 *     - subdomain
 *     - primary_color
 *     - logo_url
 *     - status
 *     
 *     products/
 *       {productId}/
 *         - name_ar
 *         - base_price
 *         - images[]
 *         - is_active
 *         - category_id
 *         
 *     categories/
 *       {categoryId}/
 *         - name_ar
 *         - display_order
 *         
 *     orders/
 *       {orderId}/
 *         - customer_name
 *         - total
 *         - status (realtime updates!)
 *         
 *     carts/
 *       {sessionId}/
 *         - items[]
 *         - updated_at (realtime!)
 *         
 *     notifications/
 *       {notificationId}/
 *         - type
 *         - message
 *         - read
 */

// =============================================================================
// FIREBASE CONFIG
// =============================================================================

import { initializeApp } from 'firebase/app'
import { getFirestore, collection, doc, getDoc, getDocs, query, where, onSnapshot } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

// =============================================================================
// STORE HELPERS
// =============================================================================

/**
 * الحصول على بيانات متجر
 */
export async function getStoreData(storeId: string) {
  const storeRef = doc(db, 'stores', storeId)
  const storeSnap = await getDoc(storeRef)
  return storeSnap.exists() ? storeSnap.data() : null
}

/**
 * الحصول على منتجات متجر
 */
export async function getStoreProducts(storeId: string) {
  const productsRef = collection(db, 'stores', storeId, 'products')
  const q = query(productsRef, where('is_active', '==', true))
  const snapshot = await getDocs(q)
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}

/**
 * البحث في منتجات متجر
 */
export async function searchStoreProducts(storeId: string, searchQuery: string) {
  // Firebase لا يدعم LIKE مباشرة
  // الحل: استخدام startAt/endAt أو Algolia
  const productsRef = collection(db, 'stores', storeId, 'products')
  const q = query(
    productsRef,
    where('is_active', '==', true),
    where('name_ar', '>=', searchQuery),
    where('name_ar', '<=', searchQuery + '\uf8ff')
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}

// =============================================================================
// REALTIME LISTENERS
// =============================================================================

/**
 * متابعة حالة الطلب في الوقت الحقيقي
 */
export function subscribeToOrderStatus(
  storeId: string, 
  orderId: string, 
  callback: (status: string) => void
) {
  const orderRef = doc(db, 'stores', storeId, 'orders', orderId)
  return onSnapshot(orderRef, (doc) => {
    if (doc.exists()) {
      callback(doc.data().status)
    }
  })
}

/**
 * متابعة السلة في الوقت الحقيقي
 */
export function subscribeToCart(
  storeId: string, 
  sessionId: string, 
  callback: (cart: any) => void
) {
  const cartRef = doc(db, 'stores', storeId, 'carts', sessionId)
  return onSnapshot(cartRef, (doc) => {
    if (doc.exists()) {
      callback(doc.data())
    }
  })
}

/**
 * متابعة الإشعارات
 */
export function subscribeToNotifications(
  storeId: string, 
  userId: string, 
  callback: (notifications: any[]) => void
) {
  const notificationsRef = collection(db, 'stores', storeId, 'notifications')
  const q = query(
    notificationsRef, 
    where('user_id', '==', userId),
    where('read', '==', false)
  )
  return onSnapshot(q, (snapshot) => {
    const notifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    callback(notifications)
  })
}

// =============================================================================
// SYNC SERVICE (Supabase → Firebase)
// =============================================================================

/**
 * مزامنة البيانات من Supabase إلى Firebase
 * يمكن استخدام Supabase Edge Functions أو Webhooks
 */

/*
// في Supabase Edge Function:

import { createClient } from '@supabase/supabase-js'
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

// عند إضافة/تعديل منتج في Supabase
export async function syncProductToFirebase(product: any) {
  const db = getFirestore()
  await db
    .collection('stores')
    .doc(product.store_id)
    .collection('products')
    .doc(product.id)
    .set({
      name_ar: product.name_ar,
      base_price: product.base_price,
      is_active: product.is_active,
      images: product.product_images?.map(img => img.image_url) || [],
      updated_at: new Date()
    }, { merge: true })
}
*/

export { db }
