"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
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
  Send,
  Bot,
  User,
  Loader2,
  ChevronRight,
  UserCheck,
  ArrowLeft,
  Mic,
  Square,
} from "lucide-react"
import type { Conversation, Message } from "@/types"
import { useToast } from "@/hooks/use-toast"
import { useIsMobile } from "@/hooks/use-mobile"
import { formatDistanceToNow, format, isToday, isYesterday, isSameDay } from "date-fns"
import { es } from "date-fns/locale"

// ─── Config ─────────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  active: {
    label: "IA respondiendo",
    shortLabel: "IA",
    color: "bg-green-500/10 text-green-600 border-green-500/20",
    dot: "bg-green-500",
    icon: Bot,
  },
  resolved: {
    label: "Resuelta",
    shortLabel: "Resuelta",
    color: "bg-muted text-muted-foreground border-border",
    dot: "bg-muted-foreground/50",
    icon: CheckCircle,
  },
  escalated: {
    label: "Escalada",
    shortLabel: "Escalada",
    color: "bg-destructive/10 text-destructive border-destructive/20",
    dot: "bg-destructive",
    icon: AlertTriangle,
  },
  human_handled: {
    label: "Tú respondiendo",
    shortLabel: "Tú",
    color: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    dot: "bg-blue-500",
    icon: UserCheck,
  },
} as const

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

function formatDateSeparator(date: Date) {
  if (isToday(date)) return "Hoy"
  if (isYesterday(date)) return "Ayer"
  return format(date, "d 'de' MMMM, yyyy", { locale: es })
}

