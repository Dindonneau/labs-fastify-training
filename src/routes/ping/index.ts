import type { FastifyPluginAsync } from "fastify"

// Mounted on /ping by app.ts, which gives it its prefix.
const ping: FastifyPluginAsync = async (fastify) => {
  fastify.get("/", async () => "pong\n")
}

export default ping
