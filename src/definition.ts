import { Kind, type TObject, type TSchema, type TUnion } from "@sinclair/typebox"
import { Schema, SchemaTypeOptions, type SchemaDefinition } from "mongoose"
import { referenceParts } from "./fields/reference/parts"
import { DefinitionOptions } from "./types"

function parseProperty(
  field: TSchema
): SchemaTypeOptions<any> {

  let def = {
    required: false
  }

  if (field.$id?.includes("ref@")) return parseReference(field)

  switch (field.type) {
    case 'string'  : return { ...def, type: String }
    case 'number'  :
    case 'integer' : return { ...def, type: Number }
    case 'boolean' : return { ...def, type: Boolean }
    case 'Date'    : return { ...def, type: Date }
    case 'object'  : return { ...def, type: new Schema(parseObject(field as TObject)) }
    case 'array'   : return { ...def, type : [parseProperty(field.items)] }
  }

  const symbol = field[Kind] ?? ''

  switch (symbol) {
    case 'This': return {
      ...def,
      type: Schema.Types.ObjectId,
      ref: field.$ref
    }
    case 'Any': return {
      ...def,
      type: Schema.Types.Mixed
    }
    case 'Union': return parseUnionProperty(field as TUnion)
  }

  throw new Error("Type not supported: " + (field.type || symbol))
}

function parseUnionProperty(
  field: TUnion
): SchemaTypeOptions<any> {

  // A ref wins over the rest: nullable refs and ref + plain variants
  const isRef = (item: TSchema) =>
    item[Kind] === 'Ref' || !!item.$id?.includes("ref@")

  const ref = field.anyOf.find(isRef)
  if (ref) return parseProperty(ref)

  // Every member is an object: mongoose can't express anyOf, so Mixed
  if (field.anyOf.every((item: TSchema) => item.type === 'object'))
    return { type: Schema.Types.Mixed }

  // Every member is a literal (Type.Literal / Type.Enum): one String + enum
  if (field.anyOf.every((item: TSchema) => "const" in item))
    return {
      type: String,
      enum: field.anyOf.map(item => item.const)
    }

  // Mixed kinds (String | Number, ref | null): Mixed, never a silent String
  return { type: Schema.Types.Mixed }
}

function parseReference(
  field: TSchema
): SchemaTypeOptions<any> {
  const parts = referenceParts(field.$id)

  if (parts?.refPath)
    return {
      type: Schema.Types.ObjectId,
      refPath: parts.refPath
    }

  return {
    type: Schema.Types.ObjectId,
    ref: parts?.names[0] ?? field.$id?.split("ref@").pop()
  }
}

function parseObject<T extends TObject>(
  object: T,
  {
    getters,
    setters
  }: DefinitionOptions<T> = {}
) {
  const properties = object.properties ?? []
  const required   = object.required ?? []
  const schema: SchemaDefinition = {}

  for (const key in properties) {
    if (key == "id") continue
    const property = properties[key]
    const field = parseProperty(property)

    if (field == undefined) continue

    if (field.type) field.required = required.includes(key)

    if ("default" in property) field.default = property.default

    if (getters && key in getters) field.get = getters[key as keyof typeof getters]
    if (setters && key in setters) field.set = setters[key as keyof typeof setters]

    schema[key] = field
  }

  return schema
}

export function createDefinition<T extends TObject>(
  object: T,
  options: DefinitionOptions<T> = {}
) {
  return parseObject(object, options)
}