import fp from "fastify-plugin"
import type { FastifyPluginAsync, FastifyRequest } from "fastify"

export const SCOPED_PROP_KEY = "scopedProp"

// The counterpart of globalDecorator.ts: the same job, typed the other way.
// Nothing here touches Fastify's global interfaces, so no other file in the
// project is told that `scopedProp` exists.
export interface ScopedProp {
  setAt: string
  by: string
}

const scopedDecorator: FastifyPluginAsync = async fastify => {
  fastify.decorateRequest(SCOPED_PROP_KEY, null)

  fastify.addHook("onRequest", async (request: FastifyRequest) => {
    request.setDecorator<ScopedProp>(SCOPED_PROP_KEY, {
      setAt: new Date().toISOString(),
      by: "scopedDecorator plugin"
    })
  })
}

export default fp(scopedDecorator)
