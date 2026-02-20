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
      include: {
        client: { select: { business_name: true } },
        _count: { select: { appointments: true } },
      },
      orderBy: { created_at: "desc" },
    })

    return NextResponse.json({
      customers: customers.map((c) => ({
        ...c,
        business_name: c.client.business_name,
        appointments_count: c._count.appointments,
        client: undefined,
        _count: undefined,
      })),
    })
  } catch (error: unknown) {
    const status = error instanceof Error && error.message === "Unauthorized" ? 401 : 500
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error interno" },
      { status }
    )
  }
}
