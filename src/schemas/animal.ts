import Type from "typebox"

export const Animal = Type.Object({
  animal: Type.String({ minLength: 1 }),
})

export const AnimalParams = Type.Object({
  animal: Type.String(),
})

export type AnimalType = Type.Static<typeof Animal>
export type AnimalParamsType = Type.Static<typeof AnimalParams>
