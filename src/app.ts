import type { FastifyPluginAsync } from "fastify"
import globalDecorator from "./plugins/globalDecorator.ts"
import auth from "./routes/auth/index.ts"
import ping from "./routes/ping/index.ts"
import users from "./routes/users/index.ts"

// Support plugins first, routes second.
const app: FastifyPluginAsync = async (fastify) => {
  // Registered at the root, so every branch below inherits it.
  await fastify.register(globalDecorator, { onReplyValue: 911 })

  await fastify.register(ping, { prefix: "/ping" })
  await fastify.register(auth, { prefix: "/auth" })
  await fastify.register(users, { prefix: "/users" })
}

export default app
