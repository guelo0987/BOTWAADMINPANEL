"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import Link from "next/link"
import {
  Search,
  Users,
  Phone,
  Mail,
  Calendar,
  MessageSquare,
  MapPin,
  Edit,
  User,
  Clock,
  FileText,
} from "lucide-react"
import type { Customer, Appointment, Conversation } from "@/types"
import { useAuth } from "@/lib/auth-context"
import { format, formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

function CustomerRow({
  customer,
  appointments,
  onClick,
}: {
  customer: Customer
  appointments: Appointment[]
  onClick: () => void
}) {
  const customerAppointments = appointments.filter(
    (apt) => apt.customer_id === customer.id
  )
  const lastAppointment = customerAppointments[0]

  return (
    <TableRow
      className="cursor-pointer hover:bg-muted/50"
      onClick={onClick}
    >
      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary/10 text-primary">
              {customer.full_name
                ? customer.full_name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                : "?"}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{customer.full_name || "Sin nombre"}</p>
            <p className="text-sm text-muted-foreground">
              +{customer.phone_number}
            </p>
          </div>
        </div>
      </TableCell>
      <TableCell>
        {(customer.data as Record<string, unknown>)?.email ? (
          <span className="text-sm">{(customer.data as Record<string, unknown>).email as string}</span>
        ) : (
          <span className="text-sm text-muted-foreground">-</span>
        )}
      </TableCell>
      <TableCell>
        <Badge variant="outline">{customerAppointments.length} citas</Badge>
      </TableCell>
      <TableCell>
        {lastAppointment ? (
          <span className="text-sm text-muted-foreground">
            {format(new Date(lastAppointment.start_time), "d MMM yyyy", {
              locale: es,
            })}
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">-</span>
        )}
      </TableCell>
      <TableCell>
        <span className="text-sm text-muted-foreground">
          {format(new Date(customer.created_at), "d MMM yyyy", { locale: es })}
        </span>
      </TableCell>
    </TableRow>
  )
}

function CustomerDetail({
  customer,
  appointments,
  conversations,
  open,
  onClose,
  clientId,
}: {
  customer: Customer | null
  appointments: Appointment[]
  conversations: Conversation[]
  open: boolean
  onClose: () => void
  clientId?: number
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(customer?.full_name || "")
  const [editEmail, setEditEmail] = useState(String((customer?.data as Record<string, unknown>)?.email || ""))
  const [editAddress, setEditAddress] = useState(String((customer?.data as Record<string, unknown>)?.direccion || (customer?.data as Record<string, unknown>)?.address || ""))
  const [editJsonData, setEditJsonData] = useState(JSON.stringify(customer?.data, null, 2))
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (customer) {
      setEditName(customer.full_name || "")
      setEditEmail(String((customer.data as Record<string, unknown>)?.email || ""))
      setEditAddress(String((customer.data as Record<string, unknown>)?.direccion || (customer.data as Record<string, unknown>)?.address || ""))
      setEditJsonData(JSON.stringify(customer.data, null, 2))
    }
  }, [customer])

  const handleSave = async () => {
    if (!customer) return
    setIsSaving(true)
    try {
      const currentData = (customer.data as Record<string, unknown>) || {}
      const updatedData = { ...currentData, email: editEmail || undefined }
      if (editAddress) updatedData.direccion = editAddress

      const res = await fetch(`/api/client/customers/${customer.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: editName, data: updatedData }),
      })
      if (!res.ok) throw new Error("Error al guardar")
      setIsEditing(false)
    } catch {
      // silently fail
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveJson = async () => {
    if (!customer) return
    setIsSaving(true)
    try {
      const parsed = JSON.parse(editJsonData)
      const res = await fetch(`/api/client/customers/${customer.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: parsed }),
      })
      if (!res.ok) throw new Error("Error al guardar")
      setIsEditing(false)
    } catch {
      // silently fail
    } finally {
      setIsSaving(false)
    }
  }

  if (!customer) return null

  const customerAppointments = appointments.filter(
    (apt) => apt.customer_id === customer.id
  )
  const customerConversations = conversations.filter(
    (conv) => conv.customer_id === customer.id
  )

  const statusColors = {
    CONFIRMED: "bg-primary/10 text-primary",
    COMPLETED: "bg-success/10 text-success",
    CANCELLED: "bg-destructive/10 text-destructive",
    NO_SHOW: "bg-warning/10 text-warning-foreground",
  }

  const statusLabels = {
    CONFIRMED: "Confirmada",
    COMPLETED: "Completada",
    CANCELLED: "Cancelada",
    NO_SHOW: "No Asistió",
  }

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-xl p-0 flex flex-col">
        <SheetHeader className="p-6 border-b border-border">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-primary/10 text-primary text-xl">
                {customer.full_name
                  ? customer.full_name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                  : "?"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <SheetTitle className="text-left text-xl">
                {customer.full_name || "Sin nombre"}
              </SheetTitle>
              <SheetDescription className="text-left flex items-center gap-2 mt-1">
                <Phone className="h-3.5 w-3.5" />
                +{customer.phone_number}
              </SheetDescription>
            </div>
            <div className="flex gap-2">
              {customerConversations.length > 0 && clientId && (
                <Link href={`/dashboard/conversations?open=${customer.id}`}>
                  <Button variant="outline" size="sm">
                    <MessageSquare className="h-4 w-4 mr-1" />
                    Ver conversación
                  </Button>
                </Link>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
              >
                <Edit className="h-4 w-4 mr-1" />
                {isEditing ? "Cancelar" : "Editar"}
              </Button>
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <Tabs defaultValue="info" className="w-full">
            <TabsList className="w-full justify-start rounded-none border-b bg-transparent px-6">
              <TabsTrigger value="info">Información</TabsTrigger>
              <TabsTrigger value="appointments">Citas</TabsTrigger>
              <TabsTrigger value="conversations">Conversaciones</TabsTrigger>
              <TabsTrigger value="data">Datos</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="p-6 space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Nombre completo</Label>
                  {isEditing ? (
                    <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
                  ) : (
                    <p className="font-medium">
                      {customer.full_name || "Sin nombre"}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-muted-foreground">Teléfono</Label>
                  <p className="font-medium flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    +{customer.phone_number}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-muted-foreground">Email</Label>
                  {isEditing ? (
                    <Input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
                  ) : (
                    <p className="font-medium flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      {(customer.data as Record<string, unknown>)?.email || "No registrado"}
                    </p>
                  )}
                </div>

                {((customer.data as Record<string, unknown>)?.direccion || (customer.data as Record<string, unknown>)?.address) && (
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Dirección</Label>
                    {isEditing ? (
                      <Textarea value={editAddress} onChange={(e) => setEditAddress(e.target.value)} />
                    ) : (
                      <p className="font-medium flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        {(customer.data as Record<string, unknown>).direccion || (customer.data as Record<string, unknown>).address}
                      </p>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="text-muted-foreground">Cliente desde</Label>
                  <p className="font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    {format(new Date(customer.created_at), "d 'de' MMMM, yyyy", {
                      locale: es,
                    })}
                  </p>
                </div>

                {isEditing && (
                  <Button className="w-full mt-4" onClick={handleSave} disabled={isSaving}>{isSaving ? "Guardando..." : "Guardar Cambios"}</Button>
                )}
              </div>
            </TabsContent>

            <TabsContent value="appointments" className="p-6">
              {customerAppointments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Calendar className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-sm text-muted-foreground">
                    Este cliente no tiene citas registradas
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {customerAppointments.map((apt) => (
                    <div
                      key={apt.id}
                      className="p-3 rounded-lg border border-border"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                            <Clock className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">
                              {format(
                                new Date(apt.start_time),
                                "EEEE d 'de' MMMM",
                                { locale: es }
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(apt.start_time), "HH:mm")} -{" "}
                              {format(new Date(apt.end_time), "HH:mm")}
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className={statusColors[apt.status]}
                        >
                          {statusLabels[apt.status]}
                        </Badge>
                      </div>
                      {apt.notes && (
                        <p className="mt-2 text-sm text-muted-foreground flex items-center gap-2">
                          <FileText className="h-3.5 w-3.5" />
                          {apt.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="conversations" className="p-6">
              {customerConversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <MessageSquare className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-sm text-muted-foreground">
                    Este cliente no tiene conversaciones en WhatsApp aún
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Las conversaciones aparecen cuando el cliente escribe por WhatsApp
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {customerConversations.map((conv) => (
                    <div
                      key={conv.id}
                      className="p-3 rounded-lg border border-border"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline">
                          {conv.status === "active"
                            ? "IA respondiendo"
                            : conv.status === "human_handled"
                              ? "Tú respondiendo"
                              : conv.status === "escalated"
                                ? "Escalada"
                                : "Resuelta"}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {conv.last_message_at
                            ? formatDistanceToNow(new Date(conv.last_message_at), {
                                addSuffix: true,
                                locale: es,
                              })
                            : "Sin mensajes"}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {conv.last_message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {conv.message_count} mensajes
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="data" className="p-6">
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Datos adicionales almacenados para este cliente
                </p>
                <div className="rounded-lg border border-border p-4 bg-muted/50">
                  <pre className="text-sm overflow-auto">
                    {JSON.stringify(customer.data, null, 2)}
                  </pre>
                </div>
                {isEditing && (
                  <div className="space-y-2">
                    <Label>Editar datos JSON</Label>
                    <Textarea
                      className="font-mono text-sm"
                      rows={10}
                      value={editJsonData}
                      onChange={(e) => setEditJsonData(e.target.value)}
                    />
                    <Button className="w-full" onClick={handleSaveJson} disabled={isSaving}>{isSaving ? "Guardando..." : "Guardar Datos"}</Button>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}

export default function CustomersPage() {
  const { user } = useAuth()
  const [search, setSearch] = useState("")
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) {
      setIsLoading(false)
      return
    }
    const load = async () => {
      try {
        const [custRes, aptRes, convRes] = await Promise.all([
          fetch("/api/appointments/customers", { credentials: "include" }),
          fetch("/api/appointments", { credentials: "include" }),
          fetch(`/api/admin/conversations?client_id=${user.id}`, { credentials: "include" }),
        ])
        if (custRes.ok) {
          const data = await custRes.json()
          setCustomers(Array.isArray(data) ? data : [])
        }
        if (aptRes.ok) {
          const data = await aptRes.json()
          setAppointments(Array.isArray(data) ? data : [])
        }
        if (convRes.ok) {
          const data = await convRes.json()
          const convs: Conversation[] = (data.conversations || []).map((c: any) => ({
            id: c.customer_id,
            customer_id: c.customer_id,
            phone_number: c.phone_number,
            customer_name: c.customer_name,
            last_message: c.last_message,
            last_message_at: c.last_message_time,
            status: c.status,
            message_count: c.message_count,
            is_escalated: c.is_escalated,
            is_human_handled: c.is_human_handled,
          }))
          setConversations(convs)
        }
      } catch {
        setCustomers([])
        setAppointments([])
        setConversations([])
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [user?.id])

  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch =
      customer.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      customer.phone_number.includes(search) ||
      (typeof customer.data === "object" && customer.data?.email
        ? String((customer.data as { email?: string }).email).toLowerCase().includes(search.toLowerCase())
        : false)
    return matchesSearch
  })

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer)
    setSheetOpen(true)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
        <p className="text-muted-foreground">
          Gestiona la información de tus clientes
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{customers.length}</p>
                <p className="text-sm text-muted-foreground">Total clientes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                <Calendar className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {appointments.filter((a) => a.status === "CONFIRMED").length}
                </p>
                <p className="text-sm text-muted-foreground">Citas activas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                <MessageSquare className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {conversations.filter((c) => c.status === "active").length}
                </p>
                <p className="text-sm text-muted-foreground">
                  Conversaciones activas
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search + Export */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, teléfono o email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          variant="outline"
          onClick={() => {
            const header = "ID,Nombre,Teléfono,Email,Fecha Registro\n"
            const rows = filteredCustomers.map((c) => {
              const email = (c.data as Record<string, unknown>)?.email || ""
              return `${c.id},"${c.full_name || ""}","${c.phone_number}","${email}","${c.created_at}"`
            }).join("\n")
            const blob = new Blob([header + rows], { type: "text/csv" })
            const url = URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = `clientes_${new Date().toISOString().split("T")[0]}.csv`
            a.click()
            URL.revokeObjectURL(url)
          }}
        >
          <FileText className="h-4 w-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      {/* Customers Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Todos los Clientes
          </CardTitle>
          <CardDescription>
            Haz clic en un cliente para ver sus detalles
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredCustomers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-lg font-medium">No hay clientes</p>
              <p className="text-sm text-muted-foreground">
                No se encontraron clientes con los filtros actuales
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Citas</TableHead>
                  <TableHead>Última cita</TableHead>
                  <TableHead>Cliente desde</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer) => (
                  <CustomerRow
                    key={customer.id}
                    customer={customer}
                    appointments={appointments}
                    onClick={() => handleSelectCustomer(customer)}
                  />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Customer Detail Sheet */}
      <CustomerDetail
        customer={selectedCustomer}
        appointments={appointments}
        conversations={conversations}
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        clientId={user?.id}
      />
    </div>
  )
}
