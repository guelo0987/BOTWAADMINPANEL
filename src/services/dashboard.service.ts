import { mockDashboardStats, mockConversationsChart, mockAppointmentStatus, mockHourlyData, mockCustomers } from "@/lib/mock-data"
import { DashboardStats, ConversationChartData, AppointmentStatusData, HourlyData } from "@/types"
import prisma from "@/lib/db"
import { ConversationMemory } from "@/services/redis.service"

export const getDashboardStats = async (clientId?: number): Promise<DashboardStats> => {
    // Si no hay clientId, usar mock (para desarrollo)
    if (!clientId) {
        await new Promise((resolve) => setTimeout(resolve, 500))
        return mockDashboardStats
    }

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
        // Fallback a mock en caso de error
        return mockDashboardStats
    }
}

export const getConversationsChartData = async (clientId?: number): Promise<ConversationChartData[]> => {
    if (!clientId) {
        await new Promise((resolve) => setTimeout(resolve, 500))
        return mockConversationsChart
    }

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
        return mockConversationsChart
    }
}

export const getAppointmentStatusData = async (clientId?: number): Promise<AppointmentStatusData[]> => {
    if (!clientId) {
        await new Promise((resolve) => setTimeout(resolve, 500))
        return mockAppointmentStatus
    }

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
        return mockAppointmentStatus
    }
}

export const getHourlyData = async (clientId?: number): Promise<HourlyData[]> => {
    if (!clientId) {
        await new Promise((resolve) => setTimeout(resolve, 500))
        return mockHourlyData
    }

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
        return mockHourlyData
    }
}

export const getRecentCustomers = async () => {
    await new Promise((resolve) => setTimeout(resolve, 500))
    // Sort by created_at desc
    return [...mockCustomers].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5)
}
