export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      customers: {
        Row: {
          id: string
          email: string
          full_name: string
          phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          full_name: string
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name_ar: string
          name_en: string
          slug: string
          description_ar: string | null
          description_en: string | null
          image_url: string | null
          parent_id: string | null
          display_order: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name_ar: string
          name_en: string
          slug: string
          description_ar?: string | null
          description_en?: string | null
          image_url?: string | null
          parent_id?: string | null
          display_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name_ar?: string
          name_en?: string
          slug?: string
          description_ar?: string | null
          description_en?: string | null
          image_url?: string | null
          parent_id?: string | null
          display_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          name_ar: string
          name_en: string
          slug: string
          description_ar: string | null
          description_en: string | null
          category_id: string | null
          base_price: number
          compare_at_price: number | null
          cost_price: number | null
          sku: string | null
          barcode: string | null
          track_inventory: boolean
          inventory_quantity: number
          low_stock_threshold: number
          is_featured: boolean
          is_active: boolean
          tags: string[] | null
          meta_title_ar: string | null
          meta_title_en: string | null
          meta_description_ar: string | null
          meta_description_en: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name_ar: string
          name_en: string
          slug: string
          description_ar?: string | null
          description_en?: string | null
          category_id?: string | null
          base_price: number
          compare_at_price?: number | null
          cost_price?: number | null
          sku?: string | null
          barcode?: string | null
          track_inventory?: boolean
          inventory_quantity?: number
          low_stock_threshold?: number
          is_featured?: boolean
          is_active?: boolean
          tags?: string[] | null
          meta_title_ar?: string | null
          meta_title_en?: string | null
          meta_description_ar?: string | null
          meta_description_en?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name_ar?: string
          name_en?: string
          slug?: string
          description_ar?: string | null
          description_en?: string | null
          category_id?: string | null
          base_price?: number
          compare_at_price?: number | null
          cost_price?: number | null
          sku?: string | null
          barcode?: string | null
          track_inventory?: boolean
          inventory_quantity?: number
          low_stock_threshold?: number
          is_featured?: boolean
          is_active?: boolean
          tags?: string[] | null
          meta_title_ar?: string | null
          meta_title_en?: string | null
          meta_description_ar?: string | null
          meta_description_en?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      product_images: {
        Row: {
          id: string
          product_id: string | null
          image_url: string
          alt_text_ar: string | null
          alt_text_en: string | null
          display_order: number
          is_primary: boolean
          created_at: string
        }
        Insert: {
          id?: string
          product_id?: string | null
          image_url: string
          alt_text_ar?: string | null
          alt_text_en?: string | null
          display_order?: number
          is_primary?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: string | null
          image_url?: string
          alt_text_ar?: string | null
          alt_text_en?: string | null
          display_order?: number
          is_primary?: boolean
          created_at?: string
        }
      }
      product_variants: {
        Row: {
          id: string
          product_id: string | null
          name_ar: string
          name_en: string
          sku: string | null
          barcode: string | null
          price: number
          compare_at_price: number | null
          cost_price: number | null
          inventory_quantity: number
          size: string | null
          color: string | null
          color_hex: string | null
          weight: number | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          product_id?: string | null
          name_ar: string
          name_en: string
          sku?: string | null
          barcode?: string | null
          price: number
          compare_at_price?: number | null
          cost_price?: number | null
          inventory_quantity?: number
          size?: string | null
          color?: string | null
          color_hex?: string | null
          weight?: number | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          product_id?: string | null
          name_ar?: string
          name_en?: string
          sku?: string | null
          barcode?: string | null
          price?: number
          compare_at_price?: number | null
          cost_price?: number | null
          inventory_quantity?: number
          size?: string | null
          color?: string | null
          color_hex?: string | null
          weight?: number | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          user_id: string | null
          order_number: string
          customer_id: string | null
          customer_email: string
          customer_name: string
          customer_phone: string | null
          status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded"
          payment_status: "pending" | "paid" | "failed" | "refunded"
          payment_method: string | null
          subtotal: number
          shipping_cost: number
          tax: number
          discount: number
          total: number
          currency: string
          shipping_address_line1: string
          shipping_address_line2: string | null
          shipping_city: string
          shipping_state: string | null
          shipping_postal_code: string | null
          shipping_country: string
          billing_address_line1: string | null
          billing_address_line2: string | null
          billing_city: string | null
          billing_state: string | null
          billing_postal_code: string | null
          billing_country: string | null
          notes: string | null
          tracking_number: string | null
          shipped_at: string | null
          delivered_at: string | null
          cancelled_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          order_number: string
          customer_id?: string | null
          customer_email: string
          customer_name: string
          customer_phone?: string | null
          status?: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded"
          payment_status?: "pending" | "paid" | "failed" | "refunded"
          payment_method?: string | null
          subtotal: number
          shipping_cost?: number
          tax?: number
          discount?: number
          total: number
          currency?: string
          shipping_address_line1: string
          shipping_address_line2?: string | null
          shipping_city: string
          shipping_state?: string | null
          shipping_postal_code?: string | null
          shipping_country?: string
          billing_address_line1?: string | null
          billing_address_line2?: string | null
          billing_city?: string | null
          billing_state?: string | null
          billing_postal_code?: string | null
          billing_country?: string | null
          notes?: string | null
          tracking_number?: string | null
          shipped_at?: string | null
          delivered_at?: string | null
          cancelled_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          order_number?: string
          customer_id?: string | null
          customer_email?: string
          customer_name?: string
          customer_phone?: string | null
          status?: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded"
          payment_status?: "pending" | "paid" | "failed" | "refunded"
          payment_method?: string | null
          subtotal?: number
          shipping_cost?: number
          tax?: number
          discount?: number
          total?: number
          currency?: string
          shipping_address_line1?: string
          shipping_address_line2?: string | null
          shipping_city?: string
          shipping_state?: string | null
          shipping_postal_code?: string | null
          shipping_country?: string
          billing_address_line1?: string | null
          billing_address_line2?: string | null
          billing_city?: string | null
          billing_state?: string | null
          billing_postal_code?: string | null
          billing_country?: string | null
          notes?: string | null
          tracking_number?: string | null
          shipped_at?: string | null
          delivered_at?: string | null
          cancelled_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string | null
          product_id: string | null
          variant_id: string | null
          product_name_ar: string
          product_name_en: string
          variant_name_ar: string | null
          variant_name_en: string | null
          sku: string | null
          quantity: number
          unit_price: number
          total_price: number
          image_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          order_id?: string | null
          product_id?: string | null
          variant_id?: string | null
          product_name_ar: string
          product_name_en: string
          variant_name_ar?: string | null
          variant_name_en?: string | null
          sku?: string | null
          quantity: number
          unit_price: number
          total_price: number
          image_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string | null
          product_id?: string | null
          variant_id?: string | null
          product_name_ar?: string
          product_name_en?: string
          variant_name_ar?: string | null
          variant_name_en?: string | null
          sku?: string | null
          quantity?: number
          unit_price?: number
          total_price?: number
          image_url?: string | null
          created_at?: string
        }
      }
      design_settings: {
        Row: {
          id: string
          key: string
          value: Json
          description: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          key: string
          value: Json
          description?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          key?: string
          value?: Json
          description?: string | null
          updated_at?: string
        }
      }
      page_content: {
        Row: {
          id: string
          page_path: string
          page_title_ar: string
          page_title_en: string
          sections: Json
          meta_title_ar: string | null
          meta_title_en: string | null
          meta_description_ar: string | null
          meta_description_en: string | null
          is_published: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          page_path: string
          page_title_ar: string
          page_title_en: string
          sections?: Json
          meta_title_ar?: string | null
          meta_title_en?: string | null
          meta_description_ar?: string | null
          meta_description_en?: string | null
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          page_path?: string
          page_title_ar?: string
          page_title_en?: string
          sections?: Json
          meta_title_ar?: string | null
          meta_title_en?: string | null
          meta_description_ar?: string | null
          meta_description_en?: string | null
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      hero_slides: {
        Row: {
          id: string
          title_ar: string
          title_en: string | null
          subtitle_ar: string | null
          subtitle_en: string | null
          image_url: string
          link_url: string | null
          display_order: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title_ar: string
          title_en?: string | null
          subtitle_ar?: string | null
          subtitle_en?: string | null
          image_url: string
          link_url?: string | null
          display_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title_ar?: string
          title_en?: string | null
          subtitle_ar?: string | null
          subtitle_en?: string | null
          image_url?: string
          link_url?: string | null
          display_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      analytics_events: {
        Row: {
          id: string
          user_id: string | null
          user_name: string | null
          event_name: string
          page_url: string | null
          referrer: string | null
          session_id: string | null
          product_id: string | null
          product_name: string | null
          product_price: number | null
          product_currency: string | null
          order_id: string | null
          order_total: number | null
          order_currency: string | null
          meta_event_id: string | null
          raw_payload: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          user_name?: string | null
          event_name: string
          page_url?: string | null
          referrer?: string | null
          session_id?: string | null
          product_id?: string | null
          product_name?: string | null
          product_price?: number | null
          product_currency?: string | null
          order_id?: string | null
          order_total?: number | null
          order_currency?: string | null
          meta_event_id?: string | null
          raw_payload?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          user_name?: string | null
          event_name?: string
          page_url?: string | null
          referrer?: string | null
          session_id?: string | null
          product_id?: string | null
          product_name?: string | null
          product_price?: number | null
          product_currency?: string | null
          order_id?: string | null
          order_total?: number | null
          order_currency?: string | null
          meta_event_id?: string | null
          raw_payload?: Json | null
          created_at?: string
        }
      }
      product_recommendations: {
        Row: {
          id: string
          product_id: string
          recommended_ids: string[]
          updated_at: string
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          recommended_ids: string[]
          updated_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          recommended_ids?: string[]
          updated_at?: string
          created_at?: string
        }
      }
      payment_offers: {
        Row: {
          id: string
          payment_method: string
          discount_percentage: number | null
          discount_amount: number | null
          description_ar: string | null
          description_en: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          payment_method: string
          discount_percentage?: number | null
          discount_amount?: number | null
          description_ar?: string | null
          description_en?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          payment_method?: string
          discount_percentage?: number | null
          discount_amount?: number | null
          description_ar?: string | null
          description_en?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      payment_rate_limits: {
        Row: {
          id: string
          identifier_type: string
          identifier_value: string
          attempt_count: number
          window_start: string
          window_end: string
          is_blocked: boolean
          blocked_until: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          identifier_type: string
          identifier_value: string
          attempt_count?: number
          window_start: string
          window_end: string
          is_blocked?: boolean
          blocked_until?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          identifier_type?: string
          identifier_value?: string
          attempt_count?: number
          window_start?: string
          window_end?: string
          is_blocked?: boolean
          blocked_until?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      payment_logs: {
        Row: {
          id: string
          event_type: string
          message: string
          details: Json | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          event_type: string
          message: string
          details?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          event_type?: string
          message?: string
          details?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
      }
      security_events: {
        Row: {
          id: string
          event_type: string
          severity: string
          description: string
          details: Json | null
          ip_address: string | null
          user_agent: string | null
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          event_type: string
          severity: string
          description: string
          details?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          event_type?: string
          severity?: string
          description?: string
          details?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          status?: string
          created_at?: string
        }
      }
      payment_transactions: {
        Row: {
          id: string
          order_id: string | null
          kashier_order_id: string | null
          amount: number
          currency: string
          status: string
          payment_method: string | null
          card_last_four: string | null
          card_brand: string | null
          created_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          order_id?: string | null
          kashier_order_id?: string | null
          amount: number
          currency?: string
          status?: string
          payment_method?: string | null
          card_last_four?: string | null
          card_brand?: string | null
          created_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          order_id?: string | null
          kashier_order_id?: string | null
          amount?: number
          currency?: string
          status?: string
          payment_method?: string | null
          card_last_four?: string | null
          card_brand?: string | null
          created_at?: string
          completed_at?: string | null
        }
      }
      sensitive_data: {
        Row: {
          id: string
          encrypted_data: string
          signature: string
          created_at: string
        }
        Insert: {
          id?: string
          encrypted_data: string
          signature: string
          created_at?: string
        }
        Update: {
          id?: string
          encrypted_data?: string
          signature?: string
          created_at?: string
        }
      }
    }
  }
}
