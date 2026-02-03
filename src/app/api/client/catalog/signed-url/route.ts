import { NextResponse } from "next/server"
import { getServerUser } from "@/lib/auth-server"
import prisma from "@/lib/db"
import { getCatalogPdfSignedUrl } from "@/services/catalog-upload.service"

/** GET - Obtiene una URL firmada para ver/descargar el PDF del catálogo del cliente. */
export async function GET(req: Request) {
  try {
    const user = await getServerUser()
    if (!user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const client = await prisma.client.findUnique({
      where: { id: user.id },
      select: { tools_config: true },
    })

    if (!client?.tools_config || typeof client.tools_config !== "object") {
      return NextResponse.json({ error: "Sin configuración de catálogo" }, { status: 404 })
    }

    const config = client.tools_config as { catalog_source?: string; catalog_pdf_key?: string }
    if (config.catalog_source !== "pdf" || !config.catalog_pdf_key?.trim()) {
      return NextResponse.json({ error: "No hay catálogo en PDF configurado" }, { status: 404 })
    }

    const url = await getCatalogPdfSignedUrl(config.catalog_pdf_key, 3600) // 1 hora

    return NextResponse.json({ url })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al obtener la URL"
    console.error("Catalog signed-url error:", err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
