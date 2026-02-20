import { NextResponse } from "next/server"
import prisma from "@/lib/db"
import { getServerUser } from "@/lib/auth-server"
import { getLogoSignedUrl } from "@/services/logo-upload.service"

export type ClientEmailSettingsPayload = {
  primary_color?: string
  secondary_color?: string
  logo_url?: string | null
  sender_name?: string | null
  footer_text?: string | null
  templates?: Record<string, unknown>
}

// GET - Obtener configuración de email del cliente autenticado
export async function GET(req: Request) {
  try {
    const user = await getServerUser()
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const settings = await prisma.clientEmailSettings.findUnique({
      where: { client_id: user.id },
    })

    let logo_display_url: string | null = null
    if (settings?.logo_url) {
      try {
        logo_display_url = await getLogoSignedUrl(settings.logo_url, 3600)
      } catch {
        logo_display_url = null
      }
    }

    return NextResponse.json({
      settings: settings
        ? {
            ...settings,
            logo_display_url,
          }
        : null,
    })
  } catch (error: unknown) {
    console.error("Error fetching email settings:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error interno" },
      { status: 500 }
    )
  }
}

// PATCH - Actualizar configuración de email del cliente autenticado
export async function PATCH(req: Request) {
  try {
    const user = await getServerUser()
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = (await req.json()) as ClientEmailSettingsPayload

    const data: Record<string, unknown> = {}
    if (body.primary_color !== undefined) data.primary_color = body.primary_color
    if (body.secondary_color !== undefined) data.secondary_color = body.secondary_color
    if (body.logo_url !== undefined) data.logo_url = body.logo_url
    if (body.sender_name !== undefined) data.sender_name = body.sender_name
    if (body.footer_text !== undefined) data.footer_text = body.footer_text
    if (body.templates !== undefined) data.templates = body.templates

    const settings = await prisma.clientEmailSettings.upsert({
      where: { client_id: user.id },
      create: {
        client_id: user.id,
        ...(data as Parameters<typeof prisma.clientEmailSettings.create>[0]["data"]),
      },
      update: data as Parameters<typeof prisma.clientEmailSettings.update>[0]["data"],
    })

    return NextResponse.json({ success: true, settings })
  } catch (error: unknown) {
    console.error("Error updating email settings:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error interno" },
      { status: 500 }
    )
  }
}
