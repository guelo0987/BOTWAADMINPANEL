"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Search,
  Phone,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  Clock,
  Send,
  Bot,
  User,
} from "lucide-react"
import type { Conversation, Message } from "@/types"
import { getAllConversations } from "@/services/conversation.service"
import { useToast } from "@/hooks/use-toast"
import { formatDistanceToNow, format } from "date-fns"
import { es } from "date-fns/locale"

const statusConfig = {
  active: {
    label: "Activa",
    color: "bg-green-500/10 text-green-600 border-green-500/20",
    icon: Clock,
  },
  resolved: {
    label: "Resuelta",
    color: "bg-muted text-muted-foreground border-border",
    icon: CheckCircle,
  },
  escalated: {
    label: "Escalada",
    color: "bg-destructive/10 text-destructive border-destructive/20",
    icon: AlertTriangle,
  },
  human_handled: {
    label: "Manejada por Humano",
    color: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    icon: User,
  },
}

function ConversationItem({
  conversation,
  isSelected,
  onClick,
}: {
  conversation: Conversation
  isSelected: boolean
  onClick: () => void
}) {
  const config = statusConfig[conversation.status]
  const StatusIcon = config.icon

  return (
    <button
      onClick={onClick}
      className={`w-full p-4 text-left border-b border-border transition-colors hover:bg-muted/50 ${isSelected ? "bg-primary/5 border-l-2 border-l-primary" : ""
        }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
          {conversation.customer_name
            ? conversation.customer_name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
            : "?"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="font-medium text-sm truncate">
              {conversation.customer_name || conversation.phone_number}
            </p>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {conversation.last_message_at || conversation.last_message_time ? (
                formatDistanceToNow(new Date(conversation.last_message_at || conversation.last_message_time || new Date()), {
                  addSuffix: false,
                  locale: es,
                })
              ) : (
                "Sin mensajes"
              )}
            </span>
          </div>
          <p className="text-sm text-muted-foreground truncate mt-0.5">
            {conversation.last_message}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className={`text-xs ${config.color}`}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {config.label}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {conversation.message_count} mensajes
            </span>
          </div>
        </div>
      </div>
    </button>
  )
}

function MessageBubble({ message }: { message: Message }) {
  const isBot = message.sender === "bot"
  const isCustomer = message.sender === "customer"
  const isAgent = message.sender === "agent"

  return (
    <div
      className={`flex gap-2 ${isCustomer ? "flex-row-reverse" : "flex-row"}`}
    >
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${isBot
            ? "bg-primary/10 text-primary"
            : isAgent
              ? "bg-blue-500/10 text-blue-600"
              : isCustomer
                ? "bg-muted text-muted-foreground"
                : "bg-warning/10 text-warning-foreground"
          }`}
      >
        {isBot ? (
          <Bot className="h-4 w-4" />
        ) : isAgent ? (
          <User className="h-4 w-4" />
        ) : (
          <User className="h-4 w-4" />
        )}
      </div>
      <div
        className={`max-w-[70%] rounded-2xl px-4 py-2 ${isCustomer
            ? "bg-primary text-primary-foreground rounded-tr-none"
            : isAgent
              ? "bg-blue-500/10 text-blue-600 border border-blue-500/20 rounded-tl-none"
              : "bg-muted rounded-tl-none"
          }`}
      >
        {isAgent && (
          <p className="text-xs font-medium mb-1 opacity-70">Agente</p>
        )}
        <p className={`text-sm ${isCustomer ? "text-primary-foreground" : ""}`}>{message.content}</p>
        <p
          className={`text-xs mt-1 ${isCustomer ? "text-primary-foreground/70" : "text-muted-foreground"
            }`}
        >
          {message.timestamp ? format(new Date(message.timestamp), "HH:mm") : ""}
        </p>
      </div>
    </div>
  )
}

