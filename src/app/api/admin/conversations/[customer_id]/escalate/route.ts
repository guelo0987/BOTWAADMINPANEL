import { NextResponse } from "next/server"
import prisma from "@/lib/db"
import { ConversationMemory } from "@/services/redis.service"

export async function POST(
    req: Request,
    { params }: { params: Promise<{ customer_id: string }> }
) {
    try {
        const body = await req.json()
        const { client_id, motivo } = body
        const { customer_id } = await params

        const customer = await prisma.customer.findFirst({
            where: {
                id: parseInt(customer_id),
                client_id: parseInt(client_id),
            },
        })

        if (!customer) {
            return NextResponse.json(
                { error: "Customer not found" },
                { status: 404 }
            )
        }

        const memory = new ConversationMemory(client_id, customer.phone_number)
        await memory.setEscalated(
            true,
            motivo || "Escalado manualmente desde panel admin"
        )

        return NextResponse.json({
            success: true,
            status: "escalated",
        })
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || "Internal Server Error" },
            { status: 500 }
        )
    }
}
