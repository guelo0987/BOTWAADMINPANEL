"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  User,
  Phone,
  FileText,
  Edit,
  X,
  CheckCircle,
  XCircle,
  AlertCircle,
  List,
  LayoutGrid,
} from "lucide-react"
import { mockAppointments, mockCustomers } from "@/lib/mock-data"
import type { Appointment } from "@/types"
import { getAllAppointments } from "@/services/appointment.service"
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, isToday, isSameMonth } from "date-fns"
import { es } from "date-fns/locale"

const statusConfig = {
  CONFIRMED: {
    label: "Confirmada",
    color: "bg-primary/10 text-primary border-primary/20",
    icon: CheckCircle,
  },
  COMPLETED: {
    label: "Completada",
    color: "bg-success/10 text-success border-success/20",
    icon: CheckCircle,
  },
  CANCELLED: {
    label: "Cancelada",
    color: "bg-destructive/10 text-destructive border-destructive/20",
    icon: XCircle,
  },
  NO_SHOW: {
    label: "No Asistió",
    color: "bg-warning/10 text-warning-foreground border-warning/20",
    icon: AlertCircle,
  },
}

function AppointmentCard({
  appointment,
  onEdit,
  onCancel,
}: {
  appointment: Appointment
  onEdit: () => void
  onCancel: () => void
}) {
  const config = statusConfig[appointment.status]
  const StatusIcon = config.icon

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-1">
              <p className="font-medium">{appointment.customer?.full_name}</p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarIcon className="h-3.5 w-3.5" />
                {format(new Date(appointment.start_time), "EEEE d 'de' MMMM", {
                  locale: es,
                })}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                {format(new Date(appointment.start_time), "HH:mm")} -{" "}
                {format(new Date(appointment.end_time), "HH:mm")}
              </div>
              {appointment.notes && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-3.5 w-3.5" />
                  {appointment.notes}
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge variant="outline" className={config.color}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {config.label}
            </Badge>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}>
                <Edit className="h-4 w-4" />
              </Button>
              {appointment.status === "CONFIRMED" && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={onCancel}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

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
      ? Math.round((new Date(appointment.end_time).getTime() - new Date(appointment.start_time).getTime()) / (1000 * 60))
      : 30
  )
  const [notes, setNotes] = useState(appointment?.notes || "")
  const [customers, setCustomers] = useState<Array<{ id: number; full_name: string | null; phone_number: string }>>([])
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Actualizar estado cuando cambia el appointment
  useEffect(() => {
    if (appointment) {
      setSelectedCustomer(appointment.customer_id?.toString() || "")
      setSelectedDate(new Date(appointment.start_time))
      setSelectedTime(format(new Date(appointment.start_time), "HH:mm"))
      setDuration(Math.round((new Date(appointment.end_time).getTime() - new Date(appointment.start_time).getTime()) / (1000 * 60)))
      setNotes(appointment.notes || "")
    } else {
      setSelectedCustomer("")
      setSelectedDate(new Date())
      setSelectedTime("09:00")
      setDuration(30)
      setNotes("")
    }
  }, [appointment])

  // Cargar clientes cuando se abre el diálogo
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
    if (!selectedCustomer || !selectedDate || !selectedTime) {
      return
    }

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
        throw new Error(error.error || "Failed to save appointment")
      }

      onSuccess?.()
      onClose()
    } catch (error: any) {
      console.error("Error saving appointment:", error)
      alert(error.message || "Error al guardar la cita")
    } finally {
      setIsSaving(false)
    }
  }

  const title = mode === "create" ? "Nueva Cita" : mode === "edit" ? "Editar Cita" : "Detalles de la Cita"

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
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

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Cliente</Label>
            <Select
              value={selectedCustomer}
              onValueChange={setSelectedCustomer}
              disabled={mode === "view" || isLoadingCustomers}
            >
              <SelectTrigger>
                <SelectValue placeholder={isLoadingCustomers ? "Cargando clientes..." : "Seleccionar cliente"} />
              </SelectTrigger>
              <SelectContent>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id.toString()}>
                    {customer.full_name || "Sin nombre"} - {customer.phone_number}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Fecha</Label>
            <div className="border rounded-md p-3">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                disabled={mode === "view"}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
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
                    const time = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`
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
              <Label>Duración (minutos)</Label>
              <Select
                value={duration.toString()}
                onValueChange={(value) => setDuration(Number(value))}
                disabled={mode === "view"}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutos</SelectItem>
                  <SelectItem value="30">30 minutos</SelectItem>
                  <SelectItem value="45">45 minutos</SelectItem>
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
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            {mode === "view" ? "Cerrar" : "Cancelar"}
          </Button>
          {mode !== "view" && (
            <Button onClick={handleSave} disabled={isSaving || !selectedCustomer}>
              {isSaving ? "Guardando..." : mode === "create" ? "Crear Cita" : "Guardar Cambios"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function CalendarView({
  appointments,
  selectedDate,
  onSelectDate,
  onSelectAppointment,
}: {
  appointments: Appointment[]
  selectedDate: Date
  onSelectDate: (date: Date) => void
  onSelectAppointment: (appointment: Appointment) => void
}) {
  const monthStart = startOfMonth(selectedDate)
  const monthEnd = endOfMonth(selectedDate)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const getAppointmentsForDay = (day: Date) => {
    return appointments.filter((apt) =>
      isSameDay(new Date(apt.start_time), day)
    )
  }

  // Get modifiers for days with appointments
  const daysWithAppointments = appointments.map((apt) => new Date(apt.start_time))

  return (
    <div className="space-y-4">
      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={(date) => date && onSelectDate(date)}
        modifiers={{
          hasAppointment: daysWithAppointments,
        }}
        modifiersClassNames={{
          hasAppointment: "bg-primary/20 font-bold",
        }}
        className="rounded-md border w-full"
      />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">
            {format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            {getAppointmentsForDay(selectedDate).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CalendarIcon className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-sm text-muted-foreground">
                  No hay citas para este día
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {getAppointmentsForDay(selectedDate).map((appointment) => {
                  const config = statusConfig[appointment.status]
                  return (
                    <button
                      key={appointment.id}
                      onClick={() => onSelectAppointment(appointment)}
                      className="w-full p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors text-left"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                            <Clock className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">
                              {appointment.customer?.full_name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(appointment.start_time), "HH:mm")} -{" "}
                              {format(new Date(appointment.end_time), "HH:mm")}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className={`text-xs ${config.color}`}>
                          {config.label}
                        </Badge>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}

export default function AppointmentsPage() {
  const { user } = useAuth()
  const [view, setView] = useState<"calendar" | "list">("calendar")
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<"view" | "edit" | "create">("view")
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Cargar citas del cliente
  useEffect(() => {
    const loadAppointments = async () => {
      if (!user?.id) return
      
      try {
        setIsLoading(true)
        const data = await getAllAppointments(user.id)
        setAppointments(data)
      } catch (error) {
        console.error("Error loading appointments:", error)
        // Fallback a mock data en caso de error
        setAppointments(mockAppointments)
      } finally {
        setIsLoading(false)
      }
    }

    loadAppointments()
  }, [user?.id])

  const filteredAppointments = appointments.filter((apt) => {
    const matchesSearch =
      apt.customer?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      apt.notes?.toLowerCase().includes(search.toLowerCase())

    const matchesStatus = statusFilter === "all" || apt.status === statusFilter

    return matchesSearch && matchesStatus
  })

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

  const handleViewAppointment = (appointment: Appointment) => {
    setSelectedAppointment(appointment)
    setDialogMode("view")
    setDialogOpen(true)
  }

  const handleCancelAppointment = async (appointment: Appointment) => {
    if (!confirm("¿Estás seguro de que deseas cancelar esta cita?")) {
      return
    }

    try {
      const response = await fetch(`/api/appointments/${appointment.id}/cancel`, {
        method: "PATCH",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to cancel appointment")
      }

      // Recargar citas
      if (user?.id) {
        const data = await getAllAppointments(user.id)
        setAppointments(data)
      }
    } catch (error: any) {
      console.error("Error cancelling appointment:", error)
      alert(error.message || "Error al cancelar la cita")
    }
  }

  const handleRefreshAppointments = async () => {
    if (!user?.id) return
    
    try {
      setIsLoading(true)
      const data = await getAllAppointments(user.id)
      setAppointments(data)
    } catch (error) {
      console.error("Error loading appointments:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Clock className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando citas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Citas</h1>
          <p className="text-muted-foreground">
            Gestiona las citas y reservaciones de tus clientes
          </p>
        </div>
        <Button onClick={handleCreateAppointment}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Cita
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <CheckCircle className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {appointments.filter((a) => a.status === "CONFIRMED").length}
                </p>
                <p className="text-sm text-muted-foreground">Confirmadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                <CheckCircle className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {appointments.filter((a) => a.status === "COMPLETED").length}
                </p>
                <p className="text-sm text-muted-foreground">Completadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                <XCircle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {appointments.filter((a) => a.status === "CANCELLED").length}
                </p>
                <p className="text-sm text-muted-foreground">Canceladas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                <AlertCircle className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {appointments.filter((a) => a.status === "NO_SHOW").length}
                </p>
                <p className="text-sm text-muted-foreground">No Asistió</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and View Toggle */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente o notas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="CONFIRMED">Confirmadas</SelectItem>
            <SelectItem value="COMPLETED">Completadas</SelectItem>
            <SelectItem value="CANCELLED">Canceladas</SelectItem>
            <SelectItem value="NO_SHOW">No Asistió</SelectItem>
          </SelectContent>
        </Select>
        <Tabs value={view} onValueChange={(v) => setView(v as "calendar" | "list")}>
          <TabsList>
            <TabsTrigger value="calendar">
              <LayoutGrid className="h-4 w-4 mr-1" />
              Calendario
            </TabsTrigger>
            <TabsTrigger value="list">
              <List className="h-4 w-4 mr-1" />
              Lista
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content */}
      {view === "calendar" ? (
        <CalendarView
          appointments={filteredAppointments}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          onSelectAppointment={handleViewAppointment}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredAppointments.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CalendarIcon className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-lg font-medium">No hay citas</p>
                <p className="text-sm text-muted-foreground">
                  No se encontraron citas con los filtros actuales
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredAppointments.map((appointment) => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                onEdit={() => handleEditAppointment(appointment)}
                onCancel={() => handleCancelAppointment(appointment)}
              />
            ))
          )}
        </div>
      )}

      {/* Appointment Dialog */}
      <AppointmentDialog
        appointment={selectedAppointment}
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        mode={dialogMode}
        onSuccess={handleRefreshAppointments}
      />
    </div>
  )
}
