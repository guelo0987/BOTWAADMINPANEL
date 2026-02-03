import { NextResponse } from "next/server"
import { getServerUser } from "@/lib/auth-server"
import { uploadCatalogPdf } from "@/services/catalog-upload.service"

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

export async function POST(req: Request) {
  try {
    const user = await getServerUser()
    if (!user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
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
        { error: `El archivo no puede superar ${MAX_FILE_SIZE / 1024 / 1024} MB` },
        { status: 400 }
      )
    }

    const type = file.type?.toLowerCase() || ""
    if (type !== "application/pdf") {
      return NextResponse.json(
        { error: "Solo se permiten archivos PDF" },
        { status: 400 }
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const result = await uploadCatalogPdf(buffer, user.id, file.name || "catalogo.pdf")

    return NextResponse.json({
      success: true,
      catalog_pdf_key: result.key,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al subir el catálogo"
    console.error("Catalog upload error:", err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
