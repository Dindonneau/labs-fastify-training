# lemfast

A training project: a Fastify 5 server in TypeScript, built by working through the official guides one example at a time, then rearranged into the layout a real Fastify application uses.

## The guides

Two pages, followed example by example:

- [Reference/TypeScript](https://fastify.dev/docs/latest/Reference/TypeScript/) — the four "Learn By Example" exercises: a bare server, route generics, JSON Schema with TypeBox, and plugins.
- [Guides/Getting-Started](https://fastify.dev/docs/latest/Guides/Getting-Started/) — its MongoDB section, for asynchronous bootstrapping.

Both assume CommonJS. This project is TypeScript and ESM, which accounts for most of the departures listed at the end.

No dependency is installed unless one of those pages calls for it.

## Stack

- Fastify 5.12, with `fastify-plugin` and `@fastify/mongodb`
- TypeBox 1.3 — schemas written in TypeScript, types derived from them
- TypeScript 7
- Node 24 — `.nvmrc` pins `lts/krypton`
- MongoDB, reachable on `localhost:27017` — database `lemfast`, collection `animals`

## Running it

A local MongoDB is required: the server connects on startup and will refuse to start without it.

```bash
nvm use
npm install
npm run dev          # reloads on save, straight from the sources
```

Or to run what would actually ship:

```bash
npm run build && npm run start
```

It listens on `127.0.0.1:8080`.

```bash
curl localhost:8080/ping
curl 'localhost:8080/auth?username=admin&password=Password123!'
curl -X POST localhost:8080/users   -H 'content-type: application/json' -d '{"name":"unicorn","email":"unicorn@rainbow.com"}'
curl -X POST localhost:8080/animals -H 'content-type: application/json' -d '{"animal":"fox"}'
curl localhost:8080/animals
```

Every branch also answers on `/<branch>/checkDecorators`, which reports what that branch can see — see below.

Quote the `/auth` URL: `?`, `&` and `!` are interpreted by the shell otherwise.

`npm test` is still the placeholder `npm init` wrote; there are no tests yet.

## Layout

```
src/
  server.ts              creates the instance and listens — the only entry point
  app.ts                 composes the application: plugins, then routes
  plugins/
    globalDecorator.ts   decorates request and reply, declared globally
    scopedDecorator.ts   decorates too, declared nowhere
    mongo.ts             opens the MongoDB connection, decorating fastify.mongo
  routes/
    ping/   auth/   users/   animals/
    checkDecorators.ts   one file, registered inside each branch above
  schemas/
    user.ts   animal.ts  TypeBox schemas and the types derived from them
examples/
  decorators/            three runnable notes on what a decorator is
```

`app.ts` registers everything explicitly, and the order is deliberate:

```ts
await fastify.register(globalDecorator, { onReplyValue: 911 })
await fastify.register(mongoPlugin)

await fastify.register(ping, { prefix: "/ping" })
await fastify.register(animals, { prefix: "/animals" })
// …
```

Support first, routes second — `routes/animals/index.ts` reads `fastify.mongo` _while it loads_, not inside a handler, so the connection has to exist by then. Swapping the two lines does not break a request later; it stops the server from starting at all, with `Cannot read properties of undefined (reading 'db')`. That is the asynchronous bootstrapping the Getting-Started guide is about.

Each route plugin receives its prefix from `app.ts`, so a route file declares `fastify.get("/")` and answers on `/ping` or `/animals`. Nothing is wired implicitly: reading `app.ts` tells you the whole application.

## What a schema buys over a generic

Both describe the same shape, and neither replaces the other.

A route generic — `fastify.post<{ Body: UserType }>` — exists only for TypeScript. It is erased at runtime and verifies nothing; it is a promise made to the compiler.

A `schema` lives at runtime. Fastify compiles it once at startup into a validation function and a dedicated serializer, so an invalid body is rejected with a 400 before the handler runs, and any field missing from the response schema is stripped from the answer.

```
POST /users {"name":"unicorn","email":"nope"}                  → 400  body/email must match format "email"
POST /users {"name":"unicorn","email":"unicorn@rainbow.com","x":"y"} → 200  {"name":"unicorn","email":"unicorn@rainbow.com"}
```

TypeBox writes both from one source: `User` is the schema, `UserType` is `Type.Static<typeof User>` derived from it — so the two cannot drift apart.

## What a plugin encapsulates

`register` does not load a plugin into your instance. Fastify builds a **child instance**, inherited from yours, and hands that one to the plugin. Whatever it decorates, hooks or registers lives in the child and does not travel back up.

This is not about where middleware runs — Express scopes that just as well, per path or per router. What is encapsulated here is the server object itself: a decoration belongs to one branch of the tree rather than to a single global app.

Hence the split between the two folders. Files under `plugins/` are wrapped in `fastify-plugin`, which lifts them into the context that registered them — without it, `fastify.mongo` would stay inside `plugins/mongo.ts` and no route would see it. Files under `routes/` are not wrapped, so each stays isolated.

One line of `plugins/globalDecorator.ts` makes it visible. Swap the export and call any `/checkDecorators` again:

```
export default fp(globalDecorator)   →  {"hasGlobalReqDecorator":true,  …}
export default globalDecorator       →  {"hasGlobalReqDecorator":false, …}
```

Without `fp`, the plugin still runs — its decorations simply stay in its own child context, and no branch sees them.

## Two ways to type a decoration, and how to see the difference

`decorate` runs at runtime; TypeScript knows nothing about it. The two plugins do the same job and differ only in how they tell the compiler about it — and in how far they reach.

**`plugins/globalDecorator.ts`** declares the properties on Fastify's own interfaces:

```ts
export const MODULE_PROP_KEY = "moduleAugmentedProp"

declare module "fastify" {
  interface FastifyRequest {
    [MODULE_PROP_KEY]: string
  }
}
```

Comfortable: a handler writes `request.moduleAugmentedProp` and it just works, everywhere, with autocompletion. But the claim is global — _every_ Fastify instance in the project is now said to carry it, including instances that never registered the plugin.

**`plugins/scopedDecorator.ts`** declares nothing at all. A handler that needs the value would ask for it, with a type local to its own file:

```ts
const scoped = request.getDecorator<ScopedProp>(SCOPED_PROP_KEY)
```

Nothing reaches the global interfaces, and Fastify checks at runtime that the decoration is really there — a missing one raises a named error rather than handing back `undefined`.

Neither value is read anywhere here: `routes/checkDecorators.ts` only asks whether the decoration *exists*, with `hasRequestDecorator`, since what this project demonstrates is their reach rather than their contents.

### The demonstration

`routes/checkDecorators.ts` is a single file, registered inside each route branch. Every copy reports what _its_ branch can see. `globalDecorator` is registered at the root of `app.ts`; `scopedDecorator` is registered by `routes/animals/index.ts` itself, so it never leaves that branch:

```
GET /ping/checkDecorators      {"hasGlobalReqDecorator":true,"hasScopedReqDecorator":false}
GET /auth/checkDecorators      {"hasGlobalReqDecorator":true,"hasScopedReqDecorator":false}
GET /users/checkDecorators     {"hasGlobalReqDecorator":true,"hasScopedReqDecorator":false}
GET /animals/checkDecorators   {"hasGlobalReqDecorator":true,"hasScopedReqDecorator":true}
```

Three identical answers and one that differs — that is encapsulation, with no explanation needed.

Worth noting: the placement is what confines the plugin, not `fp()`. Registering `scopedDecorator` from `app.ts` with `{ prefix: "/animals" }` would _not_ confine it — `fp()` lifts a plugin into whoever registers it, which would be the root. Registering it from inside `routes/animals/index.ts` lifts it no further than that branch, because the route file is itself an encapsulated context.

Module augmentation suits a plugin registered once at the root and used throughout — `fastify.mongo` is in that case. Scoped types suit a decoration that exists on one branch only, or a name covering several implementations: module augmentation allows exactly one type per name for the whole project.

## Type checking

`npm run dev` does **not** check types. Node runs the TypeScript sources by stripping the annotations away without validating them, so the server starts even when the types are wrong.

The editor covers most of that gap as you type, with one caveat: editors built on VS Code ship their own TypeScript — 6.x at the time of writing — while this project builds with 7.0.2. Pointing `typescript.tsdk` at the local install does not help, because TypeScript 7 no longer ships a language server in its npm package.

So the editor reads this code with one compiler and `npm run build` judges it with another. **When they disagree, the build wins** — run it before committing.

## Departures from the guides

Both pages assume **CommonJS**. They never say so, but three of their instructions only work there: `node index.js` on a file compiled at the root, relative imports without extensions, and `.json` files imported directly. This project is ESM, and most of what follows comes from that one choice.

**ESM rather than CommonJS** (`"type": "module"`). Not a matter of taste: `tsc --init` on TypeScript 7 generates `verbatimModuleSyntax`, which forbids writing `import` in a file compiled to CommonJS. Keeping the generated configuration means being ESM.

**`.ts` extensions in relative imports.** ESM requires an explicit extension, and TypeScript normally emits import paths untouched — which is why the usual advice is to write `.js` inside a `.ts` file, naming the compiled output rather than the real file. `rewriteRelativeImportExtensions` removes that oddity: the sources import `../../schemas/user.ts`, the build emits `.js`.

**The layout itself.** Neither page organises anything: the TypeScript one keeps everything in a single `index.ts`, the Getting-Started one uses three loose files. The folder structure here — `app.ts`, `plugins/`, `routes/`, one `server.ts` — follows what `fastify-cli generate` produces, so the project reads like a Fastify application rather than a pile of exercises. The wiring, however, is written by hand: `fastify-cli` uses `@fastify/autoload` to register a folder at a time, which is one dependency and one layer of convention for lines that are just as easy to read when spelled out.

**The plugin's option typed as `number`**, where the guide declares it `string`. The guide's own snippet does not compile: it types the reply decoration as `number` and then feeds it that `string` option. Here the key is a shared constant (`MODULE_PROP_KEY`) used by both the augmentation and the `decorate` calls, so renaming it cannot desynchronise them — and the option keeps a name of its own, `onReplyValue`, rather than reusing the decoration's.

**Status codes.** The guides throw whenever something is missing, which Fastify turns into 500s. Two places are corrected here. On `/auth`, the guide's `preValidation` throws `Must be admin`; refusing a caller is a 401, like the password check right below it:

```
GET /auth?username=bob&…   → 401 {"error":"Unauthorized"}
```

**On `/animals`,** the guide throws when a query returns nothing — `throw new Error('No documents found')` on an empty collection, `throw new Error('Invalid value')` on a missing document — which Fastify turns into 500s. An empty collection is not a server error, and a missing animal is a 404. Both are corrected here:

```
GET  /animals          (nothing stored yet)  → 200 []
GET  /animals/dragon   (no such animal)      → 404 {"error":"Animal not found"}
POST /animals          (creates a document)  → 201 {"insertedId":"…"}
```

Nothing needs provisioning for this to work: MongoDB creates the database and the collection on the first write, and reading a collection that does not exist returns an empty array rather than failing.

**TypeBox for the animals schemas**, where the Getting-Started page writes JSON Schema literals — for consistency with the rest of the project.

**`noUnusedLocals: true`**, standing in for the ESLint `no-unused-vars` rule the guide recommends, without adding a dependency. And `declaration: true` with a `types` field, which the plugin example asks for; they only emit unused `.d.ts` files here, and are kept so the project matches the page.

Everything else is followed as written, with the examples adapted to ESM and TypeScript.

## examples/

`examples/decorators/` holds three runnable files on what a decorator is, why it beats a module-level variable, and the two ways to type one.

These three files were generated by an AI assistant, as teaching material: their only purpose was to understand how decorators behave, by running them and reading what they print. They are not part of the application.

They also sit outside `src/` on purpose: their `declare module` blocks would otherwise add properties to the global Fastify interfaces for the whole project — which is itself the point they make. `tsconfig.json` is scoped to `src`, so they are not part of the build.
