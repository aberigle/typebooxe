import { TObject, Type } from "@sinclair/typebox"
import type { ReferenceSchema } from "./types"

export function buildReference<T extends TObject>(object: T, ref: string) {
  return Type.Intersect([
    Type.Optional(Type.Partial(object)),
    Type.Pick(object, ["id"])
  ], {
    $id: "ref@" + ref
  })
}

export function ReferenceType<T extends TObject>(
  object     : T,
  reference? : string
): ReferenceSchema<T> {
  const ref = reference ?? object.$id

  if (!ref) throw new Error("ReferenceType: reference is mandatory")

  return buildReference(object, ref)
}
