import { NextResponse } from "next/server"
import prisma from "@/lib/db"
import { requireAdminAuth } from "@/lib/admin-auth-server"

export async function GET(req: Request) {
  try {
    await requireAdminAuth()

    const { searchParams } = new URL(req.url)
    const clientId = searchParams.get("client_id")
    const status = searchParams.get("status")
    const date = searchParams.get("date")

    const where: Record<string, unknown> = {}
    if (clientId) where.client_id = parseInt(clientId, 10)
    if (status) where.status = status

    if (date) {
      const dayStart = new Date(date)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(dayStart)
      dayEnd.setDate(dayEnd.getDate() + 1)
      where.start_time = { gte: dayStart, lt: dayEnd }
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        customer: { select: { full_name: true, phone_number: true } },
        client: { select: { business_name: true } },
      },
      orderBy: { start_time: "desc" },
    })

    return NextResponse.json({
      appointments: appointments.map((a) => ({
        ...a,
        customer_name: a.customer.full_name,
        customer_phone: a.customer.phone_number,
        business_name: a.client.business_name,
        customer: undefined,
        client: undefined,
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
