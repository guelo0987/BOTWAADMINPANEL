import { NextResponse } from "next/server"
import prisma from "@/lib/db"
import { getServerUser } from "@/lib/auth-server"

// PATCH - Cancelar una cita
export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getServerUser()
        
        if (!user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            )
        }

        const { id } = await params
        const appointmentId = parseInt(id)

        // Verificar que la cita existe y pertenece al cliente autenticado
        const existingAppointment = await prisma.appointment.findFirst({
            where: {
                id: appointmentId,
                client_id: user.id,
            },
        })

        if (!existingAppointment) {
            return NextResponse.json(
                { error: "Appointment not found or does not belong to your account" },
                { status: 404 }
            )
        }

        // Cancelar la cita
        const cancelledAppointment = await prisma.appointment.update({
            where: {
                id: appointmentId,
            },
            data: {
                status: "CANCELLED",
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
        })

        return NextResponse.json({
            id: cancelledAppointment.id,
            client_id: cancelledAppointment.client_id,
            customer_id: cancelledAppointment.customer_id,
            google_event_id: cancelledAppointment.google_event_id,
            start_time: cancelledAppointment.start_time.toISOString(),
            end_time: cancelledAppointment.end_time.toISOString(),
            status: cancelledAppointment.status,
            notes: cancelledAppointment.notes,
            customer: cancelledAppointment.customer,
        })
    } catch (error: any) {
        console.error("Error cancelling appointment:", error)
        return NextResponse.json(
            { error: error.message || "Internal Server Error" },
            { status: 500 }
        )
    }
}
