import { TObject, TSchema } from "@sinclair/typebox"
import type mongoose from "mongoose"

export type MongooseIndexOption = {
  index: mongoose.IndexDefinition,
  options?: mongoose.IndexOptions
}

export type DefinitionOptions = {
  getters? : Record<string, (value : any) => any>
  setters? : Record<string, (value : any, priorVal? : any) => any>
}

export type TypebooxeOptions = {
  schema?: mongoose.SchemaDefinition,
  options?: mongoose.SchemaOptions,
  methods?: Record<string, Function>,
  plugins?: Array<TypebooxePlugin>,
  indexes?: Array<MongooseIndexOption>,
} & DefinitionOptions

type Methods<
  T,
  Plugins extends readonly unknown[] = []
> = {
  cast(): MergeTypeArray<[T, ...Plugins]>
}

export type TypebooxeDocument<T> = mongoose.Document<
  unknown,
  {},
  T
> & T

export type TypebooxePlugin = {
  $typebooxe : TObject,
  plugin     : (scheme : mongoose.Schema, options : any) => any
} | ((schema: mongoose.Schema, options: any) => void)

export type TypebooxeModel<
  T,
  Plugins extends readonly unknown[] = []
> = mongoose.Model<
  MergeTypeArray<[T, ...Plugins]>,
  {},
  Methods<T, Plugins>,
  {}
>

export type MergeTypeArray<T extends readonly unknown[]> = T extends [infer First, ...infer Rest]
  ? First & MergeTypeArray<Rest>
  : unknown;