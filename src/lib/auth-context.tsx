"use client"

import React from "react"

import { createContext, useContext, useState, useEffect, useCallback } from "react"
import type { AuthUser } from "@/types"

interface AuthContextType {
  user: AuthUser | null
  token: string | null
  isLoading: boolean
  login: (whatsapp_instance_id: string, password: string) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Mock API for demo purposes - replace with real API calls
const loginApi = async (whatsapp_instance_id: string, password: string): Promise<{ access_token: string; client: AuthUser }> => {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ whatsapp_instance_id, password }),
  })

  if (!res.ok) {
    const errorData = await res.json()
    throw new Error(errorData.error || "Error al iniciar sesión")
  }

  const data = await res.json()
  return {
    access_token: data.token,
    client: data.client,
  }
}


export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Check for existing session only on client
    if (typeof window !== "undefined") {
      const storedToken = localStorage.getItem("auth_token")
      const storedUser = localStorage.getItem("auth_user")

      if (storedToken && storedUser) {
        try {
          setToken(storedToken)
          setUser(JSON.parse(storedUser))
        } catch {
          // Invalid stored data, clear it
          localStorage.removeItem("auth_token")
          localStorage.removeItem("auth_user")
        }
      }
    }

    setIsLoading(false)
  }, [])

  const login = useCallback(async (whatsapp_instance_id: string, password: string) => {
    setIsLoading(true)
    try {
      const response = await loginApi(whatsapp_instance_id, password)

      setToken(response.access_token)
      setUser(response.client)

      localStorage.setItem("auth_token", response.access_token)
      localStorage.setItem("auth_user", JSON.stringify(response.client))
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      // Llamar al endpoint de logout para limpiar cookie del servidor
      await fetch("/api/auth/logout", {
        method: "POST",
      })
    } catch (error) {
      console.error("Error during logout:", error)
    } finally {
      // Limpiar estado local
      setToken(null)
      setUser(null)
      localStorage.removeItem("auth_token")
      localStorage.removeItem("auth_user")
    }
  }, [])

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <AuthContext.Provider
        value={{
          user: null,
          token: null,
          isLoading: true,
          login,
          logout,
          isAuthenticated: false
        }}
      >
        {children}
      </AuthContext.Provider>
    )
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        logout,
        isAuthenticated: !!user && !!token
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
