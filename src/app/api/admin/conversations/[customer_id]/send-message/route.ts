import { NextResponse } from "next/server"
import prisma from "@/lib/db"
import { ConversationMemory } from "@/services/redis.service"
import { sendWhatsAppMessage } from "@/services/whatsapp.service"

export async function POST(
    req: Request,
    { params }: { params: Promise<{ customer_id: string }> }
) {
    try {
        const body = await req.json()
        const { client_id, message, admin_name = "Agente" } = body
        const { customer_id } = await params

        if (!client_id || !message) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            )
        }

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

        // ⚠️ FORMATO DE NÚMERO (sin +, sin espacios)
        const cleanPhone = customer.phone_number.replace(/[+\s-()]/g, "")

        // ⚠️ ENVIAR A WHATSAPP PRIMERO
        let whatsappResponse
        try {
            whatsappResponse = await sendWhatsAppMessage(cleanPhone, message, client_id)
            
            // Verificar que realmente se envió
            if (!whatsappResponse.messages?.[0]?.id) {
                throw new Error("WhatsApp no retornó message_id")
            }
        } catch (whatsappError: any) {
            // ⚠️ ERROR AL ENVIAR A WHATSAPP - NO ACTUALIZAR REDIS
            console.error("❌ Error enviando a WhatsApp:", whatsappError)
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
            const memory = new ConversationMemory(client_id, cleanPhone)
            
            // Marcar como manejada por humano
            await memory.setHumanHandled(true, admin_name)
            
            // Guardar mensaje en historial
            await memory.addHumanMessage(message, admin_name)
            
            console.log("✅ Redis actualizado correctamente")
        } catch (redisError) {
            // ⚠️ ERROR EN REDIS PERO MENSAJE YA ENVIADO A WHATSAPP
            console.error("⚠️ Error actualizando Redis (mensaje ya enviado):", redisError)
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
