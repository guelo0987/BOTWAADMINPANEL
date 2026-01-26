import { ConversationMemory } from "./redis.service"

const WHATSAPP_API_VERSION = process.env.WHATSAPP_API_VERSION || "v21.0"
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN

export const sendWhatsAppMessage = async (
    to: string,
    message: string,
    clientId: string | number
): Promise<any> => {
    // ⚠️ VALIDACIONES
    if (!PHONE_NUMBER_ID || !ACCESS_TOKEN) {
        console.error("❌ Variables de entorno faltantes:", {
            hasPhoneNumberId: !!PHONE_NUMBER_ID,
            hasAccessToken: !!ACCESS_TOKEN
        })
        throw new Error("Configuración de WhatsApp incompleta. Verifica WHATSAPP_PHONE_NUMBER_ID y WHATSAPP_ACCESS_TOKEN")
    }

    // ⚠️ FORMATO DE NÚMERO (sin +, sin espacios, solo dígitos)
    const cleanPhone = to.replace(/[+\s-()]/g, "")

    const url = `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${PHONE_NUMBER_ID}/messages`

    const payload = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: cleanPhone,
        type: "text",
        text: {
            body: message,
        },
    }

    console.log("📤 Enviando mensaje a WhatsApp:", {
        url,
        to: cleanPhone,
        messageLength: message.length,
        hasToken: !!ACCESS_TOKEN,
        phoneNumberId: PHONE_NUMBER_ID
    })

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${ACCESS_TOKEN}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        })

        const responseData = await response.json()

        // ⚠️ VERIFICAR QUE REALMENTE SE ENVIÓ
        if (!response.ok) {
            console.error("❌ Error enviando a WhatsApp:", {
                status: response.status,
                statusText: response.statusText,
                data: responseData
            })
            throw new Error(`WhatsApp API retornó error: ${JSON.stringify(responseData)}`)
        }

        if (!responseData.messages?.[0]?.id) {
            console.error("❌ WhatsApp no retornó message_id:", responseData)
            throw new Error("WhatsApp no retornó message_id en la respuesta")
        }

        console.log("✅ Respuesta de WhatsApp:", {
            status: response.status,
            messageId: responseData.messages[0].id,
            data: responseData
        })

        // Guardar message_id si tenemos clientId (para tracking de Business Suite)
        if (clientId && responseData.messages[0].id) {
            try {
                const memory = new ConversationMemory(clientId, cleanPhone)
                await memory.saveSentMessageId(responseData.messages[0].id)
                console.log("✅ message_id guardado en Redis")
            } catch (redisError) {
                // ⚠️ ERROR EN REDIS PERO MENSAJE YA ENVIADO A WHATSAPP
                console.error("⚠️ Error guardando message_id en Redis (mensaje ya enviado):", redisError)
                // No fallar porque el mensaje ya se envió
            }
        }

        return responseData
    } catch (error: any) {
        console.error("❌ Error enviando mensaje a WhatsApp:", {
            message: error.message,
            stack: error.stack
        })
        throw error
    }
}
