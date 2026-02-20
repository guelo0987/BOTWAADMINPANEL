"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Building2, Users, Calendar, TrendingUp } from "lucide-react"

type Props = {
  stats: {
    totalClients: number
    activeClients: number
    inactiveClients: number
    totalCustomers: number
    newCustomersWeek: number
    totalAppointments: number
    appointmentsToday: number
    confirmedAppointments: number
  }
  topClients: Array<{
    id: number
    business_name: string
    is_active: boolean
    customers_count: number
    appointments_count: number
  }>
}

export function AdminDashboardClient({ stats, topClients }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Vista global de la plataforma</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalClients}</p>
                <p className="text-sm text-muted-foreground">Clientes totales</p>
              </div>
            </div>
            <div className="mt-2 flex gap-2 text-xs">
              <Badge variant="outline" className="bg-green-500/10 text-green-600">{stats.activeClients} activos</Badge>
              <Badge variant="outline" className="bg-red-500/10 text-red-600">{stats.inactiveClients} inactivos</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                <Users className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalCustomers}</p>
                <p className="text-sm text-muted-foreground">Customers totales</p>
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              +{stats.newCustomersWeek} esta semana
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                <Calendar className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.appointmentsToday}</p>
                <p className="text-sm text-muted-foreground">Citas hoy</p>
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {stats.confirmedAppointments} confirmadas en total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalAppointments}</p>
                <p className="text-sm text-muted-foreground">Citas totales</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Clientes con más actividad</CardTitle>
          <CardDescription>Top clientes por cantidad de customers y citas</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Negocio</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Customers</TableHead>
                <TableHead>Citas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topClients.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono text-xs">{c.id}</TableCell>
                  <TableCell className="font-medium">{c.business_name}</TableCell>
                  <TableCell>
                    {c.is_active ? (
                      <Badge className="bg-green-600 hover:bg-green-600">Activo</Badge>
                    ) : (
                      <Badge variant="destructive">Inactivo</Badge>
                    )}
                  </TableCell>
                  <TableCell>{c.customers_count}</TableCell>
                  <TableCell>{c.appointments_count}</TableCell>
                </TableRow>
              ))}
              {topClients.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-10">
                    No hay clientes todavía.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
