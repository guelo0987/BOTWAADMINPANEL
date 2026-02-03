import { NextResponse } from "next/server"
import prisma from "@/lib/db"
import { validateToolsConfig, normalizeToolsConfig } from "@/lib/validate-tools-config"

// GET - Obtener configuración del cliente
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
            select: {
                id: true,
                business_name: true,
                whatsapp_instance_id: true,
                is_active: true,
                system_prompt_template: true,
                tools_config: true,
                created_at: true,
            },
        })

        if (!client) {
            return NextResponse.json(
                { error: "Client not found" },
                { status: 404 }
            )
        }

        console.log("[GET /api/client/config] tools_config desde BD (crudo):", JSON.stringify(client.tools_config, null, 2))

        // Asegurar que tools_config sea un objeto, no null
        const toolsConfig = client.tools_config && typeof client.tools_config === 'object' 
            ? client.tools_config 
            : (client.tools_config ? JSON.parse(client.tools_config as string) : {})

        console.log("[GET /api/client/config] tools_config que se envía al frontend:", JSON.stringify(toolsConfig, null, 2))

        return NextResponse.json({
            ...client,
            tools_config: toolsConfig,
        })
    } catch (error: any) {
        console.error("Error fetching client config:", error)
        return NextResponse.json(
            { error: error.message || "Internal Server Error" },
            { status: 500 }
        )
    }
}

// PUT - Actualizar configuración del cliente
export async function PUT(req: Request) {
    try {
        const body = await req.json()
        const {
            client_id,
            business_name,
            whatsapp_instance_id,
            is_active,
            system_prompt_template,
            tools_config,
        } = body

        if (!client_id) {
            return NextResponse.json(
                { error: "client_id is required" },
                { status: 400 }
            )
        }

        // Validar que el cliente existe
        const existingClient = await prisma.client.findUnique({
            where: { id: parseInt(client_id) },
        })

        if (!existingClient) {
            return NextResponse.json(
                { error: "Client not found" },
                { status: 404 }
            )
        }

        // Validar whatsapp_instance_id único si se está cambiando
        if (whatsapp_instance_id && whatsapp_instance_id !== existingClient.whatsapp_instance_id) {
            const duplicate = await prisma.client.findUnique({
                where: { whatsapp_instance_id },
            })

            if (duplicate) {
                return NextResponse.json(
                    { error: "whatsapp_instance_id already exists" },
                    { status: 400 }
                )
            }
        }

        // Validar y normalizar tools_config si se está actualizando
        let normalizedToolsConfig = tools_config
        if (tools_config) {
            const validationErrors = validateToolsConfig(tools_config)
            if (validationErrors.length > 0) {
                return NextResponse.json(
                    {
                        error: "Validation failed",
                        errors: validationErrors,
                    },
                    { status: 400 }
                )
            }

            // Normalizar tools_config antes de guardar
            normalizedToolsConfig = normalizeToolsConfig(tools_config)
        }

        // Actualizar cliente
        const updatedClient = await prisma.client.update({
            where: { id: parseInt(client_id) },
            data: {
                ...(business_name && { business_name }),
                ...(whatsapp_instance_id && { whatsapp_instance_id }),
                ...(typeof is_active === "boolean" && { is_active }),
                ...(system_prompt_template && { system_prompt_template }),
                ...(normalizedToolsConfig && { tools_config: normalizedToolsConfig }),
            },
            select: {
                id: true,
                business_name: true,
                whatsapp_instance_id: true,
                is_active: true,
                system_prompt_template: true,
                tools_config: true,
                created_at: true,
            },
        })

        return NextResponse.json({
            success: true,
            client: updatedClient,
        })
    } catch (error: any) {
        console.error("Error updating client config:", error)
        return NextResponse.json(
            { error: error.message || "Internal Server Error" },
            { status: 500 }
        )
    }
}
