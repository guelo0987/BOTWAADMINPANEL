"use client"

import React, { useState, useEffect } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts"
import {
  BarChart3,
  Download,
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

// Extended mock data for analytics
const weeklyData = [
  { week: "Sem 1", conversations: 856, appointments: 124, customers: 45 },
  { week: "Sem 2", conversations: 923, appointments: 138, customers: 52 },
  { week: "Sem 3", conversations: 1045, appointments: 156, customers: 61 },
  { week: "Sem 4", conversations: 1182, appointments: 172, customers: 73 },
]

const monthlyData = [
  { month: "Ene", conversations: 3240, appointments: 456, customers: 180 },
  { month: "Feb", conversations: 3580, appointments: 512, customers: 205 },
  { month: "Mar", conversations: 4120, appointments: 598, customers: 242 },
  { month: "Abr", conversations: 3890, appointments: 545, customers: 218 },
  { month: "May", conversations: 4560, appointments: 634, customers: 267 },
  { month: "Jun", conversations: 4890, appointments: 689, customers: 298 },
]

const responseTimeData = [
  { hour: "00:00", avgTime: 2.3 },
  { hour: "04:00", avgTime: 1.8 },
  { hour: "08:00", avgTime: 3.2 },
  { hour: "12:00", avgTime: 4.1 },
  { hour: "16:00", avgTime: 3.8 },
  { hour: "20:00", avgTime: 2.9 },
]

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
  const [timeRange, setTimeRange] = useState("month")
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

  const chartData = timeRange === "week" ? weeklyData : monthlyData
  const xDataKey = timeRange === "week" ? "week" : "month"

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
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Periodo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Últimas 4 semanas</SelectItem>
              <SelectItem value="month">Últimos 6 meses</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
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
        <Card className="col-span-full">
          <CardHeader>
            <CardTitle>Actividad General</CardTitle>
            <CardDescription>
              Conversaciones, citas y nuevos clientes por periodo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                conversations: {
                  label: "Conversaciones",
                  color: COLORS.chart1,
                },
                appointments: {
                  label: "Citas",
                  color: COLORS.chart4,
                },
                customers: {
                  label: "Clientes",
                  color: COLORS.chart3,
                },
              }}
              className="h-[350px] w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ left: 0, right: 0 }}>
                  <defs>
                    <linearGradient id="colorConv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={COLORS.chart1} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={COLORS.chart1} stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="colorApt" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={COLORS.chart4} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={COLORS.chart4} stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis
                    dataKey={xDataKey}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="conversations"
                    stroke={COLORS.chart1}
                    strokeWidth={2}
                    fill="url(#colorConv)"
                    name="Conversaciones"
                  />
                  <Area
                    type="monotone"
                    dataKey="appointments"
                    stroke={COLORS.chart4}
                    strokeWidth={2}
                    fill="url(#colorApt)"
                    name="Citas"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Horarios Más Activos</CardTitle>
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

        <Card>
          <CardHeader>
            <CardTitle>Tiempo de Respuesta Promedio</CardTitle>
            <CardDescription>Por hora del día (segundos)</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                avgTime: {
                  label: "Tiempo (s)",
                  color: COLORS.chart3,
                },
              }}
              className="h-[300px] w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={responseTimeData} margin={{ left: 0, right: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis
                    dataKey="hour"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="avgTime"
                    stroke={COLORS.chart3}
                    strokeWidth={2}
                    dot={{ fill: COLORS.chart3 }}
                    name="Tiempo"
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Métricas de Rendimiento</CardTitle>
          <CardDescription>
            Indicadores clave del asistente virtual
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="p-4 rounded-lg border border-border">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                  <Bot className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tasa de Éxito</p>
                  <p className="text-2xl font-bold">98.5%</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Conversaciones resueltas automáticamente
              </p>
            </div>

            <div className="p-4 rounded-lg border border-border">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <MessageSquare className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Msgs/Conv</p>
                  <p className="text-2xl font-bold">7.2</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Promedio de mensajes por conversación
              </p>
            </div>

            <div className="p-4 rounded-lg border border-border">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                  <Calendar className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Conv. a Cita</p>
                  <p className="text-2xl font-bold">34%</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Tasa de conversión de conversación a cita
              </p>
            </div>

            <div className="p-4 rounded-lg border border-border">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                  <TrendingUp className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Escaladas</p>
                  <p className="text-2xl font-bold">1.5%</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Conversaciones escaladas a humano
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Insights */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Preguntas Más Frecuentes</CardTitle>
            <CardDescription>
              Temas más consultados por los clientes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { topic: "Disponibilidad de citas", count: 234, pct: 28 },
                { topic: "Precios de servicios", count: 198, pct: 24 },
                { topic: "Ubicación y horarios", count: 156, pct: 19 },
                { topic: "Cancelación/reagendamiento", count: 123, pct: 15 },
                { topic: "Métodos de pago", count: 89, pct: 11 },
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="w-8 text-sm font-medium text-muted-foreground">
                    #{index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{item.topic}</span>
                      <span className="text-sm text-muted-foreground">
                        {item.count}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${item.pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Servicios Más Solicitados</CardTitle>
            <CardDescription>
              Servicios con más citas agendadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { service: "Consulta General", count: 156, pct: 35 },
                { service: "Limpieza Dental", count: 134, pct: 30 },
                { service: "Ortodoncia", count: 89, pct: 20 },
                { service: "Extracción", count: 45, pct: 10 },
                { service: "Blanqueamiento", count: 22, pct: 5 },
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-4">
                  <Badge
                    variant="outline"
                    className="w-8 justify-center bg-primary/10 text-primary"
                  >
                    {index + 1}
                  </Badge>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{item.service}</span>
                      <span className="text-sm text-muted-foreground">
                        {item.count} citas
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-success rounded-full"
                        style={{ width: `${item.pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
