import { createClient } from "redis"

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379"
const connectTimeoutMs = parseFloat(process.env.REDIS_CONNECT_TIMEOUT_SECONDS ?? "3") * 1000

const redisClient = createClient({
    url: redisUrl,
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
