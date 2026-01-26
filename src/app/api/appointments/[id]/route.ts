import { NextResponse } from "next/server"
import prisma from "@/lib/db"
import { getServerUser } from "@/lib/auth-server"

// PUT - Actualizar una cita
export async function PUT(
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
        const body = await req.json()
        const { customer_id, start_time, end_time, notes, status } = body

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

        // Si se está cambiando el cliente, verificar que pertenece al cliente autenticado
        if (customer_id && customer_id !== existingAppointment.customer_id) {
            const customer = await prisma.customer.findFirst({
                where: {
                    id: parseInt(customer_id),
                    client_id: user.id,
                },
            })

            if (!customer) {
                return NextResponse.json(
                    { error: "Customer not found or does not belong to your account" },
                    { status: 404 }
                )
            }
        }

        // Actualizar la cita
        const updatedAppointment = await prisma.appointment.update({
            where: {
                id: appointmentId,
            },
            data: {
                ...(customer_id && { customer_id: parseInt(customer_id) }),
                ...(start_time && { start_time: new Date(start_time) }),
                ...(end_time && { end_time: new Date(end_time) }),
                ...(notes !== undefined && { notes: notes || null }),
                ...(status && { status }),
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
            id: updatedAppointment.id,
            client_id: updatedAppointment.client_id,
            customer_id: updatedAppointment.customer_id,
            google_event_id: updatedAppointment.google_event_id,
            start_time: updatedAppointment.start_time.toISOString(),
            end_time: updatedAppointment.end_time.toISOString(),
            status: updatedAppointment.status,
            notes: updatedAppointment.notes,
            customer: updatedAppointment.customer,
        })
    } catch (error: any) {
        console.error("Error updating appointment:", error)
        return NextResponse.json(
            { error: error.message || "Internal Server Error" },
            { status: 500 }
        )
    }
}

// DELETE - Eliminar una cita (opcional, o usar cancelar)
export async function DELETE(
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

        // Eliminar la cita
        await prisma.appointment.delete({
            where: {
                id: appointmentId,
            },
        })

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error("Error deleting appointment:", error)
        return NextResponse.json(
            { error: error.message || "Internal Server Error" },
            { status: 500 }
        )
    }
}
