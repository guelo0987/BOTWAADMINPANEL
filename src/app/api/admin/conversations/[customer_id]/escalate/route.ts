import { NextResponse } from "next/server"
import prisma from "@/lib/db"
import { getServerUser } from "@/lib/auth-server"
import { ConversationMemory } from "@/services/redis.service"

export async function POST(
    req: Request,
    { params }: { params: Promise<{ customer_id: string }> }
) {
    try {
        const user = await getServerUser()
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await req.json()
        const { client_id, motivo } = body
        const { customer_id } = await params

        if (!client_id) {
            return NextResponse.json({ error: "client_id is required" }, { status: 400 })
        }

        const clientIdNum = parseInt(client_id, 10)
        if (clientIdNum !== user.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const customer = await prisma.customer.findFirst({
            where: {
                id: parseInt(customer_id, 10),
                client_id: clientIdNum,
            },
        })

        if (!customer) {
            return NextResponse.json(
                { error: "Customer not found" },
                { status: 404 }
            )
        }

        const memory = new ConversationMemory(clientIdNum, customer.phone_number)
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
