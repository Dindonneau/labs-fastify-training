import type { FastifyPluginAsync } from "fastify"

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
  fastify.get<{ Querystring: IQuerystring; Headers: IHeaders; Reply: IReply }>(
    "/",
    {
      preValidation: async (request) => {
        const { username } = request.query
        if (username !== "admin") throw new Error("Must be admin")
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
