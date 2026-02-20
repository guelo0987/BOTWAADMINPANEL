import { NextResponse } from "next/server"
import prisma from "@/lib/db"
import { requireAdminAuth } from "@/lib/admin-auth-server"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminAuth()
    const { id } = await params
    const customerId = parseInt(id, 10)

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        client: { select: { business_name: true } },
        appointments: { orderBy: { start_time: "desc" } },
      },
    })

    if (!customer) {
      return NextResponse.json({ error: "Customer no encontrado" }, { status: 404 })
    }

    return NextResponse.json({ customer })
  } catch (error: unknown) {
    const status = error instanceof Error && error.message === "Unauthorized" ? 401 : 500
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error interno" },
      { status }
    )
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminAuth()
    const { id } = await params
    const customerId = parseInt(id, 10)
    const body = await req.json()

    const data: Record<string, unknown> = {}
    if (body.full_name !== undefined) data.full_name = body.full_name
    if (body.data !== undefined) data.data = body.data

    const customer = await prisma.customer.update({
      where: { id: customerId },
      data,
    })

    return NextResponse.json({ success: true, customer })
  } catch (error: unknown) {
    const status = error instanceof Error && error.message === "Unauthorized" ? 401 : 500
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error interno" },
      { status }
    )
  }
}
