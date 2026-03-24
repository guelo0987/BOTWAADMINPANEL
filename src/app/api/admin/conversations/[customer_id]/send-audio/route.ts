import { NextResponse } from "next/server"
import prisma from "@/lib/db"
import { getServerUser } from "@/lib/auth-server"
import { ConversationMemory } from "@/services/redis.service"
import { uploadWhatsAppMedia, sendWhatsAppAudio } from "@/services/whatsapp.service"

export async function POST(
    req: Request,
    { params }: { params: Promise<{ customer_id: string }> }
) {
    try {
        const user = await getServerUser()
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const formData = await req.formData()
        const audioFile = formData.get("audio") as File | null
        const clientIdStr = formData.get("client_id") as string | null
        const adminName = formData.get("admin_name") as string | null
        const { customer_id } = await params

        if (!clientIdStr || !audioFile) {
            return NextResponse.json(
                { error: "Missing required fields (audio, client_id)" },
                { status: 400 }
            )
        }

        const clientIdNum = parseInt(clientIdStr, 10)
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

        const client = await prisma.client.findUnique({
            where: { id: clientIdNum },
            select: {
                business_name: true,
                whatsapp_instance_id: true,
                whatsapp_access_token: true,
                whatsapp_api_version: true,
            },
        })

        if (!client?.whatsapp_access_token || !client?.whatsapp_instance_id) {
            return NextResponse.json(
                {
                    error: "Este cliente no tiene configuradas las credenciales de WhatsApp.",
                },
                { status: 400 }
            )
        }

        const cleanPhone = customer.phone_number.replace(/[+\s-()]/g, "")
        const credentials = {
            phoneNumberId: client.whatsapp_instance_id,
            accessToken: client.whatsapp_access_token,
            apiVersion: client.whatsapp_api_version ?? undefined,
        }

        // 1) Convertir File a Buffer
        const arrayBuffer = await audioFile.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        // 2) Subir audio a WhatsApp
        const mimeType = audioFile.type || "audio/ogg"
        let mediaId: string
        try {
            mediaId = await uploadWhatsAppMedia(buffer, mimeType, credentials)
        } catch (uploadError: any) {
            return NextResponse.json(
                { error: "Error subiendo audio a WhatsApp", details: uploadError.message },
                { status: 500 }
            )
        }

        // 3) Enviar mensaje de audio
        let whatsappResponse
        try {
            whatsappResponse = await sendWhatsAppAudio(
                cleanPhone,
                mediaId,
                credentials,
                clientIdNum
            )
        } catch (sendError: any) {
            return NextResponse.json(
                { error: "Error enviando audio a WhatsApp", details: sendError.message },
                { status: 500 }
            )
        }

        const messageId = whatsappResponse.messages[0].id
        const senderName = adminName || client.business_name || "Agente"

        // 4) Guardar en Redis
        try {
            const memory = new ConversationMemory(clientIdNum, cleanPhone)
            await memory.setHumanHandled(true, senderName)
            await memory.addHumanMessage("[Nota de voz]", senderName, "audio")
        } catch {
            // Redis falló pero audio ya enviado
        }

        return NextResponse.json({
            success: true,
            message: "Audio enviado",
            status: "human_handled",
            message_id: messageId,
            phone_number: cleanPhone,
        })
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || "Internal Server Error" },
            { status: 500 }
        )
    }
}
