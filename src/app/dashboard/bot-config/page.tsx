"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Bot,
  Building2,
  Clock,
  DollarSign,
  Users,
  Save,
  Plus,
  Trash2,
  Calendar,
  MessageSquare,
  Eye,
  Loader2,
  FileUp,
  FileText,
  ExternalLink,
  Mail,
  ImageIcon,
  ShieldAlert,
  CalendarClock,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { Client } from "@/types"
import { useToast } from "@/hooks/use-toast"

function CatalogPdfUpload({
  clientId,
  catalogPdfKey,
  onUploaded,
  onCleared,
}: {
  clientId: number | undefined
  catalogPdfKey: string | undefined
  onUploaded: (key: string) => void
  onCleared: () => void
}) {
  const [uploading, setUploading] = useState(false)
  const [viewUrl, setViewUrl] = useState<string | null>(null)
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || file.type !== "application/pdf") {
      toast({ title: "Selecciona un archivo PDF", variant: "destructive" })
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "El archivo no puede superar 10 MB", variant: "destructive" })
      return
    }
    setUploading(true)
    try {
      const form = new FormData()
      form.append("file", file)
      const res = await fetch("/api/client/catalog/upload", {
        method: "POST",
        body: form,
        credentials: "include",
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Error al subir")
      onUploaded(data.catalog_pdf_key)
      toast({
        title: "PDF subido correctamente",
        description: "Haz clic en «Guardar Cambios» arriba para guardar la configuración.",
      })
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "No se pudo subir el PDF",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
      e.target.value = ""
    }
  }

  const loadViewUrl = async () => {
    if (viewUrl) {
      window.open(viewUrl, "_blank")
      return
    }
    try {
      const res = await fetch("/api/client/catalog/signed-url", { credentials: "include" })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Error al obtener enlace")
      setViewUrl(data.url)
      window.open(data.url, "_blank")
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "No se pudo abrir el PDF",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-3 rounded-lg border border-border p-4 bg-muted/30">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        className="hidden"
        onChange={handleFile}
        disabled={uploading || !clientId}
      />
      {catalogPdfKey ? (
        <div className="flex flex-wrap items-center gap-3">
          <FileText className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm font-medium">Catálogo en PDF</span>
          <Button type="button" variant="outline" size="sm" onClick={loadViewUrl}>
            <ExternalLink className="h-4 w-4 mr-1" />
            Ver / Descargar
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading || !clientId}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileUp className="h-4 w-4 mr-2" />}
            Cambiar PDF
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={onCleared} className="text-destructive">
            Quitar PDF
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading || !clientId}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileUp className="h-4 w-4 mr-2" />}
            Subir PDF de catálogo
          </Button>
          <span className="text-xs text-muted-foreground">Máx. 10 MB. Después haz clic en «Guardar Cambios».</span>
        </div>
      )}
    </div>
  )
}

function LogoUpload({
  clientId,
  logoUrl,
  logoDisplayUrl,
  onUploaded,
  onCleared,
}: {
  clientId: number | undefined
  logoUrl: string | null | undefined
  logoDisplayUrl: string | null | undefined
  onUploaded: (key: string) => void
  onCleared: () => void
}) {
  const [uploading, setUploading] = useState(false)
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !/^image\/(png|jpe?g|webp)$/i.test(file.type)) {
      toast({ title: "Selecciona una imagen PNG, JPG o WebP", variant: "destructive" })
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "El logo no puede superar 2 MB", variant: "destructive" })
      return
    }
    setUploading(true)
    try {
      const form = new FormData()
      form.append("file", file)
      const res = await fetch("/api/client/email-settings/logo", {
        method: "POST",
        body: form,
        credentials: "include",
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Error al subir")
      onUploaded(data.logo_url)
      toast({ title: "Logo subido correctamente" })
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "No se pudo subir el logo",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
      e.target.value = ""
    }
  }

  return (
    <div className="space-y-3 rounded-lg border border-border p-4 bg-muted/30">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        className="hidden"
        onChange={handleFile}
        disabled={uploading || !clientId}
      />
      {logoUrl ? (
        <div className="flex flex-wrap items-center gap-3">
          {logoDisplayUrl && (
            <img src={logoDisplayUrl} alt="Logo" className="h-12 w-12 object-contain rounded border" />
          )}
          <span className="text-sm font-medium">Logo</span>
          <Button type="button" variant="outline" size="sm" disabled={uploading || !clientId} onClick={() => fileInputRef.current?.click()}>
            {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ImageIcon className="h-4 w-4 mr-2" />}
            Cambiar logo
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={onCleared} className="text-destructive">
            Quitar logo
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" variant="outline" size="sm" disabled={uploading || !clientId} onClick={() => fileInputRef.current?.click()}>
            {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ImageIcon className="h-4 w-4 mr-2" />}
            Subir logo
          </Button>
          <span className="text-xs text-muted-foreground">PNG, JPG o WebP. Máx. 2 MB.</span>
        </div>
      )}
    </div>
  )
}

type EmailSettings = {
  id: number
  client_id: number
  primary_color: string
  secondary_color: string
  logo_url: string | null
  sender_name: string | null
  footer_text: string | null
  templates: Record<string, unknown> | null
  logo_display_url?: string | null
}

