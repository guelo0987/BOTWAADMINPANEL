import { NextResponse } from "next/server"
import prisma from "@/lib/db"
import { getServerUser } from "@/lib/auth-server"

// GET - Obtener clientes del cliente autenticado
export async function GET(req: Request) {
    try {
        const user = await getServerUser()
        
        if (!user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            )
        }

        const customers = await prisma.customer.findMany({
            where: {
                client_id: user.id,
            },
            orderBy: {
                full_name: "asc",
            },
        })

        return NextResponse.json(
            customers.map((c) => ({
                id: c.id,
                client_id: c.client_id,
                phone_number: c.phone_number,
                full_name: c.full_name,
                data: c.data ?? {},
                created_at: c.created_at.toISOString(),
            }))
        )
    } catch (error: any) {
        console.error("Error fetching customers:", error)
        return NextResponse.json(
            { error: error.message || "Internal Server Error" },
            { status: 500 }
        )
    }
}
