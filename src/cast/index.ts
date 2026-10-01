import { TSchema } from "@sinclair/typebox"
import { Value, ValueError, ValueErrorType, ValuePointer } from '@sinclair/typebox/value'
import { resolveDynamicRefs } from "../fields/reference/resolve"

//@ts-ignore
import mongoose from "mongoose/lib/index.js"

export function castItem(
  def        : TSchema,
  item       : any,
  references : TSchema[] = []
) {
  def = resolveDynamicRefs(def, item)
  item = reduceErrors(item, Value.Errors(def, references, item))
  const cleaned = Value.Clean(def, references, item)
  return Value.Encode(def, references, cleaned)
}

function reduceErrors(item: any, errors: Value.ValueErrorIterator) {
  for (let error of errors) item = handleError(item, error)
  return item
}

function handleError(item: any, error: ValueError) {
  switch (error.type) {
    case ValueErrorType.Object:
      if (!error.path.includes("/_id") && mongoose.isValidObjectId(error.value))
        return Value.Patch(item, [{ type: "update", path: error.path, value: { id: error.value } }])

      if (mongoose.isValidObjectId(error.value) || error.value === null)
        return Value.Patch(item, [
          { type: "update", path: error.path, value: "" },
          { type: "delete", path: error.path }
        ])

      return item

    case ValueErrorType.String:
      if (error.path.endsWith("/id")) {
        const id = ValuePointer.Get(item, error.path.replace("/id", "/_id"))
        return Value.Patch(item, [{ type: "update", path: error.path, value: id }])
      }
    case ValueErrorType.Union:
      for (let iterator of error.errors) item = reduceErrors(item, iterator)
      return item
    default:
      return item
  }
}
