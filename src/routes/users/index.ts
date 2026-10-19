import type { FastifyPluginAsync } from "fastify"
import { User, type UserType } from "../../schemas/user.ts"

const users: FastifyPluginAsync = async (fastify) => {
  fastify.post<{ Body: UserType; Reply: UserType }>(
    "/",
    { schema: { body: User, response: { 200: User } } },
    async (request, reply) => reply.code(200).send(request.body),
  )
}

export default users
