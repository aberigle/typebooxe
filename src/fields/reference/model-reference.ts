import { TObject, TSchema, Type } from "@sinclair/typebox"
import { TypebooxeModel } from "../../types"
import { getModelDefinition } from "../../typebooxe"
import { REF_PATH_MARK } from "./parts"
import { ReferenceType } from "./schema"
import type { ModelReferenceOptions, ReferenceSchema, ReferenceUnion } from "./types"

function referenceFor(
  model: TypebooxeModel<any> | string
): { name: string, schema: TSchema } {

  if (typeof model === 'string') {
    const def = getModelDefinition(model)
    if (def)
      return { name: model, schema: ReferenceType(def as TObject, model) }

    return {
      name  : model,
      schema: Type.Object({ id: Type.String() }, { $id: "ref@" + model })
    }
  }

  if (!("$typebooxe" in model))
    throw new Error('Only can reference TypebooxeModel')

  const object = model.$typebooxe as TObject
  const name = object.$id as string

  return { name, schema: ReferenceType(object, name) }
}

export function ModelReference<T extends TObject = TObject>(
  model: TypebooxeModel<T>
): ReferenceSchema<T>

export function ModelReference(
  name: string
): TSchema

export function ModelReference<Models extends readonly unknown[]>(
  models: [...Models],
  options: ModelReferenceOptions
): ReferenceUnion<Models>

export function ModelReference(
  model: TypebooxeModel<any> | string | (TypebooxeModel<any> | string)[],
  options?: ModelReferenceOptions
): TSchema {

  if (!Array.isArray(model)) return referenceFor(model).schema

  if (!options?.refPath)
    throw new Error("ModelReference: refPath is required when referencing multiple models")

  const resolved = model.map(referenceFor)
  const names    = resolved.map(item => item.name)

  return Type.Union(
    resolved.map(item => item.schema),
    { $id: "ref@" + names.join("|") + REF_PATH_MARK + options.refPath }
  ) as TSchema

}
