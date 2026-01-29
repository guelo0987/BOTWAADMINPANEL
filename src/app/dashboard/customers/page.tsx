"use client"

import { useState } from "react"
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
import { mockCustomers, mockAppointments, mockConversations } from "@/lib/mock-data"
import type { Customer, Appointment, Conversation } from "@/types"
import { format, formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

function CustomerRow({
  customer,
  onClick,
}: {
  customer: Customer
  onClick: () => void
}) {
  const customerAppointments = mockAppointments.filter(
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
        {customer.data.email ? (
          <span className="text-sm">{customer.data.email}</span>
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
  open,
  onClose,
}: {
  customer: Customer | null
  open: boolean
  onClose: () => void
}) {
  const [isEditing, setIsEditing] = useState(false)

  if (!customer) return null

  const customerAppointments = mockAppointments.filter(
    (apt) => apt.customer_id === customer.id
  )
  const customerConversations = mockConversations.filter(
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
            >
              <Edit className="h-4 w-4 mr-1" />
              {isEditing ? "Cancelar" : "Editar"}
            </Button>
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
                    <Input defaultValue={customer.full_name || ""} />
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
                    <Input defaultValue={customer.data.email || ""} />
                  ) : (
                    <p className="font-medium flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      {customer.data.email || "No registrado"}
                    </p>
                  )}
                </div>

                {customer.data.address && (
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Dirección</Label>
                    {isEditing ? (
                      <Textarea defaultValue={customer.data.address} />
                    ) : (
                      <p className="font-medium flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        {customer.data.address}
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
                  <Button className="w-full mt-4">Guardar Cambios</Button>
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
                    Este cliente no tiene conversaciones registradas
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
                            ? "Activa"
                            : conv.status === "resolved"
                              ? "Resuelta"
                              : "Escalada"}
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
                      defaultValue={JSON.stringify(customer.data, null, 2)}
                    />
                    <Button className="w-full">Guardar Datos</Button>
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
  const [search, setSearch] = useState("")
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const filteredCustomers = mockCustomers.filter((customer) => {
    const matchesSearch =
      customer.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      customer.phone_number.includes(search) ||
      customer.data.email?.toLowerCase().includes(search.toLowerCase())

    return matchesSearch
  })

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer)
    setSheetOpen(true)
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
                <p className="text-2xl font-bold">{mockCustomers.length}</p>
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
                  {mockAppointments.filter((a) => a.status === "CONFIRMED").length}
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
                  {mockConversations.filter((c) => c.status === "active").length}
                </p>
                <p className="text-sm text-muted-foreground">
                  Conversaciones activas
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre, teléfono o email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
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
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
      />
    </div>
  )
}
