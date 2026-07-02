import { TObject, TSchema, Type } from "@sinclair/typebox"
import { TypebooxeModel } from "../types"
import { getModelDefinition } from "../typebooxe"

export function ModelReference<T extends TObject = TObject>(
  model: TypebooxeModel<T>
): TSchema

export function ModelReference(
  name: string
): TSchema

export function ModelReference<T extends TObject = TObject>(
  model: TypebooxeModel<T> | string
): TSchema {

  if (typeof model === 'string') {
    const def = getModelDefinition(model)
    if (def)
      return ReferenceType(def, model)

    return Type.Object({ id: Type.String() }, { $id: "ref@" + model })
  }

  if (!("$typebooxe" in model))
    throw new Error('Only can reference TypebooxeModel')

  const object: T = model.$typebooxe

  const ref = object.$id

  return ReferenceType(object, ref as string)
}

export function ReferenceType<T extends TSchema>(
  object: T,
  ref: string
) {
  return Type.Intersect([
    Type.Optional(Type.Partial(object)),
    Type.Pick(object, ["id"])],
    {
      $id: "ref@" + ref
    }
  )
}