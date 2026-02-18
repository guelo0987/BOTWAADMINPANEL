import { NextResponse } from "next/server"
import prisma from "@/lib/db"
import { getServerUser } from "@/lib/auth-server"
import { ConversationMemory } from "@/services/redis.service"

/**
 * Toma el control de una conversación (pausa la IA).
 * El cliente puede responder manualmente desde el panel o Business Suite.
 */
export async function POST(
    req: Request,
    { params }: { params: Promise<{ customer_id: string }> }
) {
    try {
        const user = await getServerUser()
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await req.json().catch(() => ({}))
        const { client_id, admin_name = "Agente" } = body
        const { customer_id } = await params

        if (!client_id) {
            return NextResponse.json(
                { error: "client_id is required" },
                { status: 400 }
            )
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

        const cleanPhone = customer.phone_number.replace(/[+\s-()]/g, "")
        const memory = new ConversationMemory(clientIdNum, cleanPhone)
        await memory.setHumanHandled(true, admin_name)

        return NextResponse.json({
            success: true,
            status: "human_handled",
            message: "Conversación tomada. La IA no responderá hasta que la reanudes.",
        })
    } catch (error: any) {
        console.error("Error taking conversation:", error)
        return NextResponse.json(
            { error: error.message || "Internal Server Error" },
            { status: 500 }
        )
    }
}
