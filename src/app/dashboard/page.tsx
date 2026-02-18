import React from "react"
import Link from "next/link"
import {
  MetricCard,
  ConversationsChart,
  AppointmentStatusChart,
  HourlyChart,
  RecentConversations,
  UpcomingAppointments
} from "@/components/dashboard/dashboard-widgets"
import { Users, TrendingUp, MessageSquare, Calendar, Bot, ArrowRight } from "lucide-react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getDashboardStats, getConversationsChartData, getAppointmentStatusData, getHourlyData } from "@/services/dashboard.service"
import { getRecentConversations } from "@/services/conversation.service"
import { getUpcomingAppointments } from "@/services/appointment.service"
import { getServerUser } from "@/lib/auth-server"
import { redirect } from "next/navigation"

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  // Obtener usuario autenticado
  const user = await getServerUser()
  
  if (!user) {
    redirect("/login")
  }

  const clientId = user.id

  const [
    stats,
    conversationsChart,
    appointmentStatus,
    hourlyData,
    recentConversations,
    upcomingAppointments
  ] = await Promise.all([
    getDashboardStats(clientId),
    getConversationsChartData(clientId),
    getAppointmentStatusData(clientId),
    getHourlyData(clientId),
    getRecentConversations(clientId),
    getUpcomingAppointments(clientId)
  ])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Resumen de actividad de tu asistente virtual
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/conversations">
              <MessageSquare className="h-4 w-4 mr-2" />
              Conversaciones
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/appointments">
              <Calendar className="h-4 w-4 mr-2" />
              Citas
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/bot-config">
              <Bot className="h-4 w-4 mr-2" />
              Configurar Bot
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Conversaciones Hoy"
          value={stats.conversations_today}
          change={stats.conversations_change}
          icon="MessageSquare"
          trend="up"
        />
        <MetricCard
          title="Citas Agendadas Hoy"
          value={stats.appointments_today}
          change={stats.appointments_change}
          icon="Calendar"
          trend="up"
        />
        <MetricCard
          title="Citas Pendientes"
          value={stats.pending_appointments}
          icon="Clock"
          trend="neutral"
        />
        <MetricCard
          title="Tasa de Respuesta"
          value={`${stats.response_rate}%`}
          icon="CheckCircle2"
          trend="up"
          change={2}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid gap-4 lg:grid-cols-3">
        <ConversationsChart data={conversationsChart} />
        <AppointmentStatusChart data={appointmentStatus} />
      </div>

      {/* Second Row */}
      <div className="grid gap-4 lg:grid-cols-3">
        <RecentConversations conversations={recentConversations} />
        <UpcomingAppointments appointments={upcomingAppointments} />
      </div>

      {/* Third Row */}
      <div className="grid gap-4 lg:grid-cols-2">
        <HourlyChart data={hourlyData} />
        <Card>
          <CardHeader>
            <CardTitle>Clientes</CardTitle>
            <CardDescription>Resumen de clientes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {stats.customers_total.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">Clientes totales</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-green-600 flex items-center gap-1">
                  <TrendingUp className="h-4 w-4" />+{stats.customers_new}
                </p>
                <p className="text-sm text-muted-foreground">Nuevos esta semana</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
