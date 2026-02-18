import { Conversation, Message } from "@/types"
import prisma from "@/lib/db"
import { ConversationMemory } from "@/services/redis.service"

async function fetchConversationsFromDb(clientId: number): Promise<Conversation[]> {
    const customers = await prisma.customer.findMany({
        where: { client_id: clientId },
        orderBy: { created_at: "desc" },
    })

    const conversations: Conversation[] = []
    for (const customer of customers) {
        const memory = new ConversationMemory(clientId, customer.phone_number)
        const history = await memory.getHistory()
        const statusInfo = await memory.getStatus()

        if (!history.length) continue

        const lastMsg = history[history.length - 1]
        const isEscalated = statusInfo.status === "escalated"
        const isHumanHandled = statusInfo.status === "human_handled"

        let convStatus: string
        if (isEscalated) convStatus = "escalated"
        else if (isHumanHandled) convStatus = "human_handled"
        else convStatus = "active"

        conversations.push({
            customer_id: customer.id,
            customer_name: customer.full_name || customer.phone_number,
            phone_number: customer.phone_number,
            last_message: lastMsg?.content?.substring(0, 100) || "",
            last_message_at: lastMsg?.timestamp || undefined,
            last_message_time: lastMsg?.timestamp || undefined,
            status: convStatus as Conversation["status"],
            message_count: history.length,
            is_escalated: isEscalated,
            is_human_handled: isHumanHandled,
            admin: statusInfo.admin,
            escalation_reason: statusInfo.escalation_reason,
        })
    }

    conversations.sort((a, b) => {
        const timeA = a.last_message_time || ""
        const timeB = b.last_message_time || ""
        return timeA < timeB ? 1 : -1
    })

    return conversations
}

export const getRecentConversations = async (clientId?: number): Promise<Conversation[]> => {
    if (!clientId) return []
    try {
        const all = await fetchConversationsFromDb(clientId)
        return all.slice(0, 5)
    } catch (error) {
        console.error("Error fetching recent conversations:", error)
        return []
    }
}

export const getAllConversations = async (clientId?: number): Promise<Conversation[]> => {
    if (!clientId) return []
    try {
        return await fetchConversationsFromDb(clientId)
    } catch (error) {
        console.error("Error fetching all conversations:", error)
        return []
    }
}

export const getConversationMessages = async (
    conversationId: number,
    clientId?: number
): Promise<Message[]> => {
    if (!clientId) return []
    try {
        const customer = await prisma.customer.findFirst({
            where: { id: conversationId, client_id: clientId },
        })
        if (!customer) return []

        const memory = new ConversationMemory(clientId, customer.phone_number)
        const history = await memory.getHistory()
        const statusInfo = await memory.getStatus()

        return history.map((msg: any, index: number) => ({
            id: index + 1,
            conversation_id: conversationId,
            content: msg.content || "",
            sender: (msg.role === "user" ? "customer" : msg.human ? "agent" : "bot") as Message["sender"],
            timestamp: msg.timestamp || new Date().toISOString(),
        }))
    } catch (error) {
        console.error("Error fetching conversation messages:", error)
        return []
    }
}
