import { Static, TSchema, Type, type TObject } from "@sinclair/typebox"
import { Value, ValueError, ValueErrorType, ValuePointer } from '@sinclair/typebox/value'
import type { Document, ResolveSchemaOptions, Schema, SchemaOptions } from "mongoose"
import mongoose from "mongoose/lib/index.js"
import { createDefinition } from "./definition"
import { useModels } from "./typebooxe"
import { TypebooxeRaw, type TypebooxeOptions, type TypebooxePlugin } from "./types"

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
    getters
  }: TypebooxeOptions<Plugins> = {}
) {
  const definition = createDefinition(object, { getters })

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

  const castTypes: TObject[] = [object]
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

      if (mongoose.isValidObjectId(error.value)) // we have an objectid
        return Value.Patch(item, [{ type: "delete", path: error.path }])
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