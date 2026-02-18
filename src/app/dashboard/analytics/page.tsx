"use client"

import React, { useState, useEffect } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts"
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  MessageSquare,
  Calendar,
  Clock,
  Bot,
} from "lucide-react"
import type { DashboardStats, ConversationChartData, AppointmentStatusData, HourlyData } from "@/types"

// Computed colors for Recharts
const COLORS = {
  primary: "#7c3aed",
  success: "#22c55e",
  destructive: "#ef4444",
  warning: "#f59e0b",
  chart1: "#7c3aed",
  chart2: "#a855f7",
  chart3: "#ec4899",
  chart4: "#22c55e",
}


function StatCard({
  title,
  value,
  change,
  trend,
  icon: Icon,
}: {
  title: string
  value: string | number
  change: number
  trend: "up" | "down"
  icon: React.ElementType
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold">{value}</p>
            <div
              className={`flex items-center gap-1 text-sm ${
                trend === "up" ? "text-success" : "text-destructive"
              }`}
            >
              {trend === "up" ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              {Math.abs(change)}% vs mes anterior
            </div>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [conversationsChart, setConversationsChart] = useState<ConversationChartData[]>([])
  const [appointmentStatus, setAppointmentStatus] = useState<AppointmentStatusData[]>([])
  const [hourlyData, setHourlyData] = useState<HourlyData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/dashboard/stats", { credentials: "include" })
        if (res.ok) {
          const data = await res.json()
          setStats(data.stats ?? null)
          setConversationsChart(data.conversationsChart ?? [])
          setAppointmentStatus(data.appointmentStatus ?? [])
          setHourlyData(data.hourlyData ?? [])
        }
      } catch {
        setStats(null)
        setConversationsChart([])
        setAppointmentStatus([])
        setHourlyData([])
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Analíticas</h1>
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analíticas</h1>
          <p className="text-muted-foreground">
            Reportes y estadísticas de tu asistente virtual
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Conversaciones"
          value={stats?.conversations_today ?? 0}
          change={stats?.conversations_change ?? 0}
          trend="up"
          icon={MessageSquare}
        />
        <StatCard
          title="Citas Agendadas"
          value={stats?.appointments_today ?? 0}
          change={stats?.appointments_change ?? 0}
          trend="up"
          icon={Calendar}
        />
        <StatCard
          title="Nuevos Clientes"
          value={stats?.customers_new ?? 0}
          change={0}
          trend="up"
          icon={Users}
        />
        <StatCard
          title="Tiempo de Respuesta"
          value={`${stats?.response_rate ?? 0}%`}
          change={0}
          trend="down"
          icon={Clock}
        />
      </div>

      {/* Main Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Conversaciones por día</CardTitle>
            <CardDescription>Últimos 7 días</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                conversations: {
                  label: "Conversaciones",
                  color: COLORS.chart1,
                },
              }}
              className="h-[300px] w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={conversationsChart} margin={{ left: 0, right: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar
                    dataKey="conversations"
                    fill={COLORS.chart1}
                    radius={[4, 4, 0, 0]}
                    name="Conversaciones"
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Horarios más activos</CardTitle>
            <CardDescription>Citas agendadas por hora del día</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                appointments: {
                  label: "Citas",
                  color: COLORS.chart2,
                },
              }}
              className="h-[300px] w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlyData} margin={{ left: 0, right: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis
                    dataKey="hour"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar
                    dataKey="appointments"
                    fill={COLORS.chart2}
                    radius={[4, 4, 0, 0]}
                    name="Citas"
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Estado de citas */}
      {appointmentStatus.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Estado de citas</CardTitle>
            <CardDescription>Distribución por estado</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              {appointmentStatus.map((item) => (
                <div key={item.status} className="flex items-center gap-3">
                  <div
                    className="h-4 w-4 rounded-full"
                    style={{ backgroundColor: item.fill }}
                  />
                  <span className="text-sm font-medium">{item.status}</span>
                  <span className="text-sm text-muted-foreground">{item.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
