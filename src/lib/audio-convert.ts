import { execFile } from "child_process"
import { writeFile, readFile, unlink } from "fs/promises"
import { tmpdir } from "os"
import { join } from "path"
import ffmpegPath from "ffmpeg-static"

const WHATSAPP_ACCEPTED_AUDIO = [
    "audio/aac",
    "audio/mp4",
    "audio/mpeg",
    "audio/amr",
    "audio/ogg",
    "audio/opus",
]

/**
 * Converts audio to a WhatsApp-accepted format (OGG/Opus) if needed.
 * Chrome records audio/webm which WhatsApp rejects — this converts it via ffmpeg.
 */
export async function convertAudioForWhatsApp(
    buffer: Buffer,
    mimeType: string
): Promise<{ buffer: Buffer; mimeType: string }> {
    const baseType = mimeType.split(";")[0].trim()

    if (WHATSAPP_ACCEPTED_AUDIO.includes(baseType)) {
        console.log("[audio-convert] %s already accepted by WhatsApp, skipping conversion", baseType)
        return { buffer, mimeType: baseType }
    }

    if (!ffmpegPath) {
        throw new Error("ffmpeg not available — cannot convert audio")
    }

    console.log("[audio-convert] Converting %s (%d bytes) → ogg/opus via ffmpeg", baseType, buffer.length)

    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
    const ext = baseType.includes("webm") ? "webm" : "bin"
    const inputPath = join(tmpdir(), `wa-in-${id}.${ext}`)
    const outputPath = join(tmpdir(), `wa-out-${id}.ogg`)

    await writeFile(inputPath, buffer)

    try {
        const convertedBuffer = await new Promise<Buffer>((resolve, reject) => {
            execFile(
                ffmpegPath!,
                [
                    "-y",
                    "-i", inputPath,
                    "-c:a", "libopus",
                    "-b:a", "64k",
                    "-vn",
                    "-f", "ogg",
                    outputPath,
                ],
                { timeout: 30000 },
                async (error, _stdout, stderr) => {
                    if (error) {
                        console.error("[audio-convert] ffmpeg error:", error.message, stderr)
                        reject(new Error(`ffmpeg conversion failed: ${error.message}`))
                        return
                    }
                    try {
                        const result = await readFile(outputPath)
                        resolve(result)
                    } catch (readErr: any) {
                        reject(new Error(`Failed to read converted file: ${readErr.message}`))
                    }
                }
            )
        })

        console.log(
            "[audio-convert] Done: %s (%d bytes) → ogg (%d bytes)",
            baseType, buffer.length, convertedBuffer.length
        )
        return { buffer: convertedBuffer, mimeType: "audio/ogg" }
    } finally {
        await unlink(inputPath).catch(() => {})
        await unlink(outputPath).catch(() => {})
    }
}
