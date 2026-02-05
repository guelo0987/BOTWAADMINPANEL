import { NextResponse } from "next/server"
import { getServerUser } from "@/lib/auth-server"
import {
  getDashboardStats,
  getConversationsChartData,
  getAppointmentStatusData,
  getHourlyData,
} from "@/services/dashboard.service"

export async function GET() {
  try {
    const user = await getServerUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const clientId = user.id
    const [stats, conversationsChart, appointmentStatus, hourlyData] = await Promise.all([
      getDashboardStats(clientId),
      getConversationsChartData(clientId),
      getAppointmentStatusData(clientId),
      getHourlyData(clientId),
    ])
    return NextResponse.json({
      stats,
      conversationsChart,
      appointmentStatus,
      hourlyData,
    })
  } catch (error: unknown) {
    console.error("Error fetching dashboard stats:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    )
  }
}
