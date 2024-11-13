import { type TObject, type TSchema } from "@sinclair/typebox"
import { Schema, SchemaTypeOptions, type SchemaDefinition, type SchemaDefinitionType } from "mongoose"
import { DefinitionOptions } from "./types"

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
  }

  const key    = Symbol.for("TypeBox.Kind")
  const symbol = key in field? field[key] : ''

  switch(symbol) {
    case 'Ref'   : return {
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
      // TODO handle when is not a ref
  }

  throw new Error("Type not supported: " + (field.type || symbol))
}

function parseObject(
  object: TObject,
  {
    getters,
    setters
  }: DefinitionOptions = {}
) {
  const schema : SchemaDefinition = {}

  for (const key in object.properties) {
    const property = object.properties[key]
    const field = parseProperty(property)

    if (field.type) field.required = !!object.required?.includes(key)

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