import { NextResponse } from "next/server"
import prisma from "@/lib/db"

// Endpoint de debug para ver cómo vienen los datos
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const client_id = searchParams.get("client_id")

        if (!client_id) {
            return NextResponse.json(
                { error: "client_id is required" },
                { status: 400 }
            )
        }

        const client = await prisma.client.findUnique({
            where: { id: parseInt(client_id) },
        })

        if (!client) {
            return NextResponse.json(
                { error: "Client not found" },
                { status: 404 }
            )
        }

        // Retornar datos crudos para debug
        return NextResponse.json({
            raw_tools_config: client.tools_config,
            tools_config_type: typeof client.tools_config,
            tools_config_is_array: Array.isArray(client.tools_config),
            tools_config_keys: client.tools_config ? Object.keys(client.tools_config as any) : [],
            parsed: client.tools_config as any,
        })
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || "Internal Server Error" },
            { status: 500 }
        )
    }
}
