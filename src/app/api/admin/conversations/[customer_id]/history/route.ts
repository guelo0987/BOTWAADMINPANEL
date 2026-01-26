import { NextResponse } from "next/server"
import prisma from "@/lib/db"
import { ConversationMemory } from "@/services/redis.service"

export async function GET(
    req: Request,
    { params }: { params: Promise<{ customer_id: string }> }
) {
    try {
        const { searchParams } = new URL(req.url)
        const client_id = searchParams.get("client_id")
        const { customer_id } = await params

        if (!client_id) {
            return NextResponse.json(
                { error: "client_id is required" },
                { status: 400 }
            )
        }

        // In Next.js 13+, params are sometimes awaited or passed directly. 
        // Assuming standard directory structure [customer_id]/history/route.ts
        // We need to parse customer_id from URL if context param binding fails in some edge cases, 
        // but usually it works fine.

        // Note: The file path created via tool was `src/app/api/admin/conversations/id/history` due to shell expansion limits?
        // Wait, the previous `mkdir` used `id` literal instead of `[customer_id]`.
        // I will assume the file path is correct in the `write_to_file` target. 
        // The user's system likely needs the directory to be named `[customer_id]`.

        // Correcting logic: The previous shell command created `src/app/api/admin/conversations/id/...`. 
        // I should probably fix the directory name to `[customer_id]` if possible, but I'll write to `[customer_id]` path now 
        // and let `write_to_file` create the dir.

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
        const history = await memory.getHistory()
        const statusInfo = await memory.getStatus()

        return NextResponse.json({
            customer: {
                id: customer.id,
                name: customer.full_name || customer.phone_number,
                phone: customer.phone_number,
            },
            status: {
                status: statusInfo.status,
                is_escalated: statusInfo.status === "escalated",
                is_human_handled: statusInfo.status === "human_handled",
                admin: statusInfo.admin,
                escalation_reason: statusInfo.escalation_reason,
            },
            messages: history,
        })
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || "Internal Server Error" },
            { status: 500 }
        )
    }
}
