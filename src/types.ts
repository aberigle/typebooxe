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
  plugins?: Array<(schema: mongoose.Schema, options: any) => void>,
  indexes?: Array<MongooseIndexOption>,
} & DefinitionOptions

type Methods<T> = {
  cast(): T
}

export type TypebooxeDocument<T> = mongoose.Document<
  unknown,
  {},
  T
> & T

export type TypebooxeModel<T, QueryMethods = {}> = mongoose.Model<
  T,
  QueryMethods,
  Methods<T>,
  {}
>
