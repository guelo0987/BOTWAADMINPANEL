import { NextResponse } from "next/server"
import prisma from "@/lib/db"
import { getServerUser } from "@/lib/auth-server"

// GET - Obtener todas las citas del cliente autenticado
export async function GET(req: Request) {
    try {
        const user = await getServerUser()
        
        if (!user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            )
        }

        const appointments = await prisma.appointment.findMany({
            where: {
                client_id: user.id,
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

        return NextResponse.json(
            appointments.map((apt) => ({
                id: apt.id,
                client_id: apt.client_id,
                customer_id: apt.customer_id,
                google_event_id: apt.google_event_id,
                start_time: apt.start_time.toISOString(),
                end_time: apt.end_time.toISOString(),
                status: apt.status,
                notes: apt.notes,
                customer: apt.customer,
            }))
        )
    } catch (error: any) {
        console.error("Error fetching appointments:", error)
        return NextResponse.json(
            { error: error.message || "Internal Server Error" },
            { status: 500 }
        )
    }
}

// POST - Crear una nueva cita
export async function POST(req: Request) {
    try {
        const user = await getServerUser()
        
        if (!user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            )
        }

        const body = await req.json()
        const { customer_id, start_time, end_time, notes } = body

        // Validaciones
        if (!customer_id) {
            return NextResponse.json(
                { error: "customer_id is required" },
                { status: 400 }
            )
        }

        if (!start_time || !end_time) {
            return NextResponse.json(
                { error: "start_time and end_time are required" },
                { status: 400 }
            )
        }

        // Verificar que el cliente pertenece al cliente autenticado
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

        // Crear la cita
        const appointment = await prisma.appointment.create({
            data: {
                client_id: user.id,
                customer_id: parseInt(customer_id),
                start_time: new Date(start_time),
                end_time: new Date(end_time),
                status: "CONFIRMED",
                notes: notes || null,
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
            id: appointment.id,
            client_id: appointment.client_id,
            customer_id: appointment.customer_id,
            google_event_id: appointment.google_event_id,
            start_time: appointment.start_time.toISOString(),
            end_time: appointment.end_time.toISOString(),
            status: appointment.status,
            notes: appointment.notes,
            customer: appointment.customer,
        })
    } catch (error: any) {
        console.error("Error creating appointment:", error)
        return NextResponse.json(
            { error: error.message || "Internal Server Error" },
            { status: 500 }
        )
    }
}
