import Type from "typebox"

export const User = Type.Object({
  name: Type.String(),
  email: Type.Optional(Type.String({ format: "email" }))
})

export type UserType = Type.Static<typeof User>