export default function BotConfigPage() {
  const { user } = useAuth()
  const [config, setConfig] = useState<Client | null>(null)
  const configRef = useRef<Client | null>(null)
  const [savedConfig, setSavedConfig] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showPromptPreview, setShowPromptPreview] = useState(false)
  const [emailSettings, setEmailSettings] = useState<EmailSettings | null>(null)
  const [emailSaving, setEmailSaving] = useState(false)
  const [showSaveSuccess, setShowSaveSuccess] = useState(false)
  const { toast } = useToast()

  const hasUnsavedChanges = useMemo(() => {
    if (!config || !savedConfig) return false
    return JSON.stringify(config) !== savedConfig
  }, [config, savedConfig])

  useEffect(() => {
    if (!hasUnsavedChanges) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
    }
    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [hasUnsavedChanges])

  useEffect(() => {
    configRef.current = config
  }, [config])

  // Cargar configuración al montar
  useEffect(() => {
    const loadConfig = async () => {
      if (!user?.id) return

      try {
        setIsLoading(true)
        const response = await fetch(`/api/client/config?client_id=${user.id}`, {
          credentials: "include",
        })
        if (!response.ok) {
          throw new Error("Failed to load config")
        }

        const data = await response.json()

        // Parsear tools_config si viene como string o asegurar que sea objeto
        let toolsConfig = data.tools_config
        if (typeof toolsConfig === 'string') {
          try {
            toolsConfig = JSON.parse(toolsConfig)
          } catch {
            toolsConfig = {}
          }
        }
        if (!toolsConfig || typeof toolsConfig !== 'object') {
          toolsConfig = {}
        }

        // Traer de BD: los dos pueden existir; el usuario elige con el radio cuál usa el bot (y Guardar persiste esa elección).
        const catalogPdfKeyFromDb =
          toolsConfig.catalog_pdf_key != null && String(toolsConfig.catalog_pdf_key).trim() !== ""
            ? String(toolsConfig.catalog_pdf_key).trim()
            : undefined
        const catalogSourceFromDb = toolsConfig.catalog_source === "pdf" || toolsConfig.catalog_source === "manual" ? toolsConfig.catalog_source : null
        const catalogSource =
          catalogSourceFromDb === "pdf" && catalogPdfKeyFromDb
            ? "pdf"
            : catalogSourceFromDb === "manual"
              ? "manual"
              : catalogPdfKeyFromDb
                ? "pdf"
                : "manual"

        const catalogFromDb = toolsConfig.catalog && typeof toolsConfig.catalog === "object" ? toolsConfig.catalog : null
        const categoriesFromDb = catalogFromDb && Array.isArray(catalogFromDb.categories) ? catalogFromDb.categories : null
        const hasServices = Array.isArray(toolsConfig.services) && toolsConfig.services.length > 0
        const servicesList = (toolsConfig.services || []) as { name: string; price: number; duration_minutes?: number }[]

        // Siempre llenar catalog.categories para mostrar en modo manual: BD o migrar desde services.
        const catalogCategories =
          categoriesFromDb !== null && categoriesFromDb.length > 0
            ? categoriesFromDb
            : hasServices
              ? [
                  {
                    name: "Servicios",
                    products: servicesList.map((s) => ({
                      name: s.name,
                      price: s.price,
                      description: s.duration_minutes ? `${s.duration_minutes} min` : undefined,
                    })),
                  },
                ]
              : []

        const normalizedConfig: Client = {
          ...data,
          bot_disabled_by_admin: data.bot_disabled_by_admin ?? false,
          whatsapp_access_token: data.whatsapp_access_token ?? null,
          whatsapp_app_secret: data.whatsapp_app_secret ?? null,
          whatsapp_api_version: data.whatsapp_api_version ?? "v21.0",
          tools_config: {
            ...toolsConfig,
            business_type: toolsConfig.business_type || "general",
            timezone: toolsConfig.timezone || "America/Santo_Domingo",
            currency: toolsConfig.currency || "$",
            business_hours: toolsConfig.business_hours || {
              start: "08:00",
              end: "18:00",
            },
            working_days: toolsConfig.working_days || [1, 2, 3, 4, 5],
            services: Array.isArray(toolsConfig.services) ? toolsConfig.services : [],
            professionals: Array.isArray(toolsConfig.professionals) ? toolsConfig.professionals : [],
            areas: Array.isArray(toolsConfig.areas)
              ? toolsConfig.areas.map((a: unknown) =>
                  typeof a === "string" ? a : (a as { name?: string })?.name ?? ""
                )
              : [],
            occasions: Array.isArray(toolsConfig.occasions) ? toolsConfig.occasions : [],
            catalog_source: catalogSource,
            catalog_pdf_key: catalogPdfKeyFromDb ?? undefined,
            catalog: { categories: catalogCategories },
            calendar_id: toolsConfig.calendar_id,
            contact_phone: toolsConfig.contact_phone,
            menu_url: toolsConfig.menu_url,
            requires_insurance: toolsConfig.requires_insurance ?? false,
            delivery_available: toolsConfig.delivery_available ?? false,
            delivery_fee: toolsConfig.delivery_fee,
            free_delivery_minimum: toolsConfig.free_delivery_minimum,
            slot_duration: toolsConfig.slot_duration,
            delivery_hours: toolsConfig.delivery_hours,
            delivery_duration: toolsConfig.delivery_duration,
            bot_schedule_enabled: toolsConfig.bot_schedule_enabled ?? false,
            bot_schedule_start: toolsConfig.bot_schedule_start || "08:00",
            bot_schedule_end: toolsConfig.bot_schedule_end || "18:00",
            bot_out_of_hours_mode: toolsConfig.bot_out_of_hours_mode || "off",
            bot_out_of_hours_message: toolsConfig.bot_out_of_hours_message || "",
          },
        }
        setConfig(normalizedConfig)
        setSavedConfig(JSON.stringify(normalizedConfig))
      } catch (error) {
        toast({
          title: "Error",
          description: "No se pudo cargar la configuración",
          variant: "destructive",
        })
        setConfig(null)
      } finally {
        setIsLoading(false)
      }
    }

    loadConfig()
  }, [user?.id, toast])

  // Cargar configuración de email
  useEffect(() => {
    const loadEmailSettings = async () => {
      if (!user?.id) return
      try {
        const res = await fetch("/api/client/email-settings", { credentials: "include" })
        if (!res.ok) return
        const data = await res.json()
        if (data.settings) setEmailSettings(data.settings)
        else setEmailSettings({ id: 0, client_id: user.id, primary_color: "#333333", secondary_color: "#666666", logo_url: null, sender_name: null, footer_text: null, templates: {} })
      } catch {
        setEmailSettings({ id: 0, client_id: user.id, primary_color: "#333333", secondary_color: "#666666", logo_url: null, sender_name: null, footer_text: null, templates: {} })
      }
    }
    loadEmailSettings()
  }, [user?.id])

  const handleSave = async () => {
    const latest = configRef.current ?? config
    if (!latest || !user?.id) return

    try {
      setIsSaving(true)
      const response = await fetch("/api/client/config", {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_id: user.id,
          business_name: latest.business_name,
          whatsapp_instance_id: latest.whatsapp_instance_id,
          is_active: latest.is_active,
          system_prompt_template: latest.system_prompt_template,
          tools_config: latest.tools_config,
          whatsapp_access_token: latest.whatsapp_access_token ?? null,
          whatsapp_app_secret: latest.whatsapp_app_secret ?? null,
          whatsapp_api_version: latest.whatsapp_api_version ?? null,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        
        // Si hay errores de validación, mostrarlos
        if (errorData.errors && Array.isArray(errorData.errors)) {
          const errorMessages = errorData.errors.map((e: any) => e.message).join("\n")
          toast({
            title: "Errores de validación",
            description: errorMessages,
            variant: "destructive",
          })
          return
        }
        
        throw new Error(errorData.error || "Failed to save config")
      }

      const result = await response.json()
      
      if (result.client) {
        setConfig(result.client)
        setSavedConfig(JSON.stringify(result.client))
      }

      setShowSaveSuccess(true)
      setTimeout(() => setShowSaveSuccess(false), 4000)

      toast({
        title: "Guardado correctamente",
        description: "Todos los cambios fueron guardados exitosamente.",
      })
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo guardar la configuración",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveEmail = async () => {
    if (!user?.id || !emailSettings) return
    try {
      setEmailSaving(true)
      const res = await fetch("/api/client/email-settings", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          primary_color: emailSettings.primary_color,
          secondary_color: emailSettings.secondary_color,
          logo_url: emailSettings.logo_url,
          sender_name: emailSettings.sender_name || null,
          footer_text: emailSettings.footer_text || null,
          templates: emailSettings.templates || {},
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Error al guardar")
      }
      toast({ title: "Configuración de email guardada" })
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "No se pudo guardar",
        variant: "destructive",
      })
    } finally {
      setEmailSaving(false)
    }
  }

  if (isLoading || !config) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const businessTypes = [
    { value: "general", label: "General" },
    { value: "salon", label: "Servicios + Citas (detailing, taller, spa…)" },
    { value: "store", label: "Tienda / Catálogo (sin citas obligatorias)" },
    { value: "clinic", label: "Clínica / Consultorio" },
    { value: "restaurant", label: "Restaurante" },
  ]

  const timezones = [
    { value: "America/Santo_Domingo", label: "Santo Domingo (AST)" },
    { value: "America/New_York", label: "Nueva York (EST)" },
    { value: "America/Mexico_City", label: "Ciudad de México (CST)" },
    { value: "America/Bogota", label: "Bogotá (COT)" },
  ]

  // 1 = Lunes, 7 = Domingo (según README bot)
  const weekdays = [
    { value: 1, label: "Lunes" },
    { value: 2, label: "Martes" },
    { value: 3, label: "Miércoles" },
    { value: 4, label: "Jueves" },
    { value: 5, label: "Viernes" },
    { value: 6, label: "Sábado" },
    { value: 7, label: "Domingo" },
  ]

  return (
    <div className="space-y-6">
      {/* Unsaved changes warning */}
      {hasUnsavedChanges && (
        <div className="sticky top-0 z-50 rounded-lg border border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/60 p-3 flex items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <span className="text-sm font-medium">Tienes cambios sin guardar. Recuerda guardar antes de salir.</span>
          </div>
          <Button size="sm" onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4 mr-1" />
            {isSaving ? "Guardando..." : "Guardar ahora"}
          </Button>
        </div>
      )}

      {/* Save success banner */}
      {showSaveSuccess && (
        <div className="rounded-lg border border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-950/60 p-3 flex items-center gap-2 text-green-800 dark:text-green-200 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span className="text-sm font-medium">Todos los cambios fueron guardados correctamente.</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Configuración del Bot
          </h1>
          <p className="text-muted-foreground">
            Personaliza el comportamiento de tu asistente virtual
          </p>
        </div>
        <Button onClick={handleSave} disabled={isSaving || !hasUnsavedChanges}>
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? "Guardando..." : "Guardar Cambios"}
        </Button>
      </div>

      {/* Status Card */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <Bot className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">{config.business_name}</p>
                  <p className="text-sm text-muted-foreground">
                    ID: {config.whatsapp_instance_id}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Label htmlFor="bot-active" className="text-sm">
                  Bot Activo
                </Label>
                <Switch
                  id="bot-active"
                  checked={config.is_active}
                  disabled={config.bot_disabled_by_admin}
                  onCheckedChange={(checked) =>
                    setConfig({ ...config, is_active: checked })
                  }
                />
                <Badge
                  variant="outline"
                  className={
                    config.is_active
                      ? "bg-success/10 text-success border-success/20"
                      : "bg-destructive/10 text-destructive border-destructive/20"
                  }
                >
                  {config.is_active ? "Activo" : "Inactivo"}
                </Badge>
              </div>
            </div>

            {/* Admin override warning */}
            {config.bot_disabled_by_admin && (
              <div className="rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 p-3 flex items-start gap-3">
                <ShieldAlert className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-red-800 dark:text-red-200">Bot desactivado por el administrador</p>
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                    El administrador ha desactivado tu bot. No puedes reactivarlo hasta que el administrador lo habilite nuevamente. Contacta a soporte si necesitas asistencia.
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="control" className="space-y-4">
        <TabsList className={`grid w-full ${(config.tools_config.business_type === "clinic" || config.tools_config.business_type === "salon") ? "grid-cols-6" : "grid-cols-5"}`}>
          <TabsTrigger value="control">
            <CalendarClock className="h-4 w-4 mr-2" />
            Control
          </TabsTrigger>
          <TabsTrigger value="business">
            <Building2 className="h-4 w-4 mr-2" />
            Negocio
          </TabsTrigger>
          <TabsTrigger value="prompt">
            <MessageSquare className="h-4 w-4 mr-2" />
            Personalidad
          </TabsTrigger>
          <TabsTrigger value="services">
            <DollarSign className="h-4 w-4 mr-2" />
            Servicios
          </TabsTrigger>
          {(config.tools_config.business_type === "clinic" || config.tools_config.business_type === "salon") && (
            <TabsTrigger value="team">
              <Users className="h-4 w-4 mr-2" />
              Equipo
            </TabsTrigger>
          )}
          <TabsTrigger value="email">
            <Mail className="h-4 w-4 mr-2" />
            Email
          </TabsTrigger>
        </TabsList>

        {/* Control Tab */}
        <TabsContent value="control" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                Estado del Bot
              </CardTitle>
              <CardDescription>
                Enciende o apaga tu bot. Cuando está apagado, no responderá a los mensajes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border border-border p-4">
                <div>
                  <Label htmlFor="bot-active-control" className="font-medium">Bot Encendido</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    {config.is_active
                      ? "El bot está respondiendo mensajes normalmente."
                      : "El bot está apagado y no responderá mensajes."}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    id="bot-active-control"
                    checked={config.is_active}
                    disabled={config.bot_disabled_by_admin}
                    onCheckedChange={(checked) =>
                      setConfig({ ...config, is_active: checked })
                    }
                  />
                  <Badge
                    variant="outline"
                    className={
                      config.is_active
                        ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800"
                        : "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800"
                    }
                  >
                    {config.is_active ? "Encendido" : "Apagado"}
                  </Badge>
                </div>
              </div>

              {config.bot_disabled_by_admin && (
                <div className="rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 p-3 flex items-start gap-3">
                  <ShieldAlert className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-red-800 dark:text-red-200">Bloqueado por el administrador</p>
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                      El administrador ha desactivado tu bot. No puedes reactivarlo. Contacta a soporte.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarClock className="h-5 w-5" />
                Horario Programado del Bot
              </CardTitle>
              <CardDescription>
                Opcional: programa un horario para que el bot funcione solo en cierto rango de horas. Fuera de ese horario puedes elegir que no responda o que envíe un mensaje personalizado.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border border-border p-4">
                <div>
                  <Label htmlFor="schedule-enabled" className="font-medium">Activar horario programado</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Si está activo, el bot solo responderá dentro del horario definido.
                  </p>
                </div>
                <Switch
                  id="schedule-enabled"
                  checked={config.tools_config.bot_schedule_enabled || false}
                  onCheckedChange={(checked) =>
                    setConfig({
                      ...config,
                      tools_config: {
                        ...config.tools_config,
                        bot_schedule_enabled: checked,
                      },
                    })
                  }
                />
              </div>

              {config.tools_config.bot_schedule_enabled && (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Hora de inicio</Label>
                      <Input
                        type="time"
                        value={config.tools_config.bot_schedule_start || "08:00"}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            tools_config: {
                              ...config.tools_config,
                              bot_schedule_start: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Hora de fin</Label>
                      <Input
                        type="time"
                        value={config.tools_config.bot_schedule_end || "18:00"}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            tools_config: {
                              ...config.tools_config,
                              bot_schedule_end: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <Label>Comportamiento fuera de horario</Label>
                    <div className="space-y-2">
                      <label className="flex items-start gap-3 cursor-pointer rounded-lg border border-border p-3 hover:bg-muted/50 transition-colors">
                        <input
                          type="radio"
                          name="out_of_hours_mode"
                          checked={(config.tools_config.bot_out_of_hours_mode || "off") === "off"}
                          onChange={() =>
                            setConfig({
                              ...config,
                              tools_config: {
                                ...config.tools_config,
                                bot_out_of_hours_mode: "off",
                              },
                            })
                          }
                          className="mt-1"
                        />
                        <div>
                          <span className="text-sm font-medium">No responder</span>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            El bot simplemente no responderá los mensajes fuera de horario.
                          </p>
                        </div>
                      </label>
                      <label className="flex items-start gap-3 cursor-pointer rounded-lg border border-border p-3 hover:bg-muted/50 transition-colors">
                        <input
                          type="radio"
                          name="out_of_hours_mode"
                          checked={config.tools_config.bot_out_of_hours_mode === "message"}
                          onChange={() =>
                            setConfig({
                              ...config,
                              tools_config: {
                                ...config.tools_config,
                                bot_out_of_hours_mode: "message",
                              },
                            })
                          }
                          className="mt-1"
                        />
                        <div>
                          <span className="text-sm font-medium">Enviar mensaje de fuera de horario</span>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            El bot enviará un mensaje personalizado indicando que está fuera de horario.
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>

                  {config.tools_config.bot_out_of_hours_mode === "message" && (
                    <div className="space-y-2">
                      <Label>Mensaje fuera de horario</Label>
                      <Textarea
                        placeholder="Ej: Gracias por tu mensaje. Nuestro horario de atención es de 8:00 AM a 6:00 PM. Te responderemos lo antes posible."
                        value={config.tools_config.bot_out_of_hours_message || ""}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            tools_config: {
                              ...config.tools_config,
                              bot_out_of_hours_message: e.target.value,
                            },
                          })
                        }
                        rows={3}
                      />
                      <p className="text-xs text-muted-foreground">
                        Este mensaje se enviará automáticamente cuando alguien escriba fuera del horario programado.
                      </p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Business Tab */}
        <TabsContent value="business" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Información General</CardTitle>
              <CardDescription>
                Configura los datos básicos de tu negocio
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nombre del Negocio</Label>
                  <Input
                    value={config.business_name}
                    onChange={(e) =>
                      setConfig({ ...config, business_name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>WhatsApp Instance ID</Label>
                  <Input
                    value={config.whatsapp_instance_id}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        whatsapp_instance_id: e.target.value,
                      })
                    }
                    placeholder="1234567890"
                  />
                  <p className="text-xs text-muted-foreground">
                    ID del número de WhatsApp en Meta (Phone Number ID)
                  </p>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Conexión WhatsApp (multi-tenant)</h4>
                <p className="text-sm text-muted-foreground">
                  Credenciales de tu app en Meta. El bot usa estas credenciales por cliente.
                </p>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="whatsapp-access-token">Access Token</Label>
                    <Input
                      id="whatsapp-access-token"
                      type="password"
                      autoComplete="off"
                      value={config.whatsapp_access_token ?? ""}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          whatsapp_access_token: e.target.value || null,
                        })
                      }
                      placeholder="EAAxxxx..."
                    />
                    <p className="text-xs text-muted-foreground">
                      Token de acceso permanente desde Meta for Developers
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="whatsapp-app-secret">App Secret</Label>
                    <Input
                      id="whatsapp-app-secret"
                      type="password"
                      autoComplete="off"
                      value={config.whatsapp_app_secret ?? ""}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          whatsapp_app_secret: e.target.value || null,
                        })
                      }
                      placeholder="••••••••"
                    />
                    <p className="text-xs text-muted-foreground">
                      App Secret (verificación de firma del webhook)
                    </p>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="whatsapp-api-version">Versión de API</Label>
                    <Select
                      value={config.whatsapp_api_version ?? "v21.0"}
                      onValueChange={(value) =>
                        setConfig({
                          ...config,
                          whatsapp_api_version: value,
                        })
                      }
                    >
                      <SelectTrigger id="whatsapp-api-version">
                        <SelectValue placeholder="v21.0" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="v21.0">v21.0</SelectItem>
                        <SelectItem value="v22.0">v22.0</SelectItem>
                        <SelectItem value="v23.0">v23.0</SelectItem>
                        <SelectItem value="v24.0">v24.0</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Versión de WhatsApp Cloud API (por defecto v21.0)
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Tipo de Negocio</Label>
                  <Select
                    value={config.tools_config.business_type || "general"}
                    disabled={true}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {businessTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    El tipo de negocio es configurado por el administrador
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Teléfono de Contacto</Label>
                  <Input
                    value={config.tools_config.contact_phone || ""}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        tools_config: {
                          ...config.tools_config,
                          contact_phone: e.target.value,
                        },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Moneda</Label>
                  <Input
                    value={config.tools_config.currency || ""}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        tools_config: {
                          ...config.tools_config,
                          currency: e.target.value,
                        },
                      })
                    }
                    placeholder="RD$, $, €"
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Horarios de Atención
                </h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Zona Horaria</Label>
                    <Select
                      value={config.tools_config.timezone}
                      onValueChange={(value) =>
                        setConfig({
                          ...config,
                          tools_config: {
                            ...config.tools_config,
                            timezone: value,
                          },
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar zona" />
                      </SelectTrigger>
                      <SelectContent>
                        {timezones.map((tz) => (
                          <SelectItem key={tz.value} value={tz.value}>
                            {tz.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Hora de Apertura</Label>
                    <Input
                      type="time"
                      value={config.tools_config.business_hours?.start || "08:00"}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          tools_config: {
                            ...config.tools_config,
                            business_hours: {
                              start: e.target.value,
                              end: config.tools_config.business_hours?.end || "18:00",
                            },
                          },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Hora de Cierre</Label>
                    <Input
                      type="time"
                      value={config.tools_config.business_hours?.end || "18:00"}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          tools_config: {
                            ...config.tools_config,
                            business_hours: {
                              start: config.tools_config.business_hours?.start || "08:00",
                              end: e.target.value,
                            },
                          },
                        })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Días de Trabajo</Label>
                  <div className="flex flex-wrap gap-2">
                    {weekdays.map((day) => {
                      const isSelected = config.tools_config.working_days?.includes(
                        day.value
                      )
                      return (
                        <Button
                          key={day.value}
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            const currentDays =
                              config.tools_config.working_days || []
                            const newDays = isSelected
                              ? currentDays.filter((d) => d !== day.value)
                              : [...currentDays, day.value].sort()
                            setConfig({
                              ...config,
                              tools_config: {
                                ...config.tools_config,
                                working_days: newDays,
                              },
                            })
                          }}
                        >
                          {day.label.slice(0, 3)}
                        </Button>
                      )
                    })}
                  </div>
                </div>

                {/* Duración de slot (salon) - minutos por cita */}
                {config.tools_config.business_type === "salon" && (
                  <div className="space-y-2">
                    <Label>Duración de slot (minutos)</Label>
                    <Input
                      type="number"
                      min={5}
                      value={config.tools_config.slot_duration ?? 30}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          tools_config: {
                            ...config.tools_config,
                            slot_duration: Number(e.target.value) || undefined,
                          },
                        })
                      }
                      placeholder="30"
                    />
                    <p className="text-xs text-muted-foreground">
                      Duración por defecto de cada slot de cita (ej: 30 min)
                    </p>
                  </div>
                )}
              </div>

              <Separator />

              {/* Calendar ID - Solo para salon, restaurant, general (NO para clinic ni store) */}
              {(config.tools_config.business_type === "salon" ||
                config.tools_config.business_type === "restaurant" ||
                config.tools_config.business_type === "general") && (
                <div className="space-y-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Google Calendar
                  </h4>
                  <div className="space-y-2">
                    <Label>Calendar ID</Label>
                    <Input
                      value={config.tools_config.calendar_id || ""}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          tools_config: {
                            ...config.tools_config,
                            calendar_id: e.target.value,
                          },
                        })
                      }
                      placeholder="tu-calendario@calendar.google.com"
                    />
                    <p className="text-xs text-muted-foreground">
                      El ID de tu calendario de Google para sincronizar citas
                    </p>
                  </div>
                </div>
              )}

              {/* Calendar ID para clinic (backup) - Solo si no hay profesionales o como backup */}
              {config.tools_config.business_type === "clinic" && (
                <div className="space-y-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Google Calendar (Backup)
                  </h4>
                  <div className="space-y-2">
                    <Label>Calendar ID Principal (Opcional)</Label>
                    <Input
                      value={config.tools_config.calendar_id || ""}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          tools_config: {
                            ...config.tools_config,
                            calendar_id: e.target.value,
                          },
                        })
                      }
                      placeholder="calendario-backup@calendar.google.com"
                    />
                    <p className="text-xs text-muted-foreground">
                      Calendario de respaldo si un profesional no tiene calendar_id específico
                    </p>
                  </div>
                </div>
              )}

              {/* Configuración general para clínicas: requiere seguro */}
              {config.tools_config.business_type === "clinic" && (
                <div className="space-y-4">
                  <h4 className="font-medium">Configuración para clínicas</h4>
                  <div className="flex items-center justify-between rounded-lg border border-border p-4">
                    <div>
                      <Label htmlFor="requires-insurance" className="font-medium">¿Requiere seguro médico?</Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Si está activo, el bot preguntará si el paciente tiene seguro y qué tipo (ARS, privado, etc.).
                      </p>
                    </div>
                    <Switch
                      id="requires-insurance"
                      checked={config.tools_config.requires_insurance || false}
                      onCheckedChange={(checked) =>
                        setConfig({
                          ...config,
                          tools_config: {
                            ...config.tools_config,
                            requires_insurance: checked,
                          },
                        })
                      }
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Prompt Tab */}
        <TabsContent value="prompt" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Personalidad del Bot</CardTitle>
              <CardDescription>
                Define cómo se comporta y responde tu asistente virtual
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>System Prompt</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPromptPreview(!showPromptPreview)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    {showPromptPreview ? "Editar" : "Vista Previa"}
                  </Button>
                </div>
                {showPromptPreview ? (
                  <div className="rounded-lg border border-border p-4 bg-muted/50">
                    <pre className="text-sm whitespace-pre-wrap font-mono">
                      {config.system_prompt_template}
                    </pre>
                  </div>
                ) : (
                  <Textarea
                    className="min-h-[300px] font-mono text-sm"
                    value={config.system_prompt_template}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        system_prompt_template: e.target.value,
                      })
                    }
                  />
                )}
                <p className="text-xs text-muted-foreground">
                  Este es el prompt que define la personalidad y comportamiento
                  de tu asistente. Puedes usar Markdown para formatear.
                </p>
                <div className="rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30 p-3 text-sm text-amber-800 dark:text-amber-200">
                  <strong>Prioridad máxima:</strong> Este prompt se incluye al final de las instrucciones del bot. En caso de conflicto, tus instrucciones prevalecen sobre las reglas automáticas (útil para excepciones, ej: &quot;La Dra. X no acepta seguro&quot;).
                </div>
              </div>

              <div className="rounded-lg border border-border p-4 bg-primary/5">
                <h4 className="font-medium mb-2">Tips para un buen prompt:</h4>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Define claramente el rol del asistente</li>
                  <li>Especifica el tono de comunicación (formal, amigable, etc.)</li>
                  <li>Lista las tareas principales que debe realizar</li>
                  <li>Incluye información sobre tu negocio</li>
                  <li>Define cómo manejar situaciones especiales</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Services Tab = Catálogo (lo que el bot ofrece: manual o PDF) */}
        <TabsContent value="services" className="space-y-4">
          {/* Areas para restaurant (nombres: Terraza, Salón principal, VIP) */}
          {config.tools_config.business_type === "restaurant" && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Áreas del Restaurante</CardTitle>
                  <CardDescription>
                    Nombres de áreas disponibles para reservas (ej: Terraza, Salón principal, VIP)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(config.tools_config.areas || []).map((areaName, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-4 p-4 rounded-lg border border-border"
                    >
                      <Input
                        className="flex-1"
                        placeholder="Nombre del área (ej: Terraza)"
                        value={typeof areaName === "string" ? areaName : ""}
                        onChange={(e) => {
                          const newAreas = [...(config.tools_config.areas || [])]
                          newAreas[index] = e.target.value
                          setConfig({
                            ...config,
                            tools_config: {
                              ...config.tools_config,
                              areas: newAreas,
                            },
                          })
                        }}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => {
                          setConfig((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  tools_config: {
                                    ...prev.tools_config,
                                    areas: (prev.tools_config.areas ?? []).filter((_, i) => i !== index),
                                  },
                                }
                              : prev
                          )
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full bg-transparent"
                    onClick={() => {
                      setConfig((prev) =>
                        prev
                          ? {
                              ...prev,
                              tools_config: {
                                ...prev.tools_config,
                                areas: [...(prev.tools_config.areas ?? []), ""],
                              },
                            }
                          : prev
                      )
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Área
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Ocasiones Especiales</CardTitle>
                  <CardDescription>
                    Lista de ocasiones especiales disponibles
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {config.tools_config.occasions?.map((occasion, index) => (
                      <Badge key={index} variant="secondary" className="p-2">
                        {occasion}
                        <button
                          onClick={() => {
                            const newOccasions =
                              config.tools_config.occasions?.filter(
                                (_, i) => i !== index
                              )
                            setConfig({
                              ...config,
                              tools_config: {
                                ...config.tools_config,
                                occasions: newOccasions,
                              },
                            })
                          }}
                          className="ml-2 hover:text-destructive"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Nueva ocasión (ej: Cena Romántica)"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          const input = e.currentTarget
                          const value = input.value.trim()
                          if (value) {
                            const newOccasions = [
                              ...(config.tools_config.occasions || []),
                              value,
                            ]
                            setConfig({
                              ...config,
                              tools_config: {
                                ...config.tools_config,
                                occasions: newOccasions,
                              },
                            })
                            input.value = ""
                          }
                        }
                      }}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Menú</CardTitle>
                  <CardDescription>
                    URL del menú del restaurante (opcional)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Input
                    type="url"
                    placeholder="https://restaurante.com/menu"
                    value={config.tools_config.menu_url || ""}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        tools_config: {
                          ...config.tools_config,
                          menu_url: e.target.value,
                        },
                      })
                    }
                  />
                </CardContent>
              </Card>
            </>
          )}

          {/* Catálogo: lo que el bot ofrece. Manual (categorías/productos) o PDF. El bot lo lee. */}
          <Card>
            <CardHeader>
              <CardTitle>Catálogo</CardTitle>
              <CardDescription>
                Lo que ofreces al cliente. Manual (categorías y productos/servicios) o sube un PDF. Tu bot leerá esto.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Origen del catálogo</Label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="catalog_source"
                      checked={(config.tools_config.catalog_source || "manual") === "manual"}
                      onChange={() => {
                        setConfig((prev) =>
                          prev
                            ? {
                                ...prev,
                                tools_config: {
                                  ...prev.tools_config,
                                  catalog_source: "manual",
                                  // No borrar catalog_pdf_key: el cliente puede volver a PDF y seguirá ahí
                                },
                              }
                            : prev
                        )
                      }}
                      className="rounded border-input"
                    />
                    <span>Manual (categorías y productos)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="catalog_source"
                      checked={config.tools_config.catalog_source === "pdf"}
                      onChange={() => {
                        setConfig((prev) =>
                          prev
                            ? {
                                ...prev,
                                tools_config: {
                                  ...prev.tools_config,
                                  catalog_source: "pdf",
                                },
                              }
                            : prev
                        )
                      }}
                      className="rounded border-input"
                    />
                    <span>Catálogo en PDF</span>
                  </label>
                </div>
              </div>

              {(config.tools_config.catalog_source || "manual") === "pdf" && (
                <CatalogPdfUpload
                  clientId={user?.id}
                  catalogPdfKey={config.tools_config.catalog_pdf_key}
                  onUploaded={(key) => {
                    setConfig((prev) =>
                      prev
                        ? {
                            ...prev,
                            tools_config: {
                              ...prev.tools_config,
                              catalog_pdf_key: key,
                            },
                          }
                        : prev
                    )
                  }}
                  onCleared={() => {
                    setConfig((prev) =>
                      prev
                        ? {
                            ...prev,
                            tools_config: {
                              ...prev.tools_config,
                              catalog_pdf_key: undefined,
                            },
                          }
                        : prev
                    )
                  }}
                />
              )}

              {(config.tools_config.catalog_source || "manual") === "manual" && (
                <>
                  {(config.tools_config.catalog?.categories ?? []).map((category, catIndex) => (
                    <div
                      key={catIndex}
                      className="p-4 rounded-lg border border-border space-y-4"
                    >
                      <div className="flex items-center gap-2">
                        <Input
                          placeholder="Nombre de categoría"
                          value={category.name}
                          onChange={(e) => {
                            const name = e.target.value
                            setConfig((prev) => {
                              if (!prev) return prev
                              const cats = [...(prev.tools_config.catalog?.categories ?? [])]
                              if (cats[catIndex]) cats[catIndex] = { ...cats[catIndex], name }
                              return {
                                ...prev,
                                tools_config: {
                                  ...prev.tools_config,
                                  catalog: { categories: cats },
                                },
                              }
                            })
                          }}
                          className="font-semibold"
                        />
                            <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => {
                            setConfig((prev) => {
                              if (!prev) return prev
                              const cats = prev.tools_config.catalog?.categories ?? []
                              const newCategories = cats.filter((_, i) => i !== catIndex)
                              return {
                                ...prev,
                                tools_config: {
                                  ...prev.tools_config,
                                  catalog: { categories: newCategories },
                                },
                              }
                            })
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="space-y-2 pl-4">
                        {(category.products ?? []).map((product, prodIndex) => (
                          <div
                            key={prodIndex}
                            className="flex flex-wrap items-center gap-2"
                          >
                            <Input
                              placeholder="Nombre del producto/servicio"
                              value={product.name}
                              onChange={(e) => {
                                const name = e.target.value
                                setConfig((prev) => {
                                  if (!prev) return prev
                                  const cats = [...(prev.tools_config.catalog?.categories ?? [])]
                                  const prods = [...(cats[catIndex]?.products ?? [])]
                                  if (prods[prodIndex]) prods[prodIndex] = { ...prods[prodIndex], name }
                                  if (cats[catIndex]) cats[catIndex] = { ...cats[catIndex], products: prods }
                                  return {
                                    ...prev,
                                    tools_config: {
                                      ...prev.tools_config,
                                      catalog: { categories: cats },
                                    },
                                  }
                                })
                              }}
                              className="min-w-[140px]"
                            />
                            <Input
                              type="number"
                              placeholder="Precio"
                              value={product.price}
                              onChange={(e) => {
                                const price = Number(e.target.value)
                                setConfig((prev) => {
                                  if (!prev) return prev
                                  const cats = [...(prev.tools_config.catalog?.categories ?? [])]
                                  const prods = [...(cats[catIndex]?.products ?? [])]
                                  if (prods[prodIndex]) prods[prodIndex] = { ...prods[prodIndex], price }
                                  if (cats[catIndex]) cats[catIndex] = { ...cats[catIndex], products: prods }
                                  return {
                                    ...prev,
                                    tools_config: {
                                      ...prev.tools_config,
                                      catalog: { categories: cats },
                                    },
                                  }
                                })
                              }}
                              className="w-28"
                            />
                            <Input
                              placeholder="Descripción (opcional)"
                              value={product.description ?? ""}
                              onChange={(e) => {
                                const description = e.target.value || undefined
                                setConfig((prev) => {
                                  if (!prev) return prev
                                  const cats = [...(prev.tools_config.catalog?.categories ?? [])]
                                  const prods = [...(cats[catIndex]?.products ?? [])]
                                  if (prods[prodIndex]) prods[prodIndex] = { ...prods[prodIndex], description }
                                  if (cats[catIndex]) cats[catIndex] = { ...cats[catIndex], products: prods }
                                  return {
                                    ...prev,
                                    tools_config: {
                                      ...prev.tools_config,
                                      catalog: { categories: cats },
                                    },
                                  }
                                })
                              }}
                              className="min-w-[180px] flex-1 max-w-xs"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => {
                                setConfig((prev) => {
                                  if (!prev) return prev
                                  const cats = [...(prev.tools_config.catalog?.categories ?? [])]
                                  const prodsAntes = cats[catIndex]?.products ?? []
                                  const prods = prodsAntes.filter((_, i) => i !== prodIndex)
                                  if (cats[catIndex]) cats[catIndex] = { ...cats[catIndex], products: prods }
                                  return {
                                    ...prev,
                                    tools_config: {
                                      ...prev.tools_config,
                                      catalog: { categories: cats },
                                    },
                                  }
                                })
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setConfig((prev) => {
                              if (!prev) return prev
                              const cats = [...(prev.tools_config.catalog?.categories ?? [])]
                              const prods = [...(cats[catIndex]?.products ?? []), { name: "", price: 0 }]
                              if (cats[catIndex]) cats[catIndex] = { ...cats[catIndex], products: prods }
                              return {
                                ...prev,
                                tools_config: {
                                  ...prev.tools_config,
                                  catalog: { categories: cats },
                                },
                              }
                            })
                          }}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Agregar Producto
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full bg-transparent"
                    onClick={() => {
                      setConfig((prev) => {
                        if (!prev) return prev
                        const categories = [...(prev.tools_config.catalog?.categories ?? []), { name: "", products: [] }]
                        return {
                          ...prev,
                          tools_config: {
                            ...prev.tools_config,
                            catalog: { categories },
                          },
                        }
                      })
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Categoría
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

              {/* Entrega a domicilio: solo para tipo store */}
              {config.tools_config.business_type === "store" && (
              <Card>
                <CardHeader>
                  <CardTitle>Entrega a Domicilio</CardTitle>
                  <CardDescription>
                    Opcional. Si activas entregas, el bot podrá agendar slots de entrega (pago contra entrega). Necesitas un Calendar ID.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>¿Ofrece entrega a domicilio?</Label>
                    <Switch
                      checked={config.tools_config.delivery_available || false}
                      onCheckedChange={(checked) =>
                        setConfig({
                          ...config,
                          tools_config: {
                            ...config.tools_config,
                            delivery_available: checked,
                          },
                        })
                      }
                    />
                  </div>
                  {config.tools_config.delivery_available && (
                    <>
                      <div className="space-y-2">
                        <Label>Calendar ID (para agendar entregas)</Label>
                        <Input
                          value={config.tools_config.calendar_id || ""}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              tools_config: {
                                ...config.tools_config,
                                calendar_id: e.target.value,
                              },
                            })
                          }
                          placeholder="xxx@group.calendar.google.com"
                        />
                        <p className="text-xs text-muted-foreground">
                          Obligatorio si ofreces entregas. Donde se crean los slots de entrega.
                        </p>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Costo de Entrega</Label>
                          <Input
                            type="number"
                            value={config.tools_config.delivery_fee || 0}
                            onChange={(e) =>
                              setConfig({
                                ...config,
                                tools_config: {
                                  ...config.tools_config,
                                  delivery_fee: Number(e.target.value),
                                },
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Mínimo para Entrega Gratis</Label>
                          <Input
                            type="number"
                            value={config.tools_config.free_delivery_minimum || 0}
                            onChange={(e) =>
                              setConfig({
                                ...config,
                                tools_config: {
                                  ...config.tools_config,
                                  free_delivery_minimum: Number(e.target.value),
                                },
                              })
                            }
                          />
                        </div>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Horario de entregas (inicio)</Label>
                          <Input
                            type="time"
                            value={config.tools_config.delivery_hours?.start || "09:00"}
                            onChange={(e) =>
                              setConfig({
                                ...config,
                                tools_config: {
                                  ...config.tools_config,
                                  delivery_hours: {
                                    start: e.target.value,
                                    end: config.tools_config.delivery_hours?.end || "18:00",
                                  },
                                },
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Horario de entregas (fin)</Label>
                          <Input
                            type="time"
                            value={config.tools_config.delivery_hours?.end || "18:00"}
                            onChange={(e) =>
                              setConfig({
                                ...config,
                                tools_config: {
                                  ...config.tools_config,
                                  delivery_hours: {
                                    start: config.tools_config.delivery_hours?.start || "09:00",
                                    end: e.target.value,
                                  },
                                },
                              })
                            }
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Duración estimada de entrega (minutos)</Label>
                        <Input
                          type="number"
                          min={1}
                          value={config.tools_config.delivery_duration ?? 60}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              tools_config: {
                                ...config.tools_config,
                                delivery_duration: Number(e.target.value) || undefined,
                              },
                            })
                          }
                        />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
              )}
        </TabsContent>

        {/* Email Tab */}
        <TabsContent value="email" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Email</CardTitle>
              <CardDescription>
                Personaliza los colores, logo y texto de los correos enviados a tus clientes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <LogoUpload
                  clientId={user?.id}
                  logoUrl={emailSettings?.logo_url}
                  logoDisplayUrl={emailSettings?.logo_display_url}
                  onUploaded={(key) =>
                    setEmailSettings((prev) =>
                      prev ? { ...prev, logo_url: key } : user ? { id: 0, client_id: user.id, primary_color: "#333333", secondary_color: "#666666", logo_url: key, sender_name: null, footer_text: null, templates: {} } : prev
                    )
                  }
                  onCleared={() => setEmailSettings((prev) => (prev ? { ...prev, logo_url: null } : prev))}
                />
                <Button onClick={handleSaveEmail} disabled={emailSaving}>
                  {emailSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Guardar Email
                </Button>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Color primario</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={emailSettings?.primary_color || "#333333"}
                      onChange={(e) => setEmailSettings((prev) => (prev ? { ...prev, primary_color: e.target.value } : { id: 0, client_id: user!.id, primary_color: e.target.value, secondary_color: "#666666", logo_url: null, sender_name: null, footer_text: null, templates: {} }))}
                      className="h-10 w-14 p-1 cursor-pointer"
                    />
                    <Input
                      value={emailSettings?.primary_color || "#333333"}
                      onChange={(e) => setEmailSettings((prev) => (prev ? { ...prev, primary_color: e.target.value } : { id: 0, client_id: user!.id, primary_color: e.target.value, secondary_color: "#666666", logo_url: null, sender_name: null, footer_text: null, templates: {} }))}
                      className="font-mono"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Color secundario</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={emailSettings?.secondary_color || "#666666"}
                      onChange={(e) => setEmailSettings((prev) => (prev ? { ...prev, secondary_color: e.target.value } : { id: 0, client_id: user!.id, primary_color: "#333333", secondary_color: e.target.value, logo_url: null, sender_name: null, footer_text: null, templates: {} }))}
                      className="h-10 w-14 p-1 cursor-pointer"
                    />
                    <Input
                      value={emailSettings?.secondary_color || "#666666"}
                      onChange={(e) => setEmailSettings((prev) => (prev ? { ...prev, secondary_color: e.target.value } : { id: 0, client_id: user!.id, primary_color: "#333333", secondary_color: e.target.value, logo_url: null, sender_name: null, footer_text: null, templates: {} }))}
                      className="font-mono"
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Nombre del remitente</Label>
                <Input
                  placeholder="Ej: Clínica Moreira"
                  value={emailSettings?.sender_name || ""}
                  onChange={(e) => setEmailSettings((prev) => (prev ? { ...prev, sender_name: e.target.value || null } : { id: 0, client_id: user!.id, primary_color: "#333333", secondary_color: "#666666", logo_url: null, sender_name: e.target.value || null, footer_text: null, templates: {} }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Texto del pie de página</Label>
                <Textarea
                  placeholder="Ej: © 2025 Mi Negocio. Todos los derechos reservados."
                  value={emailSettings?.footer_text || ""}
                  onChange={(e) => setEmailSettings((prev) => (prev ? { ...prev, footer_text: e.target.value || null } : { id: 0, client_id: user!.id, primary_color: "#333333", secondary_color: "#666666", logo_url: null, sender_name: null, footer_text: e.target.value || null, templates: {} }))}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Team Tab */}
        <TabsContent value="team" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profesionales</CardTitle>
              <CardDescription>
                Configura el equipo de profesionales de tu negocio
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.isArray(config.tools_config.professionals) && config.tools_config.professionals.length > 0 ? (
                <>
                  {config.tools_config.professionals.map((professional, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-4 p-4 rounded-lg border border-border"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                        {professional.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)}
                      </div>
                      <div className="flex-1 space-y-4">
                        {/* Primera fila: Nombre, Especialidad, Calendar ID */}
                        <div className="grid gap-4 md:grid-cols-3">
                          <Input
                            placeholder="Nombre"
                            value={professional.name}
                            onChange={(e) => {
                              const newProfessionals = [
                                ...(config.tools_config.professionals || []),
                              ]
                              newProfessionals[index] = {
                                ...professional,
                                name: e.target.value,
                              }
                              setConfig({
                                ...config,
                                tools_config: {
                                  ...config.tools_config,
                                  professionals: newProfessionals,
                                },
                              })
                            }}
                          />
                          <Input
                            placeholder="Especialidad"
                            value={professional.specialty || ""}
                            onChange={(e) => {
                              const newProfessionals = [
                                ...(config.tools_config.professionals || []),
                              ]
                              newProfessionals[index] = {
                                ...professional,
                                specialty: e.target.value,
                              }
                              setConfig({
                                ...config,
                                tools_config: {
                                  ...config.tools_config,
                                  professionals: newProfessionals,
                                },
                              })
                            }}
                          />
                          {(config.tools_config.business_type === "clinic" ||
                            config.tools_config.business_type === "salon") && (
                            <Input
                              placeholder="Calendar ID (opcional)"
                              value={professional.calendar_id || ""}
                              onChange={(e) => {
                                const newProfessionals = [
                                  ...(config.tools_config.professionals || []),
                                ]
                                newProfessionals[index] = {
                                  ...professional,
                                  calendar_id: e.target.value,
                                }
                                setConfig({
                                  ...config,
                                  tools_config: {
                                    ...config.tools_config,
                                    professionals: newProfessionals,
                                  },
                                })
                              }}
                            />
                          )}
                        </div>

                        {/* Para salón: Duración de slot y horario individual (opcionales) */}
                        {config.tools_config.business_type === "salon" && (
                          <>
                            <div className="grid gap-4 md:grid-cols-2">
                              <div className="space-y-2">
                                <Label className="text-xs">Duración de cita (min)</Label>
                                <Input
                                  type="number"
                                  min={5}
                                  placeholder="60"
                                  value={professional.slot_duration ?? ""}
                                  onChange={(e) => {
                                    const newProfessionals = [
                                      ...(config.tools_config.professionals || []),
                                    ]
                                    newProfessionals[index] = {
                                      ...professional,
                                      slot_duration: Number(e.target.value) || undefined,
                                    }
                                    setConfig({
                                      ...config,
                                      tools_config: {
                                        ...config.tools_config,
                                        professionals: newProfessionals,
                                      },
                                    })
                                  }}
                                />
                                <p className="text-xs text-muted-foreground">
                                  Duración de cada slot en minutos (ej: 60).
                                </p>
                              </div>
                            </div>
                            <div className="grid gap-4 md:grid-cols-2">
                              <div className="space-y-2">
                                <Label className="text-xs">Horario individual (inicio)</Label>
                                <Input
                                  type="time"
                                  value={professional.business_hours?.start || ""}
                                  onChange={(e) => {
                                    const newProfessionals = [
                                      ...(config.tools_config.professionals || []),
                                    ]
                                    newProfessionals[index] = {
                                      ...professional,
                                      business_hours: {
                                        start: e.target.value,
                                        end: professional.business_hours?.end || "18:00",
                                      },
                                    }
                                    setConfig({
                                      ...config,
                                      tools_config: {
                                        ...config.tools_config,
                                        professionals: newProfessionals,
                                      },
                                    })
                                  }}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-xs">Horario individual (fin)</Label>
                                <Input
                                  type="time"
                                  value={professional.business_hours?.end || ""}
                                  onChange={(e) => {
                                    const newProfessionals = [
                                      ...(config.tools_config.professionals || []),
                                    ]
                                    newProfessionals[index] = {
                                      ...professional,
                                      business_hours: {
                                        start: professional.business_hours?.start || "08:00",
                                        end: e.target.value,
                                      },
                                    }
                                    setConfig({
                                      ...config,
                                      tools_config: {
                                        ...config.tools_config,
                                        professionals: newProfessionals,
                                      },
                                    })
                                  }}
                                />
                              </div>
                            </div>
                            {/* Días de trabajo del profesional (salon) */}
                            <div className="space-y-2">
                              <Label className="text-xs">Días de trabajo</Label>
                              <div className="flex flex-wrap gap-2">
                                {weekdays.map((day) => {
                                  const isSelected = professional.working_days?.includes(day.value) || false
                                  return (
                                    <Button
                                      key={day.value}
                                      type="button"
                                      variant={isSelected ? "default" : "outline"}
                                      size="sm"
                                      className="h-8"
                                      onClick={() => {
                                        const newProfessionals = [
                                          ...(config.tools_config.professionals || []),
                                        ]
                                        const currentDays = professional.working_days || []
                                        const newDays = isSelected
                                          ? currentDays.filter((d) => d !== day.value)
                                          : [...currentDays, day.value].sort()
                                        newProfessionals[index] = {
                                          ...professional,
                                          working_days: newDays,
                                        }
                                        setConfig({
                                          ...config,
                                          tools_config: {
                                            ...config.tools_config,
                                            professionals: newProfessionals,
                                          },
                                        })
                                      }}
                                    >
                                      {day.label.slice(0, 3)}
                                    </Button>
                                  )
                                })}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Días en que este profesional atiende (ej: Lun, Mar, Vie).
                              </p>
                            </div>
                          </>
                        )}

                        {/* Segunda fila: Para clínicas - Precio, Duración, Horarios, Días */}
                        {config.tools_config.business_type === "clinic" && (
                          <>
                            <div className="grid gap-4 md:grid-cols-2">
                              <div className="space-y-2">
                                <Label className="text-xs">Precio de consulta</Label>
                                <Input
                                  type="number"
                                  min={0}
                                  placeholder="1500"
                                  value={professional.consultation_price ?? ""}
                                  onChange={(e) => {
                                    const newProfessionals = [
                                      ...(config.tools_config.professionals || []),
                                    ]
                                    newProfessionals[index] = {
                                      ...professional,
                                      consultation_price: Number(e.target.value) || undefined,
                                    }
                                    setConfig({
                                      ...config,
                                      tools_config: {
                                        ...config.tools_config,
                                        professionals: newProfessionals,
                                      },
                                    })
                                  }}
                                />
                                <p className="text-xs text-muted-foreground">
                                  Ej: 1500. El bot mostrará este precio por consulta (ej: RD$1,500 si usas {config.tools_config.currency || "RD$"}).
                                </p>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-xs">Duración de cita (min)</Label>
                                <Input
                                  type="number"
                                  min={5}
                                  placeholder="60"
                                  value={professional.slot_duration ?? ""}
                                  onChange={(e) => {
                                    const newProfessionals = [
                                      ...(config.tools_config.professionals || []),
                                    ]
                                    newProfessionals[index] = {
                                      ...professional,
                                      slot_duration: Number(e.target.value) || undefined,
                                    }
                                    setConfig({
                                      ...config,
                                      tools_config: {
                                        ...config.tools_config,
                                        professionals: newProfessionals,
                                      },
                                    })
                                  }}
                                />
                                <p className="text-xs text-muted-foreground">
                                  Duración de cada cita en minutos (ej: 60).
                                </p>
                              </div>
                            </div>

                            {/* Horario individual del profesional */}
                            <div className="grid gap-4 md:grid-cols-2">
                              <div className="space-y-2">
                                <Label className="text-xs">Horario individual (inicio)</Label>
                                <Input
                                  type="time"
                                  value={professional.business_hours?.start || ""}
                                  onChange={(e) => {
                                    const newProfessionals = [
                                      ...(config.tools_config.professionals || []),
                                    ]
                                    newProfessionals[index] = {
                                      ...professional,
                                      business_hours: {
                                        start: e.target.value,
                                        end: professional.business_hours?.end || "18:00",
                                      },
                                    }
                                    setConfig({
                                      ...config,
                                      tools_config: {
                                        ...config.tools_config,
                                        professionals: newProfessionals,
                                      },
                                    })
                                  }}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-xs">Horario individual (fin)</Label>
                                <Input
                                  type="time"
                                  value={professional.business_hours?.end || ""}
                                  onChange={(e) => {
                                    const newProfessionals = [
                                      ...(config.tools_config.professionals || []),
                                    ]
                                    newProfessionals[index] = {
                                      ...professional,
                                      business_hours: {
                                        start: professional.business_hours?.start || "08:00",
                                        end: e.target.value,
                                      },
                                    }
                                    setConfig({
                                      ...config,
                                      tools_config: {
                                        ...config.tools_config,
                                        professionals: newProfessionals,
                                      },
                                    })
                                  }}
                                />
                              </div>
                            </div>

                            {/* Días de trabajo del profesional (ej: Lun, Mar, Vie) */}
                            <div className="space-y-2">
                              <Label className="text-xs">Días de trabajo</Label>
                              <div className="flex flex-wrap gap-2">
                                {weekdays.map((day) => {
                                  const isSelected = professional.working_days?.includes(day.value) || false
                                  return (
                                    <Button
                                      key={day.value}
                                      type="button"
                                      variant={isSelected ? "default" : "outline"}
                                      size="sm"
                                      className="h-8"
                                      onClick={() => {
                                        const newProfessionals = [
                                          ...(config.tools_config.professionals || []),
                                        ]
                                        const currentDays = professional.working_days || []
                                        const newDays = isSelected
                                          ? currentDays.filter((d) => d !== day.value)
                                          : [...currentDays, day.value].sort()
                                        newProfessionals[index] = {
                                          ...professional,
                                          working_days: newDays,
                                        }
                                        setConfig({
                                          ...config,
                                          tools_config: {
                                            ...config.tools_config,
                                            professionals: newProfessionals,
                                          },
                                        })
                                      }}
                                    >
                                      {day.label.slice(0, 3)}
                                    </Button>
                                  )
                                })}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => {
                          const newProfessionals =
                            config.tools_config.professionals?.filter(
                              (_, i) => i !== index
                            )
                          setConfig({
                            ...config,
                            tools_config: {
                              ...config.tools_config,
                              professionals: newProfessionals,
                            },
                          })
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No hay profesionales configurados</p>
                  <p className="text-sm mt-2">Agrega tu primer profesional usando el botón de abajo</p>
                </div>
              )}

              <Button
                variant="outline"
                className="w-full bg-transparent"
                onClick={() => {
                  type Prof = NonNullable<Client["tools_config"]["professionals"]>[number]
                  const baseProfessional: Prof = {
                    id: `prof_${Date.now()}`,
                    name: "",
                    specialty: "",
                  }

                  if (config.tools_config.business_type === "clinic") {
                    baseProfessional.calendar_id = ""
                    baseProfessional.consultation_price = undefined
                    baseProfessional.slot_duration = 30
                    baseProfessional.working_days = []
                    baseProfessional.business_hours = {
                      start: "08:00",
                      end: "18:00",
                    }
                  }
                  if (config.tools_config.business_type === "salon") {
                    baseProfessional.slot_duration = 60
                    baseProfessional.business_hours = {
                      start: "08:00",
                      end: "17:00",
                    }
                    baseProfessional.working_days = []
                  }

                  const newProfessionals: Prof[] = [
                    ...(config.tools_config.professionals || []),
                    baseProfessional,
                  ]
                  setConfig({
                    ...config,
                    tools_config: {
                      ...config.tools_config,
                      professionals: newProfessionals,
                    },
                  })
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar Profesional
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
