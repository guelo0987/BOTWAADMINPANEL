import type {
  Customer,
  Appointment,
  Conversation,
  Message,
  DashboardStats,
  ConversationChartData,
  AppointmentStatusData,
  HourlyData,
  Client,
} from "@/types"

// Mock Dashboard Stats
export const mockDashboardStats: DashboardStats = {
  conversations_today: 142,
  conversations_change: 12,
  appointments_today: 28,
  appointments_change: 8,
  pending_appointments: 15,
  response_rate: 98.5,
  customers_total: 1247,
  customers_new: 23,
}

// Mock Conversations Chart Data (last 7 days)
export const mockConversationsChart: ConversationChartData[] = [
  { date: "Lun", conversations: 120 },
  { date: "Mar", conversations: 145 },
  { date: "Mié", conversations: 132 },
  { date: "Jue", conversations: 168 },
  { date: "Vie", conversations: 155 },
  { date: "Sáb", conversations: 89 },
  { date: "Dom", conversations: 142 },
]

// Mock Appointment Status Data
export const mockAppointmentStatus: AppointmentStatusData[] = [
  { status: "Confirmadas", count: 45, fill: "var(--color-chart-1)" },
  { status: "Completadas", count: 32, fill: "var(--color-chart-4)" },
  { status: "Canceladas", count: 8, fill: "var(--color-destructive)" },
  { status: "No Asistió", count: 3, fill: "var(--color-warning)" },
]

// Mock Hourly Data
export const mockHourlyData: HourlyData[] = [
  { hour: "8:00", appointments: 5 },
  { hour: "9:00", appointments: 12 },
  { hour: "10:00", appointments: 18 },
  { hour: "11:00", appointments: 15 },
  { hour: "12:00", appointments: 8 },
  { hour: "13:00", appointments: 4 },
  { hour: "14:00", appointments: 10 },
  { hour: "15:00", appointments: 14 },
  { hour: "16:00", appointments: 16 },
  { hour: "17:00", appointments: 11 },
]

// Mock Customers
export const mockCustomers: Customer[] = [
  {
    id: 1,
    client_id: 1,
    phone_number: "18091112233",
    full_name: "María García",
    data: { email: "maria@email.com", address: "Calle Principal #123" },
    created_at: "2024-01-15T10:30:00Z",
  },
  {
    id: 2,
    client_id: 1,
    phone_number: "18092223344",
    full_name: "Juan Pérez",
    data: { email: "juan@email.com", insurance: "Seguro Médico Plus" },
    created_at: "2024-01-20T14:00:00Z",
  },
  {
    id: 3,
    client_id: 1,
    phone_number: "18093334455",
    full_name: "Ana Rodríguez",
    data: { email: "ana@email.com", dob: "1990-05-15" },
    created_at: "2024-02-01T09:15:00Z",
  },
  {
    id: 4,
    client_id: 1,
    phone_number: "18094445566",
    full_name: "Carlos Martínez",
    data: { email: "carlos@email.com", allergies: ["Penicilina"] },
    created_at: "2024-02-10T16:45:00Z",
  },
  {
    id: 5,
    client_id: 1,
    phone_number: "18095556677",
    full_name: "Laura Sánchez",
    data: { email: "laura@email.com" },
    created_at: "2024-02-15T11:20:00Z",
  },
]

// Mock Appointments
export const mockAppointments: Appointment[] = [
  {
    id: 1,
    client_id: 1,
    customer_id: 1,
    google_event_id: "evt_001",
    start_time: "2025-01-24T09:00:00Z",
    end_time: "2025-01-24T10:00:00Z",
    status: "CONFIRMED",
    notes: "Consulta general",
    customer: mockCustomers[0],
  },
  {
    id: 2,
    client_id: 1,
    customer_id: 2,
    google_event_id: "evt_002",
    start_time: "2025-01-24T10:30:00Z",
    end_time: "2025-01-24T11:30:00Z",
    status: "CONFIRMED",
    notes: "Revisión de seguimiento",
    customer: mockCustomers[1],
  },
  {
    id: 3,
    client_id: 1,
    customer_id: 3,
    google_event_id: "evt_003",
    start_time: "2025-01-24T14:00:00Z",
    end_time: "2025-01-24T15:00:00Z",
    status: "COMPLETED",
    notes: "Tratamiento dental",
    customer: mockCustomers[2],
  },
  {
    id: 4,
    client_id: 1,
    customer_id: 4,
    google_event_id: "evt_004",
    start_time: "2025-01-25T11:00:00Z",
    end_time: "2025-01-25T12:00:00Z",
    status: "CONFIRMED",
    notes: "Primera consulta",
    customer: mockCustomers[3],
  },
  {
    id: 5,
    client_id: 1,
    customer_id: 5,
    google_event_id: "evt_005",
    start_time: "2025-01-23T15:00:00Z",
    end_time: "2025-01-23T16:00:00Z",
    status: "CANCELLED",
    notes: "Limpieza dental",
    customer: mockCustomers[4],
  },
]

