import { PutObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { GetObjectCommand } from "@aws-sdk/client-s3"
import { s3Client, SUPABASE_BUCKET_CATALOGS } from "@/lib/supabase-s3"

const MAX_PDF_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB

export interface UploadCatalogPdfResult {
  path: string
  key: string
}

/**
 * Sube un PDF de catálogo al bucket de Supabase vía API S3.
 * Path: client_{clientId}/catalogo.pdf (o nombre original).
 */
export async function uploadCatalogPdf(
  file: Buffer | Blob,
  clientId: number,
  fileName?: string
): Promise<UploadCatalogPdfResult> {
  if (!s3Client) {
    throw new Error(
      "Supabase S3 no está configurado. Revisa SUPABASE_S3_ACCESS_KEY_ID, SUPABASE_S3_SECRET_ACCESS_KEY y SUPABASE_S3_ENDPOINT."
    )
  }

  const size = file instanceof Buffer ? file.length : file.size
  if (size > MAX_PDF_SIZE_BYTES) {
    throw new Error(`El archivo no puede superar ${MAX_PDF_SIZE_BYTES / 1024 / 1024} MB.`)
  }

  const safeName = fileName && /\.pdf$/i.test(fileName) ? fileName : "catalogo.pdf"
  const key = `client_${clientId}/${safeName}`

  const body = file instanceof Buffer ? file : Buffer.from(await file.arrayBuffer())

  await s3Client.send(
    new PutObjectCommand({
      Bucket: SUPABASE_BUCKET_CATALOGS,
      Key: key,
      Body: body,
      ContentType: "application/pdf",
    })
  )

  return {
    path: key,
    key,
  }
}

/**
 * Genera una URL firmada para descargar el PDF.
 * @param key catalog_pdf_key (path en el bucket)
 * @param expiresIn segundos (default 1 hora)
 */
export async function getCatalogPdfSignedUrl(
  key: string,
  expiresIn: number = 3600
): Promise<string> {
  if (!s3Client) {
    throw new Error("Supabase S3 no está configurado.")
  }

  const command = new GetObjectCommand({
    Bucket: SUPABASE_BUCKET_CATALOGS,
    Key: key,
  })

  const url = await getSignedUrl(s3Client, command, { expiresIn })
  return url
}
