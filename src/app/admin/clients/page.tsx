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
import { Loader2, Plus, RefreshCcw, LogIn, KeyRound, Power, Mail, ImageIcon } from "lucide-react"
import type { ToolsConfig } from "@/types"

type ClientRow = {
  id: number
  business_name: string
  whatsapp_instance_id: string
  is_active: boolean
  bot_disabled_by_admin: boolean
  tools_config: ToolsConfig
  created_at: string
}

type BusinessType = NonNullable<ToolsConfig["business_type"]>

const BUSINESS_TYPES: Array<{ value: BusinessType; label: string; description: string }> = [
  { value: "general", label: "General", description: "Citas básicas (fecha, hora, nombre, correo). Sin catálogo ni profesionales." },
  { value: "salon", label: "Servicios + Citas", description: "Detailing, taller, spa, centro de servicios: lista de servicios con precio/duración y citas. Profesionales opcionales." },
  { value: "store", label: "Tienda / Catálogo", description: "Dealer, concesionario, tienda. Catálogo de productos. Visita sin cita; calendar_id solo si hay entregas a domicilio." },
  { value: "clinic", label: "Clínica / Consultorio", description: "Citas con doctor. Si hay varios profesionales, el cliente debe elegir con quién agendar." },
  { value: "restaurant", label: "Restaurante", description: "Reservas de mesas: fecha, hora, personas, área. Menú opcional (menu_url)." },
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
  const [notificationEmail, setNotificationEmail] = useState("")
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

  // Email settings dialog
  const [openEmail, setOpenEmail] = useState(false)
  const [emailClientId, setEmailClientId] = useState<number | null>(null)
  const [emailSettings, setEmailSettings] = useState<{
    primary_color: string
    secondary_color: string
    logo_url: string | null
    sender_name: string | null
    footer_text: string | null
    logo_display_url?: string | null
  } | null>(null)
  const [emailSaving, setEmailSaving] = useState(false)
  const [emailLogoUploading, setEmailLogoUploading] = useState(false)

  const businessTypeLabel = BUSINESS_TYPES.find((t) => t.value === businessType)?.label ?? "General"

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
        notification_email: notificationEmail,
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
      setNotificationEmail("")
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
        body: JSON.stringify({
          is_active: nextActive,
          bot_disabled_by_admin: !nextActive,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Error actualizando estado")
      setClients((prev) => prev.map((c) => (c.id === clientId ? { ...c, is_active: nextActive, bot_disabled_by_admin: !nextActive } : c)))
      toast.success(nextActive ? "Bot activado — el cliente puede controlarlo" : "Bot desactivado por admin — el cliente NO podrá reactivarlo")
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

  const openEmailSettings = async (clientId: number) => {
    setEmailClientId(clientId)
    setOpenEmail(true)
    setEmailSettings(null)
    try {
      const res = await fetch(`/api/admin/clients/${clientId}/email-settings`)
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.settings) {
        setEmailSettings({
          primary_color: data.settings.primary_color || "#333333",
          secondary_color: data.settings.secondary_color || "#666666",
          logo_url: data.settings.logo_url ?? null,
          sender_name: data.settings.sender_name ?? null,
          footer_text: data.settings.footer_text ?? null,
          logo_display_url: data.settings.logo_display_url,
        })
      } else {
        setEmailSettings({
          primary_color: "#333333",
          secondary_color: "#666666",
          logo_url: null,
          sender_name: null,
          footer_text: null,
        })
      }
    } catch {
      setEmailSettings({
        primary_color: "#333333",
        secondary_color: "#666666",
        logo_url: null,
        sender_name: null,
        footer_text: null,
      })
    }
  }

  const saveEmailSettings = async () => {
    if (!emailClientId || !emailSettings) return
    try {
      setEmailSaving(true)
      const res = await fetch(`/api/admin/clients/${emailClientId}/email-settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(emailSettings),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Error al guardar")
      toast.success("Configuración de email guardada")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al guardar")
    } finally {
      setEmailSaving(false)
    }
  }

  const uploadEmailLogo = async (file: File) => {
    if (!emailClientId) return
    setEmailLogoUploading(true)
    try {
      const form = new FormData()
      form.append("file", file)
      const res = await fetch(`/api/admin/clients/${emailClientId}/email-settings/logo`, {
        method: "POST",
        body: form,
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Error al subir")
      setEmailSettings((prev) => (prev ? { ...prev, logo_url: data.logo_url } : prev))
      toast.success("Logo subido")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al subir logo")
    } finally {
      setEmailLogoUploading(false)
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
                  El tipo de negocio define si hay citas, catálogo, profesionales, etc. El cliente podrá afinar la configuración en su panel (Configuración del Bot).
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
                  <p className="text-xs text-muted-foreground">
                    {BUSINESS_TYPES.find((t) => t.value === businessType)?.description}
                  </p>
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
                  <Label htmlFor="notification_email">Correo de notificaciones</Label>
                  <Input
                    id="notification_email"
                    type="email"
                    value={notificationEmail}
                    onChange={(e) => setNotificationEmail(e.target.value)}
                    placeholder="contacto@negocio.com"
                  />
                  <p className="text-xs text-muted-foreground">
                    Correo para notificaciones del cliente (obligatorio)
                  </p>
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
                  disabled={isCreating || !businessName || !instanceId || !notificationEmail || !password}
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
                        <div className="flex flex-col gap-1">
                          {c.is_active ? (
                            <Badge className="bg-green-600 hover:bg-green-600">Activo</Badge>
                          ) : (
                            <Badge variant="destructive">Inactivo</Badge>
                          )}
                          {c.bot_disabled_by_admin && (
                            <Badge variant="outline" className="text-xs text-orange-600 border-orange-300">
                              Bloqueado por admin
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEmailSettings(c.id)}
                            disabled={!isAdmin}
                            title="Configurar email"
                          >
                            <Mail className="h-4 w-4 mr-2" />
                            Email
                          </Button>
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

      <Dialog open={openEmail} onOpenChange={setOpenEmail}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Configuración de Email</DialogTitle>
            <DialogDescription>
              Colores, logo y texto para los correos del cliente
            </DialogDescription>
          </DialogHeader>
          {emailSettings && (
            <div className="space-y-4">
              <div className="rounded-lg border p-4 bg-muted/30 space-y-3">
                <Label>Logo</Label>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  className="hidden"
                  id="admin-email-logo"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f && /^image\/(png|jpe?g|webp)$/i.test(f.type) && f.size <= 2 * 1024 * 1024) {
                      uploadEmailLogo(f)
                    } else if (f) {
                      toast.error("Solo PNG, JPG o WebP. Máx. 2 MB")
                    }
                    e.target.value = ""
                  }}
                />
                {emailSettings.logo_url ? (
                  <div className="flex items-center gap-3">
                    {emailSettings.logo_display_url && (
                      <img src={emailSettings.logo_display_url} alt="Logo" className="h-12 w-12 object-contain rounded border" />
                    )}
                    <Button type="button" variant="outline" size="sm" disabled={emailLogoUploading} onClick={() => document.getElementById("admin-email-logo")?.click()}>
                      {emailLogoUploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ImageIcon className="h-4 w-4 mr-2" />}
                      Cambiar logo
                    </Button>
                    <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => setEmailSettings((p) => (p ? { ...p, logo_url: null } : p))}>
                      Quitar
                    </Button>
                  </div>
                ) : (
                  <Button type="button" variant="outline" size="sm" disabled={emailLogoUploading} onClick={() => document.getElementById("admin-email-logo")?.click()}>
                    {emailLogoUploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ImageIcon className="h-4 w-4 mr-2" />}
                    Subir logo
                  </Button>
                )}
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Color primario</Label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={emailSettings.primary_color}
                      onChange={(e) => setEmailSettings((p) => (p ? { ...p, primary_color: e.target.value } : p))}
                      className="h-10 w-14 rounded border cursor-pointer p-1"
                    />
                    <Input value={emailSettings.primary_color} onChange={(e) => setEmailSettings((p) => (p ? { ...p, primary_color: e.target.value } : p))} className="font-mono" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Color secundario</Label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={emailSettings.secondary_color}
                      onChange={(e) => setEmailSettings((p) => (p ? { ...p, secondary_color: e.target.value } : p))}
                      className="h-10 w-14 rounded border cursor-pointer p-1"
                    />
                    <Input value={emailSettings.secondary_color} onChange={(e) => setEmailSettings((p) => (p ? { ...p, secondary_color: e.target.value } : p))} className="font-mono" />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Nombre del remitente</Label>
                <Input
                  placeholder="Ej: Clínica Moreira"
                  value={emailSettings.sender_name || ""}
                  onChange={(e) => setEmailSettings((p) => (p ? { ...p, sender_name: e.target.value || null } : p))}
                />
              </div>
              <div className="space-y-2">
                <Label>Texto del pie de página</Label>
                <Textarea
                  placeholder="Ej: © 2025 Mi Negocio"
                  value={emailSettings.footer_text || ""}
                  onChange={(e) => setEmailSettings((p) => (p ? { ...p, footer_text: e.target.value || null } : p))}
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={saveEmailSettings} disabled={emailSaving || !emailSettings}>
              {emailSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

