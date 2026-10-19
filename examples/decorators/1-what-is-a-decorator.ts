/**
 * 1. What a decorator actually is
 *
 * Run it:  node examples/decorators/1-what-is-a-decorator.ts
 *
 * A decorator is nothing clever: it attaches a property to an object Fastify
 * already hands you — the server instance, the request, or the reply — so that
 * code elsewhere can reach it. `fastify.decorate("x", v)` is close to
 * `fastify.x = v`, with two differences that matter, shown in files 2 and 3.
 */
import Fastify from "fastify"

const app = Fastify()

// --- on the instance: available to every route below it
app.decorate("appName", "lemfast")
app.decorate("greet", (who: string) => `hello ${who}`)

// --- on the request: one value per incoming call
app.decorateRequest("requestId", "")

// --- on the reply: same idea, on the way out
app.decorateReply("servedBy", "")

app.addHook("onRequest", async (request, reply) => {
  // Each request gets its own value. This is why decorateRequest is declared
  // once with a default, then filled per call.
  request.requestId = Math.random().toString(36).slice(2, 8)
  reply.servedBy = app.appName
})

app.get("/", async (request, reply) => ({
  fromInstance: app.greet(app.appName),
  fromRequest: request.requestId,
  fromReply: reply.servedBy,
}))

// Fastify knows what it carries, without TypeScript being involved:
app.get("/introspect", async () => ({
  hasAppName: app.hasDecorator("appName"),
  hasGreet: app.hasDecorator("greet"),
  hasUnknown: app.hasDecorator("nope"),
}))

declare module "fastify" {
  interface FastifyInstance {
    appName: string
    greet(who: string): string
  }
  interface FastifyRequest {
    requestId: string
  }
  interface FastifyReply {
    servedBy: string
  }
}

for (const url of ["/", "/introspect"]) {
  const r = await app.inject({ method: "GET", url })
  console.log(url.padEnd(12), "->", r.body)
}
