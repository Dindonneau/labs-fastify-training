/**
 * 3. Teaching TypeScript about a decorator — two ways
 *
 * Run it:  node src/decorators/3-typing-them.ts
 *
 * `decorate` happens at runtime; TypeScript knows nothing about it. You either
 * declare it globally (module augmentation) or ask for it locally
 * (getDecorator). The difference only shows up once plugins are encapsulated.
 */
import Fastify from "fastify"
import fp from "fastify-plugin"

interface Store {
  find(): string
}

// --- Way 1: module augmentation. Global: EVERY FastifyInstance of the whole
// project now has `store` in its type, including instances that never got it.
declare module "fastify" {
  interface FastifyInstance {
    store: Store
  }
}

const storePlugin = fp(async fastify => {
  fastify.decorate("store", { find: () => "real data" })
})

const app = Fastify()

// Branch A registers the plugin, so it genuinely has the decorator.
await app.register(async withStore => {
  withStore.get("/a", async () => ({ via: withStore.store.find() }))
  await withStore.register(storePlugin)
})

// Branch B never registers it.
await app.register(async withoutStore => {
  // Way 1 here: this COMPILES, because the augmentation is global.
  // At runtime the property is simply missing.
  withoutStore.get("/b-augmented", async () => ({
    typeofStore: typeof withoutStore.store
  }))

  // Way 2 here: ask Fastify for it, with a type that lives only in this file.
  // Fastify answers honestly instead of handing back undefined.
  withoutStore.get("/b-getdecorator", async () => {
    try {
      const store = withoutStore.getDecorator<Store>("store")
      return { via: store.find() }
    } catch (error) {
      return { failedWith: (error as Error).message }
    }
  })
})

for (const url of ["/a", "/b-augmented", "/b-getdecorator"]) {
  const r = await app.inject({ method: "GET", url })
  console.log(url.padEnd(17), "->", r.body)
}
