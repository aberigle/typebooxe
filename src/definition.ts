import { type TObject, type TSchema } from "@sinclair/typebox"
import { Schema, SchemaTypeOptions, type SchemaDefinition } from "mongoose"
import { DefinitionOptions } from "./types"
import { TSConfig } from "bun"

function parseProperty(
  field : TSchema
): SchemaTypeOptions<any> {

  let def = {
    required: false
  }

  switch (field.type) {
    case 'string'  : return { ...def, type: String }
    case 'number'  :
    case 'integer' : return { ...def, type: Number }
    case 'boolean' : return { ...def, type: Boolean }
    case 'Date'    : return { ...def, type: Date }
    case 'object'  : return parseObject(field as TObject)
    case 'array'   : return [parseProperty(field.items)]
  }

  const key    = Symbol.for("TypeBox.Kind")
  const symbol = key in field? field[key] : ''

  switch(symbol) {
    case 'Ref'    : return {
      ...def,
      type : Schema.Types.ObjectId,
      ref  : field.$ref
    }
    case 'Any'   : return {
      ...def,
      type : Schema.Types.Mixed
    }
    case 'Union' :
      let ref = field.anyOf.find((item: TSchema) => key in item && item[key] === 'Ref')
      if (ref) return parseProperty(ref)
      return {
        ...def,
        type : String,
        enum : field.anyOf.map(value => value.const)
      }
  }

  throw new Error("Type not supported: " + (field.type || symbol))
}

function parseReference(
  field : TObject
) : SchemaTypeOptions<any> {
  const model = field.$id?.split("ref@").pop()

  return {
    type : Schema.Types.ObjectId,
    ref : model
  }
}

function parseObject(
  object: TObject,
  {
    getters,
    setters
  }: DefinitionOptions = {}
) {
  const schema : SchemaDefinition = {}

  if (object.$id?.includes("ref@")) return parseReference(object)

  for (const key in object.properties) {
    if (key == "id") continue
    const property = object.properties[key]
    const field = parseProperty(property)

    if (field == undefined) continue

    if (field.type) field.required = !!object.required?.includes(key)

    if ("default" in property) field.default = property.default

    if (getters && getters[key]) field.get = getters[key]
    if (setters && setters[key]) field.set = setters[key]

    schema[key] = field
  }

  return schema
}

export function createDefinition(
  object  : TObject,
  options : DefinitionOptions = {}
) {
  return parseObject(object, options)
}