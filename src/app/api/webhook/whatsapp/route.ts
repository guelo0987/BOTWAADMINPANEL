import { NextResponse } from "next/server"
import prisma from "@/lib/db"
import { ConversationMemory } from "@/services/redis.service"

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { entry } = body

        if (entry) {
            for (const entryItem of entry) {
                for (const change of entryItem.changes) {
                    if (change.field === "messages") {
                        const { value } = change

                        // Procesar statuses (para detectar Business Suite)
                        if (value.statuses) {
                            const phoneNumberId = value.metadata.phone_number_id

                            for (const status of value.statuses) {
                                if (
                                    status.status === "sent" &&
                                    status.id &&
                                    status.recipient_id
                                ) {
                                    await detectBusinessSuiteMessage(
                                        phoneNumberId,
                                        status.recipient_id,
                                        status.id
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }

        return NextResponse.json({ status: "received" })
    } catch (error: any) {
        console.error("Error detecting Business Suite message:", error)
        return NextResponse.json(
            { error: error.message || "Internal Server Error" },
            { status: 500 }
        )
    }
}

// Verification Request (GET)
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url)
    const mode = searchParams.get("hub.mode")
    const token = searchParams.get("hub.verify_token")
    const challenge = searchParams.get("hub.challenge")

    if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
        return new NextResponse(challenge, { status: 200 })
    }

    return new NextResponse("Forbidden", { status: 403 })
}

async function detectBusinessSuiteMessage(
    phoneNumberId: string,
    recipientId: string,
    messageId: string
) {
    try {
        // 1. Buscar cliente por whatsapp_instance_id (phone_number_id)
        const client = await prisma.client.findUnique({
            where: { whatsapp_instance_id: phoneNumberId },
        })

        if (!client) {
            console.warn(`No client found for phone_number_id: ${phoneNumberId}`)
            return
        }

        const memory = new ConversationMemory(client.id, recipientId)
        const isOurs = await memory.isMessageSentByBot(messageId)

        if (!isOurs) {
            // Mensaje enviado desde Business Suite (no está en sent_messages)
            await memory.setHumanHandled(true, "Meta Business Suite")
        }
    } catch (error) {
        console.error("Error detecting Business Suite:", error)
    }
}
