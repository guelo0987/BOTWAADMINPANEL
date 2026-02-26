import { cookies } from "next/headers"
import jwt from "jsonwebtoken"
import prisma from "@/lib/db"

import { JWT_SECRET_OR_FALLBACK } from "@/lib/jwt"

export interface AuthUser {
    id: number
    business_name: string
    whatsapp_instance_id: string
    is_active: boolean
}

/**
 * Obtiene el usuario autenticado desde las cookies (Server Component)
 */
export async function getServerUser(): Promise<AuthUser | null> {
    try {
        const cookieStore = await cookies()
        const token = cookieStore.get("auth_token")?.value

        if (!token) {
            return null
        }

        const decoded = jwt.verify(token, JWT_SECRET_OR_FALLBACK) as { id: number; business_name: string }

        // Obtener cliente completo desde la BD
        const client = await prisma.client.findUnique({
            where: { id: decoded.id },
            select: {
                id: true,
                business_name: true,
                whatsapp_instance_id: true,
                is_active: true,
            },
        })

        if (!client) {
            return null
        }

        return {
            id: client.id,
            business_name: client.business_name,
            whatsapp_instance_id: client.whatsapp_instance_id,
            is_active: client.is_active,
        }
    } catch (error) {
        console.error("Error getting server user:", error)
        return null
    }
}

/**
 * Requiere autenticación, redirige si no está autenticado
 */
export async function requireAuth(): Promise<AuthUser> {
    const user = await getServerUser()

    if (!user) {
        throw new Error("Unauthorized")
    }

    return user
}
