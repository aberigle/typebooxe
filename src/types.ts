import type mongoose from "mongoose"

export type MongooseIndexOption = {
  index: mongoose.IndexDefinition,
  options?: mongoose.IndexOptions
}

export type TypebooxeOptions = {
  schema?: mongoose.SchemaDefinition,
  options?: mongoose.SchemaOptions,
  methods?: Record<string, Function>,
  plugins?: Array<(schema: mongoose.Schema, options: any) => void>,
  indexes?: Array<MongooseIndexOption>
}

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
