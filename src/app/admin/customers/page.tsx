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
import { Users, Search, Download, RefreshCcw, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

type CustomerRow = {
  id: number
  client_id: number
  phone_number: string
  full_name: string | null
  data: Record<string, unknown> | null
  created_at: string
  business_name: string
  appointments_count: number
}

type ClientOption = {
  id: number
  business_name: string
}

export default function AdminCustomersPage() {
  const { user } = useAdminAuth()
  const [customers, setCustomers] = useState<CustomerRow[]>([])
  const [clients, setClients] = useState<ClientOption[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [selectedClient, setSelectedClient] = useState<string>("all")

  const fetchData = async () => {
    try {
      const [custRes, clientRes] = await Promise.all([
        fetch("/api/admin/customers"),
        fetch("/api/admin/clients"),
      ])
      if (custRes.ok) {
        const data = await custRes.json()
        setCustomers(data.customers || [])
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

  const filteredCustomers = customers.filter((c) => {
    const matchesClient = selectedClient === "all" || c.client_id === parseInt(selectedClient, 10)
    const q = search.toLowerCase()
    const matchesSearch =
      !q ||
      (c.full_name || "").toLowerCase().includes(q) ||
      c.phone_number.includes(q) ||
      (c.data?.email ? String(c.data.email).toLowerCase().includes(q) : false) ||
      c.business_name.toLowerCase().includes(q)
    return matchesClient && matchesSearch
  })

  const exportCsv = () => {
    const params = selectedClient !== "all" ? `?client_id=${selectedClient}` : ""
    window.open(`/api/admin/customers/export${params}`, "_blank")
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
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
          <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
          <p className="text-muted-foreground">
            Todos los clientes finales de todos los negocios ({customers.length} total)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={exportCsv}>
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
          <Button variant="outline" onClick={() => { setIsLoading(true); fetchData() }}>
            <RefreshCcw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, teléfono, email o negocio..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={selectedClient} onValueChange={setSelectedClient}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Filtrar por negocio" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los negocios</SelectItem>
            {clients.map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>
                {c.business_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Listado
          </CardTitle>
          <CardDescription>{filteredCustomers.length} customers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Negocio</TableHead>
                  <TableHead>Citas</TableHead>
                  <TableHead>Registro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono text-xs">{c.id}</TableCell>
                    <TableCell className="font-medium">{c.full_name || "Sin nombre"}</TableCell>
                    <TableCell className="font-mono text-xs">{c.phone_number}</TableCell>
                    <TableCell className="text-sm">{(c.data?.email as string) || "-"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{c.business_name}</Badge>
                    </TableCell>
                    <TableCell>{c.appointments_count}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(c.created_at), "d MMM yyyy", { locale: es })}
                    </TableCell>
                  </TableRow>
                ))}
                {filteredCustomers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                      No hay customers.
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
