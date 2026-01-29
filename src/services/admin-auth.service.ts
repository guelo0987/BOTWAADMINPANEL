import prisma from "@/lib/db"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_do_not_use_in_prod"

export type AdminRole = "admin" | "empleado"

export type AdminUserSafe = {
  id: number
  username: string
  rol: AdminRole
}

export async function authenticateAdmin(
  username: string,
  password: string
): Promise<{ user: AdminUserSafe; token: string }> {
  const dbUser = await prisma.user.findFirst({
    where: { username },
    select: {
      id: true,
      username: true,
      password: true,
      rol: true,
    },
  })

  if (!dbUser) {
    throw new Error("Credenciales inválidas")
  }

  if (!dbUser.rol) {
    throw new Error("Usuario sin rol asignado")
  }

  let isValid = false
  const isPlainText = !dbUser.password.startsWith("$2")

  if (isPlainText) {
    if (dbUser.password === password) {
      // Auto-migrar a bcrypt
      const hashed = await bcrypt.hash(password, 10)
      await prisma.user.update({
        where: { id: dbUser.id },
        data: { password: hashed, updated_at: new Date() },
      })
      isValid = true
    }
  } else {
    try {
      isValid = await bcrypt.compare(password, dbUser.password)
    } catch {
      isValid = dbUser.password === password
      if (isValid) {
        const hashed = await bcrypt.hash(password, 10)
        await prisma.user.update({
          where: { id: dbUser.id },
          data: { password: hashed, updated_at: new Date() },
        })
      }
    }
  }

  if (!isValid) {
    throw new Error("Credenciales inválidas")
  }

  const token = jwt.sign(
    { id: dbUser.id, username: dbUser.username, rol: dbUser.rol },
    JWT_SECRET,
    { expiresIn: "7d" }
  )

  return {
    user: { id: dbUser.id, username: dbUser.username, rol: dbUser.rol },
    token,
  }
}

