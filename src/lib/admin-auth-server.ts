import { cookies } from "next/headers"
import jwt from "jsonwebtoken"
import prisma from "@/lib/db"

import { JWT_SECRET_OR_FALLBACK } from "@/lib/jwt"

export type AdminRole = "admin" | "empleado"

export interface AdminAuthUser {
  id: number
  username: string
  rol: AdminRole
}

export async function getAdminServerUser(): Promise<AdminAuthUser | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("admin_auth_token")?.value

    if (!token) return null

    const decoded = jwt.verify(token, JWT_SECRET_OR_FALLBACK) as { id: number }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, username: true, rol: true },
    })

    if (!user || !user.rol) return null

    return { id: user.id, username: user.username, rol: user.rol }
  } catch (error) {
    console.error("Error getting admin server user:", error)
    return null
  }
}

export async function requireAdminAuth(): Promise<AdminAuthUser> {
  const user = await getAdminServerUser()
  if (!user) throw new Error("Unauthorized")
  return user
}

export async function requireAdminRole(required: AdminRole): Promise<AdminAuthUser> {
  const user = await requireAdminAuth()
  if (user.rol !== required) throw new Error("Forbidden")
  return user
}

