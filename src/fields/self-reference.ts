import { TSchema, TThis, Type } from "@sinclair/typebox"

export function SelfReference(
  reference: TThis
) {
  return Type.Union([
    reference,
    Type.Object({ id: Type.Optional(Type.String()) })
  ], {
    $id : "ref@" + reference.$ref
  })
}
