import { PutObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { GetObjectCommand } from "@aws-sdk/client-s3"
import { s3Client, SUPABASE_BUCKET_LOGOS } from "@/lib/supabase-s3"

const MAX_LOGO_SIZE_BYTES = 2 * 1024 * 1024 // 2 MB
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"]

export interface UploadLogoResult {
  path: string
  key: string
  url: string
}

/**
 * Sube un logo al bucket de Supabase vía API S3.
 * Path: client_{clientId}/logo.{ext}
 */
export async function uploadLogo(
  file: Buffer | Blob,
  clientId: number,
  fileName?: string
): Promise<UploadLogoResult> {
  if (!s3Client) {
    throw new Error(
      "Supabase S3 no está configurado. Revisa SUPABASE_S3_ACCESS_KEY_ID, SUPABASE_S3_SECRET_ACCESS_KEY y SUPABASE_S3_ENDPOINT."
    )
  }

  const size = file instanceof Buffer ? file.length : file.size
  if (size > MAX_LOGO_SIZE_BYTES) {
    throw new Error(`El logo no puede superar ${MAX_LOGO_SIZE_BYTES / 1024 / 1024} MB.`)
  }

  const ext = fileName?.match(/\.(png|jpe?g|webp)$/i)?.[1]?.toLowerCase() || "png"
  const key = `client_${clientId}/logo.${ext}`

  const body = file instanceof Buffer ? file : Buffer.from(await file.arrayBuffer())
  const contentType = ALLOWED_TYPES.find((t) => t.includes(ext.replace("jpeg", "jpg"))) || "image/png"

  await s3Client.send(
    new PutObjectCommand({
      Bucket: SUPABASE_BUCKET_LOGOS,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  )

  // URL pública si el bucket es público: SUPABASE_URL/storage/v1/object/public/{bucket}/{key}
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ""
  const url = supabaseUrl
    ? `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/public/${SUPABASE_BUCKET_LOGOS}/${key}`
    : ""

  return {
    path: key,
    key,
    url: url || key,
  }
}

/**
 * Genera una URL firmada para descargar el logo.
 */
export async function getLogoSignedUrl(
  key: string,
  expiresIn: number = 3600
): Promise<string> {
  if (!s3Client) {
    throw new Error("Supabase S3 no está configurado.")
  }

  const command = new GetObjectCommand({
    Bucket: SUPABASE_BUCKET_LOGOS,
    Key: key,
  })

  return getSignedUrl(s3Client, command, { expiresIn })
}
