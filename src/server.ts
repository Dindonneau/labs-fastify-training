import Fastify from "fastify"
import app from "./app.ts"

const server = Fastify({ logger: true })

await server.register(app)
await server.listen({ port: 8080, host: "127.0.0.1" })
