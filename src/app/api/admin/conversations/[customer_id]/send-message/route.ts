import { NextResponse } from "next/server"
import prisma from "@/lib/db"
import { getServerUser } from "@/lib/auth-server"
import { ConversationMemory } from "@/services/redis.service"
import { sendWhatsAppMessage } from "@/services/whatsapp.service"

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
        const { client_id, message, admin_name = "Agente" } = body
        const { customer_id } = await params

        if (!client_id || !message) {
            return NextResponse.json(
                { error: "Missing required fields" },
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

        // ⚠️ FORMATO DE NÚMERO (sin +, sin espacios)
        const cleanPhone = customer.phone_number.replace(/[+\s-()]/g, "")

        // ⚠️ ENVIAR A WHATSAPP PRIMERO
        let whatsappResponse
        try {
            whatsappResponse = await sendWhatsAppMessage(cleanPhone, message, clientIdNum)
            
            // Verificar que realmente se envió
            if (!whatsappResponse.messages?.[0]?.id) {
                throw new Error("WhatsApp no retornó message_id")
            }
        } catch (whatsappError: any) {
            // ⚠️ ERROR AL ENVIAR A WHATSAPP - NO ACTUALIZAR REDIS
            return NextResponse.json(
                {
                    error: "Error enviando mensaje a WhatsApp",
                    details: whatsappError.message || "Error desconocido"
                },
                { status: 500 }
            )
        }

        // ⚠️ SOLO SI WHATSAPP RESPONDE OK, ACTUALIZAR REDIS
        const messageId = whatsappResponse.messages[0].id

        try {
            const memory = new ConversationMemory(clientIdNum, cleanPhone)
            
            // Marcar como manejada por humano
            await memory.setHumanHandled(true, admin_name)
            
            // Guardar mensaje en historial
            await memory.addHumanMessage(message, admin_name)
        } catch (redisError) {
            // ⚠️ ERROR EN REDIS PERO MENSAJE YA ENVIADO A WHATSAPP
            // No fallar porque el mensaje ya se envió, pero informar
        }

        return NextResponse.json({
            success: true,
            message: "Mensaje enviado",
            status: "human_handled",
            message_id: messageId,
            phone_number: cleanPhone
        })
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || "Internal Server Error" },
            { status: 500 }
        )
    }
}
