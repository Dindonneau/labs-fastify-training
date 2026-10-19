import type { FastifyPluginAsync } from "fastify"
import checkDecorators from "../checkDecorators.ts"
import scopedDecorator from "../../plugins/scopedDecorator.ts"
import {
  Animal,
  AnimalParams,
  type AnimalParamsType,
  type AnimalType
} from "../../schemas/animal.ts"

const animals: FastifyPluginAsync = async fastify => {
  // Confined to this branch: registered here rather than in app.ts, so fp()
  // lifts it no further than this context. /ping and the others never see it.
  await fastify.register(scopedDecorator)
  await fastify.register(checkDecorators)

  // Runs once at load time. It only works because app.ts registers
  // plugins/mongo.ts before this file.
  const collection = fastify.mongo.db?.collection("animals")
  if (!collection) throw new Error("mongo database is not available")

  // An empty collection is not an error: the guide throws here, which turns
  // "nothing yet" into a 500.
  fastify.get("/", async () => collection.find().toArray())

  fastify.get<{ Params: AnimalParamsType }>(
    "/:animal",
    { schema: { params: AnimalParams } },
    async (request, reply) => {
      const result = await collection.findOne({ animal: request.params.animal })
      // Not found is a 404, not a server error.
      if (!result) return reply.code(404).send({ error: "Animal not found" })
      return result
    }
  )

  fastify.post<{ Body: AnimalType }>(
    "/",
    { schema: { body: Animal } },
    async (request, reply) => {
      const result = await collection.insertOne({ animal: request.body.animal })
      return reply.code(201).send({ insertedId: result.insertedId.toString() })
    }
  )
}

export default animals
