"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { MessageCircle } from "lucide-react"

export default function HomePage() {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        router.push("/dashboard")
      } else {
        router.push("/login")
      }
    }
  }, [isAuthenticated, isLoading, router])

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary">
          <MessageCircle className="h-8 w-8 text-primary-foreground animate-pulse" />
        </div>
        <div className="flex flex-col items-center gap-2">
          <h1 className="text-xl font-semibold">CompleteAgent</h1>
          <p className="text-sm text-muted-foreground">Cargando...</p>
        </div>
      </div>
    </div>
  )
}
