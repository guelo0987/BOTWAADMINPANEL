import { NextResponse } from "next/server"

export async function POST(req: Request) {
    const response = NextResponse.json({
        message: "Logout exitoso",
    })

    // Limpiar cookie de autenticación
    response.cookies.set("auth_token", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 0, // Expirar inmediatamente
        path: "/",
    })

    return response
}
