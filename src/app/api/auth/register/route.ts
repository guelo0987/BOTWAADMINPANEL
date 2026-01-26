import { NextResponse } from "next/server"
import { registerClient } from "@/services/auth.service"

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { business_name, whatsapp_instance_id, password } = body

        if (!business_name || !whatsapp_instance_id || !password) {
            return NextResponse.json(
                { error: "Faltan campos requeridos" },
                { status: 400 }
            )
        }

        const { client, token } = await registerClient({
            business_name,
            whatsapp_instance_id,
            password,
        })

        // Return client info without sensitive data
        const { password_hash, ...safeClient } = client

        return NextResponse.json({
            message: "Registro exitoso",
            token,
            client: safeClient,
        })
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || "Error interno del servidor" },
            { status: 500 }
        )
    }
}
