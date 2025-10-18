import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://prsxpmhfbdhekrkjiuti.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByc3hwbWhmYmRoZWtya2ppdXRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3MTMwNDYsImV4cCI6MjA3NDI4OTA0Nn0.HiPS3ibFT3Zv2SBTVduWngl0Y4rbSyw91XW8cQL3N6w'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Test connection
supabase.from('app_users').select('count').limit(1).then(({ error }) => {
  if (error) {
    console.error('Supabase connection test failed:', error)
  } else {
    console.log('Supabase connection test successful')
  }
})

// Types for our database
export interface AppUser {
  id: string
  email: string
  full_name?: string
  role: 'admin' | 'manager' | 'staff'
  created_at: string
  last_login_at?: string
  is_active: boolean
}

export interface Perfume {
  id: string
  name: string
  brand: string
  category: string
  cost_price: number
  sell_price: number
  store_price: number
  quantity: number
  size: string
  notes: string
  added_date: string
  expiry_date?: string
  description: string
  image_url: string
}

export interface Order {
  id: string
  customer_name: string
  customer_phone?: string
  customer_email?: string
  total_amount: number
  payment_method: 'cash' | 'card' | 'bank_transfer'
  status: 'pending' | 'completed' | 'cancelled'
  created_at: string
  created_by: string
  closed_by?: string
}

export interface OrderItem {
  id: string
  order_id: string
  perfume_id: string
  quantity: number
  unit_price: number
  total_price: number
  cost_price: number
  sell_price: number
  store_price: number
}
