import { Kind, TObject, TSchema, Type } from "@sinclair/typebox"
import { ReferenceType } from "../fields/reference"

export function generateCastType(
  schema: TSchema,
  top: TObject = schema as TObject
): TSchema {
  if (schema[Kind] === 'This')
    return ReferenceType(top, top.$id as string)

  if (schema.type === 'array')
    return Type.Array(generateCastType(schema.items, top)) as TSchema

  if (
    schema[Kind] === 'Union' &&
    schema.$id?.startsWith("ref@")
  ) return ReferenceType(top, top.$id as string)

  if (
    schema.type !== 'object' ||
    schema.$id?.includes("ref@")
  ) return schema

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
