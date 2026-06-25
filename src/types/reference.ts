import { TObject, Type } from "@sinclair/typebox"
import { TypebooxeModel } from "../types"

export function ModelReference<T extends TObject>(
  model: TypebooxeModel<T>
) {
  if (!("$typebooxe" in model))
    throw new Error('Only can reference TypebooxeModel')

  const object: T = model.$typebooxe

  const ref = object.$id

  return ReferenceType(object, ref as string)
}

export function ReferenceType<T extends TObject>(
  object : T,
  ref : string
) {
  return Type.Intersect([
    Type.Optional(Type.Partial(object)),
    Type.Pick(object, ["id"])],
    {
      $id: "ref@" + ref
    }
  )
}