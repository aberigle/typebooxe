import { TSchema, type TObject } from "@sinclair/typebox"
import { Value, ValueErrorType } from '@sinclair/typebox/value'
import { isValidObjectId, ResolveSchemaOptions, Schema, SchemaOptions } from "mongoose"
import { createDefinition } from "./definition"
import type { TypebooxeOptions } from "./types"
import { useModels } from "./typebooxe"

export function createSchema<T>(
  object  : TObject,
  {
    schema,
    options,
    indexes,
    plugins,
    getters
  } : TypebooxeOptions = {}
) {
  const definition = createDefinition(object, { getters })

  // serialize getters by default
  if (getters) options = { toObject: { getters: true }, ...options }

  const schemaOptions: SchemaOptions = {
    ...options
  }

  const result: Schema = new Schema<T>({
    ...definition,
    ...schema
  }, schemaOptions as ResolveSchemaOptions<T>)


  const references = Object.values(useModels())
  result.methods.cast = function() : T {
    return castItem(
      object,
      this.toObject({
        flattenObjectIds: true
      }),
      references
    ) as T
  }

  if (indexes) for (let { index, options } of indexes) {
    result.index(index, options || {})
  }

  if (plugins) for (let plugin of plugins) {
    result.plugin(plugin)
  }

  return result
}


function castItem(
  def : TObject,
  item : any,
  references: TSchema[] = []
) {

  for (
    let error of Value.Errors(def, references, item)
  ) item = handleError(item, error)

  return Value.Clean(def, references, item)
}

function handleError(item, error) {
  // console.log(error)
  switch (error.type) {
    case ValueErrorType.Object: // object was expected
      if (isValidObjectId(error.value)) // we have an objectid
        return Value.Patch(item, [{ type: "delete", path: error.path }])

    case ValueErrorType.String: // we want to maintain the id
      if (error.path === "/id")
        return Value.Patch(item, [{ type : "update", path : error.path, value : item._id}])
    default: // nothing to do
      return item
  }
}