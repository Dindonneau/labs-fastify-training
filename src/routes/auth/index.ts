import type { FastifyPluginAsync } from "fastify"
import checkDecorators from "../checkDecorators.ts"

interface IQuerystring {
  username: string
  password: string
}

interface IHeaders {
  "h-Custom": string
}

interface IReply {
  200: { success: boolean; message?: string }
  302: { url: string }
  "4xx": { error: string }
}

const auth: FastifyPluginAsync = async (fastify) => {
  await fastify.register(checkDecorators)

  fastify.get<{ Querystring: IQuerystring; Headers: IHeaders; Reply: IReply }>(
    "/",
    {
      // The guide throws here, which Fastify turns into a 500. Refusing a
      // caller is a 401, like the password check below.
      preValidation: async (request, reply) => {
        const { username } = request.query
        if (username !== "admin") {
          return reply.code(401).send({ error: "Unauthorized" })
        }
      },
    },
    async (request, reply) => {
      const { password } = request.query

      if (password !== "Password123!") {
        return reply.code(401).send({ error: "Unauthorized" })
      }

      return reply.code(200).send({ success: true, message: "logged in!" })
    },
  )
}

export default auth
