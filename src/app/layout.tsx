import React from "react"
import type { Metadata, Viewport } from "next"
import { Analytics } from "@vercel/analytics/next"
import { AuthProvider } from "@/lib/auth-context"
import { AdminAuthProvider } from "@/lib/admin-auth-context"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"

export const metadata: Metadata = {
  title: "DlcBot — Asistentes Virtuales con IA para WhatsApp",
  description:
    "Plataforma SaaS para crear y gestionar asistentes virtuales inteligentes para WhatsApp. Agenda citas, atiende clientes 24/7 y automatiza tu negocio.",
  generator: 'v0.app',
  icons: {
    icon: '/dlcbot_logo.png',
    apple: '/dlcbot_logo.png',
  },
}

export const viewport: Viewport = {
  themeColor: "#0f3d8c",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <AuthProvider>
          <AdminAuthProvider>
            {children}
            <Toaster />
          </AdminAuthProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}
