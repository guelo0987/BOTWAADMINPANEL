import { NextResponse } from "next/server"
import prisma from "@/lib/db"
import jwt from "jsonwebtoken"
import { requireAdminRole } from "@/lib/admin-auth-server"

import { JWT_SECRET_OR_FALLBACK } from "@/lib/jwt"

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminRole("admin")
    const { id } = await params
    const clientId = Number(id)

    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: {
        id: true,
        business_name: true,
        whatsapp_instance_id: true,
        is_active: true,
      },
    })

    if (!client) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 })
    }

    const token = jwt.sign({ id: client.id, business_name: client.business_name }, JWT_SECRET_OR_FALLBACK, {
      expiresIn: "7d",
    })

    const response = NextResponse.json({ token, client })

    // Cookie para Server Components (misma que usa el login normal)
    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    })

    return response
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Unauthorized" }, { status: 401 })
  }
}

