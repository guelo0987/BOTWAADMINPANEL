import { NextResponse } from "next/server"
import { authenticateAdmin } from "@/services/admin-auth.service"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
    }

    const { user, token } = await authenticateAdmin(username, password)

    const response = NextResponse.json({
      message: "Login admin exitoso",
      token,
      user,
    })

    response.cookies.set("admin_auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 días
      path: "/",
    })

    return response
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error de autenticación" }, { status: 401 })
  }
}

