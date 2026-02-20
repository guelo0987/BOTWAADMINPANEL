import { S3Client } from "@aws-sdk/client-s3"

const SUPABASE_S3_ACCESS_KEY_ID = process.env.SUPABASE_S3_ACCESS_KEY_ID
const SUPABASE_S3_SECRET_ACCESS_KEY = process.env.SUPABASE_S3_SECRET_ACCESS_KEY
const SUPABASE_S3_ENDPOINT = process.env.SUPABASE_S3_ENDPOINT
const SUPABASE_S3_REGION = process.env.SUPABASE_S3_REGION || "us-east-2"

if (!SUPABASE_S3_ACCESS_KEY_ID || !SUPABASE_S3_SECRET_ACCESS_KEY || !SUPABASE_S3_ENDPOINT) {
  console.warn(
    "Supabase S3: SUPABASE_S3_ACCESS_KEY_ID, SUPABASE_S3_SECRET_ACCESS_KEY o SUPABASE_S3_ENDPOINT no definidos. Subida de catálogos PDF no disponible."
  )
}

/**
 * Cliente S3 compatible con Supabase Storage (API S3).
 * Solo usar en API routes / server; no exponer credenciales al cliente.
 */
export const s3Client =
  SUPABASE_S3_ACCESS_KEY_ID && SUPABASE_S3_SECRET_ACCESS_KEY && SUPABASE_S3_ENDPOINT
    ? new S3Client({
        region: SUPABASE_S3_REGION,
        endpoint: SUPABASE_S3_ENDPOINT,
        credentials: {
          accessKeyId: SUPABASE_S3_ACCESS_KEY_ID,
          secretAccessKey: SUPABASE_S3_SECRET_ACCESS_KEY,
        },
        forcePathStyle: true,
      })
    : null

export const SUPABASE_BUCKET_CATALOGS = process.env.SUPABASE_BUCKET_CATALOGS || "catalogs"
export const SUPABASE_BUCKET_LOGOS = process.env.SUPABASE_BUCKET_LOGOS || "logos"
