import { Kind, Static, TObject, TSchema, TUnion, Type, Union } from "@sinclair/typebox"
import { Value, ValueError, ValueErrorType, ValuePointer } from '@sinclair/typebox/value'
import { type Document, type ResolveSchemaOptions, type Schema, type SchemaOptions } from "mongoose"

//@ts-ignore
import mongoose from "mongoose/lib/index.js"

import { createDefinition } from "./definition"
import { useModels } from "./typebooxe"
import { TypebooxeRaw, type TypebooxeOptions, type TypebooxePlugin } from "./types"
import { ReferenceType } from "./fields/reference"

export function createSchema<
  T extends TObject,
  Plugins extends readonly TypebooxePlugin<TObject>[] = []
>(
  object: T,
  {
    schema,
    options,
    indexes,
    plugins,
    getters,
    setters
  }: TypebooxeOptions<T, Plugins> = {}
) {
  const definition = createDefinition(object, { getters, setters })

  // serialize getters by default
  if (getters) options = { toObject: { getters: true }, ...options }

  const schemaOptions: SchemaOptions = {
    ...options
  }

  const result: Schema = new mongoose.Schema<
    TypebooxeRaw<T, Plugins>
  >({
    ...definition,
    ...schema
  }, schemaOptions as ResolveSchemaOptions<Static<T>>)

  const castTypes: TSchema[] = [generateCastType(object)]
  if (plugins) for (let item of plugins) {
    let plugin = "plugin" in item ? item.plugin : item

    if ("$typebooxe" in item) castTypes.push(item.$typebooxe)

    result.plugin(plugin)
  }

  const references = Object.values(useModels())
  const castType = Type.Intersect(castTypes)

  result.methods.cast = function <M extends TSchema = T>(type: M = castType as unknown as M) {
    const doc: Document = this
    return castItem(
      type,
      doc.toObject({
        flattenObjectIds: true,
        minimize: false
      }),
      references
    )
  }

  if (indexes) for (let { index, options } of indexes) {
    result.index(index, options || {})
  }

  return result
}

function generateCastType(
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


function castItem(
  def: TSchema,
  item: any,
  references: TSchema[] = []
) {

  item = reduceErrors(item, Value.Errors(def, references, item))

  const cleaned = Value.Clean(def, references, item)
  return Value.Encode(def, references, cleaned)
}

function reduceErrors(item: any, errors: Value.ValueErrorIterator) {
  for (
    let error of errors
  ) item = handleError(item, error)
  return item
}

function handleError(
  item: any,
  error: ValueError) {
  switch (error.type) {
    case ValueErrorType.Object: // object was expected
      if (// a reference not populated, we return the id nested as an object
        error.path !== "/_id" &&
        mongoose.isValidObjectId(error.value)
      ) return Value.Patch(item, [{ type: "update", path: error.path, value: { id: error.value } }])

      if (mongoose.isValidObjectId(error.value) || error.value === null) // we have an objectid
        return Value.Patch(item, [
          { type: "update", path: error.path, value: "" }, // hack to be able to delete a null field
          { type: "delete", path: error.path }
        ])

      return item
    case ValueErrorType.String: // we want to maintain the id
      if (error.path.endsWith("/id")) {
        const id = ValuePointer.Get(item, error.path.replace("id", "_id"))
        return Value.Patch(item, [{ type: "update", path: error.path, value: id }])
      }
    case ValueErrorType.Union: // references may have their own erros
      if (error.schema.$id?.includes("ref@")) {
        for (let iterator of error.errors) item = reduceErrors(item, iterator)
        return item
      }
    default: // nothing to do
      return item
  }
}