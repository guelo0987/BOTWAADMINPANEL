import { ToolsConfig } from "@/types"

export interface ValidationError {
    field: string
    message: string
}

/**
 * Valida tools_config según el business_type
 */
export function validateToolsConfig(config: ToolsConfig): ValidationError[] {
    const errors: ValidationError[] = []

    // Validaciones comunes
    if (!config.business_type) {
        errors.push({
            field: "business_type",
            message: "El tipo de negocio es requerido",
        })
    }

    if (!config.timezone) {
        errors.push({
            field: "timezone",
            message: "La zona horaria es requerida",
        })
    }

    // Validaciones específicas por tipo de negocio
    if (config.business_type === "general") {
        // General no requiere validaciones adicionales
    } else if (config.business_type === "clinic") {
        if (!config.professionals || config.professionals.length === 0) {
            errors.push({
                field: "professionals",
                message: "Las clínicas deben tener al menos un profesional",
            })
        }

        if (!config.services || config.services.length === 0) {
            errors.push({
                field: "services",
                message: "Las clínicas deben tener al menos un servicio",
            })
        }

        // Validar que cada profesional tenga calendar_id si hay múltiples
        if (config.professionals && config.professionals.length > 1) {
            config.professionals.forEach((prof, index) => {
                if (!prof.calendar_id) {
                    errors.push({
                        field: `professionals[${index}].calendar_id`,
                        message: `El profesional ${prof.name} debe tener un calendar_id cuando hay múltiples profesionales`,
                    })
                }
            })
        }
    }

    if (config.business_type === "salon") {
        if (!config.services || config.services.length === 0) {
            errors.push({
                field: "services",
                message: "Los salones deben tener al menos un servicio (con nombre, precio y duration_minutes)",
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
        const areas = config.areas
        if (!Array.isArray(areas) || areas.length === 0) {
            errors.push({
                field: "areas",
                message: "Los restaurantes deben tener al menos un área (ej: Terraza, Salón principal)",
            })
        } else {
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
        if (!config.catalog || !config.catalog.categories || config.catalog.categories.length === 0) {
            errors.push({
                field: "catalog",
                message: "Las tiendas deben tener al menos una categoría en el catálogo",
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

    // Validar working_days
    if (config.working_days) {
        const validDays = [0, 1, 2, 3, 4, 5, 6]
        const invalidDays = config.working_days.filter((day) => !validDays.includes(day))
        if (invalidDays.length > 0) {
            errors.push({
                field: "working_days",
                message: `Días inválidos: ${invalidDays.join(", ")}. Deben ser números del 0 (Domingo) al 6 (Sábado)`,
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

    // Asegurar que working_days esté ordenado
    if (normalized.working_days) {
        normalized.working_days = [...normalized.working_days].sort((a, b) => a - b)
    }

    // Asegurar que currency tenga un valor por defecto
    if (!normalized.currency) {
        normalized.currency = "$"
    }

    return normalized
}
