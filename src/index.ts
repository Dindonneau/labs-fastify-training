import fastify from "fastify"

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

server.get("/ping", async (request, reply) => {
  return "pong\n"
})

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

server.listen({ port: 8080, host: "127.0.0.1" }, (err, address) => {
  if (err) {
    console.error(err)
    process.exit(1)
  }
  console.log(`Server listening at ${address}`)
})
