/**
 * 2. Why decorate, rather than just exporting a variable
 *
 * Run it:  node examples/decorators/2-why-not-a-plain-variable.ts
 *
 * A module-level variable is global: one value for the whole process. A
 * decorator belongs to a branch of the plugin tree, so the same name can hold
 * different things in different places — and nothing at all elsewhere.
 */
import Fastify from "fastify"

// The "plain variable" approach: one value, forever, for everybody.
const globalDb = "the-only-database"

const app = Fastify()

// Branch A gets its own `db`.
await app.register(async (billing) => {
  billing.decorate("db", "billing-database")
  billing.get("/billing", async () => ({ decorated: billing.db, global: globalDb }))
})

// Branch B decorates the SAME name with a different value. No conflict.
await app.register(async (crm) => {
  crm.decorate("db", "crm-database")
  crm.get("/crm", async () => ({ decorated: crm.db, global: globalDb }))
})

// The parent registered both and has neither: decorations do not travel up.
app.get("/root", async () => ({
  parentHasDb: app.hasDecorator("db"),
  global: globalDb,
}))

declare module "fastify" {
  interface FastifyInstance {
    db: string
  }
}

for (const url of ["/billing", "/crm", "/root"]) {
  const r = await app.inject({ method: "GET", url })
  console.log(url.padEnd(10), "->", r.body)
}
