import { TOptional, type TObject, type TSchema } from "@sinclair/typebox"
import { Schema, SchemaTypeOptions, type SchemaDefinition } from "mongoose"
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

  const key    = Symbol.for("TypeBox.Kind")
  const symbol = key in field ? field[key] : ''

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
    case 'Union':
      if (field.$id?.includes("ref@")) return parseReference(field)
      let ref = field.anyOf.find((item: TSchema) => key in item && item[key] === 'Ref')
      if (ref) return parseProperty(ref)
      return {
        ...def,
        type: String,
        enum: field.anyOf.map(value => value.const)
      }
  }

  throw new Error("Type not supported: " + (field.type || symbol))
}

function parseReference(
  field: TSchema
): SchemaTypeOptions<any> {
  const model = field.$id?.split("ref@").pop()

  return {
    type: Schema.Types.ObjectId,
    ref: model
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