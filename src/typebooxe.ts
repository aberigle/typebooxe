import {
  type TObject,
  type TSchema
} from "@sinclair/typebox";

// @ts-ignore
import mongoose, { Schema } from "mongoose/lib/index.js";

import type { Mongoose } from "mongoose";
import { createSchema } from "./schema";
import type { TypebooxeModel, TypebooxeOptions, TypebooxePlugin } from "./types";

const goose: Mongoose = mongoose

const definitions: Record<string, TSchema> = {}
const schemas: Record<string, mongoose.Schema> = {}

export function typebooxe<
  T       extends TObject,
  Plugins extends readonly TypebooxePlugin<TObject>[] = []
>(
  object  : T,
  options : TypebooxeOptions<[...Plugins]> = {}
) {

  if (!("$id" in object)) throw new Error("Missing $id field")

  const name : string = object.$id as string
  definitions[name] = object
  const schema    = createSchema<T, Plugins>(object, options)
  schemas[name] = schema

  const model = goose.model(
    name,
    schemas[name]
  ) as TypebooxeModel<T, Plugins>

  model.$typebooxe = object

  return model
}

export function typebooxePlugin<
  T extends TObject
>(
  object: T,
  options: TypebooxeOptions<[]> = {}
): TypebooxePlugin<T> {
  const plugin = createSchema<T>(object, options)

  return {
    $typebooxe: object,
    plugin: (schema: Schema) => {
      schema.add(plugin.obj)
    }
  }
}

export function useModels() {
  return definitions
}