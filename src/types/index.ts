// API Types for CompleteAgent

export interface Client {
  id: number
  business_name: string
  whatsapp_instance_id: string
  is_active: boolean
  system_prompt_template: string
  tools_config: ToolsConfig
  created_at: string
}

export interface ToolsConfig {
  business_type?: "salon" | "clinic" | "store" | "restaurant" | "general"
  timezone?: string
  business_hours?: {
    start: string
    end: string
  }
  working_days?: number[]
  /** Duración de slots en minutos (salon). */
  slot_duration?: number
  services?: Array<{
    name: string
    price: number
    duration_minutes?: number
  }>
  professionals?: Array<{
    id: string
    name: string
    specialty?: string
    calendar_id?: string
    working_days?: number[]
    business_hours?: {
      start: string
      end: string
    }
    consultation_price?: number
    slot_duration?: number
  }>
  catalog?: {
    categories: Array<{
      name: string
      products: Array<{
        name: string
        price: number
        description?: string
      }>
    }>
  }
  /** Áreas del restaurante: nombres (ej. Terraza, Salón principal, VIP). */
  areas?: string[]
  occasions?: string[]
  menu_url?: string
  calendar_id?: string
  contact_phone?: string
  currency?: string
  requires_insurance?: boolean
  delivery_available?: boolean
  delivery_fee?: number
  free_delivery_minimum?: number
  /** Horario de entregas (store). */
  delivery_hours?: { start: string; end: string }
  /** Duración estimada de entrega en minutos (store). */
  delivery_duration?: number
}

export interface Customer {
  id: number
  client_id: number
  phone_number: string
  full_name: string | null
  data: CustomerData
  created_at: string
}

export interface CustomerData {
  email?: string
  address?: string
  dob?: string
  insurance?: string
  allergies?: string[]
  [key: string]: unknown
}

export interface Appointment {
  id: number
  client_id: number
  customer_id: number
  google_event_id: string | null
  start_time: string
  end_time: string
  status: "CONFIRMED" | "CANCELLED" | "NO_SHOW" | "COMPLETED"
  notes: string | null
  customer?: {
    id: number
    full_name: string | null
    phone_number: string
  }
}

export interface Conversation {
  id?: number
  client_id?: number
  customer_id: number
  phone_number: string
  customer_name: string | null
  last_message: string
  last_message_at?: string
  last_message_time?: string
  status: "active" | "resolved" | "escalated" | "human_handled"
  message_count: number
  is_escalated?: boolean
  is_human_handled?: boolean
  admin?: string | null
  escalation_reason?: string | null
  customer?: Customer
}

export interface Message {
  id: number
  conversation_id: number
  content: string
  sender: "customer" | "bot" | "agent"
  timestamp: string
  media_url?: string
  media_type?: string
}

export interface DashboardStats {
  conversations_today: number
  conversations_change: number
  appointments_today: number
  appointments_change: number
  pending_appointments: number
  response_rate: number
  customers_total: number
  customers_new: number
}

export interface AuthUser {
  id: number
  business_name: string
  whatsapp_instance_id: string
  is_active: boolean
}

export interface LoginResponse {
  access_token: string
  token_type: "bearer"
  client: AuthUser
}

// Chart Data Types
export interface ConversationChartData {
  date: string
  conversations: number
}

export interface AppointmentStatusData {
  status: string
  count: number
  fill: string
}

export interface HourlyData {
  hour: string
  appointments: number
}
