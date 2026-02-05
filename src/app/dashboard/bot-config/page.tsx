"use client"

import { useState, useEffect, useRef } from "react"
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
  Settings,
  Eye,
  Loader2,
  FileUp,
  FileText,
  ExternalLink,
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

export default function BotConfigPage() {
  const { user } = useAuth()
  const [config, setConfig] = useState<Client | null>(null)
  const configRef = useRef<Client | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showPromptPreview, setShowPromptPreview] = useState(false)
  const { toast } = useToast()

  // Mantener ref actualizada para que Guardar siempre envíe el estado más reciente (evita que borrados no se persistan)
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

        console.log("[loadConfig] Respuesta API (data):", data)
        console.log("[loadConfig] data.tools_config (crudo):", data.tools_config)

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

        console.log("[loadConfig] toolsConfig parseado:", toolsConfig)
        console.log("[loadConfig] BD catalog_source:", toolsConfig.catalog_source, "| catalog_pdf_key:", toolsConfig.catalog_pdf_key, "| catalog:", toolsConfig.catalog, "| services:", toolsConfig.services)

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

        console.log("[loadConfig] derivado:", {
          catalogPdfKeyFromDb,
          catalogSourceFromDb,
          catalogSource,
          catalogCategoriesLength: catalogCategories.length,
        })

        const normalizedConfig: Client = {
          ...data,
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
            // Campos opcionales - usar valores existentes o undefined
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
          },
        }
        setConfig(normalizedConfig)
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
      
      // Actualizar config con la respuesta del servidor (normalizada)
      if (result.client) {
        setConfig(result.client)
      }

      toast({
        title: "Éxito",
        description: "Configuración guardada correctamente",
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Configuración del Bot
          </h1>
          <p className="text-muted-foreground">
            Personaliza el comportamiento de tu asistente virtual
          </p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? "Guardando..." : "Guardar Cambios"}
        </Button>
      </div>

      {/* Status Card */}
      <Card>
        <CardContent className="p-4">
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
        </CardContent>
      </Card>

      <Tabs defaultValue="business" className="space-y-4">
        <TabsList className={`grid w-full ${(config.tools_config.business_type === "clinic" || config.tools_config.business_type === "salon") ? "grid-cols-4" : "grid-cols-3"}`}>
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
        </TabsList>

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
