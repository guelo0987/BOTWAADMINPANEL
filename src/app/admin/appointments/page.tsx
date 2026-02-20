"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { useAdminAuth } from "@/lib/admin-auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Calendar, Search, RefreshCcw, Loader2, MoreHorizontal, CheckCircle, XCircle, AlertTriangle } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

type AppointmentRow = {
  id: number
  client_id: number
  customer_id: number
  start_time: string
  end_time: string
  status: string
  notes: string | null
  customer_name: string | null
  customer_phone: string
  business_name: string
}

type ClientOption = { id: number; business_name: string }

const STATUS_LABELS: Record<string, string> = {
  CONFIRMED: "Confirmada",
  COMPLETED: "Completada",
  CANCELLED: "Cancelada",
  NO_SHOW: "No Asistió",
}

const STATUS_COLORS: Record<string, string> = {
  CONFIRMED: "bg-green-500/10 text-green-600",
  COMPLETED: "bg-blue-500/10 text-blue-600",
  CANCELLED: "bg-red-500/10 text-red-600",
  NO_SHOW: "bg-amber-500/10 text-amber-600",
}

export default function AdminAppointmentsPage() {
  const { user } = useAdminAuth()
  const [appointments, setAppointments] = useState<AppointmentRow[]>([])
  const [clients, setClients] = useState<ClientOption[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [selectedClient, setSelectedClient] = useState<string>("all")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")

  const fetchData = async () => {
    try {
      const [aptRes, clientRes] = await Promise.all([
        fetch("/api/admin/appointments"),
        fetch("/api/admin/clients"),
      ])
      if (aptRes.ok) {
        const data = await aptRes.json()
        setAppointments(data.appointments || [])
      }
      if (clientRes.ok) {
        const data = await clientRes.json()
        setClients((data.clients || []).map((c: any) => ({ id: c.id, business_name: c.business_name })))
      }
    } catch {
      toast.error("Error cargando datos")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const changeStatus = async (appointmentId: number, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/appointments/${appointmentId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Error cambiando status")
      }
      setAppointments((prev) =>
        prev.map((a) => (a.id === appointmentId ? { ...a, status: newStatus } : a))
      )
      toast.success(`Cita marcada como ${STATUS_LABELS[newStatus]}`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error")
    }
  }

  const filtered = appointments.filter((a) => {
    const matchesClient = selectedClient === "all" || a.client_id === parseInt(selectedClient, 10)
    const matchesStatus = selectedStatus === "all" || a.status === selectedStatus
    const q = search.toLowerCase()
    const matchesSearch =
      !q ||
      (a.customer_name || "").toLowerCase().includes(q) ||
      a.customer_phone.includes(q) ||
      a.business_name.toLowerCase().includes(q) ||
      (a.notes || "").toLowerCase().includes(q)
    return matchesClient && matchesStatus && matchesSearch
  })

  const statCounts = {
    CONFIRMED: appointments.filter((a) => a.status === "CONFIRMED").length,
    COMPLETED: appointments.filter((a) => a.status === "COMPLETED").length,
    CANCELLED: appointments.filter((a) => a.status === "CANCELLED").length,
    NO_SHOW: appointments.filter((a) => a.status === "NO_SHOW").length,
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Citas</h1>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Cargando...
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Citas</h1>
          <p className="text-muted-foreground">
            Todas las citas de todos los negocios ({appointments.length} total)
          </p>
        </div>
        <Button variant="outline" onClick={() => { setIsLoading(true); fetchData() }}>
          <RefreshCcw className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {Object.entries(statCounts).map(([status, count]) => (
          <Card key={status}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{STATUS_LABELS[status]}</p>
                <Badge variant="outline" className={STATUS_COLORS[status]}>{count}</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente, teléfono, negocio o notas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={selectedClient} onValueChange={setSelectedClient}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Negocio" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los negocios</SelectItem>
            {clients.map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>{c.business_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los status</SelectItem>
            <SelectItem value="CONFIRMED">Confirmada</SelectItem>
            <SelectItem value="COMPLETED">Completada</SelectItem>
            <SelectItem value="CANCELLED">Cancelada</SelectItem>
            <SelectItem value="NO_SHOW">No Asistió</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Listado
          </CardTitle>
          <CardDescription>{filtered.length} citas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Negocio</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Hora</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Notas</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-mono text-xs">{a.id}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{a.customer_name || "Sin nombre"}</p>
                        <p className="text-xs text-muted-foreground">{a.customer_phone}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{a.business_name}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {format(new Date(a.start_time), "d MMM yyyy", { locale: es })}
                    </TableCell>
                    <TableCell className="text-sm">
                      {format(new Date(a.start_time), "HH:mm")} - {format(new Date(a.end_time), "HH:mm")}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={STATUS_COLORS[a.status]}>
                        {STATUS_LABELS[a.status] || a.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                      {a.notes || "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {a.status !== "COMPLETED" && (
                            <DropdownMenuItem onClick={() => changeStatus(a.id, "COMPLETED")}>
                              <CheckCircle className="h-4 w-4 mr-2 text-blue-500" />
                              Marcar Completada
                            </DropdownMenuItem>
                          )}
                          {a.status !== "CONFIRMED" && (
                            <DropdownMenuItem onClick={() => changeStatus(a.id, "CONFIRMED")}>
                              <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                              Marcar Confirmada
                            </DropdownMenuItem>
                          )}
                          {a.status !== "NO_SHOW" && (
                            <DropdownMenuItem onClick={() => changeStatus(a.id, "NO_SHOW")}>
                              <AlertTriangle className="h-4 w-4 mr-2 text-amber-500" />
                              Marcar No Asistió
                            </DropdownMenuItem>
                          )}
                          {a.status !== "CANCELLED" && (
                            <DropdownMenuItem onClick={() => changeStatus(a.id, "CANCELLED")} className="text-destructive">
                              <XCircle className="h-4 w-4 mr-2" />
                              Cancelar
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-10">
                      No hay citas.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
