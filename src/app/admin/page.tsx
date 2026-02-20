import prisma from "@/lib/db"
import { getAdminServerUser } from "@/lib/admin-auth-server"
import { redirect } from "next/navigation"
import { AdminDashboardClient } from "./dashboard-client"

export const dynamic = "force-dynamic"

export default async function AdminDashboardPage() {
  const user = await getAdminServerUser()
  if (!user) redirect("/admin/login")

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const weekAgo = new Date(today)
  weekAgo.setDate(weekAgo.getDate() - 7)

  const [
    totalClients,
    activeClients,
    totalCustomers,
    newCustomersWeek,
    totalAppointments,
    appointmentsToday,
    confirmedAppointments,
    clients,
  ] = await Promise.all([
    prisma.client.count(),
    prisma.client.count({ where: { is_active: true } }),
    prisma.customer.count(),
    prisma.customer.count({ where: { created_at: { gte: weekAgo } } }),
    prisma.appointment.count(),
    prisma.appointment.count({
      where: { start_time: { gte: today, lt: tomorrow } },
    }),
    prisma.appointment.count({ where: { status: "CONFIRMED" } }),
    prisma.client.findMany({
      select: {
        id: true,
        business_name: true,
        is_active: true,
        created_at: true,
        _count: { select: { customers: true, appointments: true } },
      },
      orderBy: { created_at: "desc" },
      take: 10,
    }),
  ])

  return (
    <AdminDashboardClient
      stats={{
        totalClients,
        activeClients,
        inactiveClients: totalClients - activeClients,
        totalCustomers,
        newCustomersWeek,
        totalAppointments,
        appointmentsToday,
        confirmedAppointments,
      }}
      topClients={clients.map((c) => ({
        id: c.id,
        business_name: c.business_name,
        is_active: c.is_active,
        customers_count: c._count.customers,
        appointments_count: c._count.appointments,
      }))}
    />
  )
}
