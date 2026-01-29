"use client"

import { createContext, useCallback, useContext, useEffect, useState } from "react"

export type AdminRole = "admin" | "empleado"

export interface AdminAuthUser {
  id: number
  username: string
  rol: AdminRole
}

interface AdminAuthContextType {
  user: AdminAuthUser | null
  token: string | null
  isLoading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined)

const loginApi = async (
  username: string,
  password: string
): Promise<{ access_token: string; user: AdminAuthUser }> => {
  const res = await fetch("/api/admin/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.error || "Error al iniciar sesión")
  }

  const data = await res.json()
  return { access_token: data.token, user: data.user }
}

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminAuthUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (typeof window !== "undefined") {
      try {
        const storedToken = localStorage.getItem("admin_auth_token")
        const storedUser = localStorage.getItem("admin_auth_user")

        if (storedToken && storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser)
            setToken(storedToken)
            setUser(parsedUser)
          } catch {
            localStorage.removeItem("admin_auth_token")
            localStorage.removeItem("admin_auth_user")
          }
        }
      } catch {
        // Ignorar errores de localStorage
      }
    }
    setIsLoading(false)
  }, [])

  const login = useCallback(async (username: string, password: string) => {
    setIsLoading(true)
    try {
      const response = await loginApi(username, password)
      setToken(response.access_token)
      setUser(response.user)
      localStorage.setItem("admin_auth_token", response.access_token)
      localStorage.setItem("admin_auth_user", JSON.stringify(response.user))
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await fetch("/api/admin/auth/logout", { method: "POST" })
    } catch {
      // Ignorar errores de logout
    } finally {
      setToken(null)
      setUser(null)
      localStorage.removeItem("admin_auth_token")
      localStorage.removeItem("admin_auth_user")
    }
  }, [])

  if (!mounted) {
    return (
      <AdminAuthContext.Provider
        value={{
          user: null,
          token: null,
          isLoading: true,
          login,
          logout,
          isAuthenticated: false,
        }}
      >
        {children}
      </AdminAuthContext.Provider>
    )
  }

  return (
    <AdminAuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        logout,
        isAuthenticated: !!user && !!token,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  )
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext)
  if (context === undefined) {
    throw new Error("useAdminAuth must be used within an AdminAuthProvider")
  }
  return context
}

