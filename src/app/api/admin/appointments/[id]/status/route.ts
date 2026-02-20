import { NextResponse } from "next/server"
import prisma from "@/lib/db"
import { requireAdminAuth } from "@/lib/admin-auth-server"

const VALID_STATUSES = ["CONFIRMED", "COMPLETED", "CANCELLED", "NO_SHOW"]

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminAuth()
    const { id } = await params
    const appointmentId = parseInt(id, 10)
    const body = await req.json()

    if (!body.status || !VALID_STATUSES.includes(body.status)) {
      return NextResponse.json(
        { error: `Status debe ser uno de: ${VALID_STATUSES.join(", ")}` },
        { status: 400 }
      )
    }

    const appointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: body.status },
    })

    return NextResponse.json({ success: true, appointment })
  } catch (error: unknown) {
    const status = error instanceof Error && error.message === "Unauthorized" ? 401 : 500
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error interno" },
      { status }
    )
  }
}
