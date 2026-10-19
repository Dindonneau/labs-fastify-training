import type { FastifyPluginAsync } from "fastify"
import globalDecorator from "./plugins/globalDecorator.ts"
import mongoPlugin from "./plugins/mongo.ts"
import animals from "./routes/animals/index.ts"
import auth from "./routes/auth/index.ts"
import ping from "./routes/ping/index.ts"
import users from "./routes/users/index.ts"

// Support plugins first, routes second: routes/animals reads fastify.mongo
// while it loads, never the other way round.
const app: FastifyPluginAsync = async (fastify) => {
  // Registered at the root, so every branch below inherits it.
  await fastify.register(globalDecorator, { onReplyValue: 911 })
  await fastify.register(mongoPlugin)

  await fastify.register(ping, { prefix: "/ping" })
  await fastify.register(auth, { prefix: "/auth" })
  await fastify.register(users, { prefix: "/users" })
  await fastify.register(animals, { prefix: "/animals" })
}

export default app
