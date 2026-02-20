"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Save, ImageIcon } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"

type EmailSettings = {
  primary_color: string
  secondary_color: string
  logo_url: string | null
  sender_name: string | null
  footer_text: string | null
  templates: Record<string, unknown> | null
  logo_display_url?: string | null
}

export default function EmailSettingsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [settings, setSettings] = useState<EmailSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    const load = async () => {
      if (!user?.id) return
      try {
        const res = await fetch("/api/client/email-settings", { credentials: "include" })
        if (res.ok) {
          const data = await res.json()
          setSettings(
            data.settings || {
              primary_color: "#333333",
              secondary_color: "#666666",
              logo_url: null,
              sender_name: null,
              footer_text: null,
              templates: {},
            }
          )
        }
      } catch {
        setSettings({
          primary_color: "#333333",
          secondary_color: "#666666",
          logo_url: null,
          sender_name: null,
          footer_text: null,
          templates: {},
        })
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [user?.id])

  const handleSave = async () => {
    if (!settings) return
    setIsSaving(true)
    try {
      const res = await fetch("/api/client/email-settings", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          primary_color: settings.primary_color,
          secondary_color: settings.secondary_color,
          logo_url: settings.logo_url,
          sender_name: settings.sender_name || null,
          footer_text: settings.footer_text || null,
          templates: settings.templates || {},
        }),
      })
      if (!res.ok) throw new Error("Error al guardar")
      toast({ title: "Configuración de email guardada" })
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "No se pudo guardar",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      setSettings((prev) => (prev ? { ...prev, logo_url: data.logo_url } : prev))
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

  if (isLoading || !settings) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Configuración de Email</h1>
          <p className="text-muted-foreground">
            Personaliza los colores, logo y texto de los correos enviados a tus clientes
          </p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Guardar Cambios
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Logo</CardTitle>
          <CardDescription>Sube el logo de tu negocio para los correos</CardDescription>
        </CardHeader>
        <CardContent>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            className="hidden"
            onChange={handleLogoUpload}
            disabled={uploading}
          />
          {settings.logo_url ? (
            <div className="flex flex-wrap items-center gap-3">
              {settings.logo_display_url && (
                <img src={settings.logo_display_url} alt="Logo" className="h-16 w-16 object-contain rounded border" />
              )}
              <Button variant="outline" size="sm" disabled={uploading} onClick={() => fileInputRef.current?.click()}>
                {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ImageIcon className="h-4 w-4 mr-2" />}
                Cambiar logo
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive"
                onClick={() => setSettings((prev) => (prev ? { ...prev, logo_url: null } : prev))}
              >
                Quitar logo
              </Button>
            </div>
          ) : (
            <Button variant="outline" size="sm" disabled={uploading} onClick={() => fileInputRef.current?.click()}>
              {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ImageIcon className="h-4 w-4 mr-2" />}
              Subir logo
            </Button>
          )}
          <p className="text-xs text-muted-foreground mt-2">PNG, JPG o WebP. Máx. 2 MB.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Colores</CardTitle>
          <CardDescription>Define los colores del email</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Color primario</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={settings.primary_color}
                  onChange={(e) => setSettings((prev) => (prev ? { ...prev, primary_color: e.target.value } : prev))}
                  className="h-10 w-14 p-1 cursor-pointer"
                />
                <Input
                  value={settings.primary_color}
                  onChange={(e) => setSettings((prev) => (prev ? { ...prev, primary_color: e.target.value } : prev))}
                  className="font-mono"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Color secundario</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={settings.secondary_color}
                  onChange={(e) => setSettings((prev) => (prev ? { ...prev, secondary_color: e.target.value } : prev))}
                  className="h-10 w-14 p-1 cursor-pointer"
                />
                <Input
                  value={settings.secondary_color}
                  onChange={(e) => setSettings((prev) => (prev ? { ...prev, secondary_color: e.target.value } : prev))}
                  className="font-mono"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Remitente y Pie de Página</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Nombre del remitente</Label>
            <Input
              placeholder="Ej: Clínica Moreira"
              value={settings.sender_name || ""}
              onChange={(e) => setSettings((prev) => (prev ? { ...prev, sender_name: e.target.value || null } : prev))}
            />
          </div>
          <div className="space-y-2">
            <Label>Texto del pie de página</Label>
            <Textarea
              placeholder="Ej: © 2025 Mi Negocio. Todos los derechos reservados."
              value={settings.footer_text || ""}
              onChange={(e) => setSettings((prev) => (prev ? { ...prev, footer_text: e.target.value || null } : prev))}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Vista Previa</CardTitle>
          <CardDescription>Así se verá el encabezado de tus correos</CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className="rounded-lg border p-6 max-w-md mx-auto"
            style={{ borderColor: settings.primary_color }}
          >
            <div className="text-center space-y-3" style={{ color: settings.primary_color }}>
              {settings.logo_display_url && (
                <img src={settings.logo_display_url} alt="Logo" className="h-12 mx-auto object-contain" />
              )}
              <h3 className="text-lg font-bold" style={{ color: settings.primary_color }}>
                {settings.sender_name || user?.business_name || "Mi Negocio"}
              </h3>
              <p className="text-sm" style={{ color: settings.secondary_color }}>
                Confirmación de cita
              </p>
            </div>
            <hr className="my-4" style={{ borderColor: settings.secondary_color + "40" }} />
            <p className="text-sm text-muted-foreground">
              Hola Juan, tu cita ha sido confirmada para el viernes 21 de febrero a las 10:00 AM.
            </p>
            {settings.footer_text && (
              <>
                <hr className="my-4" style={{ borderColor: settings.secondary_color + "40" }} />
                <p className="text-xs text-center" style={{ color: settings.secondary_color }}>
                  {settings.footer_text}
                </p>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