// Mock Conversations
export const mockConversations: Conversation[] = [
  {
    id: 1,
    client_id: 1,
    customer_id: 1,
    phone_number: "18091112233",
    customer_name: "María García",
    last_message: "Gracias, nos vemos mañana a las 9am",
    last_message_at: "2025-01-24T08:30:00Z",
    status: "active",
    message_count: 12,
    customer: mockCustomers[0],
  },
  {
    id: 2,
    client_id: 1,
    customer_id: 2,
    phone_number: "18092223344",
    customer_name: "Juan Pérez",
    last_message: "¿Cuánto cuesta la consulta?",
    last_message_at: "2025-01-24T07:45:00Z",
    status: "active",
    message_count: 5,
    customer: mockCustomers[1],
  },
  {
    id: 3,
    client_id: 1,
    customer_id: 3,
    phone_number: "18093334455",
    customer_name: "Ana Rodríguez",
    last_message: "Perfecto, gracias por la información",
    last_message_at: "2025-01-23T18:20:00Z",
    status: "resolved",
    message_count: 8,
    customer: mockCustomers[2],
  },
  {
    id: 4,
    client_id: 1,
    customer_id: 4,
    phone_number: "18094445566",
    customer_name: "Carlos Martínez",
    last_message: "Necesito hablar con alguien urgente",
    last_message_at: "2025-01-24T09:00:00Z",
    status: "escalated",
    message_count: 15,
    customer: mockCustomers[3],
  },
  {
    id: 5,
    client_id: 1,
    customer_id: 5,
    phone_number: "18095556677",
    customer_name: "Laura Sánchez",
    last_message: "¿Tienen disponibilidad para el viernes?",
    last_message_at: "2025-01-24T06:15:00Z",
    status: "active",
    message_count: 3,
    customer: mockCustomers[4],
  },
]

// Mock Messages for a conversation
export const mockMessages: Message[] = [
  {
    id: 1,
    conversation_id: 1,
    content: "Hola, quisiera agendar una cita para mañana",
    sender: "customer",
    timestamp: "2025-01-24T08:00:00Z",
  },
  {
    id: 2,
    conversation_id: 1,
    content: "¡Hola María! Con gusto te ayudo a agendar tu cita. ¿A qué hora te gustaría venir? Tenemos disponibilidad a las 9:00 AM, 11:00 AM y 3:00 PM.",
    sender: "bot",
    timestamp: "2025-01-24T08:01:00Z",
  },
  {
    id: 3,
    conversation_id: 1,
    content: "A las 9am estaría perfecto",
    sender: "customer",
    timestamp: "2025-01-24T08:15:00Z",
  },
  {
    id: 4,
    conversation_id: 1,
    content: "Excelente, he agendado tu cita para mañana 25 de enero a las 9:00 AM. Te enviaré un recordatorio antes de la cita. ¿Necesitas algo más?",
    sender: "bot",
    timestamp: "2025-01-24T08:16:00Z",
  },
  {
    id: 5,
    conversation_id: 1,
    content: "Gracias, nos vemos mañana a las 9am",
    sender: "customer",
    timestamp: "2025-01-24T08:30:00Z",
  },
]

// Mock Client Config
export const mockClientConfig: Client = {
  id: 1,
  business_name: "Clínica Moreira",
  whatsapp_instance_id: "clinica_moreira",
  is_active: true,
  system_prompt_template: `Eres un asistente virtual amable y profesional para la Clínica Moreira.

Tu objetivo es:
1. Ayudar a los pacientes a agendar citas
2. Responder preguntas sobre servicios y precios
3. Proporcionar información sobre horarios y ubicación
4. Enviar recordatorios de citas

Siempre sé cortés, profesional y empático con los pacientes.`,
  tools_config: {
    business_type: "clinic",
    timezone: "America/Santo_Domingo",
    business_hours: {
      start: "08:00",
      end: "18:00",
    },
    working_days: [1, 2, 3, 4, 5],
    services: [
      { name: "Consulta General", price: 1500, duration_minutes: 30 },
      { name: "Limpieza Dental", price: 2500, duration_minutes: 45 },
      { name: "Ortodoncia", price: 35000, duration_minutes: 60 },
      { name: "Extracción", price: 3000, duration_minutes: 30 },
    ],
    professionals: [
      { id: "dr1", name: "Dr. Juan Moreira", specialty: "Odontología General" },
      { id: "dr2", name: "Dra. Ana López", specialty: "Ortodoncia" },
    ],
    calendar_id: "clinica_moreira@calendar.google.com",
    contact_phone: "18091234567",
    currency: "RD$",
  },
  created_at: "2024-01-01T00:00:00Z",
}
