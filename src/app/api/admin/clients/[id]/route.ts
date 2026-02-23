import { NextResponse } from "next/server"
import prisma from "@/lib/db"
import bcrypt from "bcryptjs"
import { normalizeToolsConfig, validateToolsConfig } from "@/lib/validate-tools-config"
import { requireAdminAuth, requireAdminRole } from "@/lib/admin-auth-server"
import type { ToolsConfig } from "@/types"

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminAuth()
    const { id } = await params
    const clientId = Number(id)

    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: {
        id: true,
        business_name: true,
        whatsapp_instance_id: true,
        is_active: true,
        bot_disabled_by_admin: true,
        system_prompt_template: true,
        tools_config: true,
        created_at: true,
      },
    })

    if (!client) return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 })
    return NextResponse.json({ client })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Unauthorized" }, { status: 401 })
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminRole("admin")
    const { id } = await params
    const clientId = Number(id)

    const body = await req.json()
    const { business_name, whatsapp_instance_id, is_active, password, system_prompt_template, tools_config, bot_disabled_by_admin } = body

    const data: any = {}
    if (typeof business_name === "string") data.business_name = business_name
    if (typeof whatsapp_instance_id === "string") data.whatsapp_instance_id = whatsapp_instance_id
    if (typeof is_active === "boolean") data.is_active = is_active
    if (typeof bot_disabled_by_admin === "boolean") data.bot_disabled_by_admin = bot_disabled_by_admin
    if (typeof system_prompt_template === "string") data.system_prompt_template = system_prompt_template

    if (tools_config) {
      const normalized: ToolsConfig = normalizeToolsConfig(tools_config)
      const errors = validateToolsConfig(normalized)
      if (errors.length) {
        return NextResponse.json({ error: "tools_config inválido", errors }, { status: 400 })
      }
      data.tools_config = normalized as any
    }

    if (typeof password === "string" && password.length) {
      data.password_hash = await bcrypt.hash(password, 10)
    }

    const client = await prisma.client.update({
      where: { id: clientId },
      data,
      select: {
        id: true,
        business_name: true,
        whatsapp_instance_id: true,
        is_active: true,
        bot_disabled_by_admin: true,
        tools_config: true,
        created_at: true,
      },
    })

    return NextResponse.json({ client })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error actualizando cliente" }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminRole("admin")
    const { id } = await params
    const clientId = Number(id)

    await prisma.client.delete({ where: { id: clientId } })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error eliminando cliente" }, { status: 500 })
  }
}

