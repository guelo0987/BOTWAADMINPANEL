"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Calendar as CalendarIcon,
  Search,
  Plus,
  Clock,
  Phone,
  FileText,
  Edit,
  CheckCircle,
  XCircle,
  AlertCircle,
  AlignJustify,
  LayoutGrid,
  Check,
  UserX,
  Ban,
  RefreshCw,
  Loader2,
  Sun,
  ChevronRight,
} from "lucide-react"
import type { Appointment } from "@/types"
import { getAllAppointments } from "@/services/appointment.service"
import {
  format,
  isSameDay,
  isToday,
  isTomorrow,
  isBefore,
  startOfDay,
} from "date-fns"
import { es } from "date-fns/locale"

// ─── Types & Config ───────────────────────────────────────────────────────────

type AppointmentStatus = "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW"

const statusConfig: Record<
  AppointmentStatus,
  { label: string; color: string; accent: string; icon: React.ElementType }
> = {
  CONFIRMED: {
    label: "Confirmada",
    color: "bg-primary/10 text-primary border-primary/20",
    accent: "bg-primary",
    icon: CheckCircle,
  },
  COMPLETED: {
    label: "Completada",
    color: "bg-green-500/10 text-green-600 border-green-500/20",
    accent: "bg-green-500",
    icon: CheckCircle,
  },
  CANCELLED: {
    label: "Cancelada",
    color: "bg-destructive/10 text-destructive border-destructive/20",
    accent: "bg-destructive",
    icon: XCircle,
  },
  NO_SHOW: {
    label: "No Asistió",
    color: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    accent: "bg-amber-500",
    icon: AlertCircle,
  },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string | null | undefined) {
  if (!name) return "?"
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

function getDuration(start: string, end: string) {
  const mins = Math.round(
    (new Date(end).getTime() - new Date(start).getTime()) / 60000
  )
  if (mins < 60) return `${mins} min`
  const h = mins / 60
  return Number.isInteger(h) ? `${h}h` : `${h.toFixed(1)}h`
}

function formatGroupHeader(dateStr: string): { label: string; highlight: boolean } {
  const date = new Date(dateStr + "T12:00:00")
  if (isToday(date)) {
    return {
      label: `Hoy · ${format(date, "EEEE d 'de' MMMM", { locale: es })}`,
      highlight: true,
    }
  }
  if (isTomorrow(date)) {
    return {
      label: `Mañana · ${format(date, "d 'de' MMMM", { locale: es })}`,
      highlight: false,
    }
  }
  return {
    label: format(date, "EEEE d 'de' MMMM yyyy", { locale: es }),
    highlight: false,
  }
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  colorClass,
  bgClass,
}: {
  icon: React.ElementType
  label: string
  value: number
  colorClass: string
  bgClass: string
}) {
  return (
    <Card>
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <div
            className={`flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg ${bgClass}`}
          >
            <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${colorClass}`} />
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-bold leading-none">{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Rich agenda card ─────────────────────────────────────────────────────────

function AgendaCard({
  appointment,
  onEdit,
  onStatusChange,
}: {
  appointment: Appointment
  onEdit: () => void
  onStatusChange: (id: number, status: AppointmentStatus) => void
}) {
  const config = statusConfig[appointment.status as AppointmentStatus] ?? statusConfig.CONFIRMED
  const StatusIcon = config.icon
  const initials = getInitials(appointment.customer?.full_name)
  const duration = getDuration(appointment.start_time, appointment.end_time)
  const isPast =
    isBefore(new Date(appointment.end_time), startOfDay(new Date())) &&
    appointment.status === "CONFIRMED"

  return (
    <div
      className={`relative flex items-start gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl border bg-card transition-all hover:shadow-sm ${
        isPast ? "opacity-60" : ""
      }`}
    >
      {/* Left accent bar */}
      <div
        className={`absolute left-0 top-3 bottom-3 w-[3px] rounded-full ${config.accent}`}
      />

      {/* Avatar */}
      <div className="ml-2 flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-xs sm:text-sm select-none">
        {initials}
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Name + status badge */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-semibold text-sm leading-tight">
              {appointment.customer?.full_name || "Sin nombre"}
            </p>
            {appointment.customer?.phone_number && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <Phone className="h-3 w-3" />
                {appointment.customer.phone_number}
              </p>
            )}
          </div>
          <Badge
            variant="outline"
            className={`text-xs shrink-0 ${config.color}`}
          >
            <StatusIcon className="h-3 w-3 mr-1" />
            {config.label}
          </Badge>
        </div>

        {/* Time + duration */}
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            {format(new Date(appointment.start_time), "HH:mm")} –{" "}
            {format(new Date(appointment.end_time), "HH:mm")}
          </span>
          <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
            {duration}
          </span>
        </div>

        {/* Price + Notes */}
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {appointment.total_price != null && (
            <span className="text-xs font-semibold text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
              ${appointment.total_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          )}
          {appointment.notes && (
            <p className="text-xs text-muted-foreground flex items-start gap-1 line-clamp-1">
              <FileText className="h-3 w-3 mt-0.5 shrink-0" />
              {appointment.notes}
            </p>
          )}
        </div>

        {/* Quick actions — only for CONFIRMED */}
        {appointment.status === "CONFIRMED" && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs px-2 text-green-600 border-green-200 hover:bg-green-50 hover:border-green-300"
              onClick={() => onStatusChange(appointment.id, "COMPLETED")}
            >
              <Check className="h-3 w-3 sm:mr-1" />
              <span className="hidden sm:inline">Completar</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs px-2 text-amber-600 border-amber-200 hover:bg-amber-50 hover:border-amber-300"
              onClick={() => onStatusChange(appointment.id, "NO_SHOW")}
            >
              <UserX className="h-3 w-3 sm:mr-1" />
              <span className="hidden sm:inline">No Asistió</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs px-2 text-destructive border-destructive/20 hover:bg-destructive/5"
              onClick={() => onStatusChange(appointment.id, "CANCELLED")}
            >
              <Ban className="h-3 w-3 sm:mr-1" />
              <span className="hidden sm:inline">Cancelar</span>
            </Button>
          </div>
        )}
      </div>

      {/* Edit button */}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0"
        onClick={onEdit}
      >
        <Edit className="h-4 w-4" />
      </Button>
    </div>
  )
}

// ─── Agenda view ──────────────────────────────────────────────────────────────

function AgendaView({
  appointments,
  onEdit,
  onStatusChange,
}: {
  appointments: Appointment[]
  onEdit: (apt: Appointment) => void
  onStatusChange: (id: number, status: AppointmentStatus) => void
}) {
  if (appointments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <CalendarIcon className="h-12 w-12 text-muted-foreground/40 mb-4" />
        <p className="font-medium text-muted-foreground">No hay citas</p>
        <p className="text-sm text-muted-foreground mt-1">
          No se encontraron citas con los filtros actuales
        </p>
      </div>
    )
  }

  // Group by date key
  const grouped: Record<string, Appointment[]> = {}
  for (const apt of appointments) {
    const key = format(new Date(apt.start_time), "yyyy-MM-dd")
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(apt)
  }
  const sortedKeys = Object.keys(grouped).sort()

  return (
    <div className="space-y-6">
      {sortedKeys.map((dateKey) => {
        const { label, highlight } = formatGroupHeader(dateKey)
        const dayApts = grouped[dateKey].sort(
          (a, b) =>
            new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
        )
        return (
          <div key={dateKey}>
            {/* Date header */}
            <div
              className={`flex items-center gap-2 mb-3 ${
                highlight ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {highlight && <Sun className="h-4 w-4 shrink-0" />}
              <h3
                className={`text-sm font-semibold capitalize ${
                  highlight ? "text-primary" : ""
                }`}
              >
                {label}
              </h3>
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs tabular-nums">{dayApts.length}</span>
            </div>

            {/* Appointment cards */}
            <div className="space-y-2">
              {dayApts.map((apt) => (
                <AgendaCard
                  key={apt.id}
                  appointment={apt}
                  onEdit={() => onEdit(apt)}
                  onStatusChange={onStatusChange}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Calendar view ────────────────────────────────────────────────────────────

function CalendarView({
  appointments,
  selectedDate,
  onSelectDate,
  onEdit,
  onStatusChange,
}: {
  appointments: Appointment[]
  selectedDate: Date
  onSelectDate: (date: Date) => void
  onEdit: (apt: Appointment) => void
  onStatusChange: (id: number, status: AppointmentStatus) => void
}) {
  const daysWithAppointments = appointments.map((apt) => new Date(apt.start_time))
  const dayApts = appointments
    .filter((apt) => isSameDay(new Date(apt.start_time), selectedDate))
    .sort(
      (a, b) =>
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    )

  return (
    <div className="grid gap-4 lg:grid-cols-[320px,1fr]">
      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={(date) => date && onSelectDate(date)}
        modifiers={{ hasAppointment: daysWithAppointments }}
        modifiersClassNames={{ hasAppointment: "bg-primary/20 font-bold" }}
        className="rounded-xl border w-full"
      />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-primary" />
            <span className="capitalize">
              {format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}
            </span>
            {isToday(selectedDate) && (
              <Badge className="bg-primary/10 text-primary border-0 text-xs">
                Hoy
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[380px] pr-2">
            {dayApts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CalendarIcon className="h-10 w-10 text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground">
                  No hay citas para este día
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {dayApts.map((apt) => (
                  <AgendaCard
                    key={apt.id}
                    appointment={apt}
                    onEdit={() => onEdit(apt)}
                    onStatusChange={onStatusChange}
                  />
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Appointment dialog ───────────────────────────────────────────────────────

function AppointmentDialog({
  appointment,
  open,
  onClose,
  mode,
  onSuccess,
}: {
  appointment: Appointment | null
  open: boolean
  onClose: () => void
  mode: "view" | "edit" | "create"
  onSuccess?: () => void
}) {
  const [selectedCustomer, setSelectedCustomer] = useState(
    appointment?.customer_id?.toString() || ""
  )
  const [selectedDate, setSelectedDate] = useState(
    appointment ? new Date(appointment.start_time) : new Date()
  )
  const [selectedTime, setSelectedTime] = useState(
    appointment
      ? format(new Date(appointment.start_time), "HH:mm")
      : "09:00"
  )
  const [duration, setDuration] = useState(
    appointment
      ? Math.round(
          (new Date(appointment.end_time).getTime() -
            new Date(appointment.start_time).getTime()) /
            (1000 * 60)
        )
      : 30
  )
  const [notes, setNotes] = useState(appointment?.notes || "")
  const [customers, setCustomers] = useState<
    Array<{ id: number; full_name: string | null; phone_number: string }>
  >([])
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (appointment) {
      setSelectedCustomer(appointment.customer_id?.toString() || "")
      setSelectedDate(new Date(appointment.start_time))
      setSelectedTime(format(new Date(appointment.start_time), "HH:mm"))
      setDuration(
        Math.round(
          (new Date(appointment.end_time).getTime() -
            new Date(appointment.start_time).getTime()) /
            (1000 * 60)
        )
      )
      setNotes(appointment.notes || "")
    } else {
      setSelectedCustomer("")
      setSelectedDate(new Date())
      setSelectedTime("09:00")
      setDuration(30)
      setNotes("")
    }
  }, [appointment])

  useEffect(() => {
    if (open && (mode === "create" || mode === "edit")) {
      loadCustomers()
    }
  }, [open, mode])

  const loadCustomers = async () => {
    try {
      setIsLoadingCustomers(true)
      const response = await fetch("/api/appointments/customers")
      if (!response.ok) throw new Error("Failed to load customers")
      const data = await response.json()
      setCustomers(data)
    } catch (error) {
      console.error("Error loading customers:", error)
    } finally {
      setIsLoadingCustomers(false)
    }
  }

  const handleSave = async () => {
    if (!selectedCustomer || !selectedDate || !selectedTime) return

    try {
      setIsSaving(true)

      const [hours, minutes] = selectedTime.split(":").map(Number)
      const startTime = new Date(selectedDate)
      startTime.setHours(hours, minutes, 0, 0)

      const endTime = new Date(startTime)
      endTime.setMinutes(endTime.getMinutes() + duration)

      const appointmentData = {
        customer_id: parseInt(selectedCustomer),
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        notes: notes || null,
      }

      let response
      if (mode === "create") {
        response = await fetch("/api/appointments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(appointmentData),
        })
      } else if (mode === "edit" && appointment) {
        response = await fetch(`/api/appointments/${appointment.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(appointmentData),
        })
      }

      if (!response?.ok) {
        const error = await response?.json()
        throw new Error(error?.error || "Failed to save appointment")
      }

      toast.success(
        mode === "create" ? "Cita creada exitosamente" : "Cita actualizada"
      )
      onSuccess?.()
      onClose()
    } catch (error: any) {
      console.error("Error saving appointment:", error)
      toast.error(error.message || "Error al guardar la cita")
    } finally {
      setIsSaving(false)
    }
  }

  const title =
    mode === "create"
      ? "Nueva Cita"
      : mode === "edit"
      ? "Editar Cita"
      : "Detalles de la Cita"

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Crea una nueva cita manualmente"
              : mode === "edit"
              ? "Modifica los detalles de la cita"
              : "Información de la cita"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Cliente</Label>
            <Select
              value={selectedCustomer}
              onValueChange={setSelectedCustomer}
              disabled={mode === "view" || isLoadingCustomers}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    isLoadingCustomers
                      ? "Cargando clientes..."
                      : "Seleccionar cliente"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id.toString()}>
                    {customer.full_name || "Sin nombre"} — {customer.phone_number}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Fecha</Label>
            <div className="border rounded-md p-2 flex justify-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                disabled={mode === "view"}
              />
            </div>
          </div>

          <div className="grid gap-4 grid-cols-2">
            <div className="space-y-2">
              <Label>Hora de Inicio</Label>
              <Select
                value={selectedTime}
                onValueChange={setSelectedTime}
                disabled={mode === "view"}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar hora" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 20 }, (_, i) => {
                    const hour = Math.floor(i / 2) + 8
                    const minute = (i % 2) * 30
                    const time = `${hour.toString().padStart(2, "0")}:${minute
                      .toString()
                      .padStart(2, "0")}`
                    return (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Duración</Label>
              <Select
                value={duration.toString()}
                onValueChange={(v) => setDuration(Number(v))}
                disabled={mode === "view"}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 min</SelectItem>
                  <SelectItem value="30">30 min</SelectItem>
                  <SelectItem value="45">45 min</SelectItem>
                  <SelectItem value="60">1 hora</SelectItem>
                  <SelectItem value="90">1.5 horas</SelectItem>
                  <SelectItem value="120">2 horas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notas</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Motivo de la cita, observaciones..."
              disabled={mode === "view"}
              rows={3}
            />
          </div>

          {appointment?.total_price != null && (
            <div className="space-y-2">
              <Label>Precio</Label>
              <p className="text-sm font-semibold text-green-600">
                ${appointment.total_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            {mode === "view" ? "Cerrar" : "Cancelar"}
          </Button>
          {mode !== "view" && (
            <Button
              onClick={handleSave}
              disabled={isSaving || !selectedCustomer}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : mode === "create" ? (
                "Crear Cita"
              ) : (
                "Guardar Cambios"
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AppointmentsPage() {
  const { user } = useAuth()
  const [view, setView] = useState<"agenda" | "calendar">("agenda")
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<"view" | "edit" | "create">(
    "create"
  )
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const loadAppointments = useCallback(
    async (silent = false) => {
      if (!user?.id) return
      if (!silent) setIsLoading(true)
      else setIsRefreshing(true)
      try {
        const data = await getAllAppointments(user.id)
        setAppointments(data)
      } catch {
        toast.error("Error al cargar las citas")
      } finally {
        if (!silent) setIsLoading(false)
        else setIsRefreshing(false)
      }
    },
    [user?.id]
  )

  useEffect(() => {
    loadAppointments()
  }, [loadAppointments])

  const handleStatusChange = async (
    id: number,
    newStatus: AppointmentStatus
  ) => {
    // Optimistic update
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a))
    )
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error()
      const labels: Record<string, string> = {
        COMPLETED: "marcada como completada",
        CANCELLED: "cancelada",
        NO_SHOW: "marcada como no asistió",
      }
      toast.success(`Cita ${labels[newStatus] ?? "actualizada"}`)
    } catch {
      await loadAppointments(true)
      toast.error("Error al actualizar la cita")
    }
  }

  const handleCreateAppointment = () => {
    setSelectedAppointment(null)
    setDialogMode("create")
    setDialogOpen(true)
  }

  const handleEditAppointment = (appointment: Appointment) => {
    setSelectedAppointment(appointment)
    setDialogMode("edit")
    setDialogOpen(true)
  }

  const filteredAppointments = appointments.filter((apt) => {
    const term = search.toLowerCase()
    const matchesSearch =
      apt.customer?.full_name?.toLowerCase().includes(term) ||
      apt.notes?.toLowerCase().includes(term) ||
      apt.customer?.phone_number?.includes(search)
    const matchesStatus =
      statusFilter === "all" || apt.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Today's confirmed appointments (from all appointments, not filtered)
  const todayConfirmed = appointments
    .filter(
      (a) => a.status === "CONFIRMED" && isToday(new Date(a.start_time))
    )
    .sort(
      (a, b) =>
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    )

  const stats = {
    confirmed: appointments.filter((a) => a.status === "CONFIRMED").length,
    completed: appointments.filter((a) => a.status === "COMPLETED").length,
    cancelled: appointments.filter((a) => a.status === "CANCELLED").length,
    noShow: appointments.filter((a) => a.status === "NO_SHOW").length,
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-7 w-24 bg-muted rounded animate-pulse" />
            <div className="h-4 w-52 bg-muted rounded animate-pulse mt-2" />
          </div>
        </div>
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Citas</h1>
          <p className="text-sm text-muted-foreground">
            Gestiona las citas de tus clientes
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => loadAppointments(true)}
            disabled={isRefreshing}
            title="Actualizar"
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
          </Button>
          <Button onClick={handleCreateAppointment}>
            <Plus className="h-4 w-4 mr-1.5" />
            <span className="hidden sm:inline">Nueva Cita</span>
            <span className="sm:hidden">Nueva</span>
          </Button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
        <StatCard
          icon={CheckCircle}
          label="Confirmadas"
          value={stats.confirmed}
          colorClass="text-primary"
          bgClass="bg-primary/10"
        />
        <StatCard
          icon={CheckCircle}
          label="Completadas"
          value={stats.completed}
          colorClass="text-green-600"
          bgClass="bg-green-500/10"
        />
        <StatCard
          icon={XCircle}
          label="Canceladas"
          value={stats.cancelled}
          colorClass="text-destructive"
          bgClass="bg-destructive/10"
        />
        <StatCard
          icon={AlertCircle}
          label="No Asistió"
          value={stats.noShow}
          colorClass="text-amber-600"
          bgClass="bg-amber-500/10"
        />
      </div>

      {/* ── Today spotlight ── */}
      {todayConfirmed.length > 0 && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Sun className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-primary">
              Hoy · {format(new Date(), "d 'de' MMMM", { locale: es })}
            </h2>
            <Badge className="bg-primary/15 text-primary border-0 text-xs ml-auto">
              {todayConfirmed.length} confirmada
              {todayConfirmed.length !== 1 ? "s" : ""}
            </Badge>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {todayConfirmed.map((apt) => (
              <button
                key={apt.id}
                onClick={() => handleEditAppointment(apt)}
                className="flex items-center gap-2 p-2.5 rounded-lg bg-background border text-left hover:shadow-sm transition-all group"
              >
                <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate">
                    {apt.customer?.full_name || "Sin nombre"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(apt.start_time), "HH:mm")} ·{" "}
                    {getDuration(apt.start_time, apt.end_time)}
                  </p>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Controls ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar cliente, teléfono o notas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="sm:w-[160px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="CONFIRMED">Confirmadas</SelectItem>
            <SelectItem value="COMPLETED">Completadas</SelectItem>
            <SelectItem value="CANCELLED">Canceladas</SelectItem>
            <SelectItem value="NO_SHOW">No Asistió</SelectItem>
          </SelectContent>
        </Select>

        {/* View toggle */}
        <div className="flex rounded-lg border overflow-hidden self-start">
          <button
            onClick={() => setView("agenda")}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors ${
              view === "agenda"
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted text-muted-foreground"
            }`}
          >
            <AlignJustify className="h-4 w-4" />
            <span className="hidden sm:inline">Agenda</span>
          </button>
          <button
            onClick={() => setView("calendar")}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors ${
              view === "calendar"
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted text-muted-foreground"
            }`}
          >
            <LayoutGrid className="h-4 w-4" />
            <span className="hidden sm:inline">Calendario</span>
          </button>
        </div>
      </div>

      {/* ── Content ── */}
      {view === "agenda" ? (
        <AgendaView
          appointments={filteredAppointments}
          onEdit={handleEditAppointment}
          onStatusChange={handleStatusChange}
        />
      ) : (
        <CalendarView
          appointments={filteredAppointments}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          onEdit={handleEditAppointment}
          onStatusChange={handleStatusChange}
        />
      )}

      {/* ── Dialog ── */}
      <AppointmentDialog
        appointment={selectedAppointment}
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        mode={dialogMode}
        onSuccess={() => loadAppointments(true)}
      />
    </div>
  )
}
