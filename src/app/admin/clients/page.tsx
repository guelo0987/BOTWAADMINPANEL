"use client"

import React from "react"

import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { useAdminAuth } from "@/lib/admin-auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Plus, RefreshCcw, LogIn, KeyRound, Power } from "lucide-react"
import type { ToolsConfig } from "@/types"

type ClientRow = {
  id: number
  business_name: string
  whatsapp_instance_id: string
  is_active: boolean
  tools_config: ToolsConfig
  created_at: string
}

type BusinessType = NonNullable<ToolsConfig["business_type"]>

const BUSINESS_TYPES: Array<{ value: BusinessType; label: string }> = [
  { value: "general", label: "General" },
  { value: "clinic", label: "Clínica" },
  { value: "salon", label: "Salón" },
  { value: "restaurant", label: "Restaurante" },
  { value: "store", label: "Tienda" },
]

export default function AdminClientsPage() {
  const { user } = useAdminAuth()
  const isAdmin = user?.rol === "admin"

  const [clients, setClients] = useState<ClientRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Create form
  const [openCreate, setOpenCreate] = useState(false)
  const [businessName, setBusinessName] = useState("")
  const [instanceId, setInstanceId] = useState("")
  const [password, setPassword] = useState("")
  const [businessType, setBusinessType] = useState<BusinessType>("general")
  const [timezone, setTimezone] = useState("America/Santo_Domingo")
  const [prompt, setPrompt] = useState("")
  const [isCreating, setIsCreating] = useState(false)

  // Reset password dialog
  const [openReset, setOpenReset] = useState(false)
  const [resetClientId, setResetClientId] = useState<number | null>(null)
  const [newPassword, setNewPassword] = useState("")
  const [isResetting, setIsResetting] = useState(false)

  const businessTypeLabel = useMemo(() => {
    const found = BUSINESS_TYPES.find((t) => t.value === businessType)
    return found?.label || "General"
  }, [businessType])

  const fetchClients = async () => {
    const res = await fetch("/api/admin/clients", { method: "GET" })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.error || "No se pudieron cargar los clientes")
    }
    const data = await res.json()
    setClients(data.clients || [])
  }

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setIsLoading(true)
        await fetchClients()
      } catch (e) {
        if (mounted) toast.error(e instanceof Error ? e.message : "Error cargando clientes")
      } finally {
        if (mounted) setIsLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  const refresh = async () => {
    try {
      setIsRefreshing(true)
      await fetchClients()
      toast.success("Lista actualizada")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error actualizando")
    } finally {
      setIsRefreshing(false)
    }
  }

  const createClient = async () => {
    try {
      setIsCreating(true)
      const payload = {
        business_name: businessName,
        whatsapp_instance_id: instanceId,
        password,
        business_type: businessType,
        system_prompt_template: prompt || undefined,
        tools_config: {
          business_type: businessType,
          timezone,
        },
      }

      const res = await fetch("/api/admin/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        const details = Array.isArray(data.errors)
          ? data.errors.map((e: any) => `${e.field}: ${e.message}`).join(" | ")
          : ""
        throw new Error(data.error ? `${data.error}${details ? ` (${details})` : ""}` : "Error creando cliente")
      }

      toast.success("Cliente creado")
      setOpenCreate(false)
      setBusinessName("")
      setInstanceId("")
      setPassword("")
      setBusinessType("general")
      setTimezone("America/Santo_Domingo")
      setPrompt("")
      await fetchClients()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error creando cliente")
    } finally {
      setIsCreating(false)
    }
  }

  const toggleActive = async (clientId: number, nextActive: boolean) => {
    try {
      const res = await fetch(`/api/admin/clients/${clientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: nextActive }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Error actualizando estado")
      setClients((prev) => prev.map((c) => (c.id === clientId ? { ...c, is_active: nextActive } : c)))
      toast.success(nextActive ? "Cliente activado" : "Cliente desactivado")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error actualizando estado")
    }
  }

  const openResetPassword = (clientId: number) => {
    setResetClientId(clientId)
    setNewPassword("")
    setOpenReset(true)
  }

  const resetPassword = async () => {
    if (!resetClientId) return
    try {
      setIsResetting(true)
      const res = await fetch(`/api/admin/clients/${resetClientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Error reseteando contraseña")
      toast.success("Contraseña actualizada")
      setOpenReset(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error reseteando contraseña")
    } finally {
      setIsResetting(false)
    }
  }

  const impersonate = async (clientId: number) => {
    try {
      const res = await fetch(`/api/admin/clients/${clientId}/impersonate`, { method: "POST" })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "No se pudo acceder como cliente")

      // El dashboard del cliente usa localStorage para sesión.
      localStorage.setItem("auth_token", data.token)
      localStorage.setItem("auth_user", JSON.stringify(data.client))
      window.location.href = "/dashboard"
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al acceder como cliente")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground">Crea clientes por tipo de empresa y gestiona su acceso.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={refresh} disabled={isRefreshing}>
            {isRefreshing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCcw className="h-4 w-4 mr-2" />}
            Actualizar
          </Button>

          <Dialog open={openCreate} onOpenChange={setOpenCreate}>
            <DialogTrigger asChild>
              <Button disabled={!isAdmin}>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo cliente
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Crear cliente</DialogTitle>
                <DialogDescription>
                  Crea un cliente y configura el tipo de empresa (se guarda en <code>tools_config.business_type</code>).
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label>Tipo de empresa</Label>
                  <Select value={businessType} onValueChange={(v) => setBusinessType(v as BusinessType)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {BUSINESS_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Seleccionado: {businessTypeLabel}</p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="business_name">Nombre del negocio</Label>
                  <Input
                    id="business_name"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Clínica Moreira"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="instance_id">WhatsApp Instance ID</Label>
                  <Input
                    id="instance_id"
                    value={instanceId}
                    onChange={(e) => setInstanceId(e.target.value)}
                    placeholder="clinica_moreira"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="timezone">Zona horaria</Label>
                  <Input
                    id="timezone"
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    placeholder="America/Santo_Domingo"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="prompt">System prompt (opcional)</Label>
                  <Textarea
                    id="prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Si lo dejas vacío, usamos una plantilla según el tipo de empresa."
                    rows={4}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  onClick={createClient}
                  disabled={isCreating || !businessName || !instanceId || !password}
                >
                  {isCreating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Crear
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {!isAdmin && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base">Permisos</CardTitle>
            <CardDescription>Tu rol es <code>{user?.rol}</code>. Solo <code>admin</code> puede crear/editar clientes.</CardDescription>
          </CardHeader>
        </Card>
      )}

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Listado</CardTitle>
          <CardDescription>{clients.length} clientes</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Cargando...
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Negocio</TableHead>
                    <TableHead>Instance</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono text-xs">{c.id}</TableCell>
                      <TableCell className="font-medium">{c.business_name}</TableCell>
                      <TableCell className="font-mono text-xs">{c.whatsapp_instance_id}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{c.tools_config?.business_type || "general"}</Badge>
                      </TableCell>
                      <TableCell>
                        {c.is_active ? (
                          <Badge className="bg-green-600 hover:bg-green-600">Activo</Badge>
                        ) : (
                          <Badge variant="destructive">Inactivo</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => impersonate(c.id)}
                            disabled={!isAdmin}
                            title="Entrar como este cliente"
                          >
                            <LogIn className="h-4 w-4 mr-2" />
                            Acceder
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openResetPassword(c.id)}
                            disabled={!isAdmin}
                            title="Cambiar contraseña"
                          >
                            <KeyRound className="h-4 w-4 mr-2" />
                            Password
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleActive(c.id, !c.is_active)}
                            disabled={!isAdmin}
                            title={c.is_active ? "Desactivar" : "Activar"}
                          >
                            <Power className="h-4 w-4 mr-2" />
                            {c.is_active ? "Desactivar" : "Activar"}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!clients.length && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                        No hay clientes todavía.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={openReset} onOpenChange={setOpenReset}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Resetear contraseña</DialogTitle>
            <DialogDescription>Se actualizará la contraseña del cliente seleccionado.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="new_password">Nueva contraseña</Label>
            <Input
              id="new_password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <DialogFooter>
            <Button onClick={resetPassword} disabled={!newPassword || isResetting}>
              {isResetting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

