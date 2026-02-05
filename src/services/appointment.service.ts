import { Appointment } from "@/types"

export const getUpcomingAppointments = async (clientId?: number): Promise<Appointment[]> => {
    if (!clientId) return []

    // Si estamos en el servidor (tiene clientId), usar Prisma directamente
    if (typeof window === 'undefined') {
        try {
            const prisma = (await import("@/lib/db")).default
            const appointments = await prisma.appointment.findMany({
                where: {
                    client_id: clientId,
                    status: "CONFIRMED",
                    start_time: {
                        gte: new Date(),
                    },
                },
                include: {
                    customer: {
                        select: {
                            id: true,
                            full_name: true,
                            phone_number: true,
                        },
                    },
                },
                orderBy: {
                    start_time: "asc",
                },
                take: 4,
            })

            return appointments.map((apt) => ({
                id: apt.id,
                client_id: apt.client_id,
                customer_id: apt.customer_id,
                google_event_id: apt.google_event_id,
                start_time: apt.start_time.toISOString(),
                end_time: apt.end_time.toISOString(),
                status: apt.status as "CONFIRMED" | "CANCELLED" | "COMPLETED" | "NO_SHOW",
                notes: apt.notes,
                customer: apt.customer,
            }))
        } catch (error) {
            console.error("Error fetching appointments:", error)
            return []
        }
    }

    // Si estamos en el cliente, usar el endpoint API
    try {
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
        const response = await fetch(`${baseUrl}/api/appointments`)
        if (!response.ok) {
            throw new Error("Failed to fetch appointments")
        }
        
        const allAppointments: Appointment[] = await response.json()
        
        // Filtrar solo las confirmadas y próximas
        const upcoming = allAppointments
            .filter((a) => a.status === "CONFIRMED" && new Date(a.start_time) >= new Date())
            .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
            .slice(0, 4)
        
        return upcoming
    } catch (error) {
        console.error("Error fetching appointments:", error)
        return []
    }
}

export const getAllAppointments = async (clientId?: number): Promise<Appointment[]> => {
    if (!clientId) return []

    // Si estamos en el servidor (tiene clientId), usar Prisma directamente
    if (typeof window === 'undefined') {
        try {
            const prisma = (await import("@/lib/db")).default
            const appointments = await prisma.appointment.findMany({
                where: {
                    client_id: clientId,
                },
                include: {
                    customer: {
                        select: {
                            id: true,
                            full_name: true,
                            phone_number: true,
                        },
                    },
                },
                orderBy: {
                    start_time: "desc",
                },
            })

            return appointments.map((apt) => ({
                id: apt.id,
                client_id: apt.client_id,
                customer_id: apt.customer_id,
                google_event_id: apt.google_event_id,
                start_time: apt.start_time.toISOString(),
                end_time: apt.end_time.toISOString(),
                status: apt.status as "CONFIRMED" | "CANCELLED" | "COMPLETED" | "NO_SHOW",
                notes: apt.notes,
                customer: apt.customer,
            }))
        } catch (error) {
            console.error("Error fetching all appointments:", error)
            return []
        }
    }

    // Si estamos en el cliente, usar el endpoint API
    try {
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
        const response = await fetch(`${baseUrl}/api/appointments`)
        if (!response.ok) {
            throw new Error("Failed to fetch appointments")
        }
        
        const appointments: Appointment[] = await response.json()
        return appointments
    } catch (error) {
        console.error("Error fetching all appointments:", error)
        return []
    }
}
