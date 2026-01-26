"use client"

import React from "react"
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
    Area,
    AreaChart,
    Bar,
    BarChart,
    Cell,
    Pie,
    PieChart,
    XAxis,
    YAxis,
    CartesianGrid,
    ResponsiveContainer,
} from "recharts"
import { Badge } from "@/components/ui/badge"
import { Clock, MessageSquare, Calendar, CheckCircle2, type LucideIcon } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { Appointment, Conversation, ConversationChartData, AppointmentStatusData, HourlyData } from "@/types"

// Icon mapping for MetricCard
const iconMap: Record<string, LucideIcon> = {
    MessageSquare,
    Calendar,
    Clock,
    CheckCircle2,
}

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

export function MetricCard({
    title,
    value,
    change,
    icon,
    trend = "up",
}: {
    title: string
    value: string | number
    change?: number
    icon: string
    trend?: "up" | "down" | "neutral"
}) {
    const Icon = iconMap[icon] || Clock
    
    return (
        <Card>
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">{title}</p>
                        <p className="text-3xl font-bold">{value}</p>
                        {change !== undefined && (
                            <p
                                className={`text-sm flex items-center gap-1 ${trend === "up"
                                        ? "text-green-600"
                                        : trend === "down"
                                            ? "text-destructive"
                                            : "text-muted-foreground"
                                    }`}
                            >
                                {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"}
                                {Math.abs(change)}% vs ayer
                            </p>
                        )}
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                        <Icon className="h-6 w-6 text-primary" />
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

export function ConversationsChart({ data }: { data: ConversationChartData[] }) {
    return (
        <Card className="col-span-full lg:col-span-2">
            <CardHeader>
                <CardTitle>Conversaciones</CardTitle>
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
                        <AreaChart data={data} margin={{ left: 0, right: 0 }}>
                            <defs>
                                <linearGradient id="conversationsGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={COLORS.chart1} stopOpacity={0.3} />
                                    <stop offset="100%" stopColor={COLORS.chart1} stopOpacity={0.05} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                            <XAxis
                                dataKey="date"
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
                                fill="url(#conversationsGradient)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}

export function AppointmentStatusChart({ data }: { data: AppointmentStatusData[] }) {
    const chartData = data.map((item) => ({
        ...item,
        fill:
            item.status === "Confirmadas"
                ? COLORS.chart1
                : item.status === "Completadas"
                    ? COLORS.success
                    : item.status === "Canceladas"
                        ? COLORS.destructive
                        : COLORS.warning,
    }))

    return (
        <Card>
            <CardHeader>
                <CardTitle>Estado de Citas</CardTitle>
                <CardDescription>Distribución actual</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer
                    config={{
                        count: {
                            label: "Cantidad",
                        },
                    }}
                    className="h-[300px] w-full"
                >
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <ChartTooltip content={<ChartTooltipContent nameKey="status" />} />
                            <Pie
                                data={chartData}
                                dataKey="count"
                                nameKey="status"
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                paddingAngle={2}
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                </ChartContainer>
                <div className="mt-4 grid grid-cols-2 gap-2">
                    {chartData.map((item) => (
                        <div key={item.status} className="flex items-center gap-2">
                            <div
                                className="h-3 w-3 rounded-full"
                                style={{ backgroundColor: item.fill }}
                            />
                            <span className="text-xs text-muted-foreground">{item.status}</span>
                            <span className="text-xs font-medium ml-auto">{item.count}</span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}

export function HourlyChart({ data }: { data: HourlyData[] }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Horarios Populares</CardTitle>
                <CardDescription>Citas por hora</CardDescription>
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
                        <BarChart data={data} margin={{ left: 0, right: 0 }}>
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
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}

export function RecentConversations({ conversations }: { conversations: Conversation[] }) {
    const statusColors = {
        active: "bg-green-500/10 text-green-600 border-green-500/20",
        resolved: "bg-muted text-muted-foreground border-border",
        escalated: "bg-destructive/10 text-destructive border-destructive/20",
    }

    const statusLabels = {
        active: "Activa",
        resolved: "Resuelta",
        escalated: "Escalada",
    }

    return (
        <Card className="col-span-full lg:col-span-2">
            <CardHeader>
                <CardTitle>Conversaciones Recientes</CardTitle>
                <CardDescription>Últimas interacciones con clientes</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {conversations.map((conversation) => (
                        <div
                            key={conversation.id}
                            className="flex items-center gap-4 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                        >
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                                {conversation.customer_name
                                    ? conversation.customer_name
                                        .split(" ")
                                        .map((n) => n[0])
                                        .join("")
                                        .slice(0, 2)
                                    : "?"}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <p className="font-medium text-sm truncate">
                                        {conversation.customer_name || conversation.phone_number}
                                    </p>
                                    <Badge
                                        variant="outline"
                                        className={`text-xs ${statusColors[conversation.status]}`}
                                    >
                                        {statusLabels[conversation.status]}
                                    </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground truncate">
                                    {conversation.last_message}
                                </p>
                            </div>
                            <div className="text-xs text-muted-foreground whitespace-nowrap">
                                {conversation.last_message_at ? (
                                    formatDistanceToNow(new Date(conversation.last_message_at), {
                                        addSuffix: true,
                                        locale: es,
                                    })
                                ) : (
                                    "Sin mensajes"
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}

export function UpcomingAppointments({ appointments }: { appointments: Appointment[] }) {
    const statusColors = {
        CONFIRMED: "bg-primary/10 text-primary border-primary/20",
        COMPLETED: "bg-green-500/10 text-green-600 border-green-500/20",
        CANCELLED: "bg-destructive/10 text-destructive border-destructive/20",
        NO_SHOW: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    }

    const statusLabels = {
        CONFIRMED: "Confirmada",
        COMPLETED: "Completada",
        CANCELLED: "Cancelada",
        NO_SHOW: "No Asistió",
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Próximas Citas</CardTitle>
                <CardDescription>Citas programadas</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {appointments.map((appointment) => (
                        <div
                            key={appointment.id}
                            className="flex items-center gap-3 p-3 rounded-lg border border-border"
                        >
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                <Clock className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">
                                    {appointment.customer?.full_name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {new Date(appointment.start_time).toLocaleDateString("es-ES", {
                                        weekday: "short",
                                        day: "numeric",
                                        month: "short",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })}
                                </p>
                            </div>
                            <Badge
                                variant="outline"
                                className={`text-xs ${statusColors[appointment.status]}`}
                            >
                                {statusLabels[appointment.status]}
                            </Badge>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
