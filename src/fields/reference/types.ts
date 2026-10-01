import { TObject, TSchema, TUnion } from "@sinclair/typebox"
import { TypebooxeModel } from "../../types"
import type { buildReference } from "./schema"

export type ModelReferenceOptions = {
  refPath: string
}

export type ReferenceSchema<T extends TObject> = ReturnType<typeof buildReference<T>>

export type MemberSchema<M> = M extends TypebooxeModel<infer T>
  ? ReferenceSchema<T>
  : TSchema

export type ReferenceUnion<Models extends readonly unknown[]> = TUnion<{
  -readonly [K in keyof Models]: MemberSchema<Models[K]>
}>
