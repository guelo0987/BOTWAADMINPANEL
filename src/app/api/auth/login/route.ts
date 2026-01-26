import { NextResponse } from "next/server"
import { authenticateClient } from "@/services/auth.service"

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { whatsapp_instance_id, password } = body

        if (!whatsapp_instance_id || !password) {
            return NextResponse.json(
                { error: "Faltan campos requeridos" },
                { status: 400 }
            )
        }

        const { client, token } = await authenticateClient(whatsapp_instance_id, password)

        const { password_hash, ...safeClient } = client

        // Crear respuesta con cookie
        const response = NextResponse.json({
            message: "Login exitoso",
            token,
            client: safeClient,
        })

        // Establecer cookie HTTP-only para Server Components
        response.cookies.set("auth_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 7, // 7 días
            path: "/",
        })

        return response
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || "Error de autenticación" },
            { status: 401 }
        )
    }
}
