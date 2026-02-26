import { NextResponse } from "next/server"
import prisma from "@/lib/db"
import { getServerUser } from "@/lib/auth-server"
import { validateToolsConfig, normalizeToolsConfig } from "@/lib/validate-tools-config"
import { ToolsConfig } from "@/types"

// GET - Obtener configuración del cliente autenticado
export async function GET(req: Request) {
    try {
        const user = await getServerUser()
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const client_id = searchParams.get("client_id")
        if (!client_id) {
            return NextResponse.json(
                { error: "client_id is required" },
                { status: 400 }
            )
        }

        const clientIdNum = parseInt(client_id, 10)
        if (clientIdNum !== user.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const client = await prisma.client.findUnique({
            where: { id: clientIdNum },
            select: {
                id: true,
                business_name: true,
                whatsapp_instance_id: true,
                is_active: true,
                bot_disabled_by_admin: true,
                notification_email: true,
                system_prompt_template: true,
                tools_config: true,
                created_at: true,
                whatsapp_access_token: true,
                whatsapp_app_secret: true,
                whatsapp_api_version: true,
            },
        })

        if (!client) {
            return NextResponse.json(
                { error: "Client not found" },
                { status: 404 }
            )
        }

        // Asegurar que tools_config sea un objeto, no null
        const toolsConfig = client.tools_config && typeof client.tools_config === 'object'
            ? client.tools_config
            : (client.tools_config ? JSON.parse(client.tools_config as string) : {})

        // Normalizar tools_config antes de enviar al cliente (para que reciba datos limpios)
        const normalizedToolsConfig = normalizeToolsConfig(toolsConfig as ToolsConfig)

        return NextResponse.json({
            ...client,
            tools_config: normalizedToolsConfig,
        })
    } catch (error: any) {
        console.error("Error fetching client config:", error)
        return NextResponse.json(
            { error: error.message || "Internal Server Error" },
            { status: 500 }
        )
    }
}

// PUT - Actualizar configuración del cliente autenticado
export async function PUT(req: Request) {
    try {
        const user = await getServerUser()
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await req.json()
        const {
            client_id,
            business_name,
            whatsapp_instance_id,
            is_active,
            notification_email,
            system_prompt_template,
            tools_config,
            whatsapp_access_token,
            whatsapp_app_secret,
            whatsapp_api_version,
        } = body

        if (!client_id) {
            return NextResponse.json(
                { error: "client_id is required" },
                { status: 400 }
            )
        }

        const clientIdNum = parseInt(client_id, 10)
        if (clientIdNum !== user.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const existingClient = await prisma.client.findUnique({
            where: { id: clientIdNum },
        })

        if (!existingClient) {
            return NextResponse.json(
                { error: "Client not found" },
                { status: 404 }
            )
        }

        if (is_active === true && existingClient.bot_disabled_by_admin) {
            return NextResponse.json(
                { error: "El bot fue desactivado por el administrador. Contacta al soporte para reactivarlo." },
                { status: 403 }
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
        let normalizedToolsConfig = tools_config as ToolsConfig
        if (tools_config) {
            // Normalizar tools_config antes de validar para corregir datos legacy (ej: working_days=0 -> 7)
            normalizedToolsConfig = normalizeToolsConfig(tools_config as ToolsConfig)

            const validationErrors = validateToolsConfig(normalizedToolsConfig)
            if (validationErrors.length > 0) {
                return NextResponse.json(
                    {
                        error: "Validation failed",
                        errors: validationErrors,
                    },
                    { status: 400 }
                )
            }
        }

        const updatedClient = await prisma.client.update({
            where: { id: clientIdNum },
            data: {
                ...(business_name && { business_name }),
                ...(whatsapp_instance_id && { whatsapp_instance_id }),
                ...(typeof is_active === "boolean" && { is_active }),
                ...(notification_email !== undefined && { notification_email: notification_email || null }),
                ...(system_prompt_template && { system_prompt_template }),
                ...(normalizedToolsConfig && { tools_config: normalizedToolsConfig }),
                ...(whatsapp_access_token !== undefined && { whatsapp_access_token: whatsapp_access_token || null }),
                ...(whatsapp_app_secret !== undefined && { whatsapp_app_secret: whatsapp_app_secret || null }),
                ...(whatsapp_api_version !== undefined && { whatsapp_api_version: whatsapp_api_version || null }),
            },
            select: {
                id: true,
                business_name: true,
                whatsapp_instance_id: true,
                is_active: true,
                bot_disabled_by_admin: true,
                notification_email: true,
                system_prompt_template: true,
                tools_config: true,
                created_at: true,
                whatsapp_access_token: true,
                whatsapp_app_secret: true,
                whatsapp_api_version: true,
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
