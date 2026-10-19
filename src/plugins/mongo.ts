import fp from "fastify-plugin"
import fastifyMongo from "@fastify/mongodb"
import type { FastifyPluginAsync } from "fastify"

// The guide's our-db-connector.js, in TypeScript.
const dbConnector: FastifyPluginAsync = async fastify => {
  await fastify.register(fastifyMongo, {
    url: "mongodb://localhost:27017/lemfast"
  })
}

export default fp(dbConnector)
