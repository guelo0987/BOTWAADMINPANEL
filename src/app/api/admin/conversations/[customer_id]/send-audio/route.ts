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

        console.log("[send-audio] Recibido:", {
            customer_id,
            client_id: clientIdStr,
            audioName: audioFile?.name,
            audioType: audioFile?.type,
            audioSize: audioFile?.size,
        })

        if (!clientIdStr || !audioFile) {
            return NextResponse.json(
                { error: "Missing required fields (audio, client_id)" },
                { status: 400 }
            )
        }

        const clientIdNum = parseInt(clientIdStr, 10)
        if (clientIdNum !== user.id) {
            console.error("[send-audio] Forbidden: user.id=%d clientId=%d", user.id, clientIdNum)
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const customer = await prisma.customer.findFirst({
            where: {
                id: parseInt(customer_id, 10),
                client_id: clientIdNum,
            },
        })

        if (!customer) {
            console.error("[send-audio] Customer not found: customer_id=%s client_id=%d", customer_id, clientIdNum)
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
            console.error("[send-audio] WhatsApp credentials missing for client_id=%d", clientIdNum)
            return NextResponse.json(
                {
                    error: "Este cliente no tiene configuradas las credenciales de WhatsApp.",
                },
                { status: 400 }
            )
        }

        const cleanPhone = customer.phone_number.replace(/[+\s-()]/g, "")
        console.log("[send-audio] Enviando a phone=%s phoneNumberId=%s apiVersion=%s",
            cleanPhone,
            client.whatsapp_instance_id,
            client.whatsapp_api_version ?? "v21.0"
        )

        const credentials = {
            phoneNumberId: client.whatsapp_instance_id,
            accessToken: client.whatsapp_access_token,
            apiVersion: client.whatsapp_api_version ?? undefined,
        }

        // 1) Convertir File a Buffer
        const arrayBuffer = await audioFile.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        console.log("[send-audio] Buffer size=%d bytes, mimeType=%s", buffer.length, audioFile.type)

        // 2) Subir audio a WhatsApp
        const mimeType = audioFile.type || "audio/ogg"
        let mediaId: string
        try {
            console.log("[send-audio] Subiendo media a WhatsApp con mimeType=%s", mimeType)
            mediaId = await uploadWhatsAppMedia(buffer, mimeType, credentials)
            console.log("[send-audio] Upload exitoso, mediaId=%s", mediaId)
        } catch (uploadError: any) {
            console.error("[send-audio] UPLOAD FALLÓ:", uploadError.message)
            return NextResponse.json(
                { error: "Error subiendo audio a WhatsApp", details: uploadError.message },
                { status: 500 }
            )
        }

        // 3) Enviar mensaje de audio
        let whatsappResponse
        try {
            console.log("[send-audio] Enviando mensaje de audio a to=%s mediaId=%s", cleanPhone, mediaId)
            whatsappResponse = await sendWhatsAppAudio(
                cleanPhone,
                mediaId,
                credentials,
                clientIdNum
            )
            console.log("[send-audio] Mensaje enviado OK:", JSON.stringify(whatsappResponse))
        } catch (sendError: any) {
            console.error("[send-audio] SEND FALLÓ:", sendError.message)
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
        console.error("[send-audio] ERROR inesperado:", error)
        return NextResponse.json(
            { error: error.message || "Internal Server Error" },
            { status: 500 }
        )
    }
}
