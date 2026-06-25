import { Static, TObject, TSchema } from "@sinclair/typebox"
import { type Document, type ResolveSchemaOptions, type Schema } from "mongoose"

//@ts-ignore
import mongoose from "mongoose/lib/index.js"

import { castItem } from "./cast"
import { buildCastType } from "./cast/cast-type"
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
    getters,
    setters
  }: TypebooxeOptions<T, Plugins> = {}
) {
  const definition = createDefinition(object, { getters, setters })

  if (getters) options = { toObject: { getters: true }, ...options }

  const result: Schema = new mongoose.Schema<
    TypebooxeRaw<T, Plugins>
  >({
    ...definition,
    ...schema
  }, options as ResolveSchemaOptions<Static<T>>)

  let castType   : TSchema | null = null
  let references : TSchema[] | null = null

  // Add the cast function
  result.methods.cast = function<M extends TSchema = T>(type?: M) {
    if (!castType && !type)
      castType = buildCastType(
        object,
        plugins as readonly { $typebooxe: TSchema }[] | undefined
      )

    if (!references) references = Object.values(useModels())

    return castItem(
      type ?? castType as unknown as M,
      this.toObject({
        flattenObjectIds: true,
        minimize: false
      }),
      references!
    )
  }

  if (plugins) for (let item of plugins) {
    result.plugin("plugin" in item ? item.plugin : item)
  }

  if (indexes) for (let { index, options } of indexes) {
    result.index(index, options || {})
  }

  return result
}
