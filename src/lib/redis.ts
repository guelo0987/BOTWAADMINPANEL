import { createClient } from "redis"

const redisUrl = process.env.REDIS_URL
if (!redisUrl && process.env.NODE_ENV === "production") {
  throw new Error("REDIS_URL debe estar definido en producción. Configura la variable de entorno.")
}
const redisUrlOrFallback = redisUrl || "redis://localhost:6379"
const connectTimeoutMs = parseFloat(process.env.REDIS_CONNECT_TIMEOUT_SECONDS ?? "3") * 1000

const redisClient = createClient({
    url: redisUrlOrFallback,
    socket: {
        connectTimeout: connectTimeoutMs,
    },
})

redisClient.on("error", (err) => console.error("Redis Client Error", err))

// Connect if not already connected (Next.js hot reload safety)
if (!redisClient.isOpen) {
    redisClient.connect()
}

export default redisClient
