import { NextResponse } from "next/server"
import prisma from "@/lib/db"
import bcrypt from "bcryptjs"
import { normalizeToolsConfig, validateToolsConfig } from "@/lib/validate-tools-config"
import { requireAdminAuth, requireAdminRole } from "@/lib/admin-auth-server"
import type { ToolsConfig } from "@/types"

function defaultToolsConfigForType(business_type: ToolsConfig["business_type"]): ToolsConfig {
  const base: ToolsConfig = {
    business_type,
    timezone: "America/Santo_Domingo",
    business_hours: { start: "08:00", end: "18:00" },
    working_days: [1, 2, 3, 4, 5],
    currency: "$",
  }

  if (business_type === "clinic") {
    return {
      ...base,
      services: [{ name: "Consulta general", price: 0, duration_minutes: 30 }],
      professionals: [{ id: "prof-1", name: "Profesional 1" }],
      requires_insurance: false,
    }
  }

  if (business_type === "salon") {
    return {
      ...base,
      slot_duration: 30,
      services: [{ name: "Corte de pelo", price: 0, duration_minutes: 60 }],
      professionals: [],
    }
  }

  if (business_type === "restaurant") {
    return {
      ...base,
      business_hours: { start: "12:00", end: "23:00" },
      working_days: [1, 2, 3, 4, 5, 6],
      areas: ["Salón principal", "Terraza"],
      occasions: ["Cumpleaños", "Aniversario", "Reunión de negocios"],
    }
  }

  if (business_type === "store") {
    return {
      ...base,
      calendar_id: undefined,
      catalog: { categories: [{ name: "General", products: [{ name: "Producto", price: 0 }] }] },
      delivery_hours: { start: "09:00", end: "18:00" },
      delivery_duration: 60,
      free_delivery_minimum: 3000,
    }
  }

  return base
}

function defaultPromptForType(business_type: ToolsConfig["business_type"]): string {
  switch (business_type) {
    case "clinic":
      return "Eres un asistente amable de una clínica. Ayudas a agendar, reprogramar o cancelar citas, responder preguntas frecuentes y recopilar datos del paciente de forma respetuosa."
    case "salon":
      return "Eres un asistente amable de un salón. Ayudas a reservar servicios, consultar disponibilidad y precios, y confirmar citas."
    case "restaurant":
      return "Eres un asistente amable de un restaurante. Ayudas con reservas, horarios, menú y consultas de disponibilidad."
    case "store":
      return "Eres un asistente amable de una tienda. Ayudas con el catálogo de productos, disponibilidad y precios. Al agendar entregas a domicilio, siempre mencionas que el pago es contra entrega."
    case "general":
    default:
      return "Eres un asistente amable."
  }
}

export async function GET() {
  try {
    await requireAdminAuth()

    const clients = await prisma.client.findMany({
      orderBy: { created_at: "desc" },
      select: {
        id: true,
        business_name: true,
        whatsapp_instance_id: true,
        is_active: true,
        tools_config: true,
        created_at: true,
      },
    })

    return NextResponse.json({ clients })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Unauthorized" }, { status: 401 })
  }
}

export async function POST(req: Request) {
  try {
    await requireAdminRole("admin")

    const body = await req.json()
    const { business_name, whatsapp_instance_id, password, business_type, system_prompt_template, tools_config } = body

    if (!business_name || !whatsapp_instance_id || !password) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
    }

    const bt: ToolsConfig["business_type"] = business_type || "general"
    const mergedToolsConfig: ToolsConfig = normalizeToolsConfig({
      ...defaultToolsConfigForType(bt),
      ...(tools_config || {}),
      business_type: bt,
    })

    const errors = validateToolsConfig(mergedToolsConfig)
    if (errors.length) {
      return NextResponse.json({ error: "tools_config inválido", errors }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const client = await prisma.client.create({
      data: {
        business_name,
        whatsapp_instance_id,
        password_hash: hashedPassword,
        system_prompt_template: system_prompt_template || defaultPromptForType(bt),
        is_active: true,
        tools_config: mergedToolsConfig as any,
      },
      select: {
        id: true,
        business_name: true,
        whatsapp_instance_id: true,
        is_active: true,
        tools_config: true,
        created_at: true,
      },
    })

    return NextResponse.json({ client }, { status: 201 })
  } catch (error: any) {
    // Prisma unique violation
    const msg = typeof error?.message === "string" ? error.message : "Error creando cliente"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

