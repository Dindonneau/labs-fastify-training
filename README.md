# lemfast

A training project: a Fastify 5 server in TypeScript, built step by step from the official TypeScript reference.

Its only purpose is to learn Fastify's type system on a throwaway app — route typing, schemas, plugins — by working through the documented examples one at a time, in their order, with nothing added on top.

## The guide

The project follows the "Learn By Example" section of the Fastify TypeScript reference: <https://fastify.dev/docs/latest/Reference/TypeScript/>

It is made of four examples, worked through in order:

1. **Getting Started** — a blank HTTP server ← *done*
2. Using Generics
3. JSON Schema
4. Plugins

No dependency is installed unless that page calls for it. Anything the guide does not mention waits until the guide gets there.

## Stack

- Fastify 5.12
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

Either way the server listens on port 8080. Check it with:

```bash
curl localhost:8080/ping
```

It should answer `pong`.

> The guide announces `Server listening at http://127.0.0.1:8080`, while macOS prints `http://[::1]:8080`. Calling `listen` without a `host` binds to `localhost`, which resolves to IPv6 first here. Both stacks answer.

`npm test` is still the placeholder `npm init` wrote; there are no tests yet.

## Type checking

`npm run dev` does **not** check types. Node runs the TypeScript sources by stripping the annotations away without validating them, so the server starts even when the types are wrong.

The editor covers most of that gap as you type, with one caveat worth knowing: editors built on VS Code ship their own TypeScript — 6.x at the time of writing — while this project builds with 7.0.2. Pointing `typescript.tsdk` at the local install does not help, because TypeScript 7 no longer ships a language server in its npm package.

So the editor reads this code with one compiler and `npm run build` judges it with another. **When they disagree, the build wins** — run it before committing.

## Layout

```
src/index.ts     the server — the only source file so far
dist/            build output, git-ignored
```

`npm run build` compiles `src/` into `dist/`, and `npm run start` runs `dist/index.js`.

## Three deliberate departures from the guide

**Sources in `src/`, output in `dist/`.** The guide keeps `index.ts` at the root and compiles it next to the source, which is why its start script reads `node index.js`. Splitting the two keeps generated files out of the way and lets `dist/` be ignored wholesale; `rootDir`, `outDir` and the start script are set accordingly.

**`"type": "module"`.** The guide does not set it. The code is written as ESM and compiled with `module: nodenext`, so the emitted `dist/index.js` is an ES module and Node needs this field to load it as one.

**A `dev` script.** The guide only compiles and runs. `node --watch src/index.ts` watches and executes the TypeScript directly, both of which Node does on its own since v24 — no nodemon, no ts-node, no extra dependency.

Everything else on the page is followed as written.
