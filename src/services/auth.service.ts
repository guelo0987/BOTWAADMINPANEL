import prisma from "@/lib/db"
import { Client } from "@prisma/client"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_do_not_use_in_prod"

export const registerClient = async (data: {
    business_name: string
    whatsapp_instance_id: string
    password: string
    // Optional initial config
    system_prompt_template?: string
}): Promise<{ client: Client; token: string }> => {
    const existingClient = await prisma.client.findUnique({
        where: { whatsapp_instance_id: data.whatsapp_instance_id },
    })

    if (existingClient) {
        throw new Error("El ID de instancia de WhatsApp ya está registrado")
    }

    const hashedPassword = await bcrypt.hash(data.password, 10)

    const newClient = await prisma.client.create({
        data: {
            business_name: data.business_name,
            whatsapp_instance_id: data.whatsapp_instance_id,
            password_hash: hashedPassword,
            system_prompt_template: data.system_prompt_template || "Eres un asistente amable.",
            is_active: true,
        },
    })

    const token = jwt.sign(
        { id: newClient.id, business_name: newClient.business_name },
        JWT_SECRET,
        { expiresIn: "7d" }
    )

    return { client: newClient, token }
}

export const authenticateClient = async (
    whatsapp_instance_id: string,
    password: string
): Promise<{ client: Client; token: string }> => {
    const client = await prisma.client.findUnique({
        where: { whatsapp_instance_id },
    })

    if (!client) {
        throw new Error("Credenciales inválidas")
    }

    let isValid = false
    
    // Verificar si la contraseña en BD es texto plano (no tiene formato de hash bcrypt)
    const isPlainText = !client.password_hash.startsWith('$2')
    
    if (isPlainText) {
        // Contraseña en texto plano: comparar directamente
        if (client.password_hash === password) {
            // Hashear y actualizar automáticamente
            const hashedPassword = await bcrypt.hash(password, 10)
            await prisma.client.update({
                where: { id: client.id },
                data: { password_hash: hashedPassword }
            })
            isValid = true
        }
    } else {
        // Contraseña hasheada: usar bcrypt
        try {
            isValid = await bcrypt.compare(password, client.password_hash)
        } catch (error) {
            // Si bcrypt falla, tratar como texto plano
            isValid = client.password_hash === password
            if (isValid) {
                // Actualizar a hash
                const hashedPassword = await bcrypt.hash(password, 10)
                await prisma.client.update({
                    where: { id: client.id },
                    data: { password_hash: hashedPassword }
                })
            }
        }
    }

    if (!isValid) {
        throw new Error("Credenciales inválidas")
    }

    const token = jwt.sign(
        { id: client.id, business_name: client.business_name },
        JWT_SECRET,
        { expiresIn: "7d" }
    )

    return { client, token }
}
