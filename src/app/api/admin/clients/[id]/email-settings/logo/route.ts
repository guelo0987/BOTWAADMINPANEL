import { NextResponse } from "next/server"
import { requireAdminAuth } from "@/lib/admin-auth-server"
import { uploadLogo } from "@/services/logo-upload.service"
import prisma from "@/lib/db"

const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2 MB
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"]

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminAuth()

    const { id } = await params
    const clientIdNum = parseInt(id, 10)
    if (isNaN(clientIdNum)) {
      return NextResponse.json({ error: "clientId inválido" }, { status: 400 })
    }

    const client = await prisma.client.findUnique({
      where: { id: clientIdNum },
    })
    if (!client) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 })
    }

    const contentType = req.headers.get("content-type") || ""
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        { error: "Content-Type debe ser multipart/form-data" },
        { status: 400 }
      )
    }

    const formData = await req.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json(
        { error: "Falta el archivo. Usa el campo 'file'." },
        { status: 400 }
      )
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `El logo no puede superar ${MAX_FILE_SIZE / 1024 / 1024} MB` },
        { status: 400 }
      )
    }

    const type = file.type?.toLowerCase() || ""
    if (!ALLOWED_TYPES.includes(type)) {
      return NextResponse.json(
        { error: "Solo se permiten imágenes PNG, JPG o WebP" },
        { status: 400 }
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const result = await uploadLogo(buffer, clientIdNum, file.name || "logo.png")

    await prisma.clientEmailSettings.upsert({
      where: { client_id: clientIdNum },
      create: {
        client_id: clientIdNum,
        logo_url: result.key,
      },
      update: { logo_url: result.key },
    })

    return NextResponse.json({
      success: true,
      logo_url: result.key,
      url: result.url,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al subir el logo"
    console.error("Logo upload error:", err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
