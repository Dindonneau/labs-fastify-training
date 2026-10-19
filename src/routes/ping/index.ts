import type { FastifyPluginAsync } from "fastify"
import checkDecorators from "../checkDecorators.ts"

// Mounted on /ping by app.ts, which gives it its prefix.
const ping: FastifyPluginAsync = async (fastify) => {
  await fastify.register(checkDecorators)

  fastify.get("/", async () => "pong\n")
}

export default ping
