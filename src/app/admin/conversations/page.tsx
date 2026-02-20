"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { useAdminAuth } from "@/lib/admin-auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { MessageSquare, Loader2, RefreshCcw, LogIn, Bot, UserCheck, AlertTriangle, CheckCircle } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

type ConvRow = {
  customer_id: number
  customer_name: string
  phone_number: string
  status: string
  last_message: string
  last_message_time: string | null
  message_count: number
  is_escalated: boolean
  is_human_handled: boolean
  admin?: string
  escalation_reason?: string
}

type ClientOption = { id: number; business_name: string }

const STATUS_ICONS: Record<string, React.ReactNode> = {
  active: <Bot className="h-4 w-4 text-green-500" />,
  human_handled: <UserCheck className="h-4 w-4 text-blue-500" />,
  escalated: <AlertTriangle className="h-4 w-4 text-amber-500" />,
  resolved: <CheckCircle className="h-4 w-4 text-muted-foreground" />,
}

const STATUS_LABELS: Record<string, string> = {
  active: "IA respondiendo",
  human_handled: "Humano respondiendo",
  escalated: "Escalada",
  resolved: "Resuelta",
}

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-500/10 text-green-600",
  human_handled: "bg-blue-500/10 text-blue-600",
  escalated: "bg-amber-500/10 text-amber-600",
  resolved: "bg-muted text-muted-foreground",
}

export default function AdminConversationsPage() {
  const { user } = useAdminAuth()
  const [clients, setClients] = useState<ClientOption[]>([])
  const [selectedClient, setSelectedClient] = useState<string>("")
  const [conversations, setConversations] = useState<ConvRow[]>([])
  const [stats, setStats] = useState({ total: 0, active: 0, human_handled: 0, escalated: 0, resolved: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingConvs, setIsLoadingConvs] = useState(false)

  useEffect(() => {
    const loadClients = async () => {
      try {
        const res = await fetch("/api/admin/clients")
        if (res.ok) {
          const data = await res.json()
          setClients((data.clients || []).map((c: any) => ({ id: c.id, business_name: c.business_name })))
        }
      } catch {
        toast.error("Error cargando clientes")
      } finally {
        setIsLoading(false)
      }
    }
    loadClients()
  }, [])

  const loadConversations = async (clientId: string) => {
    if (!clientId) return
    setIsLoadingConvs(true)
    try {
      const res = await fetch(`/api/admin/conversations?client_id=${clientId}`, {
        credentials: "include",
      })
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          toast.error("Para ver conversaciones, primero accede como este cliente desde la página de Clientes")
          setConversations([])
          setStats({ total: 0, active: 0, human_handled: 0, escalated: 0, resolved: 0 })
          return
        }
        throw new Error("Error cargando conversaciones")
      }
      const data = await res.json()
      setConversations(data.conversations || [])
      setStats({
        total: data.total || 0,
        active: data.active || 0,
        human_handled: data.human_handled || 0,
        escalated: data.escalated || 0,
        resolved: data.resolved || 0,
      })
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error")
      setConversations([])
    } finally {
      setIsLoadingConvs(false)
    }
  }

  const handleClientChange = (clientId: string) => {
    setSelectedClient(clientId)
    if (clientId) loadConversations(clientId)
  }

  const impersonate = async (clientId: number) => {
    try {
      const res = await fetch(`/api/admin/clients/${clientId}/impersonate`, { method: "POST" })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Error")
      localStorage.setItem("auth_token", data.token)
      localStorage.setItem("auth_user", JSON.stringify(data.client))
      window.location.href = "/dashboard/conversations"
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al acceder como cliente")
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Conversaciones</h1>
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
          <h1 className="text-2xl font-bold tracking-tight">Conversaciones</h1>
          <p className="text-muted-foreground">
            Monitor de conversaciones de WhatsApp por negocio
          </p>
        </div>
        {selectedClient && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => loadConversations(selectedClient)}>
              <RefreshCcw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
            <Button onClick={() => impersonate(parseInt(selectedClient, 10))}>
              <LogIn className="h-4 w-4 mr-2" />
              Acceder como cliente
            </Button>
          </div>
        )}
      </div>

      <div>
        <Select value={selectedClient} onValueChange={handleClientChange}>
          <SelectTrigger className="w-[300px]">
            <SelectValue placeholder="Selecciona un negocio para ver sus conversaciones" />
          </SelectTrigger>
          <SelectContent>
            {clients.map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>{c.business_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!selectedClient && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Selecciona un negocio para ver sus conversaciones</p>
          </CardContent>
        </Card>
      )}

      {selectedClient && (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Activas (IA)</span>
                <Badge variant="outline" className={STATUS_COLORS.active}>{stats.active}</Badge>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Humano</span>
                <Badge variant="outline" className={STATUS_COLORS.human_handled}>{stats.human_handled}</Badge>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Escaladas</span>
                <Badge variant="outline" className={STATUS_COLORS.escalated}>{stats.escalated}</Badge>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total</span>
                <Badge variant="outline">{stats.total}</Badge>
              </CardContent>
            </Card>
          </div>

          {isLoadingConvs ? (
            <div className="flex items-center gap-2 text-muted-foreground py-8 justify-center">
              <Loader2 className="h-4 w-4 animate-spin" /> Cargando conversaciones...
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Conversaciones
                </CardTitle>
                <CardDescription>{conversations.length} conversaciones con historial</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Teléfono</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Último mensaje</TableHead>
                        <TableHead>Mensajes</TableHead>
                        <TableHead>Hace</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {conversations.map((c) => (
                        <TableRow key={c.customer_id}>
                          <TableCell className="font-medium">{c.customer_name}</TableCell>
                          <TableCell className="font-mono text-xs">{c.phone_number}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {STATUS_ICONS[c.status]}
                              <Badge variant="outline" className={STATUS_COLORS[c.status]}>
                                {STATUS_LABELS[c.status] || c.status}
                              </Badge>
                            </div>
                            {c.admin && <p className="text-xs text-muted-foreground mt-1">por {c.admin}</p>}
                          </TableCell>
                          <TableCell className="max-w-[250px] truncate text-sm text-muted-foreground">
                            {c.last_message || "-"}
                          </TableCell>
                          <TableCell>{c.message_count}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {c.last_message_time
                              ? formatDistanceToNow(new Date(c.last_message_time), { addSuffix: true, locale: es })
                              : "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                      {conversations.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                            No hay conversaciones con historial para este negocio.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                  Para tomar control, enviar mensajes o resolver conversaciones, accede como este cliente usando el botón de arriba.
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
