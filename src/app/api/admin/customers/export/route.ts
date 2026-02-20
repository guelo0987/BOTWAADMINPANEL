import { NextResponse } from "next/server"
import prisma from "@/lib/db"
import { requireAdminAuth } from "@/lib/admin-auth-server"

export async function GET(req: Request) {
  try {
    await requireAdminAuth()

    const { searchParams } = new URL(req.url)
    const clientId = searchParams.get("client_id")

    const where = clientId ? { client_id: parseInt(clientId, 10) } : {}

    const customers = await prisma.customer.findMany({
      where,
      include: { client: { select: { business_name: true } } },
      orderBy: { created_at: "desc" },
    })

    const header = "ID,Negocio,Nombre,Teléfono,Email,Fecha Registro\n"
    const rows = customers
      .map((c) => {
        const data = (c.data as Record<string, unknown>) || {}
        const email = String(data.email || "")
        return `${c.id},"${c.client.business_name}","${c.full_name || ""}","${c.phone_number}","${email}","${c.created_at.toISOString()}"`
      })
      .join("\n")

    const csv = header + rows

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="customers_${new Date().toISOString().split("T")[0]}.csv"`,
      },
    })
  } catch (error: unknown) {
    const status = error instanceof Error && error.message === "Unauthorized" ? 401 : 500
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error interno" },
      { status }
    )
  }
}
