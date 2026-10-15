import fastify from "fastify"
import { User, type UserType } from "./schemas/user.ts"
import myPlugin from "./plugins/index.ts"

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

const server = fastify()

server.register(myPlugin, { myPluginOption: 911 })

server.get("/plugin", async (req, res) => ({
  fromRequest: req.myPluginProp,
  fromReply: res.myPluginProp
}))

server.get("/ping", async (request, reply) => {
  return "pong\n"
})

// Fastify example
server.get<{ Querystring: IQuerystring; Headers: IHeaders; Reply: IReply }>(
  "/auth",
  {
    preValidation: async (req, res) => {
      const { username } = req.query
      if (username !== "admin") throw new Error("Must be admin")
    }
  },
  async (req, res) => {
    const { username, password } = req.query
    // const customerHeader = req.headers["h-Custom"]

    // if (!customerHeader) {
    //   return res.code(400).send({ error: "Bad Request" })
    // }

    if (password !== "Password123!") {
      return res.code(401).send({ error: "Unauthorized" })
    }

    if (username !== "admin") {
      return res.code(404).send({ error: "Not found" })
    }

    return res.code(200).send({ success: true, message: "logged in!" })
  }
)

// Typebox example
server.post<{ Body: UserType; Reply: UserType }>(
  "/",
  {
    schema: {
      body: User,
      response: {
        200: User
      }
    }
  },
  async (req, res) => {
    const { name, email } = req.body
    return res.code(200).send({ name, email: email ?? "" })
  }
)

server.listen({ port: 8080, host: "127.0.0.1" }, (err, address) => {
  if (err) {
    console.error(err)
    process.exit(1)
  }
  console.log(`Server listening at ${address}`)
})
