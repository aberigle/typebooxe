import { Static, TObject, TSchema, Type } from "@sinclair/typebox"
import mongoose, { Types } from "mongoose"

export type MongooseIndexOption = {
  index: mongoose.IndexDefinition,
  options?: mongoose.IndexOptions
}

export type DefinitionOptions<T extends TObject> = {
  getters?: {
    [K in keyof Static<T>]?: (value: Static<T>[K]) => Static<T>[K]
  }
  setters?: {
    [K in keyof Static<T>]?: (value: Static<T>[K], priorVal?: Static<T>[K]) => Static<T>[K]
  }
}

export type TypebooxeOptions<
  T extends TObject,
  Plugins extends readonly TypebooxePlugin<TObject>[] = []
> = {
  schema?: mongoose.SchemaDefinition,
  options?: mongoose.SchemaOptions,
  methods?: Record<string, Function>,
  plugins?: Plugins,
  indexes?: Array<MongooseIndexOption>,
} & DefinitionOptions<T>

export type Methods<
  T extends TObject,
  Plugins extends readonly TypebooxePlugin<TObject>[] = []
> = {
  cast<M extends TSchema = T>(castType?: M): MergeTypeArray<[Static<M>, ...ExtractPluginTypes<Plugins>]>
}

export const ObjectId = Type.Transform(Type.String({ pattern: '^[0-9a-fA-F]{24}$' }))
  .Decode(value => new Types.ObjectId(value))
  .Encode(value => value.toHexString())

export type TypebooxeDocument<
  T extends TObject,
  Plugins extends readonly TypebooxePlugin<TObject>[] = []
> = mongoose.Document<
  Types.ObjectId,
  {},
  TypebooxeRaw<T, Plugins>
> & Methods<T, Plugins> & TypebooxeRaw<T, Plugins>

export type TypebooxeRaw<
  T extends TObject,
  Plugins extends readonly TypebooxePlugin<TObject>[] = []
> = MergeTypeArray<[StaticWithRefs<T>, ...ExtractPluginTypes<Plugins>]>

type StaticWithRefs<T extends TObject> = {
  [K in keyof Static<T>]: NonNullable<Static<T>[K]> extends { id: any }
  ? Static<T>[K] | string | Types.ObjectId
  : Static<T>[K] extends (infer U)[]
  ? Array<NonNullable<U> extends { id: any } ? U | string | Types.ObjectId : U>
  : Static<T>[K]
}

export type TypebooxeModel<
  T extends TObject,
  Plugins extends readonly TypebooxePlugin<TObject>[] = []
> = mongoose.Model<
  TypebooxeRaw<T, Plugins>,// & { _id: Types.ObjectId },
  {},
  Methods<T, Plugins>,
  {},
  TypebooxeDocument<T, Plugins>
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
  : {};