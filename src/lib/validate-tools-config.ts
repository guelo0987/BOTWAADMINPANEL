import { ToolsConfig } from "@/types"

export interface ValidationError {
    field: string
    message: string
}

export interface ValidateToolsConfigOptions {
    /** Si es true, no se exige calendar_id al crear (el cliente lo configurará en su panel). */
    allowMissingCalendarId?: boolean
}

/**
 * Valida tools_config según el business_type
 */
export function validateToolsConfig(
    config: ToolsConfig,
    options?: ValidateToolsConfigOptions
): ValidationError[] {
    const errors: ValidationError[] = []
    const allowMissingCalendarId = options?.allowMissingCalendarId === true

    // Validaciones comunes
    if (!config.business_type) {
        errors.push({
            field: "business_type",
            message: "El tipo de negocio es requerido",
        })
    }

    // timezone recomendado para todos; no obligatorio

    // business_hours y working_days obligatorios en salon, clinic, restaurant, general
    const needsHours =
        config.business_type === "salon" ||
        config.business_type === "clinic" ||
        config.business_type === "restaurant" ||
        config.business_type === "general"
    if (needsHours) {
        if (!config.business_hours?.start || !config.business_hours?.end) {
            errors.push({ field: "business_hours", message: "Los horarios de negocio son requeridos para este tipo" })
        }
        if (!Array.isArray(config.working_days) || config.working_days.length === 0) {
            errors.push({ field: "working_days", message: "Los días laborables son requeridos para este tipo" })
        }
    }

    // Validaciones específicas por tipo de negocio (según README bot)
    // calendar_id requerido salvo allowMissingCalendarId (ej. creación desde admin; el cliente lo pone en su panel)
    if (config.business_type === "general") {
        if (!allowMissingCalendarId && !config.calendar_id?.trim()) {
            errors.push({ field: "calendar_id", message: "El tipo general requiere un Calendar ID para citas" })
        }
    } else if (config.business_type === "clinic") {
        if (!allowMissingCalendarId && !config.calendar_id?.trim()) {
            errors.push({ field: "calendar_id", message: "El tipo clinic requiere un Calendar ID (general o por profesional)" })
        }
        if (!config.professionals || config.professionals.length === 0) {
            errors.push({
                field: "professionals",
                message: "Las clínicas deben tener al menos un profesional",
            })
        }
        // services opcional en clinic (consultas opcionales)
    }

    if (config.business_type === "salon") {
        if (!allowMissingCalendarId && !config.calendar_id?.trim()) {
            errors.push({ field: "calendar_id", message: "El tipo salon requiere un Calendar ID de Google" })
        }
        if (!config.services || config.services.length === 0) {
            errors.push({
                field: "services",
                message: "Debe haber al menos un servicio (nombre, precio y duration_minutes)",
            })
        }
        if (config.slot_duration != null && (typeof config.slot_duration !== "number" || config.slot_duration <= 0)) {
            errors.push({
                field: "slot_duration",
                message: "slot_duration debe ser un número positivo (minutos)",
            })
        }
    }

    if (config.business_type === "restaurant") {
        if (!allowMissingCalendarId && !config.calendar_id?.trim()) {
            errors.push({ field: "calendar_id", message: "El tipo restaurant requiere un Calendar ID para reservas" })
        }
        // areas opcional: variante "básico" solo reservas sin áreas (README 4.1)
        const areas = config.areas
        if (Array.isArray(areas) && areas.length > 0) {
            const invalid = areas.some((a) => typeof a !== "string" || !String(a).trim())
            if (invalid) {
                errors.push({
                    field: "areas",
                    message: "Cada área debe ser un nombre de texto (ej: Terraza, VIP)",
                })
            }
        }
    }

    if (config.business_type === "store") {
        const source = config.catalog_source || "manual"
        if (source === "pdf") {
            if (!config.catalog_pdf_key?.trim()) {
                errors.push({
                    field: "catalog_pdf_key",
                    message: "Debes subir un PDF de catálogo o elegir catálogo manual",
                })
            }
        } else {
            if (!config.catalog || !config.catalog.categories || config.catalog.categories.length === 0) {
                errors.push({
                    field: "catalog",
                    message: "Las tiendas deben tener al menos una categoría en el catálogo (o usar catálogo en PDF)",
                })
            }
        }
        // calendar_id opcional en store; solo obligatorio si hay entregas a domicilio
        if (config.delivery_available && !config.calendar_id) {
            errors.push({
                field: "calendar_id",
                message: "Si ofreces entregas a domicilio, debes configurar un Calendar ID para agendar entregas",
            })
        }
        if (config.delivery_hours) {
            const dh = config.delivery_hours
            if (!dh.start || !dh.end) {
                errors.push({
                    field: "delivery_hours",
                    message: "delivery_hours debe tener start y end (ej: 09:00 - 18:00)",
                })
            } else {
                const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/
                if (!timeRegex.test(dh.start) || !timeRegex.test(dh.end)) {
                    errors.push({
                        field: "delivery_hours",
                        message: "Horarios en formato HH:MM (ej: 09:00)",
                    })
                }
            }
        }
        if (config.delivery_duration != null && (typeof config.delivery_duration !== "number" || config.delivery_duration <= 0)) {
            errors.push({
                field: "delivery_duration",
                message: "delivery_duration debe ser un número positivo (minutos)",
            })
        }
    }

    // Validar business_hours
    if (config.business_hours) {
        if (!config.business_hours.start || !config.business_hours.end) {
            errors.push({
                field: "business_hours",
                message: "Los horarios de negocio deben tener inicio y fin",
            })
        } else {
            // Validar formato HH:MM
            const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/
            if (!timeRegex.test(config.business_hours.start)) {
                errors.push({
                    field: "business_hours.start",
                    message: "El horario de inicio debe estar en formato HH:MM (ej: 08:00)",
                })
            }
            if (!timeRegex.test(config.business_hours.end)) {
                errors.push({
                    field: "business_hours.end",
                    message: "El horario de fin debe estar en formato HH:MM (ej: 18:00)",
                })
            }
        }
    }

    // Validar working_days: 1 = Lunes, 7 = Domingo (según README bot)
    if (config.working_days) {
        const validDays = [1, 2, 3, 4, 5, 6, 7]
        const invalidDays = config.working_days.filter((day) => !validDays.includes(day))
        if (invalidDays.length > 0) {
            errors.push({
                field: "working_days",
                message: `Días inválidos: ${invalidDays.join(", ")}. Deben ser números del 1 (Lunes) al 7 (Domingo)`,
            })
        }
    }

    // Validar servicios si existen
    if (config.services) {
        config.services.forEach((service, index) => {
            if (!service.name) {
                errors.push({
                    field: `services[${index}].name`,
                    message: "El nombre del servicio es requerido",
                })
            }
            if (service.price === undefined || service.price < 0) {
                errors.push({
                    field: `services[${index}].price`,
                    message: "El precio del servicio debe ser un número positivo",
                })
            }
            if (service.duration_minutes && service.duration_minutes <= 0) {
                errors.push({
                    field: `services[${index}].duration_minutes`,
                    message: "La duración debe ser un número positivo",
                })
            }
        })
    }

    // Validar profesionales si existen
    if (config.professionals) {
        config.professionals.forEach((prof, index) => {
            if (!prof.id) {
                errors.push({
                    field: `professionals[${index}].id`,
                    message: "El ID del profesional es requerido",
                })
            }
            if (!prof.name) {
                errors.push({
                    field: `professionals[${index}].name`,
                    message: "El nombre del profesional es requerido",
                })
            }
        })
    }

    return errors
}

/**
 * Valida y normaliza tools_config antes de guardar
 */
export function normalizeToolsConfig(config: ToolsConfig): ToolsConfig {
    const normalized = { ...config }

    // working_days: 1 = Lunes, 7 = Domingo. Migrar 0 (Domingo antiguo) → 7
    if (normalized.working_days?.length) {
        normalized.working_days = [...new Set(
            normalized.working_days.map((d) => (d === 0 ? 7 : d))
        )].filter((d) => d >= 1 && d <= 7).sort((a, b) => a - b)
    }

    // Asegurar que currency tenga un valor por defecto
    if (!normalized.currency) {
        normalized.currency = "$"
    }

    // catalog_source solo indica cuál usa el bot (manual o pdf). No borramos el otro: se guardan ambos (catalog_pdf_key y catalog/services) para que al cambiar de opción sigan ahí.
    if (normalized.catalog_source !== "pdf" && normalized.catalog_source !== "manual") {
        normalized.catalog_source = normalized.catalog_pdf_key ? "pdf" : "manual"
    }

    return normalized
}
