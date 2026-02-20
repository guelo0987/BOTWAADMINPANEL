import { NextResponse } from "next/server"
import prisma from "@/lib/db"
import { getServerUser } from "@/lib/auth-server"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getServerUser()
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { id } = await params
    const customerId = parseInt(id, 10)

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    })
    if (!customer || customer.client_id !== user.id) {
      return NextResponse.json({ error: "Customer no encontrado" }, { status: 404 })
    }

    const body = await req.json()
    const data: Record<string, unknown> = {}
    if (body.full_name !== undefined) data.full_name = body.full_name
    if (body.data !== undefined) data.data = body.data

    const updated = await prisma.customer.update({
      where: { id: customerId },
      data,
    })

    return NextResponse.json({ success: true, customer: updated })
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error interno" },
      { status: 500 }
    )
  }
}
