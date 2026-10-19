import type { FastifyPluginAsync } from "fastify"
import { MODULE_PROP_KEY } from "../plugins/globalDecorator.ts"
import { SCOPED_PROP_KEY } from "../plugins/scopedDecorator.ts"

// Registered inside each route branch, so it answers on /ping/checkDecorators,
// /animals/checkDecorators, and so on. Each copy reports what ITS branch can
// see — which is the whole point: the answers differ.
const checkDecorators: FastifyPluginAsync = async fastify => {
  const hasGlobalReqDecorator = fastify.hasRequestDecorator(MODULE_PROP_KEY)
  const hasScopedReqDecorator = fastify.hasRequestDecorator(SCOPED_PROP_KEY)

  fastify.get("/checkDecorators", async () => ({
    hasGlobalReqDecorator,
    hasScopedReqDecorator
  }))
}
export default checkDecorators
