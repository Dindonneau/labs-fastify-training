import type { FastifyPluginAsync } from "fastify"
import fp from "fastify-plugin"

// using declaration merging, add your plugin props to the appropriate fastify interfaces
// if prop type is defined here, the value will be typechecked when you call decorate{,Request,Reply}
declare module "fastify" {
  interface FastifyRequest {
    myPluginProp: string
  }
  interface FastifyReply {
    myPluginProp: number
  }
}

// define options
export interface MyPluginOptions {
  myPluginOption: number
}

// define plugin using promises
const myPluginAsync: FastifyPluginAsync<MyPluginOptions> = async (
  fastify,
  options
) => {
  fastify.decorateRequest("myPluginProp", "super_secret_value")
  fastify.decorateReply("myPluginProp", options.myPluginOption)
}

// export plugin using fastify-plugin
export default fp(myPluginAsync)
