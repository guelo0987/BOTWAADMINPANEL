import { Conversation, Message } from "@/types"

export const getRecentConversations = async (clientId?: number): Promise<Conversation[]> => {
    if (!clientId) return []

    try {
        // Obtener conversaciones desde la API de admin
        const response = await fetch(
            `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/admin/conversations?client_id=${clientId}`
        )
        
        if (!response.ok) {
            throw new Error("Failed to fetch conversations")
        }

        const data = await response.json()
        return data.conversations.slice(0, 5)
    } catch (error) {
        console.error("Error fetching recent conversations:", error)
        return []
    }
}

export const getAllConversations = async (clientId?: number): Promise<Conversation[]> => {
    if (!clientId) return []

    try {
        const response = await fetch(
            `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/admin/conversations?client_id=${clientId}`
        )
        
        if (!response.ok) {
            throw new Error("Failed to fetch conversations")
        }

        const data = await response.json()
        return data.conversations
    } catch (error) {
        console.error("Error fetching all conversations:", error)
        return []
    }
}

export const getConversationMessages = async (conversationId: number, clientId?: number): Promise<Message[]> => {
    if (!clientId) return []

    try {
        const response = await fetch(
            `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/admin/conversations/${conversationId}/history?client_id=${clientId}`
        )
        
        if (!response.ok) {
            throw new Error("Failed to fetch conversation messages")
        }

        const data = await response.json()
        return data.messages.map((msg: any, index: number) => ({
            id: index + 1,
            conversation_id: conversationId,
            role: msg.role,
            content: msg.content,
            timestamp: new Date().toISOString(),
            human: msg.human || false,
            admin: msg.admin || null,
        }))
    } catch (error) {
        console.error("Error fetching conversation messages:", error)
        return []
    }
}
