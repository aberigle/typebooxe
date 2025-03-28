import {
  type TObject,
  type TSchema
} from "@sinclair/typebox";

// @ts-ignore
import mongoose, { Schema } from "mongoose/lib/index.js";

import { createSchema } from "./schema";
import type { MergeTypeArray, TypebooxeModel, TypebooxeOptions, TypebooxePlugin } from "./types";

const definitions: Record<string, TSchema> = {}
const schemas: Record<string, mongoose.Schema> = {}

export function typebooxe<
  T extends TObject,
  Plugins extends readonly unknown[] = []
>(
  object  : T,
  options : TypebooxeOptions = {}
): MergeTypeArray<[TypebooxeModel<T, Plugins>, ...Plugins]> {

  if (!("$id" in object)) throw new Error("Missing $id field")

  const name : string = object.$id as string
  definitions[name] = object
  schemas[name]     = createSchema<T>(object, options)

  return mongoose.model(
    name,
    schemas[name]
  ) as MergeTypeArray<[TypebooxeModel<T, Plugins>, ...Plugins]>
}

export function typebooxePlugin<
  T
>(
  object  : TObject,
  options : TypebooxeOptions = {}
): TypebooxePlugin  {
  const plugin = createSchema<T>(object, options)

  return {
    $typebooxe : object,
    plugin : (schema : Schema) => {
      schema.add(plugin.obj)
    }
  }
}

export function useModels() {
  return definitions
}