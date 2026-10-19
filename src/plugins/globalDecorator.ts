import fp from "fastify-plugin"
import type { FastifyPluginAsync } from "fastify"

export const MODULE_PROP_KEY = "moduleAugmentedProp"

// using declaration merging, add your plugin props to the appropriate fastify interfaces
// if prop type is defined here, the value will be typechecked when you call decorate{,Request,Reply}
declare module "fastify" {
  interface FastifyRequest {
    [MODULE_PROP_KEY]: string
  }
  interface FastifyReply {
    [MODULE_PROP_KEY]: number
  }
}

export interface MyGlobalPluginOptions {
  onReplyValue: number
}

const globalDecorator: FastifyPluginAsync<MyGlobalPluginOptions> = async (
  fastify,
  options
) => {
  fastify.decorateRequest(MODULE_PROP_KEY, "super_secret_value")
  fastify.decorateReply(MODULE_PROP_KEY, options.onReplyValue)
}

export default fp(globalDecorator)
