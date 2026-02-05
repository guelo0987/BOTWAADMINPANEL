import { DashboardStats, ConversationChartData, AppointmentStatusData, HourlyData } from "@/types"
import prisma from "@/lib/db"
import { ConversationMemory } from "@/services/redis.service"

const emptyStats: DashboardStats = {
    conversations_today: 0,
    conversations_change: 0,
    appointments_today: 0,
    appointments_change: 0,
    pending_appointments: 0,
    response_rate: 0,
    customers_total: 0,
    customers_new: 0,
}

export const getDashboardStats = async (clientId?: number): Promise<DashboardStats> => {
    if (!clientId) return emptyStats

    try {
        // Obtener estadísticas reales desde la base de datos
        const [customers, appointments, conversations] = await Promise.all([
            prisma.customer.count({
                where: { client_id: clientId },
            }),
            prisma.appointment.findMany({
                where: { client_id: clientId },
            }),
            // Para conversaciones, necesitamos obtener de Redis
            // Por ahora usamos un conteo aproximado basado en customers con historial
            prisma.customer.findMany({
                where: { client_id: clientId },
                select: { phone_number: true },
            }),
        ])

        // Contar conversaciones activas desde Redis
        let activeConversations = 0
        for (const customer of conversations) {
            const memory = new ConversationMemory(clientId, customer.phone_number)
            const history = await memory.getHistory()
            if (history.length > 0) {
                activeConversations++
            }
        }

        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)

        const appointmentsToday = appointments.filter(
            (apt) =>
                new Date(apt.start_time) >= today &&
                new Date(apt.start_time) < tomorrow
        ).length

        const pendingAppointments = appointments.filter(
            (apt) => apt.status === "CONFIRMED"
        ).length

        // Calcular tasa de respuesta (mock por ahora)
        const responseRate = 98.5

        return {
            conversations_today: activeConversations,
            conversations_change: 12, // TODO: Calcular cambio real
            appointments_today: appointmentsToday,
            appointments_change: 8, // TODO: Calcular cambio real
            pending_appointments: pendingAppointments,
            response_rate: responseRate,
            customers_total: customers,
            customers_new: 5, // TODO: Calcular nuevos esta semana
        }
    } catch (error) {
        console.error("Error fetching dashboard stats:", error)
        return emptyStats
    }
}

export const getConversationsChartData = async (clientId?: number): Promise<ConversationChartData[]> => {
    if (!clientId) return []

    try {
        // Obtener conversaciones de los últimos 7 días desde Redis
        const customers = await prisma.customer.findMany({
            where: { client_id: clientId },
            select: { phone_number: true },
        })

        const chartData: ConversationChartData[] = []
        const today = new Date()
        
        // Inicializar últimos 7 días
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today)
            date.setDate(date.getDate() - i)
            chartData.push({
                date: date.toISOString().split("T")[0],
                conversations: 0,
            })
        }

        // Contar conversaciones por día (simplificado - en producción usar mejor tracking)
        for (const customer of customers) {
            const memory = new ConversationMemory(clientId, customer.phone_number)
            const history = await memory.getHistory()
            
            if (history.length > 0) {
                // Obtener fecha del último mensaje
                const lastMessage = history[history.length - 1]
                if (lastMessage.timestamp) {
                    const msgDate = new Date(lastMessage.timestamp).toISOString().split("T")[0]
                    const dayData = chartData.find((d) => d.date === msgDate)
                    if (dayData) {
                        dayData.conversations++
                    }
                }
            }
        }

        return chartData
    } catch (error) {
        console.error("Error fetching conversations chart:", error)
        return []
    }
}

const emptyAppointmentStatus: AppointmentStatusData[] = [
    { status: "Confirmadas", count: 0, fill: "#22c55e" },
    { status: "Completadas", count: 0, fill: "#3b82f6" },
    { status: "Canceladas", count: 0, fill: "#ef4444" },
    { status: "No Asistió", count: 0, fill: "#f59e0b" },
]

export const getAppointmentStatusData = async (clientId?: number): Promise<AppointmentStatusData[]> => {
    if (!clientId) return emptyAppointmentStatus

    try {
        const appointments = await prisma.appointment.findMany({
            where: { client_id: clientId },
            select: { status: true },
        })

        const statusCounts: Record<string, number> = {
            CONFIRMED: 0,
            CANCELLED: 0,
            COMPLETED: 0,
            NO_SHOW: 0,
        }

        appointments.forEach((apt) => {
            const status = apt.status as keyof typeof statusCounts
            if (status in statusCounts) {
                statusCounts[status]++
            }
        })

        return [
            { status: "Confirmadas", count: statusCounts.CONFIRMED, fill: "#22c55e" },
            { status: "Completadas", count: statusCounts.COMPLETED, fill: "#3b82f6" },
            { status: "Canceladas", count: statusCounts.CANCELLED, fill: "#ef4444" },
            { status: "No Asistió", count: statusCounts.NO_SHOW, fill: "#f59e0b" },
        ]
    } catch (error) {
        console.error("Error fetching appointment status:", error)
        return emptyAppointmentStatus
    }
}

export const getHourlyData = async (clientId?: number): Promise<HourlyData[]> => {
    if (!clientId) return []

    try {
        const appointments = await prisma.appointment.findMany({
            where: { client_id: clientId },
            select: { start_time: true },
        })

        // Inicializar horas del día (8 AM - 8 PM)
        const hourlyData: HourlyData[] = []
        for (let hour = 8; hour <= 20; hour++) {
            hourlyData.push({
                hour: `${hour}:00`,
                appointments: 0,
            })
        }

        // Contar citas por hora
        appointments.forEach((apt) => {
            const hour = new Date(apt.start_time).getHours()
            const hourData = hourlyData.find((h) => parseInt(h.hour.split(":")[0]) === hour)
            if (hourData) {
                hourData.appointments++
            }
        })

        return hourlyData
    } catch (error) {
        console.error("Error fetching hourly data:", error)
        return []
    }
}

export const getRecentCustomers = async (clientId?: number) => {
    if (!clientId) return []
    try {
        const customers = await prisma.customer.findMany({
            where: { client_id: clientId },
            select: { id: true, full_name: true, phone_number: true, data: true, created_at: true, client_id: true },
            orderBy: { created_at: "desc" },
            take: 5,
        })
        return customers.map((c) => ({
            id: c.id,
            client_id: c.client_id,
            phone_number: c.phone_number,
            full_name: c.full_name,
            data: (c.data as Record<string, unknown>) ?? {},
            created_at: c.created_at.toISOString(),
        }))
    } catch (error) {
        console.error("Error fetching recent customers:", error)
        return []
    }
}
