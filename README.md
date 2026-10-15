# lemfast

A training project: a Fastify 5 server in TypeScript, built step by step from the official TypeScript reference.

Its only purpose is to learn Fastify's type system on a throwaway app — route typing, schemas, plugins — by working through the documented examples one at a time, in their order, with nothing added on top.

## The guide

The project follows the "Learn By Example" section of the Fastify TypeScript reference: <https://fastify.dev/docs/latest/Reference/TypeScript/>

It is made of four examples, worked through in order:

1. **Getting Started** — a blank HTTP server ← *done*
2. **Using Generics** — typed querystring, headers and reply ← *done*
3. **JSON Schema** — runtime validation, via TypeBox ← *done*
4. **Plugins** — encapsulation, decorators, declaration merging ← *done*

The third example offers three routes to the same destination: TypeBox, `json-schema-to-typescript` and `json-schema-to-ts`. Only the first is implemented here; the other two produce the same JSON Schema by other means.

No dependency is installed unless that page calls for it. Anything the guide does not mention waits until the guide gets there.

## Stack

- Fastify 5.12, with `fastify-plugin`
- TypeBox 1.3 — schemas written in TypeScript, types derived from them
- TypeScript 7
- Node 24 — `.nvmrc` pins `lts/krypton`
- `@tsconfig/node24` as the compiler baseline

## Getting started

```bash
nvm use
npm install
```

While developing, run the server straight from the sources, reloading on every save:

```bash
npm run dev
```

To run what will actually ship, compile first:

```bash
npm run build
npm run start
```

Either way the server listens on `127.0.0.1:8080` — bound to the loopback interface on purpose, so a development server never answers the local network. Check it with:

```bash
curl localhost:8080/ping
```

It should answer `pong`. The typed routes:

```bash
curl 'localhost:8080/auth?username=admin&password=Password123!'
curl -X POST localhost:8080/ -H 'content-type: application/json' -d '{"name":"Paul","email":"p@b.co"}'
curl localhost:8080/plugin
```

`/plugin` answers `{"fromRequest":"super_secret_value","fromReply":911}` — the `911` being the option handed to `register`, carried all the way to the reply.

Quote the first URL: `?`, `&` and `!` are all interpreted by the shell otherwise.

`npm test` is still the placeholder `npm init` wrote; there are no tests yet.

## What a schema buys over a generic

Both describe the same shape, and they do not replace each other.

A route generic — `server.post<{ Body: UserType }>` — exists only for TypeScript. It is erased at runtime and verifies nothing; it is a promise made to the compiler.

A `schema` lives at runtime. Fastify compiles it once at startup into a validation function and a dedicated serializer, so an invalid body is rejected with a 400 before the handler runs, and any field missing from the response schema is stripped from the answer.

```
POST {"name":"Paul","email":"nope"}            → 400  body/email must match format "email"
POST {"name":"Paul","email":"p@b.co","x":"y"}  → 200  {"name":"Paul","email":"p@b.co"}
```

TypeBox writes both from one source: `User` is the schema, and `UserType` is `Type.Static<typeof User>` derived from it — so the two can never drift apart.

## What a plugin encapsulates

`server.register(plugin)` does not load the plugin into your instance. Fastify builds a **child instance**, inherited from yours, and hands that one to the plugin. Whatever the plugin decorates, hooks or registers lives in the child and does not travel back up.

This is not about where middleware runs — Express scopes that just as well, per path or per router. What is encapsulated here is the server object itself: a decoration belongs to one branch of the tree rather than to a single global app, so two sibling plugins can decorate the same name without colliding.

One line of `src/plugins/index.ts` makes it visible. Swap the export, call `/plugin` again:

```
export default fp(myPluginAsync)   →  {"fromRequest":"super_secret_value","fromReply":911}
export default myPluginAsync       →  {}
```

The plugin still runs in both cases. Without `fp`, its decorations simply stay in its own child context, and the route never sees them.

Two distinct mechanisms follow from that, easy to confuse:

- **`fastify-plugin`** wraps a plugin to say "do not give me a child context, run me in the one that registers me". Without it, a plugin that only decorates or adds a hook affects nobody — not even the routes declared beside it.
- **An anonymous `register`** is what draws a boundary. Routes declared inside it inherit that context; routes declared outside never see it.

Together they give a property worth the detour: an authentication plugin loaded in a context protects every route of that context **by construction**. Adding a route there cannot forget it, where `app.get('/x', requireAuth, handler)` relies on nobody forgetting the middleware.

## Type checking

`npm run dev` does **not** check types. Node runs the TypeScript sources by stripping the annotations away without validating them, so the server starts even when the types are wrong.

The editor covers most of that gap as you type, with one caveat worth knowing: editors built on VS Code ship their own TypeScript — 6.x at the time of writing — while this project builds with 7.0.2. Pointing `typescript.tsdk` at the local install does not help, because TypeScript 7 no longer ships a language server in its npm package.

So the editor reads this code with one compiler and `npm run build` judges it with another. **When they disagree, the build wins** — run it before committing.

## Layout

```
src/index.ts          the server and its routes
src/schemas/user.ts   the User schema and the type derived from it
src/plugins/index.ts  a plugin decorating request and reply
dist/                 build output, git-ignored
```

`npm run build` compiles `src/` into `dist/`, and `npm run start` runs `dist/index.js`.

## Departures from the guide

The guide assumes **CommonJS**. It never says so, but three of its instructions only work there: `node index.js` on a file compiled at the root, relative imports without extensions, and `.json` files imported directly. This project is ESM, and nearly every difference below follows from that single choice.

**ESM rather than CommonJS** (`"type": "module"`). Not a matter of taste: `tsc --init` on TypeScript 7 generates `verbatimModuleSyntax`, which forbids writing `import` in a file compiled to CommonJS. Keeping the generated configuration means being ESM.

**`.ts` extensions in relative imports.** ESM requires an explicit extension, and TypeScript normally emits import paths untouched — which is why the usual ESM advice is to write `.js` inside a `.ts` file, naming the compiled output rather than the real file. `rewriteRelativeImportExtensions` removes that oddity: the sources import `./schemas/user.ts`, the build emits `./schemas/user.js`. Only relative paths are rewritten, which is all this project uses.

**Sources in `src/`, output in `dist/`.** The guide keeps `index.ts` at the root and compiles it next to the source, hence its `node index.js` start script. Splitting the two keeps generated files out of the way and lets `dist/` be ignored wholesale.

**A `dev` script.** The guide only compiles and runs. `node --watch src/index.ts` watches and executes the TypeScript directly, both of which Node does on its own since v24 — no nodemon, no ts-node, no extra dependency.

**`myPluginOption` typed as `number`**, where the guide declares it `string`. The guide's own snippet does not compile: it types `FastifyReply.myPluginProp` as `number` and then feeds it that `string` option. Its comment promises the value "will be typechecked when you call decorate" — and it is, which is how the mismatch surfaces.

**`noUnusedLocals: true`.** For the same purpose, the guide recommends the ESLint `no-unused-vars` rule, so that an imported plugin is known to be actually loaded. The compiler already does that job here, and this project adds no dependency the page does not call for.

**`declaration: true` and a `types` field**, which the plugin example asks for. They exist to publish a plugin as its own npm package; here they only produce unused `.d.ts` files next to the build. Kept so the project matches the page it follows.

Everything else on the page is followed as written, with its examples adapted to ESM where needed.
