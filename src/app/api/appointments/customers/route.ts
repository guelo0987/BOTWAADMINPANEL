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
            select: {
                id: true,
                full_name: true,
                phone_number: true,
            },
            orderBy: {
                full_name: "asc",
            },
        })

        return NextResponse.json(customers)
    } catch (error: any) {
        console.error("Error fetching customers:", error)
        return NextResponse.json(
            { error: error.message || "Internal Server Error" },
            { status: 500 }
        )
    }
}
