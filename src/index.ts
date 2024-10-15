import {
  type TObject,
  type TSchema
} from "@sinclair/typebox";

import mongoose from "mongoose";

import { createSchema } from "./schema";
import type { TypebooxeModel, TypebooxeOptions } from "./types";

const definitions: Record<string, TSchema> = {}
const schemas: Record<string, mongoose.Schema> = {}

export function typebooxe<
  T,
  QueryMethods = {}
>(
  object  : TObject,
  options : TypebooxeOptions = {}
): TypebooxeModel<T, QueryMethods> {

  if (!("$id" in object)) throw new Error("Missing $id field")

  const name : string = object.$id as string
  definitions[name] = object
  schemas[name]     = createSchema<T>(object, options)

  return mongoose.model(
    name,
    schemas[name]
  ) as TypebooxeModel<T, QueryMethods>
}

export function useModels() {
  return definitions
}