// Manual type definitions for payment-related tables
// These are temporary types until Supabase type generation works

export interface PaymentWebhook {
  id?: string
  source: string
  event_type: string
  payload: any
  signature: string
  signature_verified: boolean
  ip_address: string
  status: string
  created_at?: string
}

export interface PaymentRefund {
  id?: string
  transaction_id: string
  refund_amount: number
  status: string
  completed_at?: string
  created_at?: string
}

export interface FraudRule {
  id: string
  name: string
  description?: string
  rule_type: string
  conditions: any
  action: string
  priority: number
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export interface SecurityEvent {
  id: string
  event_type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  metadata?: any
  status: 'open' | 'resolved' | 'ignored'
  resolved_at?: string
  resolution_notes?: string
  created_at?: string
}

export interface PaymentTransaction {
  id: string
  order_id: string
  payment_method_id: string
  amount: number
  currency: string
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  risk_level?: 'low' | 'medium' | 'high' | 'critical'
  created_at?: string
  updated_at?: string
}

export interface PaymentLog {
  id: string
  transaction_id: string
  level: string
  message: string
  metadata?: any
  created_at?: string
}

export interface Order {
  id: string
  order_number: string
  customer_name: string
  customer_email: string
  payment_status?: string
  status: string
  updated_at?: string
  created_at?: string
}
