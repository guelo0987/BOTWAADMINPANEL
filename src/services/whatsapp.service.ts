import { ConversationMemory } from "./redis.service"

export interface WhatsAppClientCredentials {
    phoneNumberId: string
    accessToken: string
    apiVersion?: string
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