function ConversationDetail({
  conversation,
  open,
  onClose,
  clientId,
  onRefresh,
}: {
  conversation: Conversation | null
  open: boolean
  onClose: () => void
  clientId?: number
  onRefresh?: () => void
}) {
  const [newMessage, setNewMessage] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [conversationStatus, setConversationStatus] = useState(conversation?.status || "active")
  const { toast } = useToast()

  // Cargar mensajes cuando se abre el detalle
  useEffect(() => {
    if (open && conversation && clientId) {
      loadMessages()
    }
  }, [open, conversation?.customer_id, clientId])

  const loadMessages = async () => {
    if (!conversation?.customer_id || !clientId) return

    try {
      setIsLoadingMessages(true)
      const response = await fetch(
        `/api/admin/conversations/${conversation.customer_id}/history?client_id=${clientId}`
      )
      if (!response.ok) throw new Error("Failed to load messages")
      
      const data = await response.json()
      
      // Convertir mensajes del formato Redis al formato Message
      const formattedMessages: Message[] = data.messages.map((msg: any, index: number) => {
        // Determinar el sender basado en role y human flag
        let sender: "customer" | "bot" | "agent" = "bot"
        if (msg.role === "user") {
          sender = "customer"
        } else if (msg.human) {
          sender = "agent"
        } else {
          sender = "bot"
        }

        return {
          id: index + 1,
          conversation_id: conversation.customer_id,
          content: msg.content,
          sender,
          timestamp: msg.timestamp || new Date().toISOString(),
        }
      })
      
      setMessages(formattedMessages)
      setConversationStatus(data.status.status)
    } catch (error) {
      console.error("Error loading messages:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los mensajes",
        variant: "destructive",
      })
    } finally {
      setIsLoadingMessages(false)
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !conversation?.customer_id || !clientId) return

    try {
      setIsSending(true)
      const response = await fetch(
        `/api/admin/conversations/${conversation.customer_id}/send-message`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            client_id: clientId,
            message: newMessage,
            admin_name: "Admin", // TODO: Obtener del usuario autenticado
          }),
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to send message")
      }

      setNewMessage("")
      setConversationStatus("human_handled")
      await loadMessages() // Recargar mensajes
      onRefresh?.() // Refrescar lista de conversaciones
      
      toast({
        title: "Mensaje enviado",
        description: "El mensaje se envió correctamente",
      })
    } catch (error: any) {
      console.error("Error sending message:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo enviar el mensaje",
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  const handleEscalate = async () => {
    if (!conversation?.customer_id || !clientId) return

    const motivo = prompt("Motivo de escalación (opcional):")
    if (motivo === null) return // Usuario canceló

    try {
      const response = await fetch(
        `/api/admin/conversations/${conversation.customer_id}/escalate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            client_id: clientId,
            motivo: motivo || "Escalado manualmente desde panel",
          }),
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to escalate")
      }

      setConversationStatus("escalated")
      onRefresh?.()
      
      toast({
        title: "Conversación escalada",
        description: "La conversación ha sido marcada como escalada",
      })
    } catch (error: any) {
      console.error("Error escalating:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo escalar la conversación",
        variant: "destructive",
      })
    }
  }

  const handleResolve = async () => {
    if (!conversation?.customer_id || !clientId) return

    const resumeAI = confirm("¿Deseas reanudar la IA? (Si cancelas, solo se marcará como resuelta)")

    try {
      const response = await fetch(
        `/api/admin/conversations/${conversation.customer_id}/resolve`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            client_id: clientId,
            resume_ai: resumeAI,
          }),
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to resolve")
      }

      setConversationStatus(resumeAI ? "active" : "resolved")
      onRefresh?.()
      
      toast({
        title: "Conversación resuelta",
        description: resumeAI ? "La IA ha sido reanudada" : "La conversación ha sido marcada como resuelta",
      })
    } catch (error: any) {
      console.error("Error resolving:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo resolver la conversación",
        variant: "destructive",
      })
    }
  }

  if (!conversation) return null

  const config = statusConfig[conversationStatus as keyof typeof statusConfig] || statusConfig.active

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg p-0 flex flex-col h-full">
        <SheetHeader className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
              {conversation.customer_name
                ? conversation.customer_name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                : "?"}
            </div>
            <div className="flex-1">
              <SheetTitle className="text-left">
                {conversation.customer_name || "Cliente"}
              </SheetTitle>
              <SheetDescription className="text-left flex items-center gap-2">
                <Phone className="h-3 w-3" />
                +{conversation.phone_number}
              </SheetDescription>
            </div>
            <Badge variant="outline" className={config.color}>
              {config.label}
            </Badge>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 p-4 min-h-0">
          {isLoadingMessages ? (
            <div className="flex items-center justify-center py-12">
              <Clock className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-sm text-muted-foreground">No hay mensajes en esta conversación</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="p-4 border-t border-border bg-background">
          {/* Información de estado */}
          {(conversation.is_human_handled || conversation.is_escalated) && (
            <div className="mb-3 p-3 rounded-lg bg-muted/50 border border-border">
              {conversation.is_human_handled && conversation.admin && (
                <p className="text-xs text-muted-foreground">
                  Manejada por: <span className="font-medium">{conversation.admin}</span>
                </p>
              )}
              {conversation.is_escalated && conversation.escalation_reason && (
                <p className="text-xs text-muted-foreground mt-1">
                  Motivo: <span className="font-medium">{conversation.escalation_reason}</span>
                </p>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 mb-3">
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive bg-transparent"
              onClick={handleEscalate}
              disabled={conversationStatus === "escalated"}
            >
              <AlertTriangle className="h-4 w-4 mr-1" />
              Escalar
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleResolve}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Resolver
            </Button>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Escribe un mensaje..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSendMessage()
                }
              }}
              disabled={isSending}
              className="flex-1 bg-background border-border text-foreground placeholder:text-muted-foreground"
            />
            <Button onClick={handleSendMessage} disabled={isSending || !newMessage.trim()}>
              {isSending ? (
                <Clock className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export default function ConversationsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({ active: 0, escalated: 0, resolved: 0 })

  // Cargar conversaciones
  useEffect(() => {
    loadConversations()
  }, [user?.id, statusFilter])

  const loadConversations = async () => {
    if (!user?.id) return

    try {
      setIsLoading(true)
      const response = await fetch(
        `/api/admin/conversations?client_id=${user.id}${statusFilter !== "all" ? `&status_filter=${statusFilter}` : ""}`
      )
      if (!response.ok) throw new Error("Failed to load conversations")
      
      const data = await response.json()
      
      // Mapear a formato Conversation con id
      const formattedConversations: Conversation[] = data.conversations.map((conv: any, index: number) => ({
        id: index + 1,
        customer_id: conv.customer_id,
        phone_number: conv.phone_number,
        customer_name: conv.customer_name,
        last_message: conv.last_message,
        last_message_at: conv.last_message_time,
        last_message_time: conv.last_message_time,
        status: conv.status,
        message_count: conv.message_count,
        is_escalated: conv.is_escalated,
        is_human_handled: conv.is_human_handled,
        admin: conv.admin,
        escalation_reason: conv.escalation_reason,
      }))
      
      setConversations(formattedConversations)
      setStats({
        active: data.active || 0,
        escalated: data.escalated || 0,
        resolved: data.resolved || 0,
      })
    } catch (error) {
      console.error("Error loading conversations:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las conversaciones",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const filteredConversations = conversations.filter((conv) => {
    const matchesSearch =
      conv.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
      conv.phone_number.includes(search) ||
      conv.last_message.toLowerCase().includes(search.toLowerCase())

    return matchesSearch
  })

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation)
    setSheetOpen(true)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Conversaciones</h1>
        <p className="text-muted-foreground">
          Gestiona las conversaciones con tus clientes
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, teléfono o mensaje..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="active">Activas</SelectItem>
            <SelectItem value="human_handled">Manejadas por Humano</SelectItem>
            <SelectItem value="escalated">Escaladas</SelectItem>
            <SelectItem value="resolved">Resueltas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                <Clock className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.active}</p>
                <p className="text-sm text-muted-foreground">Activas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.escalated}</p>
                <p className="text-sm text-muted-foreground">Escaladas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <CheckCircle className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.resolved}</p>
                <p className="text-sm text-muted-foreground">Resueltas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conversations List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Todas las Conversaciones
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[500px]">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Clock className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-lg font-medium">No hay conversaciones</p>
                <p className="text-sm text-muted-foreground">
                  No se encontraron conversaciones con los filtros actuales
                </p>
              </div>
            ) : (
              filteredConversations.map((conversation) => (
                <ConversationItem
                  key={conversation.id}
                  conversation={conversation}
                  isSelected={selectedConversation?.id === conversation.id}
                  onClick={() => handleSelectConversation(conversation)}
                />
              ))
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Conversation Detail Sheet */}
      <ConversationDetail
        conversation={selectedConversation}
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        clientId={user?.id}
        onRefresh={loadConversations}
      />
    </div>
  )
}
