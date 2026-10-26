# Decorators, from the beginning

Three runnable files. Read them in order, run each one, look at what it prints.

```bash
node examples/decorators/1-what-is-a-decorator.ts
node examples/decorators/2-why-not-a-plain-variable.ts
node examples/decorators/3-typing-them.ts
```

## 1. What a decorator is

Nothing clever: attaching a property to an object Fastify already hands you.

```ts
app.decorate("appName", "fastify-training")        // on the server instance
app.decorateRequest("requestId", "")      // on every incoming request
app.decorateReply("servedBy", "")         // on every outgoing reply
```

`decorate` is close to writing `app.appName = "fastify-training"`. The instance one is read wherever that instance reaches. The request and reply ones are declared once with a default, then filled per call — usually in a hook, because each request needs its own value:

```ts
app.addHook("onRequest", async (request, reply) => {
  request.requestId = Math.random().toString(36).slice(2, 8)
})
```

File 1 prints:

```
/            -> {"fromInstance":"hello fastify-training","fromRequest":"pb14uf","fromReply":"fastify-training"}
/introspect  -> {"hasAppName":true,"hasGreet":true,"hasUnknown":false}
```

`hasDecorator` is worth noticing: Fastify knows at runtime what it carries, with no help from TypeScript. The two worlds are separate, which is the whole subject of file 3.

## 2. Why not just export a variable

A module-level `const` is global — one value for the entire process. A decorator belongs to a branch of the plugin tree. File 2 registers two sibling plugins that decorate **the same name** with different values:

```
/billing   -> {"decorated":"billing-database","global":"the-only-database"}
/crm       -> {"decorated":"crm-database","global":"the-only-database"}
/root      -> {"parentHasDb":false,"global":"the-only-database"}
```

Two values under one name, no collision, and the parent that registered both has neither. A plain variable cannot do that. This also explains why a plugin meant to share something must be wrapped in `fastify-plugin`: without it, its decorations stay in its own child context and nobody sees them.

The second reason is lifecycle. A database connection has to be opened when the server starts and closed when it stops. A plugin can do both — decorate on startup, release in an `onClose` hook — where a bare import has no idea the server exists.

## 3. Teaching TypeScript about them

`decorate` runs at runtime. TypeScript has no idea it happened, so `app.appName` is an error until you say otherwise. Two ways to say it.

**Module augmentation** — the common one:

```ts
declare module "fastify" {
  interface FastifyInstance {
    store: Store
  }
}
```

Comfortable: autocompletion works everywhere, with nothing else to write. But it is **global**. It does not say "this branch has a store", it says "every Fastify instance in this project has a store".

**`getDecorator<T>`** — ask for it where you need it:

```ts
const store = fastify.getDecorator<Store>("store")
```

The type stays local to that file, and Fastify checks at runtime whether the decorator is really there.

File 3 runs both against a branch that never registered the plugin:

```
/a                -> {"via":"real data"}
/b-augmented      -> {"typeofStore":"undefined"}
/b-getdecorator   -> {"failedWith":"No decorator 'store' has been declared on instance."}
```

The middle line is the problem. `withoutStore.store.find()` compiles, because the augmentation promised it exists. At runtime the property is missing, so you get `undefined` and a `TypeError` further along — far from the cause. `getDecorator` cannot restore the static check, since TypeScript still cannot tell branches apart, but it fails immediately and names what is missing.

## The leak these files demonstrate

This directory now declares `appName`, `greet`, `requestId`, `servedBy` and `db` on the global Fastify interfaces. Which means that anywhere else in this project, on a brand-new instance carrying none of them:

```ts
const naked = Fastify()
naked.appName          // compiles
naked.store.find()     // compiles, crashes at runtime
```

That is not a flaw of these examples, it is module augmentation working as designed — and the reason `getDecorator` exists. It is also why the guide warns, in *Using a Plugin*, that a plugin's types are pulled in as soon as they are within the compiler's scope, whether the plugin is used or not.

## Which to use

Module augmentation when the plugin is registered at the root and serves the whole application — the autocompletion is worth it, and the global claim happens to be true. That is the case for a plugin registered once in `app.ts`, at the top of the tree.

`getDecorator` when the decorator only exists on one branch, or when the same name covers several implementations — the `serverOne` / `serverTwo` case in the guide, where `usersRepository` is a Postgres repository on one side and a SQLite one on the other. Module augmentation allows exactly one type per name for the whole project; `getDecorator` allows one per usage.
