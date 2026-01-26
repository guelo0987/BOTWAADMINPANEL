import redisClient from "@/lib/redis"

export class ConversationMemory {
    private key: string
    private clientId: string
    private phoneNumber: string

    constructor(clientId: string | number, phoneNumber: string) {
        this.clientId = clientId.toString()
        this.phoneNumber = phoneNumber
        this.key = `chat:${this.clientId}:${this.phoneNumber}`
    }

    // Verificar si hay intervención humana
    async isHumanHandled(): Promise<boolean> {
        const status = await redisClient.get(`${this.key}:status`)
        return status === "human_handled" || status === "escalated"
    }

    // Marcar como manejada por humano
    async setHumanHandled(handled = true, adminUser: string | null = null): Promise<void> {
        const statusKey = `${this.key}:status`
        const adminKey = `${this.key}:admin`

        if (handled) {
            await redisClient.setEx(statusKey, 3600, "human_handled")
            if (adminUser) {
                await redisClient.setEx(adminKey, 3600, adminUser)
            }
        } else {
            await redisClient.del(statusKey)
            await redisClient.del(adminKey)
        }
    }

    // Marcar como escalada
    async setEscalated(escalated = true, motivo: string | null = null): Promise<void> {
        const statusKey = `${this.key}:status`
        const reasonKey = `${this.key}:escalation_reason`

        if (escalated) {
            await redisClient.setEx(statusKey, 3600, "escalated")
            if (motivo) {
                await redisClient.setEx(reasonKey, 3600, motivo)
            }
        } else {
            await redisClient.del(statusKey)
            await redisClient.del(reasonKey)
        }
    }

    // Obtener estado
    async getStatus(): Promise<{
        status: string
        admin: string | null
        escalation_reason: string | null
    }> {
        const status = (await redisClient.get(`${this.key}:status`)) || "active"
        const admin = await redisClient.get(`${this.key}:admin`)
        const reason = await redisClient.get(`${this.key}:escalation_reason`)

        return {
            status,
            admin,
            escalation_reason: reason,
        }
    }

    // Agregar mensaje de humano
    async addHumanMessage(content: string, adminName = "Agente"): Promise<void> {
        const message = JSON.stringify({
            role: "assistant",
            content,
            human: true,
            admin: adminName,
            timestamp: new Date().toISOString()
        })

        await redisClient.rPush(this.key, message)
        await redisClient.lTrim(this.key, -20, -1) // Mantener últimos 20
        await redisClient.expire(this.key, 3600)
    }

    // Obtener historial
    async getHistory(): Promise<any[]> {
        const messages = await redisClient.lRange(this.key, 0, -1)
        return messages.map((msg) => JSON.parse(msg))
    }

    // Guardar message_id enviado por bot
    async saveSentMessageId(messageId: string): Promise<void> {
        const sentKey = `${this.key}:sent_messages`
        await redisClient.sAdd(sentKey, messageId)
        await redisClient.expire(sentKey, 3600)
    }

    // Verificar si mensaje fue enviado por bot
    async isMessageSentByBot(messageId: string): Promise<boolean> {
        const sentKey = `${this.key}:sent_messages`
        const result = await redisClient.sIsMember(sentKey, messageId)
        return result === 1
    }
}
