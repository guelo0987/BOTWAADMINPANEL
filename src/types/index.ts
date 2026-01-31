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

/**
 * tools_config: configuración del bot por tipo de negocio.
 * business_type define citas, catálogo, profesionales, etc.
 * working_days: 1 = Lunes, 7 = Domingo (según README bot).
 */
export interface ToolsConfig {
  business_type?: "salon" | "clinic" | "store" | "restaurant" | "general"
  timezone?: string
  business_hours?: {
    start: string
    end: string
  }
  /** Días laborables: 1 = Lunes, 7 = Domingo. */
  working_days?: number[]
  /** Duración de slots en minutos (salon, general). */
  slot_duration?: number
  /** Servicios con precio y duración (salon, clinic). */
  services?: Array<{
    name: string
    price: number
    /** Duración en minutos (recomendado). */
    duration_minutes?: number
    /** Alias aceptado en algunos flujos. */
    duration?: number
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
  /** Catálogo por categorías (store). */
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
  /** Áreas para reservar (restaurant). */
  areas?: string[]
  /** Sugerencias de ocasión en UI; el bot pide texto libre. */
  occasions?: string[]
  menu_url?: string
  /** Obligatorio en salon, clinic, restaurant, general; opcional en store (solo entregas). */
  calendar_id?: string
  contact_phone?: string
  currency?: string
  requires_insurance?: boolean
  /** Store: habilita agendar entregas a domicilio (requiere calendar_id). */
  delivery_available?: boolean
  delivery_fee?: number
  /** Monto mínimo para envío gratis (store). */
  free_delivery_minimum?: number
  /** Horario para slots de entrega (store); si no, usa business_hours. */
  delivery_hours?: { start: string; end: string }
  /** Duración en minutos por slot de entrega (store, default 60). */
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
