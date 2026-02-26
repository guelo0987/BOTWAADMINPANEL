/**
 * JWT Secret centralizado. En producción DEBE estar definido en JWT_SECRET.
 * En desarrollo usa un fallback para facilitar el setup local.
 */
const JWT_SECRET = process.env.JWT_SECRET

if (!JWT_SECRET && process.env.NODE_ENV === "production") {
  throw new Error(
    "JWT_SECRET debe estar definido en producción. Configura la variable de entorno JWT_SECRET."
  )
}

export const JWT_SECRET_OR_FALLBACK = JWT_SECRET || "dev_only_fallback_do_not_use_in_prod"
