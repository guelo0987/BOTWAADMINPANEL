import { ConversationMemory } from "./redis.service"

export interface WhatsAppClientCredentials {
    phoneNumberId: string
    accessToken: string
    apiVersion?: string
}

/**
 * Sube un archivo de audio a WhatsApp Cloud API y devuelve el media_id.
 */
export const uploadWhatsAppMedia = async (
    audioBuffer: Buffer,
    mimeType: string,
    credentials: WhatsAppClientCredentials
): Promise<string> => {
    if (!credentials.phoneNumberId || !credentials.accessToken) {
        throw new Error("Credenciales de WhatsApp incompletas")
    }

    const apiVersion = credentials.apiVersion || "v21.0"
    const url = `https://graph.facebook.com/${apiVersion}/${credentials.phoneNumberId}/media`

    // WhatsApp acepta: audio/aac, audio/mp4, audio/mpeg, audio/amr, audio/ogg, audio/opus
    // Chrome graba audio/webm;codecs=opus → declaramos audio/ogg (mismo codec Opus, WhatsApp lo acepta)
    // Firefox graba audio/ogg;codecs=opus → directo
    // Safari graba audio/mp4 → directo
    const baseType = mimeType.split(";")[0].trim()
    const whatsappType = baseType === "audio/webm" ? "audio/ogg" : baseType
    const ext = whatsappType.includes("ogg") || whatsappType.includes("opus") ? "ogg" : whatsappType.includes("mp4") ? "m4a" : "ogg"

    console.log("[uploadWhatsAppMedia] mimeType original=%s → baseType=%s → whatsappType=%s ext=%s bufferSize=%d", mimeType, baseType, whatsappType, ext, audioBuffer.length)

    const formData = new FormData()
    const blob = new Blob([new Uint8Array(audioBuffer)], { type: baseType })
    formData.append("file", blob, `audio.${ext}`)
    formData.append("type", baseType)
    formData.append("messaging_product", "whatsapp")

    const response = await fetch(url, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${credentials.accessToken}`,
        },
        body: formData,
    })

    const data = await response.json()
    console.log("[uploadWhatsAppMedia] WA response status=%d body=%s", response.status, JSON.stringify(data))

    if (!response.ok) {
        throw new Error(`Error subiendo media a WhatsApp: ${JSON.stringify(data)}`)
    }

    if (!data.id) {
        throw new Error("WhatsApp no retornó media_id")
    }

    return data.id
}

/**
 * Envía un mensaje de audio por WhatsApp usando un media_id ya subido.
 */
export const sendWhatsAppAudio = async (
    to: string,
    mediaId: string,
    credentials: WhatsAppClientCredentials,
    clientId?: string | number
): Promise<any> => {
    if (!credentials.phoneNumberId || !credentials.accessToken) {
        throw new Error("Credenciales de WhatsApp incompletas")
    }

    const apiVersion = credentials.apiVersion || "v21.0"
    const cleanPhone = to.replace(/[+\s-()]/g, "")
    const url = `https://graph.facebook.com/${apiVersion}/${credentials.phoneNumberId}/messages`

    const payload = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: cleanPhone,
        type: "audio",
        audio: { id: mediaId },
    }

    console.log("[sendWhatsAppAudio] POST %s payload=%s", url, JSON.stringify(payload))

    const response = await fetch(url, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${credentials.accessToken}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    })

    const responseData = await response.json()
    console.log("[sendWhatsAppAudio] WA response status=%d body=%s", response.status, JSON.stringify(responseData))

    if (!response.ok) {
        throw new Error(`Error enviando audio: ${JSON.stringify(responseData)}`)
    }

    if (!responseData.messages?.[0]?.id) {
        throw new Error("WhatsApp no retornó message_id para audio")
    }

    if (clientId != null && responseData.messages[0].id) {
        try {
            const memory = new ConversationMemory(clientId, cleanPhone)
            await memory.saveSentMessageId(responseData.messages[0].id)
        } catch {
            // Redis falló pero mensaje ya enviado
        }
    }

    return responseData
}

/**
 * Envía un mensaje de WhatsApp usando las credenciales del cliente (multi-tenant).
 * Las credenciales vienen de la BD por cliente, no de variables de entorno globales.
 */
export const sendWhatsAppMessage = async (
    to: string,
    message: string,
    credentials: WhatsAppClientCredentials,
    clientId?: string | number
): Promise<any> => {
    if (!credentials.phoneNumberId || !credentials.accessToken) {
        throw new Error("Credenciales de WhatsApp incompletas para este cliente. Configura whatsapp_instance_id y whatsapp_access_token en Configuración del Bot.")
    }

    const apiVersion = credentials.apiVersion || "v21.0"
    const cleanPhone = to.replace(/[+\s-()]/g, "")

    const url = `https://graph.facebook.com/${apiVersion}/${credentials.phoneNumberId}/messages`

    const payload = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: cleanPhone,
        type: "text",
        text: {
            body: message,
        },
    }

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${credentials.accessToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        })

        const responseData = await response.json()

        // ⚠️ VERIFICAR QUE REALMENTE SE ENVIÓ
        if (!response.ok) {
            throw new Error(`WhatsApp API retornó error: ${JSON.stringify(responseData)}`)
        }

        if (!responseData.messages?.[0]?.id) {
            throw new Error("WhatsApp no retornó message_id en la respuesta")
        }

        if (clientId != null && responseData.messages[0].id) {
            try {
                const memory = new ConversationMemory(clientId, cleanPhone)
                await memory.saveSentMessageId(responseData.messages[0].id)
            } catch {
                // Redis falló pero mensaje ya enviado
            }
        }

        return responseData
    } catch (error: any) {
        throw error
    }
}
