import { Static, TObject, Type } from "@sinclair/typebox"
import mongoose, { Types } from "mongoose"

export type MongooseIndexOption = {
  index: mongoose.IndexDefinition,
  options?: mongoose.IndexOptions
}

export type DefinitionOptions = {
  getters?: Record<string, (value: any) => any>
  setters?: Record<string, (value: any, priorVal?: any) => any>
}

export type TypebooxeOptions<
  Plugins extends readonly TypebooxePlugin<TObject>[]
> = {
  schema?: mongoose.SchemaDefinition,
  options?: mongoose.SchemaOptions,
  methods?: Record<string, Function>,
  plugins?: Plugins,
  indexes?: Array<MongooseIndexOption>,
} & DefinitionOptions

export type Methods<
  T extends TObject,
  Plugins extends readonly TypebooxePlugin<TObject>[] = []
> = {
    cast<M extends TObject = T>(castType?: M): TypebooxeRaw<M, Plugins>
}

export const ObjectId = Type.Transform(Type.String({ pattern: '^[0-9a-fA-F]{24}$' }))
  .Decode(value => new Types.ObjectId(value))
  .Encode(value => value.toHexString())

export type TypebooxeDocument<
  T extends TObject,
  Plugins extends readonly TypebooxePlugin<TObject>[]
> = mongoose.Document<
  unknown,
  {},
  TypebooxeRaw<T, Plugins>
>

export type TypebooxeRaw<
  T extends TObject,
  Plugins extends readonly TypebooxePlugin<TObject>[] = []
> = MergeTypeArray<[Static<T>, ...ExtractPluginTypes<Plugins>]>

export type TypebooxeModel<
  T extends TObject,
  Plugins extends readonly TypebooxePlugin<TObject>[] = []
> = mongoose.Model<
  TypebooxeRaw<T, Plugins> & { _id: Types.ObjectId },
  {},
  Methods<T, Plugins>,
  {}
> & { $typebooxe: T }

export type TypebooxePlugin<T extends TObject> = {
  $typebooxe: T,
  plugin: (scheme: mongoose.Schema, options: any) => any
} // | ((schema: mongoose.Schema, options: any) => void)

export type ExtractPluginTypes<
  Plugins extends readonly TypebooxePlugin<TObject>[]
> = {
    [K in keyof Plugins]:
      Plugins[K] extends TypebooxePlugin<infer P>
      ? Static<P>
      : never
  }

export type MergeTypeArray<
  T extends unknown[]
> = T extends [infer First, ...infer Rest]
  ? First & MergeTypeArray<Rest>
  : unknown;