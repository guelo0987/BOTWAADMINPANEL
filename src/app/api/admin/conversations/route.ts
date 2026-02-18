import { NextResponse } from "next/server"
import prisma from "@/lib/db"
import { getServerUser } from "@/lib/auth-server"
import { ConversationMemory } from "@/services/redis.service"

export async function GET(req: Request) {
    try {
        const user = await getServerUser()
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const client_id = searchParams.get("client_id")
        const status_filter = searchParams.get("status_filter")

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

        // 1. Obtener todos los customers del cliente desde DB
        const customers = await prisma.customer.findMany({
            where: { client_id: clientIdNum },
            orderBy: { created_at: "desc" }, // En app real, ordenar por último mensaje
        })

        const conversations = []
        let activeCount = 0,
            humanHandledCount = 0,
            escalatedCount = 0,
            resolvedCount = 0

        // 2. Iterar customers y enriquecer con estado de Redis
        for (const customer of customers) {
            const memory = new ConversationMemory(clientIdNum, customer.phone_number)

            const history = await memory.getHistory()
            const statusInfo = await memory.getStatus()

            if (!history.length) continue

            const lastMsg = history[history.length - 1]
            const isEscalated = statusInfo.status === "escalated"
            const isHumanHandled = statusInfo.status === "human_handled"

            let convStatus
            if (isEscalated) {
                convStatus = "escalated"
                escalatedCount++
            } else if (isHumanHandled) {
                convStatus = "human_handled"
                humanHandledCount++
            } else if (history.length) {
                convStatus = "active"
                activeCount++
            } else {
                convStatus = "resolved"
                resolvedCount++
            }

            if (status_filter && convStatus !== status_filter) continue

            conversations.push({
                customer_id: customer.id,
                customer_name: customer.full_name || customer.phone_number,
                phone_number: customer.phone_number,
                status: convStatus,
                last_message: lastMsg?.content?.substring(0, 100) || "",
                last_message_time: lastMsg?.timestamp || null,
                message_count: history.length,
                is_escalated: isEscalated,
                is_human_handled: isHumanHandled,
                admin: statusInfo.admin,
                escalation_reason: statusInfo.escalation_reason,
            })
        }

        // Ordenar por tiempo del último mensaje (si existe timestamp)
        conversations.sort((a, b) => {
            const timeA = a.last_message_time || ""
            const timeB = b.last_message_time || ""
            return timeA < timeB ? 1 : -1
        })

        return NextResponse.json({
            conversations,
            total: conversations.length,
            active: activeCount,
            human_handled: humanHandledCount,
            escalated: escalatedCount,
            resolved: resolvedCount,
        })
    } catch (error: any) {
        console.error("Error listing conversations:", error)
        return NextResponse.json(
            { error: error.message || "Internal Server Error" },
            { status: 500 }
        )
    }
}