function getStatusConfig(status: string) {
  return STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.active
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function AvatarBubble({ name, status }: { name: string; status: string }) {
  const cfg = getStatusConfig(status)
  return (
    <div className="relative shrink-0">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm select-none">
        {name ? getInitials(name) : "?"}
      </div>
      <span
        className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-background ${cfg.dot}`}
      />
    </div>
  )
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
  const cfg = getStatusConfig(conversation.status)
  const relTime =
    conversation.last_message_at || conversation.last_message_time
      ? formatDistanceToNow(
          new Date(
            conversation.last_message_at || conversation.last_message_time || new Date()
          ),
          { addSuffix: false, locale: es }
        )
      : ""

  return (
    <button
      onClick={onClick}
      className={`w-full px-4 py-3.5 md:py-3 text-left transition-colors active:bg-muted/80 hover:bg-muted/60 ${
        isSelected
          ? "bg-primary/5 border-r-[3px] border-r-primary"
          : "border-r-[3px] border-r-transparent"
      }`}
    >
      <div className="flex items-center gap-3">
        <AvatarBubble
          name={conversation.customer_name || conversation.phone_number}
          status={conversation.status}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className={`text-sm truncate ${isSelected ? "font-semibold" : "font-medium"}`}>
              {conversation.customer_name || conversation.phone_number}
            </p>
            <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
              {relTime}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2 mt-0.5">
            <p className="text-xs text-muted-foreground truncate leading-snug flex-1">
              {conversation.last_message || "Sin mensajes"}
            </p>
            <Badge
              variant="outline"
              className={`text-[10px] px-1.5 py-0 h-4 shrink-0 md:hidden ${cfg.color}`}
            >
              {cfg.shortLabel}
            </Badge>
          </div>
        </div>
      </div>
    </button>
  )
}

function DateSeparator({ date }: { date: Date }) {
  return (
    <div className="flex items-center gap-3 my-3">
      <div className="h-px flex-1 bg-border" />
      <span className="text-[10px] font-medium text-muted-foreground px-2 uppercase tracking-wide">
        {formatDateSeparator(date)}
      </span>
      <div className="h-px flex-1 bg-border" />
    </div>
  )
}

function MessageBubble({
  message,
  showTime,
}: {
  message: Message
  showTime: boolean
}) {
  const isCustomer = message.sender === "customer"
  const isAgent = message.sender === "agent"
  const isBot = message.sender === "bot"

  return (
    <div className={`flex gap-2 ${isCustomer ? "flex-row-reverse" : "flex-row"}`}>
      <div
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs hidden md:flex ${
          isBot
            ? "bg-primary/10 text-primary"
            : isAgent
            ? "bg-blue-500/10 text-blue-600"
            : "bg-muted text-muted-foreground"
        }`}
      >
        {isBot ? <Bot className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
      </div>

      <div
        className={`max-w-[85%] md:max-w-[72%] flex flex-col gap-0.5 ${
          isCustomer ? "items-end" : "items-start"
        }`}
      >
        {isAgent && (
          <p className="text-[10px] font-semibold text-blue-600 px-1">Agente</p>
        )}
        <div
          className={`rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
            isCustomer
              ? "bg-primary text-primary-foreground rounded-tr-none"
              : isAgent
              ? "bg-blue-50 text-blue-900 border border-blue-100 rounded-tl-none dark:bg-blue-950 dark:text-blue-100 dark:border-blue-900"
              : "bg-muted rounded-tl-none"
          }`}
        >
          {message.media_type === "audio" ? (
            <div className="flex items-center gap-2 py-0.5">
              <Mic className="h-4 w-4 shrink-0 opacity-60" />
              <span className="italic text-sm opacity-80">Nota de voz</span>
            </div>
          ) : (
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          )}
        </div>
        {showTime && message.timestamp && (
          <p
            className={`text-[10px] text-muted-foreground px-1 ${
              isCustomer ? "text-right" : "text-left"
            }`}
          >
            {format(new Date(message.timestamp), "HH:mm")}
          </p>
        )}
      </div>
    </div>
  )
}

// ─── Chat panel ───────────────────────────────────────────────────────────────

function ChatPanel({
  conversation,
  clientId,
  businessName,
  onRefresh,
  onBack,
}: {
  conversation: Conversation
  clientId?: number
  businessName?: string
  onRefresh: () => void
  onBack?: () => void
}) {
  const [newMessage, setNewMessage] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [conversationStatus, setConversationStatus] = useState(conversation.status)
  const [showEscalateInput, setShowEscalateInput] = useState(false)
  const [escalateReason, setEscalateReason] = useState("")
  const [showResolveOptions, setShowResolveOptions] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const [isSendingAudio, setIsSendingAudio] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const isMobile = useIsMobile()
  const { toast } = useToast()
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const messagesLengthRef = useRef(0)

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    bottomRef.current?.scrollIntoView({ behavior })
  }, [])

  const loadMessages = useCallback(
    async (silent = false) => {
      if (!conversation?.customer_id || !clientId) return
      try {
        if (!silent) setIsLoadingMessages(true)
        const res = await fetch(
          `/api/admin/conversations/${conversation.customer_id}/history?client_id=${clientId}`
        )
        if (!res.ok) throw new Error("Error cargando mensajes")
        const data = await res.json()

        const formatted: Message[] = data.messages.map((msg: any, i: number) => ({
          id: i + 1,
          conversation_id: conversation.customer_id,
          content: msg.content,
          sender:
            msg.role === "user" ? "customer" : msg.human ? "agent" : ("bot" as const),
          timestamp: msg.timestamp || new Date().toISOString(),
          media_type: msg.media_type || undefined,
        }))

        setMessages(formatted)
        setConversationStatus(data.status.status)
      } catch {
        if (!silent)
          toast({
            title: "Error",
            description: "No se pudieron cargar los mensajes",
            variant: "destructive",
          })
      } finally {
        if (!silent) setIsLoadingMessages(false)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [conversation.customer_id, clientId]
  )

  // Reset & load when conversation changes
  useEffect(() => {
    setMessages([])
    setNewMessage("")
    setConversationStatus(conversation.status)
    setShowEscalateInput(false)
    setShowResolveOptions(false)
    messagesLengthRef.current = 0
    loadMessages(false)
  }, [conversation.customer_id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll to bottom when messages arrive
  useEffect(() => {
    if (messages.length === 0) return
    const isFirstLoad = messagesLengthRef.current === 0
    scrollToBottom(isFirstLoad ? "instant" : "smooth")
    messagesLengthRef.current = messages.length
  }, [messages.length, scrollToBottom])

  // Auto-refresh messages every 5s
  useEffect(() => {
    const iv = setInterval(() => loadMessages(true), 5000)
    return () => clearInterval(iv)
  }, [loadMessages])

  // ── Actions ────────────────────────────────────────────────────────────────

  const handleSendMessage = async () => {
    const text = newMessage.trim()
    if (!text || !conversation?.customer_id || !clientId || isSending) return

    setNewMessage("")
    if (inputRef.current) inputRef.current.style.height = "40px"

    const optimistic: Message = {
      id: messages.length + 1,
      conversation_id: conversation.customer_id,
      content: text,
      sender: "agent",
      timestamp: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, optimistic])
    scrollToBottom()

    try {
      setIsSending(true)
      const res = await fetch(
        `/api/admin/conversations/${conversation.customer_id}/send-message`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            client_id: clientId,
            message: text,
            admin_name: businessName,
          }),
        }
      )
      if (!res.ok) throw new Error((await res.json()).error || "Error")
      setConversationStatus("human_handled")
      onRefresh()
      await loadMessages(true)
    } catch (error: any) {
      setMessages((prev) => prev.filter((m) => m !== optimistic))
      setNewMessage(text)
      toast({ title: "Error al enviar", description: error.message, variant: "destructive" })
    } finally {
      setIsSending(false)
      inputRef.current?.focus()
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      // Prioridad: OGG/Opus (Firefox, ideal para WhatsApp) → WebM/Opus (Chrome) → MP4 (Safari)
      const mimeType = MediaRecorder.isTypeSupported("audio/ogg;codecs=opus")
        ? "audio/ogg;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/mp4"

      const recorder = new MediaRecorder(stream, { mimeType })
      audioChunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data)
      }

      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop())
        streamRef.current = null
        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current)
          recordingTimerRef.current = null
        }
        const blob = new Blob(audioChunksRef.current, { type: mimeType })
        if (blob.size > 0) {
          sendVoiceMessage(blob)
        }
      }

      recorder.start(250) // Recoger data cada 250ms
      mediaRecorderRef.current = recorder
      setIsRecording(true)
      setRecordingSeconds(0)

      // Timer visual
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((s) => {
          if (s >= 59) {
            // Máximo 60 segundos
            mediaRecorderRef.current?.stop()
            setIsRecording(false)
            return 0
          }
          return s + 1
        })
      }, 1000)
    } catch {
      toast({
        title: "Error",
        description: "No se pudo acceder al micrófono. Verifica los permisos del navegador.",
        variant: "destructive",
      })
    }
  }

  const cancelRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      // Limpiar chunks antes de stop para que onstop no envíe
      audioChunksRef.current = []
      mediaRecorderRef.current.stop()
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current)
      recordingTimerRef.current = null
    }
    setIsRecording(false)
    setRecordingSeconds(0)
  }

  const stopAndSendRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop() // onstop handler will call sendVoiceMessage
    }
    setIsRecording(false)
    setRecordingSeconds(0)
  }

  const sendVoiceMessage = async (audioBlob: Blob) => {
    if (!conversation?.customer_id || !clientId) return

    // Mensaje optimista
    const optimistic: Message = {
      id: messages.length + 1,
      conversation_id: conversation.customer_id,
      content: "[Nota de voz]",
      sender: "agent",
      timestamp: new Date().toISOString(),
      media_type: "audio",
    }
    setMessages((prev) => [...prev, optimistic])
    scrollToBottom()

    try {
      setIsSendingAudio(true)

      // Chrome records audio/webm which WhatsApp rejects — convert to MP3 client-side
      let blobToSend = audioBlob
      let fileName = "audio.ogg"
      const blobType = audioBlob.type.split(";")[0].trim()

      if (blobType === "audio/webm") {
        try {
          const lamejs = (await import("lamejs")).default
          const arrayBuffer = await audioBlob.arrayBuffer()
          const audioCtx = new AudioContext()
          const decoded = await audioCtx.decodeAudioData(arrayBuffer)
          const pcm = decoded.getChannelData(0)
          const sampleRate = decoded.sampleRate

          const samples = new Int16Array(pcm.length)
          for (let i = 0; i < pcm.length; i++) {
            const s = Math.max(-1, Math.min(1, pcm[i]))
            samples[i] = s < 0 ? s * 0x8000 : s * 0x7fff
          }

          const encoder = new lamejs.Mp3Encoder(1, sampleRate, 64)
          const chunks: Int8Array[] = []
          for (let i = 0; i < samples.length; i += 1152) {
            const chunk = samples.subarray(i, Math.min(i + 1152, samples.length))
            const mp3buf = encoder.encodeBuffer(chunk)
            if (mp3buf.length > 0) chunks.push(mp3buf)
          }
          const end = encoder.flush()
          if (end.length > 0) chunks.push(end)

          audioCtx.close()
          blobToSend = new Blob(chunks, { type: "audio/mpeg" })
          fileName = "audio.mp3"
        } catch (convErr) {
          console.error("[sendVoiceMessage] WebM→MP3 conversion failed:", convErr)
          throw new Error("No se pudo procesar el audio grabado")
        }
      } else if (blobType === "audio/mp4") {
        fileName = "audio.m4a"
      }

      const formData = new FormData()
      formData.append("audio", blobToSend, fileName)
      formData.append("client_id", String(clientId))
      formData.append("admin_name", businessName || "")

      const res = await fetch(
        `/api/admin/conversations/${conversation.customer_id}/send-audio`,
        { method: "POST", body: formData }
      )

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || "Error enviando audio")
      }

      setConversationStatus("human_handled")
      onRefresh()
      await loadMessages(true)
    } catch (error: any) {
      setMessages((prev) => prev.filter((m) => m !== optimistic))
      toast({ title: "Error al enviar audio", description: error.message, variant: "destructive" })
    } finally {
      setIsSendingAudio(false)
    }
  }

  const handleTakeConversation = async () => {
    if (!conversation?.customer_id || !clientId) return
    try {
      const res = await fetch(
        `/api/admin/conversations/${conversation.customer_id}/take`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ client_id: clientId, admin_name: businessName }),
        }
      )
      if (!res.ok) throw new Error((await res.json()).error)
      setConversationStatus("human_handled")
      onRefresh()
      toast({ title: "Control tomado", description: "La IA está pausada. Escribe tu mensaje." })
      inputRef.current?.focus()
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    }
  }

  const handleEscalate = async () => {
    if (!conversation?.customer_id || !clientId) return
    try {
      const res = await fetch(
        `/api/admin/conversations/${conversation.customer_id}/escalate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            client_id: clientId,
            motivo: escalateReason.trim() || "Escalado manualmente desde panel",
          }),
        }
      )
      if (!res.ok) throw new Error((await res.json()).error)
      setConversationStatus("escalated")
      setShowEscalateInput(false)
      setEscalateReason("")
      onRefresh()
      toast({ title: "Conversación escalada" })
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    }
  }

  const handleResolve = async (resumeAI: boolean) => {
    if (!conversation?.customer_id || !clientId) return
    try {
      const res = await fetch(
        `/api/admin/conversations/${conversation.customer_id}/resolve`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ client_id: clientId, resume_ai: resumeAI }),
        }
      )
      if (!res.ok) throw new Error((await res.json()).error)
      setConversationStatus(resumeAI ? "active" : "resolved")
      setShowResolveOptions(false)
      onRefresh()
      toast({
        title: "Resuelta",
        description: resumeAI
          ? "La IA ha reanudado la conversación"
          : "Marcada como resuelta",
      })
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    }
  }

  // ── Render helpers ─────────────────────────────────────────────────────────

  const cfg = getStatusConfig(conversationStatus)
  const StatusIcon = cfg.icon

  const renderedMessages = () => {
    const nodes: React.ReactNode[] = []
    let lastDate: Date | null = null

    messages.forEach((msg, i) => {
      const msgDate = msg.timestamp ? new Date(msg.timestamp) : null
      const nextMsg = messages[i + 1]
      const nextDate = nextMsg?.timestamp ? new Date(nextMsg.timestamp) : null

      if (msgDate && (!lastDate || !isSameDay(lastDate, msgDate))) {
        nodes.push(<DateSeparator key={`sep-${i}`} date={msgDate} />)
        lastDate = msgDate
      }

      const showTime =
        i === messages.length - 1 ||
        nextMsg?.sender !== msg.sender ||
        (nextDate && msgDate && !isSameDay(msgDate, nextDate))

      nodes.push(
        <MessageBubble key={msg.id} message={msg} showTime={!!showTime} />
      )
    })
    return nodes
  }

  // ── JSX ────────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 md:gap-3 px-3 md:px-4 py-3 border-b bg-background shrink-0">
        {onBack && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="shrink-0 h-9 w-9 -ml-1"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <AvatarBubble
          name={conversation.customer_name || conversation.phone_number}
          status={conversationStatus}
        />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">
            {conversation.customer_name || "Cliente"}
          </p>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Phone className="h-3 w-3" />+{conversation.phone_number}
          </p>
        </div>
        <Badge variant="outline" className={`text-xs shrink-0 ${cfg.color}`}>
          <StatusIcon className="h-3 w-3 mr-1" />
          <span className="hidden sm:inline">{cfg.label}</span>
          <span className="sm:hidden">{cfg.shortLabel}</span>
        </Badge>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-3 md:px-4 py-3 space-y-1.5 scroll-smooth">
        {isLoadingMessages ? (
          <div className="space-y-4 pt-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className={`flex gap-2 ${i % 2 === 0 ? "flex-row-reverse" : "flex-row"}`}
              >
                <Skeleton className="h-7 w-7 rounded-full shrink-0 hidden md:block" />
                <Skeleton className={`h-12 rounded-2xl ${i % 2 === 0 ? "w-48" : "w-40"}`} />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
            <MessageSquare className="h-10 w-10 opacity-20" />
            <p className="text-sm">Sin mensajes aún</p>
          </div>
        ) : (
          renderedMessages()
        )}
        <div ref={bottomRef} />
      </div>

      {/* Footer */}
      <div
        className="border-t bg-background px-3 md:px-4 pt-3 space-y-2.5 md:space-y-3 shrink-0"
        style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
      >
        {/* Status context info */}
        {(conversation.is_human_handled && conversation.admin) ||
        (conversation.is_escalated && conversation.escalation_reason) ? (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
            {conversation.is_human_handled && conversation.admin && (
              <span>
                Manejada por <strong className="text-foreground">{conversation.admin}</strong>
              </span>
            )}
            {conversation.is_escalated && conversation.escalation_reason && (
              <span>
                Motivo: <strong className="text-foreground">{conversation.escalation_reason}</strong>
              </span>
            )}
          </div>
        ) : null}

        {/* Inline escalate form */}
        {showEscalateInput && (
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="Motivo de escalación (opcional)"
              value={escalateReason}
              onChange={(e) => setEscalateReason(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleEscalate()
                if (e.key === "Escape") {
                  setShowEscalateInput(false)
                  setEscalateReason("")
                }
              }}
              className="flex-1 h-9 md:h-8 text-sm"
              autoFocus
            />
            <div className="flex gap-2">
              <Button size="sm" variant="destructive" onClick={handleEscalate} className="flex-1 sm:flex-none h-9 md:h-8">
                Confirmar
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="flex-1 sm:flex-none h-9 md:h-8"
                onClick={() => {
                  setShowEscalateInput(false)
                  setEscalateReason("")
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {/* Inline resolve options */}
        {showResolveOptions && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <span className="text-xs text-muted-foreground">¿Qué hacer?</span>
            <div className="flex gap-2 flex-1">
              <Button size="sm" variant="outline" onClick={() => handleResolve(false)} className="flex-1 sm:flex-none h-9 md:h-8">
                Solo resolver
              </Button>
              <Button size="sm" onClick={() => handleResolve(true)} className="flex-1 sm:flex-none h-9 md:h-8">
                Reanudar IA
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowResolveOptions(false)}
                className="h-9 md:h-8 px-2"
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {/* Action buttons */}
        {!showEscalateInput && !showResolveOptions && (
          <div className="flex items-center gap-2 overflow-x-auto">
            {conversationStatus === "active" && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleTakeConversation}
                className="text-blue-600 border-blue-200 hover:bg-blue-50 dark:hover:bg-blue-950 h-9 md:h-8 shrink-0"
              >
                <UserCheck className="h-3.5 w-3.5 mr-1.5" />
                Tomar control
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              disabled={conversationStatus === "escalated"}
              onClick={() => {
                setShowEscalateInput(true)
                setShowResolveOptions(false)
              }}
              className="text-destructive border-destructive/20 hover:bg-destructive/5 h-9 md:h-8 shrink-0"
            >
              <AlertTriangle className="h-3.5 w-3.5 mr-1.5" />
              Escalar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowResolveOptions(true)
                setShowEscalateInput(false)
              }}
              className="h-9 md:h-8 shrink-0"
            >
              <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
              Resolver
            </Button>
          </div>
        )}

        {/* Message input */}
        {isRecording ? (
          <div className="flex gap-2 items-center bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg px-3 py-2">
            <span className="flex items-center gap-2 flex-1">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-sm font-medium text-red-600 dark:text-red-400">
                Grabando… {recordingSeconds}s
              </span>
            </span>
            <Button
              size="icon"
              variant="ghost"
              onClick={cancelRecording}
              className="shrink-0 h-9 w-9 text-muted-foreground hover:text-destructive"
              title="Cancelar"
            >
              <Square className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              onClick={stopAndSendRecording}
              className="shrink-0 h-11 w-11 md:h-10 md:w-10 rounded-full md:rounded-md bg-red-500 hover:bg-red-600"
              title="Enviar nota de voz"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex gap-2 items-end">
            <Textarea
              ref={inputRef}
              placeholder={isMobile ? "Escribe un mensaje…" : "Escribe un mensaje… (Enter para enviar, Shift+Enter para salto de línea)"}
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value)
                e.target.style.height = "auto"
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px"
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSendMessage()
                }
              }}
              disabled={isSending || isSendingAudio}
              rows={1}
              className="flex-1 resize-none text-sm overflow-hidden text-base md:text-sm"
              style={{ minHeight: "44px", maxHeight: "120px", height: "44px" }}
            />
            {newMessage.trim() ? (
              <Button
                size="icon"
                onClick={handleSendMessage}
                disabled={isSending || !newMessage.trim()}
                className="shrink-0 h-11 w-11 md:h-10 md:w-10 rounded-full md:rounded-md"
              >
                {isSending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            ) : (
              <Button
                size="icon"
                variant="outline"
                onClick={startRecording}
                disabled={isSendingAudio}
                className="shrink-0 h-11 w-11 md:h-10 md:w-10 rounded-full md:rounded-md"
                title="Enviar nota de voz"
              >
                {isSendingAudio ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ConversationsPage() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const isMobile = useIsMobile()

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    active: 0,
    human_handled: 0,
    escalated: 0,
    resolved: 0,
  })

  const openedFromParamRef = useRef(false)
  const selectedIdRef = useRef<number | null>(null)

  const loadConversations = useCallback(
    async (silent = false) => {
      if (!user?.id) return
      try {
        if (!silent) setIsLoading(true)
        const params = new URLSearchParams({ client_id: String(user.id) })
        if (statusFilter !== "all") params.set("status_filter", statusFilter)
        const res = await fetch(`/api/admin/conversations?${params}`)
        if (!res.ok) throw new Error("Error")
        const data = await res.json()

        const formatted: Conversation[] = (data.conversations ?? []).map(
          (conv: any, i: number) => ({
            id: i + 1,
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
          })
        )

        setConversations(formatted)
        setStats({
          active: data.active ?? 0,
          human_handled: data.human_handled ?? 0,
          escalated: data.escalated ?? 0,
          resolved: data.resolved ?? 0,
        })

        if (selectedIdRef.current !== null) {
          const updated = formatted.find(
            (c) => c.customer_id === selectedIdRef.current
          )
          if (updated) setSelectedConversation(updated)
        }
      } catch {
        if (!silent)
          toast({
            title: "Error",
            description: "No se pudieron cargar las conversaciones",
            variant: "destructive",
          })
      } finally {
        if (!silent) setIsLoading(false)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user?.id, statusFilter]
  )

  useEffect(() => {
    loadConversations()
    const iv = setInterval(() => loadConversations(true), 10000)
    return () => clearInterval(iv)
  }, [user?.id, statusFilter]) // eslint-disable-line react-hooks/exhaustive-deps

  // Open from ?open=customer_id
  useEffect(() => {
    const openId = searchParams.get("open")
    if (openId && conversations.length > 0 && !openedFromParamRef.current) {
      openedFromParamRef.current = true
      const conv = conversations.find((c) => c.customer_id === parseInt(openId))
      if (conv) {
        setSelectedConversation(conv)
        selectedIdRef.current = conv.customer_id
      }
    }
  }, [searchParams, conversations])

  const handleSelect = (conv: Conversation) => {
    setSelectedConversation(conv)
    selectedIdRef.current = conv.customer_id
  }

  const handleBack = () => {
    setSelectedConversation(null)
    selectedIdRef.current = null
  }

  const filtered = conversations.filter((conv) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      conv.customer_name?.toLowerCase().includes(q) ||
      conv.phone_number.includes(q) ||
      conv.last_message?.toLowerCase().includes(q)
    )
  })

  // On mobile, show either the list or the chat — not both
  const showList = !isMobile || !selectedConversation
  const showChat = !isMobile || !!selectedConversation

  // ── JSX ─────────────────────────────────────────────────────────────────────

  return (
    <div
      className="-m-4 md:-m-6 flex flex-col overflow-hidden"
      style={{ height: "calc(100dvh - 4rem)" }}
    >
      {/* Top stats bar — hidden on mobile when viewing chat */}
      {(!isMobile || !selectedConversation) && (
        <div className="flex items-center gap-3 md:gap-4 px-4 py-2.5 border-b bg-background shrink-0 overflow-x-auto">
          <h1 className="text-sm font-semibold shrink-0">Conversaciones</h1>
          <div className="h-4 w-px bg-border shrink-0 hidden md:block" />
          <div className="flex items-center gap-3 text-xs shrink-0">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              <strong>{stats.active}</strong>
              <span className="text-muted-foreground">IA</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-blue-500" />
              <strong>{stats.human_handled}</strong>
              <span className="text-muted-foreground">Tú</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-destructive" />
              <strong>{stats.escalated}</strong>
              <span className="text-muted-foreground hidden sm:inline">Escaladas</span>
              <span className="text-muted-foreground sm:hidden">Esc</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-muted-foreground/40" />
              <strong>{stats.resolved}</strong>
              <span className="text-muted-foreground hidden sm:inline">Resueltas</span>
              <span className="text-muted-foreground sm:hidden">Res</span>
            </span>
          </div>
        </div>
      )}

      {/* Split pane (desktop) / single pane (mobile) */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── Left: conversation list ── */}
        {showList && (
          <div
            className={`flex flex-col bg-background ${
              isMobile
                ? "w-full"
                : "w-72 lg:w-80 border-r shrink-0"
            }`}
          >
            {/* Search + filter */}
            <div className="p-3 border-b space-y-2 shrink-0">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Buscar conversación…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 h-9 md:h-8 text-sm"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9 md:h-8 text-xs">
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="active">IA respondiendo</SelectItem>
                  <SelectItem value="human_handled">Tú respondiendo</SelectItem>
                  <SelectItem value="escalated">Escaladas</SelectItem>
                  <SelectItem value="resolved">Resueltas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto divide-y">
              {isLoading ? (
                <>
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="px-4 py-3.5 md:py-3 flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-3.5 w-28" />
                        <Skeleton className="h-3 w-44" />
                      </div>
                    </div>
                  ))}
                </>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-6 text-center gap-2">
                  <MessageSquare className="h-10 w-10 text-muted-foreground/20" />
                  <p className="text-sm text-muted-foreground">
                    {search ? "Sin resultados para tu búsqueda" : "Aún no hay conversaciones"}
                  </p>
                </div>
              ) : (
                filtered.map((conv) => (
                  <ConversationItem
                    key={conv.customer_id}
                    conversation={conv}
                    isSelected={!isMobile && selectedConversation?.customer_id === conv.customer_id}
                    onClick={() => handleSelect(conv)}
                  />
                ))
              )}
            </div>
          </div>
        )}

        {/* ── Right: chat ── */}
        {showChat && (
          <div className="flex-1 overflow-hidden">
            {selectedConversation ? (
              <ChatPanel
                key={selectedConversation.customer_id}
                conversation={selectedConversation}
                clientId={user?.id}
                businessName={user?.business_name}
                onRefresh={() => loadConversations(true)}
                onBack={isMobile ? handleBack : undefined}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
                <MessageSquare className="h-14 w-14 opacity-15" />
                <div className="text-center">
                  <p className="font-medium text-foreground">Selecciona una conversación</p>
                  <p className="text-sm mt-0.5">
                    Elige una del panel izquierdo para ver los mensajes
                  </p>
                </div>
                {filtered.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSelect(filtered[0])}
                    className="mt-1"
                  >
                    Abrir primera conversación
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
