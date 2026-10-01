import { Kind, TObject, TSchema, Type } from "@sinclair/typebox"
import { referenceParts } from "../fields/reference/parts"
import { ReferenceType } from "../fields/reference/schema"
import { getModelDefinition } from "../typebooxe"

function isPlaceholderRef(
  schema: TSchema
): boolean {
  const keys = Object.keys(schema.properties ?? {})
  return keys.length === 1 && keys[0] === 'id'
}

function resolvePlaceholder(
  schema: TSchema
): TSchema {
  const model = schema.$id!.replace("ref@", "")
  const def = getModelDefinition(model)
  if (!def) throw new Error(
    `Model "${model}" not found. Ensure the model is registered before calling cast().`
  )
  return ReferenceType(def as TObject, model)
}

export function generateCastType(
  schema: TSchema,
  top: TObject = schema as TObject
): TSchema {
  const parts = referenceParts(schema.$id)

  if (parts?.refPath)
    return Type.Union(parts.names.map(name => {
      const def = getModelDefinition(name)
      if (!def) throw new Error(
        `Model "${name}" not found. Ensure the model is registered before calling cast().`
      )
      return ReferenceType(def as TObject, name)
    }), { $id: schema.$id }) as TSchema

  if (schema[Kind] === 'This')
    return ReferenceType(top, top.$id as string)

  if (schema.type === 'array')
    return Type.Array(generateCastType(schema.items, top)) as TSchema

  if (
    schema[Kind] === 'Union' &&
    schema.$id?.startsWith("ref@")
  ) return ReferenceType(top, top.$id as string)

  if (schema.type !== 'object')
    return schema

  if (schema.$id?.startsWith("ref@"))
    return isPlaceholderRef(schema) ? resolvePlaceholder(schema) : schema

  const object = schema as TObject

  const result: any = {}
  for (let key in object.properties ?? []) {
    let fixed = generateCastType(object.properties[key], top)
    if (!object.required?.includes(key)) fixed = Type.Optional(fixed)
    result[key] = fixed
  }

  return Type.Object(result)
}

export function buildCastType(
  object  : TSchema,
  plugins : readonly { $typebooxe: TSchema }[] = []
): TSchema {
  const castTypes: TSchema[] = [generateCastType(object)]

  for (let item of plugins)
    if ("$typebooxe" in item)
      castTypes.push(item.$typebooxe)

  return Type.Intersect(castTypes)
}
